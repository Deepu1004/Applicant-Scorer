# upload_resume_blueprint.py (or wherever your blueprint is)
import os
import json
import datetime
import traceback
import logging # Use standard logging
from flask import (
    Blueprint, request, jsonify, current_app, send_from_directory, abort
)
from werkzeug.utils import secure_filename
from typing import Dict, Any, Optional, Tuple, List # Add type hinting

# --- IMPORTANT: Ensure this imports the *updated* utils ---
# The quality of the parsed data heavily depends on the implementation
# of parse_resume_text in utils.py. The issues noted (incorrect name,
# missing sections, miscategorization) MUST be addressed there.
try:
    from utils import (
        allowed_file, extract_text_from_pdf, extract_text_from_docx,
        parse_resume_text # This function needs significant improvement for accuracy
    )
except ImportError as e:
    # Use logging for fatal errors
    logging.basicConfig(level=logging.ERROR) # Ensure basicConfig is called if not done elsewhere
    logging.error(f"FATAL: Could not import utility functions. Check utils.py and PYTHONPATH. Error: {e}", exc_info=True)
    # Optional: Define dummy functions to prevent app crash on startup, but log warnings.
    def allowed_file(filename: str) -> bool:
        logging.warning("Using dummy allowed_file function.")
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'pdf', 'docx'}
    def extract_text_from_pdf(path: str) -> Optional[str]:
         logging.warning("Using dummy extract_text_from_pdf function.")
         return None
    def extract_text_from_docx(path: str) -> Optional[str]:
        logging.warning("Using dummy extract_text_from_docx function.")
        return None
    def parse_resume_text(text: str, original_filename: Optional[str] = None) -> Dict[str, Any]:
        logging.warning("Using dummy parse_resume_text function.")
        return {"error": "Parsing utilities not loaded.", "_original_filename": original_filename, "_raw_text": text[:500] + "..."}
    # raise # Re-raising prevents the app from starting, which might be desired

# Create Blueprint
upload_bp = Blueprint('upload_resume', __name__, url_prefix='/resumes')

# --- Helper Function for Logging ---
def _log(level: str, message: str, exc_info: bool = False):
    """Helper to use Flask's logger if available, otherwise basic print."""
    try:
        if level == 'info':
            current_app.logger.info(message)
        elif level == 'warning':
            current_app.logger.warning(message)
        elif level == 'error':
            current_app.logger.error(message, exc_info=exc_info)
        elif level == 'debug':
            current_app.logger.debug(message)
        else:
            print(f"[{level.upper()}] {message}") # Fallback
    except RuntimeError: # If outside application context
        print(f"[{level.upper()}] {message}")
        if exc_info:
            traceback.print_exc()


# --- Upload and Parse Endpoint ---
@upload_bp.route('/upload', methods=['POST'])
def upload_and_parse_resumes() -> Tuple[str, int]:
    """
    Handles resume uploads (PDF, DOCX), saves original, extracts text,
    parses extracted text using the configured utility function (needs improvement),
    saves parsed data as JSON, and returns parsed data in the response.

    Returns:
        A JSON response containing success and/or error information,
        and an appropriate HTTP status code (200, 207, 400).
    """
    _log('info', f"Received request to {request.path} from {request.remote_addr}")
    if 'files' not in request.files:
        _log('warning', "Upload attempt failed: No 'files' key in request.files")
        return jsonify({'error': "Missing 'files' part in the multipart request"}), 400

    files = request.files.getlist('files')
    if not files or all(f.filename == '' for f in files):
        _log('warning', "Upload attempt failed: No files selected or files list empty")
        return jsonify({'error': 'No selected files to upload'}), 400

    _log('info', f"Received {len(files)} file(s) for upload.")
    success_responses: List[Dict[str, Any]] = []
    error_files: List[Dict[str, str]] = []

    # Ensure configuration keys exist
    try:
        original_folder = current_app.config['ORIGINAL_RESUME_FOLDER']
        parsed_folder = current_app.config['PARSED_DATA_FOLDER']
    except KeyError as config_err:
         _log('error', f"Configuration Error: Missing key {config_err}. Cannot save files.", exc_info=True)
         return jsonify({'error': f'Server configuration error: Missing {config_err}'}), 500

    # Ensure folders exist (create if they don't)
    try:
        os.makedirs(original_folder, exist_ok=True)
        os.makedirs(parsed_folder, exist_ok=True)
    except OSError as os_err:
        _log('error', f"Could not create required directories: {os_err}", exc_info=True)
        return jsonify({'error': f'Server error: Could not create storage directories: {os_err.strerror}'}), 500

    for file in files:
        # Skip if file stream or filename is somehow missing in the list
        if not file or not file.filename:
            _log('warning', "Skipping an empty file part in the request.")
            continue

        original_filename: str = file.filename
        # Secure the filename for storage, but keep original for context/response
        original_filename_secure_for_save: str = secure_filename(original_filename)

        _log('info', f"\n--- Processing file: '{original_filename}' (Save As: '{original_filename_secure_for_save}') ---")

        # Check if filename becomes invalid after sanitization
        if not original_filename_secure_for_save:
             error_msg = "Filename is invalid or becomes empty after sanitization."
             _log('warning', f"Error for '{original_filename}': {error_msg}")
             error_files.append({'filename': original_filename, 'error': error_msg})
             continue # Skip to the next file

        # Generate unique filenames
        base_name_secure, extension = os.path.splitext(original_filename_secure_for_save)
        timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S%f")
        # Use a consistent, unique base for both original and parsed related files if needed later
        file_base_timestamped = f"{base_name_secure}_{timestamp}"

        # Define paths using the unique base
        original_filepath = os.path.join(original_folder, f"{file_base_timestamped}{extension}")
        parsed_json_filename = f"{file_base_timestamped}_parsed.json"
        parsed_json_filepath = os.path.join(parsed_folder, parsed_json_filename)

        # --- File Type Check ---
        if not allowed_file(original_filename):
             error_msg = f"Invalid file type ('{extension}'). Only PDF and DOCX are allowed."
             _log('warning', f"  Skipping '{original_filename}': {error_msg}")
             error_files.append({'filename': original_filename, 'error': error_msg})
             continue # Skip to the next file

        # --- Processing Steps ---
        raw_text: Optional[str] = None
        parsed_data: Optional[Dict[str, Any]] = None
        try:
            # 1. Save Original File (using unique timestamped name)
            _log('debug', f"  Saving original to: {original_filepath}")
            file.save(original_filepath)
            _log('info', f"  Saved original: '{original_filename}' as '{os.path.basename(original_filepath)}'")

            # 2. Extract Text
            _log('debug', f"  Extracting text using extension: {extension.lower()}")
            if extension.lower() == ".pdf":
                raw_text = extract_text_from_pdf(original_filepath)
            elif extension.lower() == ".docx":
                raw_text = extract_text_from_docx(original_filepath)
            else:
                 # This case should be prevented by allowed_file, but good to be defensive
                 raise ValueError(f"Unsupported file extension '{extension}' passed allowed_file check.")

            if not raw_text:
                # Distinguish between extraction failure and genuinely empty file
                if raw_text is None:
                    raise ValueError("Text extraction function failed (returned None).")
                else: # raw_text is ""
                    raise ValueError("Text extraction successful, but the document appears to be empty.")
            _log('info', f"  Text extracted successfully (Length: {len(raw_text)} chars).")

            # 3. Parse Text (CRITICAL STEP - Relies heavily on utils.parse_resume_text)
            _log('info', "  Parsing extracted text...")
            # Pass original filename for potential context within the parser
            parsed_data = parse_resume_text(raw_text, original_filename=original_filename)

            # --- Verification & Handling of Parsing Results ---
            if parsed_data is None:
                _log('warning', "  Parser function returned None. Treating as empty dictionary.")
                parsed_data = {} # Default to empty dict if parser fails severely
            elif not isinstance(parsed_data, dict):
                 _log('warning', f"  Parser function returned non-dict type ({type(parsed_data)}). Treating as empty dictionary.")
                 parsed_data = {}

            # Add metadata that might be useful, regardless of parsing quality
            parsed_data['_original_filename'] = original_filename
            parsed_data['_processed_timestamp'] = datetime.datetime.now().isoformat()
            # Optionally include raw text only if debugging or specifically needed
            # parsed_data['_raw_text'] = raw_text # Consider removing this in production unless needed

            _log('info', f"  Text parsed. Applicant Name Found (if parser succeeded): '{parsed_data.get('name', 'Not Found/Parser Issue')}'")

            # 4. Save Parsed Data as JSON
            _log('debug', f"  Saving parsed JSON to: {parsed_json_filepath}")
            try:
                with open(parsed_json_filepath, "w", encoding="utf-8") as f_json:
                    # Use ensure_ascii=False for broader character support
                    json.dump(parsed_data, f_json, indent=4, ensure_ascii=False)
                _log('info', f"  Saved parsed JSON successfully: '{parsed_json_filename}'")
            except TypeError as json_err:
                # This error suggests non-serializable data types in parsed_data
                _log('error', f"  ERROR: Could not serialize parsed data to JSON: {json_err}", exc_info=True)
                # Still add to success, but include the error note in the returned data
                parsed_data['json_save_error'] = f"Could not save JSON locally due to serialization error: {json_err}"
                # Add to success list, but with the error flagged
                success_responses.append({
                    'filename': original_filename, # Use original filename for frontend consistency
                    'parsedData': parsed_data,
                    'warning': 'JSON could not be saved locally due to data type issue.'
                })
                # Skip the standard success append below
                continue # Move to next file

            # --- Add to Success Response ---
            success_responses.append({
                'filename': original_filename, # Use original filename for frontend
                'parsedData': parsed_data      # Include the actual parsed dictionary
            })

        except FileNotFoundError as fnf_err:
             error_msg = f"File not found during processing (should not happen after save): {fnf_err}"
             _log('error', f"  ERROR for '{original_filename}': {error_msg}", exc_info=True)
             error_files.append({'filename': original_filename, 'error': error_msg})

        except ValueError as val_err: # Catch specific errors like empty text
            error_msg = f"Data processing error: {val_err}"
            _log('error', f"  ERROR for '{original_filename}': {error_msg}")
            # No traceback needed for simple ValueErrors usually
            error_files.append({'filename': original_filename, 'error': error_msg})
            # Attempt cleanup only if parsing failed *after* saving original
            # (No JSON would have been created yet in this specific path)

        except Exception as e:
            # Catch broader exceptions during save, extract, parse
            error_msg = f"Unexpected processing error: {type(e).__name__} - {str(e)}"
            _log('error', f"  ERROR for '{original_filename}': {error_msg}", exc_info=True) # Log full traceback
            error_files.append({'filename': original_filename, 'error': error_msg})

            # --- Cleanup Attempt on Error ---
            # Remove JSON if it exists (might exist if error happened during JSON save attempt)
            if os.path.exists(parsed_json_filepath):
                try:
                    os.remove(parsed_json_filepath)
                    _log('info', f"  Removed partially created/failed JSON: {parsed_json_filename}")
                except OSError as rm_err:
                    _log('warning', f"  Warning: Could not remove potentially partial JSON {parsed_json_filename}: {rm_err}")
            # Keep the original file (original_filepath) for debugging purposes even if processing failed

    # --- Construct Final Response ---
    response_data: Dict[str, Any] = {}
    status_code: int

    if success_responses:
        response_data['success'] = {
            'message': f'{len(success_responses)} file(s) processed.',
            'files': success_responses
        }
    if error_files:
        response_data['errors'] = error_files

    if success_responses and error_files:
        status_code = 207 # Multi-Status (Partial Success)
        if 'success' in response_data: # Add clarification
             response_data['success']['message'] += f" However, {len(error_files)} file(s) failed."
    elif success_responses:
        status_code = 200 # OK
    elif error_files:
        status_code = 400 # Bad Request (assuming errors were due to client-side issues like bad files)
        response_data['message'] = f'{len(error_files)} file(s) failed processing.'
    else:
         # This case means no files were processed (e.g., all were skipped due to type or empty)
         _log('warning', "Upload request finished, but no files were successfully processed or errored out.")
         response_data['message'] = 'No valid files were provided or processed.'
         status_code = 400 # Bad Request

    _log('info', f"--- Upload request finished. Success: {len(success_responses)}, Errors: {len(error_files)}. Status Code: {status_code} ---\n")
    return jsonify(response_data), status_code


# --- Download Endpoint (Largely unchanged, added logging) ---
@upload_bp.route('/download/<path:filename>', methods=['GET'])
def download_resume(filename: str):
    """
    Serves an original resume file for download.
    Uses the unique timestamped filename derived during upload for lookup.
    Expects the *original* filename as input from the client, then secures it.
    NOTE: This currently assumes the client requests using the *original* filename.
          If the client needs to request using the *timestamped* name, adjust accordingly.
    """
    _log('info', f"Request to download original resume: '{filename}'")

    # Secure the filename provided by the client
    secure_name_base = secure_filename(os.path.splitext(filename)[0])
    original_extension = os.path.splitext(filename)[1] # Keep original extension

    if not secure_name_base:
         _log('warning', f"Download failed: Filename '{filename}' invalid after securing.")
         abort(400, description="Filename invalid after securing.")

    # --- Finding the Timestamped File ---
    # This part is tricky if only the original name is known. We need to find the
    # corresponding timestamped file. It's better if the client receives and uses
    # the saved filename (`file_base_timestamped` + extension) or if we store a mapping.
    # For simplicity *now*, let's assume we look for files *starting* with the secure base.
    # WARNING: This could return the wrong file if multiple uploads had the same original name.
    # A database mapping original_filename -> saved_filepath would be much more robust.

    original_resume_dir = current_app.config['ORIGINAL_RESUME_FOLDER']
    abs_original_resume_dir = os.path.abspath(original_resume_dir)
    target_file_to_serve = None
    actual_filename_on_disk = None # The name we found

    try:
        for item in os.listdir(abs_original_resume_dir):
            # Check if item starts with secure_name_base + "_" (timestamp separator)
            # and ends with the original extension (case-insensitive check recommended)
            if item.startswith(secure_name_base + "_") and item.lower().endswith(original_extension.lower()):
                 # Basic check: Take the first match. For more accuracy, you might sort by timestamp
                 # embedded in the filename and take the latest, or use a DB lookup.
                 potential_path = os.path.join(abs_original_resume_dir, item)
                 if os.path.isfile(potential_path):
                     target_file_to_serve = potential_path
                     actual_filename_on_disk = item # Store the name found on disk
                     _log('info', f"Found matching file on disk: '{actual_filename_on_disk}' for requested '{filename}'")
                     break # Stop after finding the first match

    except FileNotFoundError:
         _log('error', f"Original resume directory not found: {abs_original_resume_dir}")
         abort(404, description=f"Resume storage directory not found.")
    except Exception as e:
         _log('error', f"Error listing directory {abs_original_resume_dir}: {e}", exc_info=True)
         abort(500, description="Server error listing files.")


    if not target_file_to_serve:
         _log('warning', f"Error: Original resume file matching '{filename}' (secure base: '{secure_name_base}') not found in {abs_original_resume_dir}")
         abort(404, description=f"File matching '{filename}' not found.")

    abs_target_file_path = os.path.abspath(target_file_to_serve)

    # --- Security Check (Redundant but safe) ---
    # Ensure the resolved path is still within the intended directory
    if not abs_target_file_path.startswith(abs_original_resume_dir + os.sep):
        _log('error', f"Security Alert: Path traversal attempt detected? Requested '{filename}', resolved to '{abs_target_file_path}', which is outside '{abs_original_resume_dir}'")
        abort(403, description="Access denied.")

    # --- Serve the File ---
    try:
        _log('info', f"Serving file: '{actual_filename_on_disk}' from directory '{abs_original_resume_dir}' as download name '{filename}'")
        return send_from_directory(
            directory=abs_original_resume_dir,
            path=actual_filename_on_disk, # Use the actual filename found on disk
            as_attachment=True,
            download_name=filename # Use the original filename for the user's download
        )
    except Exception as e:
        _log('error', f"Error serving file '{actual_filename_on_disk}': {e}", exc_info=True)
        abort(500, description="Internal server error while serving file.")