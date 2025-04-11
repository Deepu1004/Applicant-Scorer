# -*- coding: utf-8 -*-
import os
import json
import datetime
import traceback
from flask import (
    Blueprint, request, jsonify, current_app, send_from_directory, abort
)
from werkzeug.utils import secure_filename

# Import utilities and config
# Ensure these imports match your project structure
try:
    from utils import (
        allowed_file, extract_text_from_pdf, extract_text_from_docx,
        parse_resume_text
    )
except ImportError:
    # Handle case where utils might be in the same directory or handle path issues
    print("Warning: Could not import from 'utils'. Trying local import or check PYTHONPATH.")
    # Add alternative import logic if necessary, e.g., if utils.py is in the same dir:
    # from .utils import ... or handle path adjustments
    # For now, assume it works or raise a clearer error if needed during runtime
    raise


# Create Blueprint
upload_bp = Blueprint('upload_resume', __name__, url_prefix='/resumes')

@upload_bp.route('/upload', methods=['POST'])
def upload_and_parse_resumes():
    """
    Handles resume uploads, saves original, parses, saves JSON data,
    and returns parsed data in the response for successful files.
    """
    print("Received request to /resumes/upload")
    if 'files' not in request.files:
        print("Error: No 'files' key found in request.files")
        return jsonify({'error': "Missing 'files' part in the multipart request"}), 400

    files = request.files.getlist('files')
    if not files or all(f.filename == '' for f in files):
        print("Error: No files selected or files list is empty")
        return jsonify({'error': 'No selected files to upload'}), 400

    print(f"Received {len(files)} file(s) for upload.")
    success_responses = [] # Will store dicts including parsedData
    error_files = []

    original_folder = current_app.config['ORIGINAL_RESUME_FOLDER']
    parsed_folder = current_app.config['PARSED_DATA_FOLDER']

    # Ensure folders exist
    os.makedirs(original_folder, exist_ok=True)
    os.makedirs(parsed_folder, exist_ok=True)

    for file in files:
        if not file or not file.filename:
            print("Skipping an empty file part.")
            continue

        original_filename = file.filename
        # Use secure_filename cautiously, it might alter names significantly
        # Sticking to original_filename for identifying errors/success might be better,
        # but use secure_filename for saving to prevent path traversal.
        original_filename_secure_for_save = secure_filename(original_filename)
        print(f"Processing file: {original_filename} (Secure for save: {original_filename_secure_for_save})")

        if not original_filename_secure_for_save:
             error_msg = "Filename is invalid or becomes empty after sanitization."
             print(f"Error for '{original_filename}': {error_msg}")
             error_files.append({'filename': original_filename, 'error': error_msg})
             continue

        # Use the secure name ONLY for constructing the file path to save
        original_filepath = os.path.join(original_folder, original_filename_secure_for_save)

        # Use base name from secure name, but keep original for identification
        base_name_secure, extension = os.path.splitext(original_filename_secure_for_save)
        timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S%f")
        # Create a unique base for parsed file using timestamp
        file_base_timestamped = f"{base_name_secure}_{timestamp}"
        parsed_json_filename = f"{file_base_timestamped}_parsed.json"
        parsed_json_filepath = os.path.join(parsed_folder, parsed_json_filename)

        # Check allowed extensions using the original filename for user feedback clarity
        if allowed_file(original_filename):
            saved_original = False
            saved_json = False
            parsed_data = None # Initialize parsed_data for the current file
            try:
                # Save the original file
                file.save(original_filepath)
                saved_original = True
                print(f"  Saved original: {original_filename_secure_for_save}")

                # Extract text
                raw_text = None
                print(f"  Extracting text using extension: {extension.lower()}")
                if extension.lower() == ".pdf":
                    raw_text = extract_text_from_pdf(original_filepath)
                elif extension.lower() == ".docx":
                    raw_text = extract_text_from_docx(original_filepath)

                if not raw_text:
                    raise ValueError("Text extraction failed or returned empty content.")
                print("  Text extracted successfully.")

                # Parse text
                print("  Parsing extracted text...")
                # Pass the extracted text and the *original* filename for context if needed
                parsed_data = parse_resume_text(raw_text, original_filename)
                if not parsed_data:
                    raise ValueError("Parsing function returned None or empty data.")
                print("  Text parsed successfully.")

                # Save parsed JSON locally (optional, but good practice)
                print(f"  Saving parsed JSON to: {parsed_json_filename}")
                with open(parsed_json_filepath, "w", encoding="utf-8") as f_json:
                    json.dump(parsed_data, f_json, indent=4, ensure_ascii=False)
                saved_json = True
                print(f"  Saved parsed JSON successfully.")

                # ---- KEY CHANGE: Add parsed_data to the success response ----
                success_responses.append({
                    'filename': original_filename, # Use original filename for frontend mapping
                    'parsedData': parsed_data      # Include the parsed dictionary
                    # 'parsed_json_filename': parsed_json_filename, # Can include if needed elsewhere
                    # 'message': 'File processed successfully.' # Redundant with overall message
                })
                # -------------------------------------------------------------

            except Exception as e:
                error_msg = f"Processing failed: {type(e).__name__} - {str(e)}"
                print(f"  ERROR for '{original_filename}': {error_msg}")
                traceback.print_exc()
                # Use original filename for error reporting
                error_files.append({'filename': original_filename, 'error': error_msg})
                # Cleanup partial files if an error occurred
                if saved_json and os.path.exists(parsed_json_filepath):
                    try: os.remove(parsed_json_filepath); print(f"  Removed partial JSON: {parsed_json_filename}")
                    except OSError: print(f"  Warning: Could not remove partial JSON {parsed_json_filename}")
                # Remove original only if text extraction or parsing failed, maybe keep otherwise?
                # Decide cleanup strategy based on needs. Removing original might hinder debugging.
                # Let's keep the original for now if it saved successfully, even if parsing failed.
                # if saved_original and os.path.exists(original_filepath):
                #      try: os.remove(original_filepath); print(f"  Removed original file: {original_filename_secure_for_save} after error")
                #      except OSError: print(f"  Warning: Could not remove original file {original_filename_secure_for_save} after error")

        else:
             # Use original filename for error reporting
             error_msg = "Invalid file type. Only PDF and DOCX are allowed."
             print(f"  Error for '{original_filename}': {error_msg}")
             error_files.append({'filename': original_filename, 'error': error_msg})

    # --- Response Construction ---
    response_data = {}
    status_code = 200
    if success_responses:
        # Structure matches frontend expectation: responseData.success.files[{ filename, parsedData }]
        response_data['success'] = {
            'message': f'{len(success_responses)} file(s) processed and ready for AI validation.',
            'files': success_responses # This list now contains parsedData
        }
    if error_files:
        response_data['errors'] = error_files
        # If there were both successes and errors, return 207 Partial Content
        status_code = 207 if success_responses else 400

    # Handle case where nothing succeeded and nothing explicitly failed (e.g., only empty file parts)
    if not success_responses and not error_files:
         response_data['info'] = {'message': 'No valid files were processed.'}
         status_code = 400 # Bad request as nothing useful was provided

    print(f"Upload request finished. Success: {len(success_responses)}, Errors: {len(error_files)}. Status Code: {status_code}")
    return jsonify(response_data), status_code


# --- Download Endpoint (No changes needed based on request) ---
@upload_bp.route('/download/<path:filename>', methods=['GET'])
def download_resume(filename):
    """Serves an original resume file for download based on the original filename."""
    print(f"Request to download original resume: {filename}")
    secure_name = secure_filename(filename)
    if not secure_name: abort(400, description="Filename invalid after securing.")

    original_resume_dir = current_app.config['ORIGINAL_RESUME_FOLDER']
    # Convert to absolute path for robust security check
    abs_original_resume_dir = os.path.abspath(original_resume_dir)
    # Construct the target path using the secure name
    target_file_path = os.path.join(abs_original_resume_dir, secure_name)
    abs_target_file_path = os.path.abspath(target_file_path)

    # Security check: Prevent path traversal attacks
    # Ensure the resolved absolute path starts with the absolute directory path + separator
    if not abs_target_file_path.startswith(abs_original_resume_dir + os.sep) and abs_target_file_path != abs_original_resume_dir:
        print(f"Access Denied: Path traversal attempt? {filename} -> {secure_name} -> {abs_target_file_path}")
        abort(403, description="Access denied.")

    if not os.path.isfile(abs_target_file_path):
         print(f"Error: Original resume file not found: {secure_name} in {abs_original_resume_dir}")
         abort(404, description=f"File '{filename}' not found.")

    try:
        # Use send_from_directory for security and proper header handling
        # Pass the absolute directory path and the secure filename
        return send_from_directory(
            abs_original_resume_dir,
            secure_name,
            as_attachment=True,
            download_name=filename # Suggest original filename to user
        )
    except Exception as e:
        print(f"Error serving file {secure_name}: {e}"); traceback.print_exc()
        abort(500, description="Internal server error while serving file.")

# --- Helper utilities (assuming they are in utils.py or similar) ---
# Make sure you have these functions defined correctly in your utils module.
# Example stubs if they weren't provided:
"""
# In utils.py (or similar)

import PyPDF2
from docx import Document

ALLOWED_EXTENSIONS = {'pdf', 'docx'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(pdf_path):
    text = ""
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages:
                text += page.extract_text() or ""
    except Exception as e:
        print(f"Error reading PDF {pdf_path}: {e}")
        return None
    return text

def extract_text_from_docx(docx_path):
    text = ""
    try:
        doc = Document(docx_path)
        for para in doc.paragraphs:
            text += para.text + "\n"
    except Exception as e:
        print(f"Error reading DOCX {docx_path}: {e}")
        return None
    return text

def parse_resume_text(text, original_filename):
    # This is where your complex parsing logic goes (e.g., using regex, SpaCy, etc.)
    # For demonstration, returning a basic structure. Replace with your actual parsing.
    print(f"Parsing text from: {original_filename} (length: {len(text)})")
    # Basic placeholder parsing - REPLACE WITH YOUR ACTUAL PARSING LOGIC
    parsed = {
        "_original_filename": original_filename,
        "name": "Extracted Name Placeholder",
        "phone": "Extracted Phone Placeholder",
        "email": "extracted@example.com",
        "linkedin": "Not Found",
        "github": "Not Found",
        "summary": "Extracted Summary Placeholder",
        "education": "Extracted Education Placeholder",
        "experience": "Extracted Experience Placeholder",
        "skills": "Extracted Skills Placeholder",
        "projects": "Extracted Projects Placeholder",
        "certifications": "Extracted Certifications Placeholder",
        "coding_profiles": "Not Found",
        "_raw_text": text[:2000] # Truncate raw text for response size if needed
    }
    # Simulate parsing failure sometimes for testing
    # import random
    # if random.random() < 0.1: return None # Simulate 10% parse failure

    # Simulate finding some fields
    if "deepak" in text.lower():
        parsed["name"] = "Sai Deepak Varanasi (Found)"
    if "9133115280" in text:
        parsed["phone"] = "+91 9133115280 (Found)"

    return parsed

"""