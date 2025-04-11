# -*- coding: utf-8 -*-
import os
import datetime
import traceback
from flask import Blueprint, request, jsonify, current_app, abort
from werkzeug.utils import secure_filename

# Create Blueprint
# Using url_prefix='/jd' makes routes like /jd/save, /jd/list, /jd/content/...
jd_bp = Blueprint('generate_jd', __name__, url_prefix='/jd')

@jd_bp.route('/save', methods=['POST'])
def save_job_description():
    """Saves the job description text data to a .txt file."""
    print("Received request to /jd/save")
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid or empty JSON data"}), 400

    job_title = data.get('title', '').strip()
    job_description = data.get('description', '').strip()
    experience = data.get('experience', 'Not Specified').strip()

    if not job_title or not job_description:
        return jsonify({"error": "Missing 'title' or 'description'"}), 400

    jd_folder = current_app.config['JOB_DESC_FOLDER']

    try:
        # Create filename
        base_filename = secure_filename(job_title) or "job_description"
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"JD_{base_filename}_{timestamp}.txt"
        filepath = os.path.join(jd_folder, filename)
        print(f"Attempting to save JD to: {filepath}")

        # Verify directory exists and has write permissions
        if not os.path.isdir(jd_folder):
             raise OSError(f"JD directory does not exist: {jd_folder}")
        if not os.access(jd_folder, os.W_OK):
             raise OSError(f"No write permission in JD directory: {jd_folder}")

        # Prepare content and write file
        file_content = f"Job Title: {job_title}\nExperience Required: {experience}\n====================================\n\n{job_description}"
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(file_content)

        print(f"Successfully saved job description: {filename}")
        return jsonify({"message": "Job Description saved successfully!", "filename": filename}), 201

    except OSError as e:
        print(f"OS Error saving JD file: {e}"); traceback.print_exc()
        return jsonify({"error": f"File system error saving JD: {e}"}), 500
    except Exception as e:
        print(f"Unexpected Error saving JD file: {e}"); traceback.print_exc()
        return jsonify({"error": "Could not save job description due to an unexpected internal error."}), 500

@jd_bp.route('/list', methods=['GET'])
def list_job_descriptions():
    """Returns a list of available job description filenames (.txt)."""
    print("Received request to /jd/list")
    jd_folder = current_app.config['JOB_DESC_FOLDER']
    try:
        if not os.path.isdir(jd_folder):
             print(f"Error: JD directory not found: {jd_folder}")
             return jsonify({"error": "config_error", "message": "Job description folder path is invalid."}), 500

        abs_jd_folder = os.path.abspath(jd_folder)
        files_with_mtime = []
        for f in os.listdir(abs_jd_folder):
             if f.lower().endswith('.txt') and os.path.isfile(os.path.join(abs_jd_folder, f)):
                 try:
                      mtime = os.path.getmtime(os.path.join(abs_jd_folder, f))
                      files_with_mtime.append((f, mtime))
                 except OSError:
                      print(f"Warning: Could not get mtime for {f}")
                      files_with_mtime.append((f, 0)) # Add with 0 timestamp on error

        # Sort by modification time, newest first
        jd_files = [f[0] for f in sorted(files_with_mtime, key=lambda x: x[1], reverse=True)]
        print(f"Found {len(jd_files)} JD files.")
        return jsonify({"jd_files": jd_files}), 200
    except Exception as e:
        print(f"Error listing JD files: {e}"); traceback.print_exc()
        return jsonify({"error": "list_error", "message": "Could not list job descriptions."}), 500

@jd_bp.route('/content/<path:filename>', methods=['GET'])
def get_jd_content(filename):
    """Returns the text content of a specific job description file."""
    print(f"Received request to /jd/content for: {filename}")
    secure_name = secure_filename(filename)
    # Important: Check if securing the name changed it in a meaningful way or made it empty
    if not secure_name or secure_name != filename:
         print(f"Invalid JD filename requested: {filename} -> {secure_name}")
         abort(400, description="Invalid filename provided.")

    jd_folder = current_app.config['JOB_DESC_FOLDER']
    abs_jd_folder = os.path.abspath(jd_folder)
    jd_file_path = os.path.join(abs_jd_folder, secure_name)
    abs_jd_file_path = os.path.abspath(jd_file_path) # Resolve the full path

    # Security Check: Prevent path traversal (e.g., ../../etc/passwd)
    if not abs_jd_file_path.startswith(abs_jd_folder + os.sep):
        print(f"Access Denied: Path traversal attempt? {filename} -> {secure_name} -> {abs_jd_file_path}")
        abort(403, description="Access denied.")

    try:
        if not os.path.isfile(abs_jd_file_path):
            print(f"JD file not found: {abs_jd_file_path}")
            abort(404, description=f"Job description '{secure_name}' not found.")

        # Read the content
        with open(abs_jd_file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        print(f"Successfully read content for: {secure_name}")
        return jsonify({"filename": secure_name, "content": content}), 200
    except Exception as e:
        print(f"Error reading JD file {secure_name}: {e}"); traceback.print_exc()
        abort(500, description=f"Could not read job description '{secure_name}'.")