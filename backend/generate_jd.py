# backend/generate_jd.py
# -*- coding: utf-8 -*-
import os
import datetime
import traceback
import logging
from flask import Blueprint, request, jsonify, current_app, abort
from werkzeug.utils import secure_filename

# Use relative import for config if needed, but better to use current_app.config
# from . import config # Generally not needed if using current_app

# Create Blueprint
# Using url_prefix='/jd' makes routes like /jd/save, /jd/list, /jd/content/...
jd_bp = Blueprint('generate_jd', __name__, url_prefix='/jd')

# Logger - use Flask's app logger inside routes
logger = logging.getLogger(__name__) # Fallback logger

@jd_bp.route('/save', methods=['POST'])
def save_job_description():
    """Saves the job description text data to a .txt file in the configured folder."""
    log = current_app.logger # Use app logger
    log.info("Received request to /jd/save")

    if not request.is_json:
        log.warning("Request to /jd/save is not JSON.")
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    if not data:
        log.warning("Request to /jd/save has invalid or empty JSON.")
        return jsonify({"error": "Invalid or empty JSON data"}), 400

    # Extract data, providing defaults or handling missing keys
    job_title = data.get('title', '').strip()
    job_description = data.get('description', '').strip()
    experience = data.get('experience', 'Not Specified').strip() # Example optional field

    if not job_title or not job_description:
        log.warning("Missing 'title' or 'description' in /jd/save request.")
        return jsonify({"error": "Missing 'title' or 'description'"}), 400

    # Get folder path from app configuration
    jd_folder = current_app.config.get('JOB_DESC_FOLDER')
    if not jd_folder:
         log.error("JOB_DESC_FOLDER not configured in the application.")
         return jsonify({"error": "Configuration error", "message": "Server configuration issue."}), 500

    try:
        # Create a secure base filename from the title
        base_filename = secure_filename(job_title) or "job_description"
        # Add timestamp to avoid overwrites
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"JD_{base_filename}_{timestamp}.txt"
        filepath = os.path.join(jd_folder, filename)
        log.info(f"Attempting to save JD to: {filepath}")

        # Directory existence should be ensured by create_app, but check access
        if not os.path.isdir(jd_folder):
             # This check might be redundant if create_app works, but good fallback
             log.error(f"JD directory does not exist or is not accessible: {jd_folder}")
             # Attempt to create it just in case (might fail due to permissions)
             try:
                  os.makedirs(jd_folder, exist_ok=True)
                  log.info(f"Created missing JD directory: {jd_folder}")
             except OSError as mkdir_e:
                  log.error(f"Failed to create JD directory {jd_folder}: {mkdir_e}")
                  raise OSError(f"JD directory not found and could not be created: {jd_folder}") from mkdir_e
        # Check write permissions specifically
        if not os.access(jd_folder, os.W_OK):
             log.error(f"No write permission in JD directory: {jd_folder}")
             raise OSError(f"No write permission in JD directory: {jd_folder}")

        # Prepare content and write file with UTF-8 encoding
        file_content = f"Job Title: {job_title}\nExperience Required: {experience}\n====================================\n\n{job_description}"
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(file_content)

        log.info(f"Successfully saved job description: {filename}")
        return jsonify({"message": "Job Description saved successfully!", "filename": filename}), 201 # 201 Created

    except OSError as e:
        log.error(f"OS Error saving JD file '{filename}': {e}", exc_info=True)
        return jsonify({"error": f"File system error saving JD: Check server logs for details."}), 500
    except Exception as e:
        log.error(f"Unexpected Error saving JD file '{filename}': {e}", exc_info=True)
        return jsonify({"error": "Could not save job description due to an unexpected internal error."}), 500

@jd_bp.route('/list', methods=['GET'])
def list_job_descriptions():
    """Returns a sorted list of available job description filenames (.txt)."""
    log = current_app.logger
    log.info("Received request to /jd/list")
    jd_folder = current_app.config.get('JOB_DESC_FOLDER')

    if not jd_folder:
         log.error("JOB_DESC_FOLDER not configured.")
         return jsonify({"error": "config_error", "message": "Server configuration issue."}), 500

    try:
        if not os.path.isdir(jd_folder):
             log.error(f"JD directory configured but not found: {jd_folder}")
             # Return empty list instead of 500 if dir just doesn't exist yet
             return jsonify({"jd_files": []}), 200
             # Or return 500 if it *should* exist:
             # return jsonify({"error": "config_error", "message": "Job description folder path is invalid or inaccessible."}), 500

        abs_jd_folder = os.path.abspath(jd_folder)
        files_with_mtime = []
        log.debug(f"Listing .txt files in: {abs_jd_folder}")
        for f in os.listdir(abs_jd_folder):
             # Ensure it's a .txt file and actually a file (not a directory)
             if f.lower().endswith('.txt') and os.path.isfile(os.path.join(abs_jd_folder, f)):
                 try:
                      mtime = os.path.getmtime(os.path.join(abs_jd_folder, f))
                      files_with_mtime.append((f, mtime))
                 except OSError as e:
                      log.warning(f"Could not get modification time for {f}: {e}")
                      files_with_mtime.append((f, 0)) # Add with 0 timestamp on error to include in list

        # Sort by modification time, newest first
        jd_files = [f[0] for f in sorted(files_with_mtime, key=lambda x: x[1], reverse=True)]
        log.info(f"Found {len(jd_files)} JD files.")
        return jsonify({"jd_files": jd_files}), 200

    except Exception as e:
        log.error(f"Error listing JD files in {jd_folder}: {e}", exc_info=True)
        return jsonify({"error": "list_error", "message": "Could not list job descriptions. Check server logs."}), 500

@jd_bp.route('/content/<path:filename>', methods=['GET'])
def get_jd_content(filename):
    """Returns the text content of a specific job description file."""
    log = current_app.logger
    log.info(f"Received request to /jd/content for: {filename}")

    # Secure the filename to prevent directory traversal outside the intended folder
    secure_name = secure_filename(filename)
    # Basic check: if securing the name fundamentally changed it or made it empty, it's likely invalid/malicious
    if not secure_name or secure_name != filename:
         log.warning(f"Invalid JD filename requested: Original='{filename}', Secured='{secure_name}'")
         abort(400, description=f"Invalid filename format: {filename}")

    jd_folder = current_app.config.get('JOB_DESC_FOLDER')
    if not jd_folder:
         log.error("JOB_DESC_FOLDER not configured.")
         abort(500, description="Server configuration error.") # Use abort for server errors too

    abs_jd_folder = os.path.abspath(jd_folder)
    # Construct the full path to the requested file
    jd_file_path = os.path.join(abs_jd_folder, secure_name)
    # Resolve the absolute path to prevent tricks like '/path/to/jd/../other/file'
    abs_jd_file_path = os.path.abspath(jd_file_path)

    # --- Security Check: Ensure the resolved path is still within the designated JD folder ---
    # os.path.commonprefix is one way, checking startswith is often clearer
    if not abs_jd_file_path.startswith(abs_jd_folder + os.sep):
        log.error(f"Access Denied: Path traversal attempt? Filename='{filename}', Resolved='{abs_jd_file_path}', Base='{abs_jd_folder}'")
        abort(403, description="Access denied to the requested file.") # 403 Forbidden

    try:
        # Check if the file actually exists *after* security checks
        if not os.path.isfile(abs_jd_file_path):
            log.warning(f"JD file not found: {abs_jd_file_path}")
            abort(404, description=f"Job description '{secure_name}' not found.") # 404 Not Found

        # Read the content using UTF-8 encoding
        with open(abs_jd_file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        log.info(f"Successfully read content for: {secure_name}")
        return jsonify({"filename": secure_name, "content": content}), 200

    except FileNotFoundError: # Should be caught by isfile check, but belt-and-suspenders
         log.warning(f"JD file not found (exception handler): {abs_jd_file_path}")
         abort(404, description=f"Job description '{secure_name}' not found.")
    except Exception as e:
        log.error(f"Error reading JD file {secure_name}: {e}", exc_info=True)
        abort(500, description=f"Could not read job description '{secure_name}'. Check server logs.")