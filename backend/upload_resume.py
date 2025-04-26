# backend/upload_resume.py
# -*- coding: utf-8 -*-
import os
import json
import datetime
import traceback
import logging
import re # Import re for filename sanitization
from flask import (
    Blueprint, request, jsonify, current_app, send_from_directory, abort
)
from werkzeug.utils import secure_filename
from typing import Dict, Any, Optional, Tuple, List # Add type hinting

# --- Relative Imports from within the 'backend' package ---
# Ensure utils.py exists and contains the required functions
try:
    # --- THIS LINE MUST START WITH A DOT ---
    from .utils import (
        allowed_file, extract_text_from_pdf, extract_text_from_docx,
        parse_resume_text
    )
except ImportError as e:
    # Log a critical error if utils cannot be imported, as the blueprint is unusable
    # Using basicConfig here ensures logging works even if Flask's logging isn't set up yet
    logging.basicConfig(level=logging.CRITICAL)
    logging.critical(f"FATAL ERROR: Cannot import from utils.py. Upload functionality will fail. Error: {e}", exc_info=True)
    # Depending on desired behavior, you might raise the error to stop the app
    # raise ImportError("Could not import required utility functions.") from e
    # Or define dummy functions to *allow* app start but log heavily:
    def allowed_file(*args, **kwargs): raise NotImplementedError("Utils not loaded")
    def extract_text_from_pdf(*args, **kwargs): raise NotImplementedError("Utils not loaded")
    def extract_text_from_docx(*args, **kwargs): raise NotImplementedError("Utils not loaded")
    def parse_resume_text(*args, **kwargs): raise NotImplementedError("Utils not loaded")


# Create Blueprint
upload_bp = Blueprint('upload_resume', __name__, url_prefix='/resumes')

# Fallback logger if needed outside app context
fallback_logger = logging.getLogger(__name__)

# --- Upload and Parse Endpoint ---
@upload_bp.route('/upload', methods=['POST'])
def upload_and_parse_resumes() -> Tuple[jsonify, int]:
    """
    Handles multiple resume uploads (PDF, DOCX). For each valid file:
    1. Saves the original file with a unique timestamped name.
    2. Extracts text content.
    3. Parses the text using utils.parse_resume_text.
    4. Saves the parsed data as a JSON file (also uniquely named).
    Returns a JSON response summarizing successes and failures.

    Returns:
        Flask JSON response object and HTTP status code.
    """
    log = current_app.logger if current_app else fallback_logger
    log.info(f"Received request to {request.path} from {request.remote_addr}")

    # --- Request Validation ---
    if 'files' not in request.files:
        log.warning("Upload attempt failed: No 'files' key in request.files")
        abort(400, description="Missing 'files' part in the multipart request.")

    files: List = request.files.getlist('files') # Use getlist for multiple files
    if not files or all(not f or not f.filename for f in files):
        log.warning("Upload attempt failed: No files selected or files list empty/invalid.")
        abort(400, description='No selected files or empty file parts provided.')

    log.info(f"Received {len(files)} file part(s) for upload.")
    success_responses: List[Dict[str, Any]] = []
    error_files: List[Dict[str, str]] = []

    # --- Get and Validate Configuration ---
    try:
        original_folder = current_app.config['ORIGINAL_RESUME_FOLDER']
        parsed_folder = current_app.config['PARSED_DATA_FOLDER']
    except KeyError as config_err:
         log.critical(f"Configuration Error: Missing key {config_err}. Cannot save files.", exc_info=True)
         abort(500, description=f'Server configuration error: Missing {config_err}')

    # --- Ensure Storage Directories Exist ---
    try:
        os.makedirs(original_folder, exist_ok=True)
        os.makedirs(parsed_folder, exist_ok=True)
        # Check write permissions (important on Linux/server environments)
        if not os.access(original_folder, os.W_OK) or not os.access(parsed_folder, os.W_OK):
             raise OSError(f"Write permission denied for '{original_folder}' or '{parsed_folder}'.")
    except OSError as os_err:
        log.critical(f"Could not create/access required directories: {os_err}", exc_info=True)
        abort(500, description=f'Server error: Could not create/access storage directories: {os_err}')

    # --- Process Each File ---
    for file in files:
        # Skip potentially empty file parts in the list
        if not file or not file.filename:
            log.warning("Skipping an empty file part in the request.")
            continue

        original_filename: str = file.filename
        log.info(f"\n--- Processing file: '{original_filename}' ---")

        # --- Filename Security and Uniqueness ---
        original_filename_secure_for_save: str = secure_filename(original_filename)
        if not original_filename_secure_for_save:
             error_msg = "Filename is invalid or becomes empty after sanitization."
             log.warning(f"  Skipping '{original_filename}': {error_msg}")
             error_files.append({'filename': original_filename, 'error': error_msg})
             continue # Skip to the next file

        base_name_secure, extension = os.path.splitext(original_filename_secure_for_save)
        # Further sanitize base name for JSON filename (replace non-word chars except hyphen)
        safe_base_for_json = re.sub(r'[^\w\-]+', '_', base_name_secure)
        timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S%f") # Microseconds for higher uniqueness
        # Use a consistent, unique base derived from the sanitized name + timestamp
        file_base_timestamped = f"{safe_base_for_json}_{timestamp}"

        original_filepath = os.path.join(original_folder, f"{file_base_timestamped}{extension}")
        parsed_json_filename = f"{file_base_timestamped}_parsed.json"
        parsed_json_filepath = os.path.join(parsed_folder, parsed_json_filename)

        # --- File Type Check (using utils.allowed_file) ---
        if not allowed_file(original_filename):
             error_msg = f"Invalid file type ('{extension}'). Allowed types: {', '.join(current_app.config.get('ALLOWED_EXTENSIONS', {'pdf', 'docx'}))}."
             log.warning(f"  Skipping '{original_filename}': {error_msg}")
             error_files.append({'filename': original_filename, 'error': error_msg})
             continue # Skip to the next file

        # --- Processing Steps within a Try-Except Block ---
        raw_text: Optional[str] = None
        parsed_data: Optional[Dict[str, Any]] = None
        try:
            # 1. Save Original File
            log.debug(f"  Saving original to: {original_filepath}")
            file.save(original_filepath)
            log.info(f"  Saved original: '{original_filename}' as '{os.path.basename(original_filepath)}'")

            # 2. Extract Text
            log.debug(f"  Extracting text using extension: {extension.lower()}")
            if extension.lower() == ".pdf":
                raw_text = extract_text_from_pdf(original_filepath)
            elif extension.lower() == ".docx":
                raw_text = extract_text_from_docx(original_filepath)
            else:
                 # Should be caught by allowed_file, but defensive check
                 raise ValueError(f"Internal error: Unsupported file extension '{extension}'")

            if raw_text is None: # Check if extraction function failed
                raise ValueError("Text extraction function failed (returned None). Possible file corruption or library issue.")
            if not raw_text.strip(): # Check if file content is genuinely empty
                raise ValueError("Text extraction successful, but the document appears to be empty or contains only whitespace.")
            log.info(f"  Text extracted successfully (Length: {len(raw_text)} chars).")

            # 3. Parse Text (using utils.parse_resume_text)
            log.info("  Parsing extracted text...")
            parsed_data = parse_resume_text(raw_text, original_filename=original_filename) # Pass original name for context

            if parsed_data is None:
                log.warning("  Parser function returned None. Treating as empty dictionary.")
                parsed_data = {}
            elif not isinstance(parsed_data, dict):
                 log.warning(f"  Parser function returned non-dict type ({type(parsed_data)}). Treating as empty dictionary.")
                 parsed_data = {}

            # Add standard metadata
            parsed_data['_original_filename'] = original_filename
            parsed_data['_saved_original_filepath'] = original_filepath # Store path if needed later
            parsed_data['_saved_parsed_filename'] = parsed_json_filename
            parsed_data['_processed_timestamp'] = datetime.datetime.now().isoformat()
            # Avoid including full raw text in response/saved JSON unless absolutely necessary
            # parsed_data['_raw_text_snippet'] = raw_text[:200] + "..." # Example snippet

            log.info(f"  Text parsed. Name found (best guess): '{parsed_data.get('name', 'Not Found')}'")

            # 4. Save Parsed Data as JSON
            log.debug(f"  Saving parsed JSON to: {parsed_json_filepath}")
            try:
                with open(parsed_json_filepath, "w", encoding="utf-8") as f_json:
                    json.dump(parsed_data, f_json, indent=4, ensure_ascii=False)
                log.info(f"  Saved parsed JSON successfully: '{parsed_json_filename}'")
            except TypeError as json_err:
                log.error(f"  ERROR: Could not serialize parsed data to JSON for '{original_filename}': {json_err}", exc_info=True)
                # Add error note to the data itself before adding to success list
                parsed_data['json_save_error'] = f"SerializationError: {json_err}"
                success_responses.append({
                    'filename': original_filename,
                    'parsedData': parsed_data, # Return data even if save failed
                    'warning': 'Parsed data contains non-serializable types; JSON save failed.'
                })
                continue # Skip normal success append, move to next file

            # --- Add Fully Successful Result ---
            success_responses.append({
                'filename': original_filename,
                'parsedData': parsed_data,
                'message': 'Processed successfully.'
            })

        except FileNotFoundError as fnf_err:
             # Should generally not happen after initial directory checks/creation
             error_msg = f"File not found during processing: {fnf_err}"
             log.error(f"  ERROR for '{original_filename}': {error_msg}", exc_info=True)
             error_files.append({'filename': original_filename, 'error': error_msg})

        except ValueError as val_err: # Catch specific errors like empty text or parser issues
            error_msg = f"Data processing error: {val_err}"
            log.error(f"  ERROR for '{original_filename}': {error_msg}") # No traceback for simple ValueErrors
            error_files.append({'filename': original_filename, 'error': error_msg})
            # Cleanup original file if processing failed after saving it
            if os.path.exists(original_filepath):
                try: os.remove(original_filepath); log.info(f"Removed original file '{os.path.basename(original_filepath)}' after processing error.")
                except OSError as rm_err: log.warning(f"Could not remove original file after error: {rm_err}")

        except OSError as os_err: # Catch file system errors during save/access
             error_msg = f"File system error: {os_err}"
             log.error(f"  ERROR for '{original_filename}': {error_msg}", exc_info=True)
             error_files.append({'filename': original_filename, 'error': error_msg})
             # Cleanup original/parsed if they exist
             if os.path.exists(original_filepath):
                 try: os.remove(original_filepath); log.info(f"Removed original file '{os.path.basename(original_filepath)}' after OS error.")
                 except OSError as rm_err: log.warning(f"Could not remove original file after OS error: {rm_err}")
             if os.path.exists(parsed_json_filepath):
                 try: os.remove(parsed_json_filepath); log.info(f"Removed parsed JSON file '{parsed_json_filename}' after OS error.")
                 except OSError as rm_err: log.warning(f"Could not remove parsed JSON file after OS error: {rm_err}")


        except Exception as e:
            # Catch any other unexpected exceptions
            error_msg = f"Unexpected error: {type(e).__name__} - {str(e)}"
            log.critical(f"  CRITICAL ERROR for '{original_filename}': {error_msg}", exc_info=True) # Log full traceback
            error_files.append({'filename': original_filename, 'error': "An unexpected server error occurred."}) # Generic msg to client
            # Attempt cleanup
            if os.path.exists(original_filepath):
                 try: os.remove(original_filepath); log.info(f"Removed original file '{os.path.basename(original_filepath)}' after critical error.")
                 except OSError as rm_err: log.warning(f"Could not remove original file after critical error: {rm_err}")
            if os.path.exists(parsed_json_filepath):
                try: os.remove(parsed_json_filepath); log.info(f"Removed parsed JSON file '{parsed_json_filename}' after critical error.")
                except OSError as rm_err: log.warning(f"Could not remove parsed JSON file after critical error: {rm_err}")

    # --- Construct Final Response ---
    response_data: Dict[str, Any] = {}
    status_code: int

    if success_responses:
        response_data['success_files'] = success_responses # Renamed key for clarity
    if error_files:
        response_data['error_files'] = error_files # Renamed key for clarity

    # Determine overall status code
    if success_responses and error_files:
        status_code = 207 # Multi-Status (Partial Success)
        response_data['message'] = f"{len(success_responses)} file(s) processed successfully, {len(error_files)} failed."
    elif success_responses:
        status_code = 200 # OK (All processed successfully)
        response_data['message'] = f"All {len(success_responses)} file(s) processed successfully."
    elif error_files:
        status_code = 400 # Bad Request (All failed, likely due to client-side file issues)
        response_data['message'] = f"All {len(error_files)} file(s) failed processing. Check errors for details."
    else:
         # This case means no files were processed (e.g., all skipped invalid type)
         log.warning("Upload request finished, but no files were successfully processed or errored out.")
         response_data['message'] = 'No valid files were provided or processed.'
         status_code = 400 # Bad Request

    log.info(f"--- Upload request finished. Success: {len(success_responses)}, Errors: {len(error_files)}. Status Code: {status_code} ---\n")
    return jsonify(response_data), status_code


# --- Download Endpoint ---
@upload_bp.route('/download/original/<path:filename>', methods=['GET'])
def download_original_resume(filename: str):
    """
    Serves an original resume file for download.
    Expects the *timestamped* filename (without extension) as part of the path.
    Example URL: /resumes/download/original/myresume_20231027103000123456.pdf

    NOTE: This requires the client to know the unique timestamped filename.
          The upload response should ideally return this information.
    """
    log = current_app.logger if current_app else fallback_logger
    log.info(f"Request to download original resume: '{filename}'")

    # The filename from the URL should be the unique, timestamped name
    # Secure it just in case, although it should be system-generated
    secure_name = secure_filename(filename)
    if not secure_name or secure_name != filename: # Check if securing changed it
         log.warning(f"Download failed: Potentially invalid filename characters in '{filename}'")
         abort(400, description="Invalid filename format provided.")

    original_resume_dir = current_app.config.get('ORIGINAL_RESUME_FOLDER')
    if not original_resume_dir:
        log.error("ORIGINAL_RESUME_FOLDER not configured.")
        abort(500, "Server configuration error.")

    abs_original_resume_dir = os.path.abspath(original_resume_dir)
    target_file_path = os.path.join(abs_original_resume_dir, secure_name)
    abs_target_file_path = os.path.abspath(target_file_path)

    # --- Security Check ---
    # Ensure the resolved path is still within the intended directory
    if not abs_target_file_path.startswith(abs_original_resume_dir + os.sep):
        log.error(f"Security Alert: Path traversal attempt? Requested '{filename}', resolved to '{abs_target_file_path}', which is outside '{abs_original_resume_dir}'")
        abort(403, description="Access denied.") # Forbidden

    # Check if file exists before attempting to send
    if not os.path.isfile(abs_target_file_path):
        log.warning(f"Download failed: File not found at '{abs_target_file_path}'")
        abort(404, description=f"Original resume file '{secure_name}' not found.") # Not Found

    # --- Serve the File ---
    try:
        log.info(f"Serving file: '{secure_name}' from directory '{abs_original_resume_dir}'")
        # Let Flask handle Content-Type based on extension
        # as_attachment=True forces download dialog
        return send_from_directory(
            directory=abs_original_resume_dir,
            path=secure_name,
            as_attachment=True
            # download_name could be set to a friendlier name if desired,
            # but requires mapping back from timestamped name to original.
            # download_name=derive_original_name(secure_name) # Needs helper function
        )
    except Exception as e:
        log.error(f"Error serving file '{secure_name}': {e}", exc_info=True)
        abort(500, description="Internal server error while serving file.")

# --- (Optional) Download Endpoint for Parsed JSON ---
@upload_bp.route('/download/parsed/<path:filename>', methods=['GET'])
def download_parsed_resume(filename: str):
    """
    Serves a parsed resume JSON file for download.
    Expects the *timestamped* filename (e.g., myresume_20231027103000123456_parsed.json).
    """
    log = current_app.logger if current_app else fallback_logger
    log.info(f"Request to download parsed resume JSON: '{filename}'")

    # Validate filename ends with _parsed.json (adjust if naming convention changes)
    if not filename.lower().endswith('_parsed.json'):
         abort(400, description="Invalid format for parsed data filename.")

    secure_name = secure_filename(filename)
    if not secure_name or secure_name != filename:
         log.warning(f"Download failed: Potentially invalid filename characters in '{filename}'")
         abort(400, description="Invalid filename format provided.")

    parsed_resume_dir = current_app.config.get('PARSED_DATA_FOLDER')
    if not parsed_resume_dir:
        log.error("PARSED_DATA_FOLDER not configured.")
        abort(500, "Server configuration error.")

    abs_parsed_resume_dir = os.path.abspath(parsed_resume_dir)
    target_file_path = os.path.join(abs_parsed_resume_dir, secure_name)
    abs_target_file_path = os.path.abspath(target_file_path)

    # Security Check
    if not abs_target_file_path.startswith(abs_parsed_resume_dir + os.sep):
        log.error(f"Security Alert: Path traversal attempt? Requested '{filename}', resolved to '{abs_target_file_path}', which is outside '{abs_parsed_resume_dir}'")
        abort(403, description="Access denied.")

    if not os.path.isfile(abs_target_file_path):
        log.warning(f"Download failed: Parsed JSON file not found at '{abs_target_file_path}'")
        abort(404, description=f"Parsed resume data '{secure_name}' not found.")

    try:
        log.info(f"Serving file: '{secure_name}' from directory '{abs_parsed_resume_dir}'")
        return send_from_directory(
            directory=abs_parsed_resume_dir,
            path=secure_name,
            mimetype='application/json', # Explicitly set mimetype for JSON
            as_attachment=True
        )
    except Exception as e:
        log.error(f"Error serving parsed JSON file '{secure_name}': {e}", exc_info=True)
        abort(500, description="Internal server error while serving file.")