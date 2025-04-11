# -*- coding: utf-8 -*-
import os
import json
import time
import traceback
from flask import Blueprint, request, jsonify, current_app, abort
from werkzeug.utils import secure_filename

# Import utilities
from utils import get_match_results

# Create Blueprint
# Using url_prefix='/scan' makes routes like /scan/batch
scan_bp = Blueprint('scan_resumes', __name__, url_prefix='/scan')

@scan_bp.route('/batch', methods=['POST'])
def batch_scan_resumes():
    """Scans parsed resumes against a specific job description."""
    print("Received request to /scan/batch")
    start_time = time.time()

    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    data = request.get_json();
    if not data:
        return jsonify({"error": "Empty JSON body"}), 400

    selected_jd_filename = data.get('jd_filename')
    if not selected_jd_filename:
        return jsonify({"error": "Missing 'jd_filename'"}), 400

    # --- Validate JD Filename ---
    secure_jd_filename = secure_filename(selected_jd_filename)
    if secure_jd_filename != selected_jd_filename:
        print(f"Invalid JD filename format provided: {selected_jd_filename}")
        return jsonify({"error": "Invalid JD filename format."}), 400

    jd_folder = current_app.config['JOB_DESC_FOLDER']
    parsed_folder = current_app.config['PARSED_DATA_FOLDER']
    jd_file_path = os.path.join(jd_folder, secure_jd_filename)
    print(f"Scanning against JD: {secure_jd_filename}")

    # --- Read Job Description ---
    jd_text = None
    try:
        abs_jd_folder = os.path.abspath(jd_folder)
        abs_jd_file_path = os.path.abspath(jd_file_path)

        # Security check
        if not abs_jd_file_path.startswith(abs_jd_folder + os.sep):
             print(f"Access denied to JD file: {abs_jd_file_path}")
             abort(403, "Access denied to JD.")

        if not os.path.isfile(abs_jd_file_path):
            print(f"JD file not found: {abs_jd_file_path}")
            return jsonify({"error": "jd_not_found", "message": f"JD '{secure_jd_filename}' not found."}), 404

        with open(abs_jd_file_path, 'r', encoding='utf-8') as f:
            jd_text = f.read()

        if not jd_text.strip():
            print(f"JD file is empty: {secure_jd_filename}")
            return jsonify({"error": "jd_empty", "message": f"JD file '{secure_jd_filename}' is empty."}), 400
    except Exception as e:
        print(f"Error reading JD file {secure_jd_filename}: {e}"); traceback.print_exc()
        return jsonify({"error": "jd_read_error", "message": f"Could not read JD file."}), 500

    # --- Find Parsed Resumes ---
    resume_results = []
    scan_errors = []
    parsed_json_files = []
    try:
        if not os.path.isdir(parsed_folder):
             print(f"Error: Parsed resume directory not found: {parsed_folder}")
             return jsonify({"error": "config_error", "message": "Parsed resume folder invalid."}), 500

        abs_parsed_folder = os.path.abspath(parsed_folder)
        files_with_mtime = []
        # List files and get modification times for sorting
        for f in os.listdir(abs_parsed_folder):
             if f.lower().endswith('.json') and os.path.isfile(os.path.join(abs_parsed_folder, f)):
                 try:
                      mtime = os.path.getmtime(os.path.join(abs_parsed_folder, f))
                      files_with_mtime.append((f, mtime))
                 except OSError:
                      print(f"Warning: Could not get mtime for {f}")
                      files_with_mtime.append((f, 0)) # Add with 0 timestamp on error

        # Sort by modification time, newest first
        parsed_json_files = [f[0] for f in sorted(files_with_mtime, key=lambda x: x[1], reverse=True)]

        if not parsed_json_files:
            print("No parsed resumes found to scan.")
            return jsonify({"jd_used": secure_jd_filename, "results": [], "scan_errors": [], "message": "No parsed resumes found."}), 200
    except Exception as e:
        print(f"Error listing parsed resume files: {e}"); traceback.print_exc()
        return jsonify({"error": "resume_list_error", "message": "Could not list parsed resumes."}), 500

    # --- Process Each Resume ---
    print(f"Found {len(parsed_json_files)} resumes. Starting scan...")
    success_count = 0
    abs_parsed_folder = os.path.abspath(parsed_folder) # Cache path

    for json_filename in parsed_json_files:
        resume_json_path = os.path.join(abs_parsed_folder, json_filename)
        try:
            abs_resume_json_path = os.path.abspath(resume_json_path)
            # Security check for resume JSON path
            if not abs_resume_json_path.startswith(abs_parsed_folder + os.sep):
                 print(f"Access denied to JSON file: {abs_resume_json_path}")
                 raise ValueError("Attempt to access JSON outside designated folder.")

            with open(resume_json_path, 'r', encoding='utf-8') as f_json:
                resume_data = json.load(f_json)

            resume_raw_text = resume_data.get('_raw_text')
            original_resume_filename = resume_data.get('_original_filename')

            if not resume_raw_text:
                raise ValueError("'_raw_text' missing or empty in JSON.")
            if not original_resume_filename:
                 print(f"Warning: '_original_filename' missing in {json_filename}. Using base JSON name.")
                 original_resume_filename = os.path.splitext(json_filename)[0].replace('_parsed', '')

            # Perform the matching using the utility function
            match_data = get_match_results(resume_raw_text, jd_text)
            if match_data.get("error"): # Check if matching itself had an error (e.g., NLTK failed)
                raise ValueError(match_data['error'])

            # Append successful result
            resume_results.append({
                "original_filename": original_resume_filename,
                "name": resume_data.get('name', 'N/A'),
                "email": resume_data.get('email', 'N/A'),
                "phone": resume_data.get('phone', 'N/A'),
                "score": match_data["score"],
                "matching_keywords": match_data["matching_keywords"],
                "missing_keywords": match_data["missing_keywords"],
                "match_count": match_data["match_count"],
                "jd_keyword_count": match_data["jd_keyword_count"],
                "_parsed_json_filename": json_filename # Keep internal reference if needed
            })
            success_count += 1

        except (json.JSONDecodeError, ValueError, OSError, Exception) as e:
            error_msg = f"{type(e).__name__}: {str(e)}"
            print(f"Error processing {json_filename}: {error_msg}")
            # Avoid logging full tracebacks for common errors like JSONDecodeError or expected ValueErrors
            if not isinstance(e, (json.JSONDecodeError, ValueError, FileNotFoundError)):
                traceback.print_exc()
            scan_errors.append({"filename": json_filename, "error": error_msg})

    # --- Return Results ---
    end_time = time.time()
    duration = round(end_time - start_time, 2)
    response_payload = {
        "jd_used": secure_jd_filename,
        "results": sorted(resume_results, key=lambda x: x['score'], reverse=True), # Sort by score desc
        "scan_errors": scan_errors,
        "summary": {
             "total_resumes_found": len(parsed_json_files),
             "successfully_scanned": success_count,
             "errors": len(scan_errors),
             "duration_seconds": duration
        }
    }
    status_code = 200
    if scan_errors: status_code = 207 # Multi-Status
    # Handle case where resumes existed but all failed scanning
    if not resume_results and not scan_errors and parsed_json_files:
        status_code = 500 # Indicate something went wrong globally if files existed but none processed
    elif not parsed_json_files:
        status_code = 200 # No files found is not an error state, just empty results

    print(f"Batch Scan Complete. Duration: {duration}s. Scanned: {success_count}, Errors: {len(scan_errors)}. Status: {status_code}")
    return jsonify(response_payload), status_code