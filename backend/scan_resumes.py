# backend/scan_resumes.py
# -*- coding: utf-8 -*-
import os
import json
import time
import traceback
import logging
from flask import Blueprint, request, jsonify, current_app, abort
from werkzeug.utils import secure_filename

# --- Relative Imports ---
from .utils import get_match_results # Import the matching utility

# Create Blueprint
scan_bp = Blueprint('scan_resumes', __name__, url_prefix='/scan')

# Logger - use Flask's app logger inside routes
logger = logging.getLogger(__name__) # Fallback logger

@scan_bp.route('/batch', methods=['POST'])
def batch_scan_resumes():
    """
    Scans all available parsed resumes (.json) against a selected job description (.txt).
    Returns a list of results sorted by match score.
    Uses current_app for config and logging.
    """
    log = current_app.logger # Use app logger
    log.info("Received request to /scan/batch")
    start_time = time.time()

    # --- Validate Input ---
    if not request.is_json:
        log.warning("Request to /scan/batch is not JSON.")
        abort(400, description="Request must be JSON.")

    data = request.get_json();
    if not data:
        log.warning("Request to /scan/batch has empty JSON body.")
        abort(400, description="Empty JSON body provided.")

    selected_jd_filename = data.get('jd_filename')
    if not selected_jd_filename or not isinstance(selected_jd_filename, str):
        log.warning("Missing or invalid 'jd_filename' in /scan/batch request.")
        abort(400, description="Missing or invalid 'jd_filename' (must be a string).")

    # --- Validate JD Filename and Get Paths ---
    secure_jd_filename = secure_filename(selected_jd_filename)
    if secure_jd_filename != selected_jd_filename:
        log.warning(f"Invalid JD filename format provided: Original='{selected_jd_filename}', Secured='{secure_jd_filename}'")
        abort(400, description="Invalid characters in JD filename.")

    jd_folder = current_app.config.get('JOB_DESC_FOLDER')
    parsed_folder = current_app.config.get('PARSED_DATA_FOLDER')
    if not jd_folder or not parsed_folder:
         log.error("JOB_DESC_FOLDER or PARSED_DATA_FOLDER not configured.")
         abort(500, description="Server configuration error regarding storage paths.")

    jd_file_path = os.path.join(jd_folder, secure_jd_filename)
    log.info(f"Scanning resumes against JD: {secure_jd_filename}")

    # --- Read Job Description ---
    jd_text = None
    try:
        abs_jd_folder = os.path.abspath(jd_folder)
        abs_jd_file_path = os.path.abspath(jd_file_path)

        # Security check: ensure file is within the designated folder
        if not abs_jd_file_path.startswith(abs_jd_folder + os.sep):
             log.error(f"Access Denied (Path Traversal?): JD='{abs_jd_file_path}', Base='{abs_jd_folder}'")
             abort(403, "Access denied to job description file.")

        if not os.path.isfile(abs_jd_file_path):
            log.warning(f"Selected JD file not found: {abs_jd_file_path}")
            abort(404, description=f"Job Description file '{secure_jd_filename}' not found.")

        with open(abs_jd_file_path, 'r', encoding='utf-8') as f:
            jd_text = f.read()

        if not jd_text or not jd_text.strip():
            log.warning(f"JD file is empty: {secure_jd_filename}")
            abort(400, description=f"Job Description file '{secure_jd_filename}' is empty or contains only whitespace.")

    except FileNotFoundError: # Should be caught by isfile, but good practice
        log.warning(f"Selected JD file not found (exception): {abs_jd_file_path}")
        abort(404, description=f"Job Description file '{secure_jd_filename}' not found.")
    except Exception as e:
        log.error(f"Error reading JD file {secure_jd_filename}: {e}", exc_info=True)
        abort(500, description="Could not read the selected Job Description file.")

    # --- Find and List Parsed Resume Files (.json) ---
    resume_results = []
    scan_errors = []
    parsed_json_files = []
    try:
        if not os.path.isdir(parsed_folder):
             log.warning(f"Parsed resume directory not found: {parsed_folder}. No resumes to scan.")
             # Not necessarily an error if no resumes uploaded yet, return empty results
             return jsonify({
                 "jd_used": secure_jd_filename,
                 "results": [],
                 "scan_errors": [],
                 "summary": {"total_resumes_found": 0, "successfully_scanned": 0, "errors": 0, "duration_seconds": 0}
             }), 200

        abs_parsed_folder = os.path.abspath(parsed_folder)
        files_with_mtime = []
        log.debug(f"Listing .json files in: {abs_parsed_folder}")
        for f in os.listdir(abs_parsed_folder):
             if f.lower().endswith('.json') and os.path.isfile(os.path.join(abs_parsed_folder, f)):
                 try:
                      mtime = os.path.getmtime(os.path.join(abs_parsed_folder, f))
                      files_with_mtime.append((f, mtime))
                 except OSError as e:
                      log.warning(f"Could not get modification time for {f}: {e}")
                      files_with_mtime.append((f, 0)) # Include with timestamp 0

        # Sort by modification time, newest first (optional, could sort results later)
        parsed_json_files = [f[0] for f in sorted(files_with_mtime, key=lambda x: x[1], reverse=True)]

        if not parsed_json_files:
            log.info("No parsed resumes (.json files) found in the directory.")
            # Return success with empty results
            duration = round(time.time() - start_time, 2)
            return jsonify({
                "jd_used": secure_jd_filename,
                "results": [],
                "scan_errors": [],
                "summary": {"total_resumes_found": 0, "successfully_scanned": 0, "errors": 0, "duration_seconds": duration}
            }), 200

    except Exception as e:
        log.error(f"Error listing parsed resume files in {parsed_folder}: {e}", exc_info=True)
        abort(500, description="Could not list parsed resumes to scan.")

    # --- Process Each Resume JSON File ---
    log.info(f"Found {len(parsed_json_files)} parsed resumes. Starting scan...")
    success_count = 0
    abs_parsed_folder = os.path.abspath(parsed_folder) # Re-resolve for security checks

    for json_filename in parsed_json_files:
        resume_json_path = os.path.join(abs_parsed_folder, json_filename)
        abs_resume_json_path = os.path.abspath(resume_json_path)
        log.debug(f"Processing resume file: {json_filename}")

        try:
            # Security check for resume JSON path
            if not abs_resume_json_path.startswith(abs_parsed_folder + os.sep):
                 log.error(f"Access Denied (Path Traversal?): JSON='{abs_resume_json_path}', Base='{abs_parsed_folder}'")
                 raise ValueError(f"Attempt to access JSON outside designated folder: {json_filename}")

            with open(resume_json_path, 'r', encoding='utf-8') as f_json:
                resume_data = json.load(f_json)

            # Extract necessary fields from JSON (handle missing keys gracefully)
            resume_raw_text = resume_data.get('_raw_text') # Assumes raw text is saved during parsing
            original_resume_filename = resume_data.get('_original_filename')

            if not resume_raw_text:
                # If raw text isn't stored, we can't scan. Log error for this file.
                raise ValueError("'_raw_text' field missing or empty in JSON. Cannot perform keyword matching.")

            if not original_resume_filename:
                 log.warning(f"'_original_filename' missing in {json_filename}. Using base JSON name for reporting.")
                 # Attempt to derive original name if possible (e.g., remove '_parsed.json')
                 original_resume_filename = json_filename.replace('_parsed.json', '')


            # --- Perform the matching using the utility function ---
            # get_match_results uses NLTK initialized globally
            match_data = get_match_results(resume_raw_text, jd_text)

            # Check if the matching function itself returned an error (e.g., NLTK failed)
            if match_data.get("error"):
                raise ValueError(f"Keyword matching failed: {match_data['error']}")

            # Append successful result including key info from parsed data and match results
            resume_results.append({
                "original_filename": original_resume_filename,
                "name": resume_data.get('name', 'N/A'),
                "email": resume_data.get('email', 'N/A'),
                "phone": resume_data.get('phone', 'N/A'),
                "score": match_data.get("score", 0.0),
                "matching_keywords": match_data.get("matching_keywords", []),
                "missing_keywords": match_data.get("missing_keywords", []),
                "match_count": match_data.get("match_count", 0),
                "jd_keyword_count": match_data.get("jd_keyword_count", 0),
                "_parsed_json_filename": json_filename # Keep internal reference if needed for debugging/linking
            })
            success_count += 1
            log.debug(f"Successfully scanned: {original_resume_filename} (Score: {match_data.get('score', 0.0)})")

        except (json.JSONDecodeError, ValueError, OSError, KeyError, Exception) as e:
            # Log specific errors for individual file processing failures
            error_msg = f"{type(e).__name__}: {str(e)}"
            log.error(f"Error processing resume JSON '{json_filename}': {error_msg}", exc_info=False) # Avoid traceback spam for common errors
            # Log traceback for unexpected errors
            if not isinstance(e, (json.JSONDecodeError, ValueError, FileNotFoundError, KeyError)):
                 log.exception(f"Full traceback for error processing {json_filename}:") # Use log.exception for traceback

            scan_errors.append({"filename": json_filename, "error": error_msg})

    # --- Return Combined Results ---
    end_time = time.time()
    duration = round(end_time - start_time, 2)

    # Sort final results by score descending
    sorted_results = sorted(resume_results, key=lambda x: x['score'], reverse=True)

    response_payload = {
        "jd_used": secure_jd_filename,
        "results": sorted_results,
        "scan_errors": scan_errors, # Report which files failed
        "summary": {
             "total_resumes_found": len(parsed_json_files),
             "successfully_scanned": success_count,
             "errors": len(scan_errors),
             "duration_seconds": duration
        }
    }

    # Determine appropriate status code
    status_code = 200
    if scan_errors and success_count > 0:
        status_code = 207 # Multi-Status: Partial success
        log.warning(f"Batch Scan completed with {len(scan_errors)} errors.")
    elif scan_errors and success_count == 0 and len(parsed_json_files) > 0:
        status_code = 500 # All processing failed, likely a systemic issue
        log.error("Batch Scan failed for all resumes found.")
    # Case: No JSON files found -> handled earlier, returns 200
    # Case: All succeeded -> returns 200

    log.info(f"Batch Scan Complete. Duration: {duration}s. Scanned: {success_count}/{len(parsed_json_files)}, Errors: {len(scan_errors)}. Status: {status_code}")
    return jsonify(response_payload), status_code