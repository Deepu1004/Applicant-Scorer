# -*- coding: utf-8 -*-
import os
import sys
import spacy
import traceback
from flask import Flask, jsonify
from flask_cors import CORS

# Import configuration and utilities
import config
from utils import initialize_nltk # Import the NLTK initializer

# Import Blueprints
from upload_resume import upload_bp
from generate_jd import jd_bp
from scan_resumes import scan_bp

# --- Flask App Initialization ---
app = Flask(__name__)

# --- Load Configuration ---
app.config['JOB_DESC_FOLDER'] = config.JOB_DESC_FOLDER
app.config['ORIGINAL_RESUME_FOLDER'] = config.ORIGINAL_RESUME_FOLDER
app.config['PARSED_DATA_FOLDER'] = config.PARSED_DATA_FOLDER
app.config['MAX_CONTENT_LENGTH'] = config.MAX_FILE_SIZE
app.config['NLP_MODEL'] = None # Placeholder for loaded spaCy model
app.config['NLP_MODEL_NAME'] = config.NLP_MODEL_NAME # Store the name

# --- Configure CORS ---
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# --- Create Directories If They Don't Exist ---
print("--- Initializing Directories ---")
for folder_path in [config.JOB_DESC_FOLDER, config.ORIGINAL_RESUME_FOLDER, config.PARSED_DATA_FOLDER]:
    try:
        os.makedirs(folder_path, exist_ok=True)
        print(f"Directory ensured: {folder_path}")
    except OSError as e:
        print(f"CRITICAL ERROR: Could not create directory {folder_path}: {e}")
        print("Please check permissions and ensure the parent directory structure exists.")
        # sys.exit(1) # Consider exiting if essential
print("--- Directory Initialization Complete ---")

# --- Load spaCy Model ---
def load_spacy_model(model_name):
    """Loads or downloads the spaCy model."""
    print("--- Loading spaCy Model ---")
    nlp_instance = None
    try:
        nlp_instance = spacy.load(model_name)
        print(f"spaCy model '{model_name}' loaded successfully.")
    except OSError:
        print(f"spaCy model '{model_name}' not found. Attempting to download...")
        try:
            from spacy.cli import download
            download(model_name)
            nlp_instance = spacy.load(model_name) # Try loading again
            print(f"Model '{model_name}' downloaded and loaded successfully.")
        except ImportError:
             print("spacy.cli.download not found, attempting system call...")
             try:
                 os.system(f"{sys.executable} -m spacy download {model_name}")
                 nlp_instance = spacy.load(model_name)
                 print(f"Model '{model_name}' downloaded via system call and loaded successfully.")
             except Exception as e_sys:
                 print(f"Failed to download or load spaCy model '{model_name}' via system call: {e_sys}")
                 print("NER for name extraction will not be available.")
                 nlp_instance = None
        except Exception as e:
            print(f"Failed to download or load spaCy model '{model_name}': {e}")
            print("NER for name extraction will not be available.")
            nlp_instance = None
    print("--- spaCy Model Loading Complete ---")
    return nlp_instance

# Load the model and store it in app.config
app.config['NLP_MODEL'] = load_spacy_model(app.config['NLP_MODEL_NAME'])

# --- Initialize NLTK ---
# Call the initializer function from utils.py
initialize_nltk()

# --- Register Blueprints ---
# Note the url_prefix adds a base path to all routes within the blueprint
app.register_blueprint(upload_bp) # Prefix '/resumes' defined in upload_resume.py
app.register_blueprint(jd_bp)     # Prefix '/jd' defined in generate_jd.py
app.register_blueprint(scan_bp)   # Prefix '/scan' defined in scan_resumes.py

# --- Basic Health Check Route (at root) ---
@app.route('/', methods=['GET'])
def health_check():
    """Basic health check endpoint."""
    print("Health check endpoint '/' accessed.")
    # Check status of models/nltk
    spacy_status = "Loaded" if app.config['NLP_MODEL'] else "Failed/Disabled"
    # Access NLTK status via the global var in utils (or add a check function)
    import utils
    nltk_status = "Initialized" if utils.lemmatizer else "Failed/Disabled"

    return jsonify({
        "status": "ok",
        "message": "ATS Backend is running",
        "spacy_model": f"{app.config['NLP_MODEL_NAME']} ({spacy_status})",
        "nltk_status": nltk_status
        }), 200

# --- Main Execution ---
if __name__ == '__main__':
    print("\n" + "="*50)
    print("     Starting ATS Backend Flask Server (Modular)")
    print("="*50)
    print(f" * Environment: {'Development' if app.debug else 'Production'}")
    print(f" * Base Directory: {config.BASE_DIR}")
    print(f" * Job Descriptions: {app.config['JOB_DESC_FOLDER']}")
    print(f" * Original Resumes: {app.config['ORIGINAL_RESUME_FOLDER']}")
    print(f" * Parsed Resumes: {app.config['PARSED_DATA_FOLDER']}")
    print(f" * Max Upload Size: {app.config['MAX_CONTENT_LENGTH'] // (1024*1024)} MB")
    print(f" * spaCy Model Loaded: {'Yes (' + app.config['NLP_MODEL_NAME'] + ')' if app.config['NLP_MODEL'] else 'NO - Name extraction disabled!'}")
    # Check NLTK status again for the startup message
    import utils
    print(f" * NLTK Ready: {'Yes' if utils.lemmatizer else 'NO - Keyword matching WILL FAIL!'}")
    print(f" * Running on http://0.0.0.0:5000 (Press CTRL+C to quit)")
    print("="*50 + "\n")

    # Set debug=True for development; use False and a WSGI server for production
    # Use threaded=False if you encounter issues with shared resources like models,
    # although Flask's dev server with reload might handle it ok.
    # Consider using a production server like Gunicorn or Waitress.
    app.run(debug=True, host='0.0.0.0', port=5000, threaded=True) # threaded=True can improve dev responsiveness

    print("\n" + "="*50)
    print("     Flask Server Has Been Shut Down")
    print("="*50 + "\n")