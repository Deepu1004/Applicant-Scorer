# -*- coding: utf-8 -*-
import os
import sys
import spacy
import traceback
import subprocess  # <--- Add this import
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
app.config['NLP_MODEL_NAME'] = config.NLP_MODEL_NAME # Store the name e.g., "en_core_web_sm"
# --- ADD SpaCy Model Version (Match your spacy version if possible) ---
# Check your spacy version (pip show spacy) and find a compatible model version
# e.g., for spacy 3.7.x, use model version 3.7.0 or similar
app.config['NLP_MODEL_VERSION'] = "3.7.0" # <--- **ADJUST THIS VERSION**

# --- Configure CORS ---
CORS(app, resources={
    r"/*": {
        # IMPORTANT: In production, restrict origins to your Vercel frontend URL
        "origins": ["http://localhost:5173", "http://127.0.0.1:5173", "https://your-vercel-app-url.vercel.app"], # Add your frontend URL
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# --- Create Directories (Only relevant locally, Vercel handles differently) ---
# Note: Vercel's filesystem is ephemeral except for /tmp. Creating these might
# work initially but won't persist reliably across invocations.
# Store JDs/Resumes in external storage (S3, Vercel Blob, etc.) for production.
print("--- Initializing Local Directories (Ephemeral on Vercel) ---")
for folder_path in [config.JOB_DESC_FOLDER, config.ORIGINAL_RESUME_FOLDER, config.PARSED_DATA_FOLDER]:
    try:
        os.makedirs(folder_path, exist_ok=True)
        print(f"Directory ensured locally: {folder_path}")
    except OSError as e:
        print(f"Warning: Could not create directory {folder_path}: {e}")
print("--- Local Directory Initialization Complete ---")


# --- NEW Load spaCy Model Function (Serverless Friendly) ---
def load_spacy_model_on_demand(model_name, model_version):
    """
    Loads the spaCy model. If not found locally (in /tmp for serverless),
    downloads it from the official GitHub releases to /tmp and then loads it.
    Caches the loaded model in app.config['NLP_MODEL'].
    """
    if app.config.get('NLP_MODEL') is not None:
        print("spaCy model already loaded in memory.")
        return app.config['NLP_MODEL']

    # Path where the model will be stored in the serverless environment
    tmp_model_path = f"/tmp/{model_name}"
    model_url = f"https://github.com/explosion/spacy-models/releases/download/{model_name}-{model_version}/{model_name}-{model_version}-py3-none-any.whl"

    print(f"--- Loading spaCy Model On-Demand: {model_name} ---")
    nlp_instance = None
    try:
        # Check if model already downloaded in /tmp
        if os.path.exists(tmp_model_path):
            print(f"Loading spaCy model from {tmp_model_path}...")
            nlp_instance = spacy.load(tmp_model_path)
            print("Model loaded successfully from /tmp.")
        else:
            print(f"Model not found in /tmp. Attempting download from {model_url}...")
            # Ensure /tmp directory exists (usually does on Vercel)
            os.makedirs("/tmp", exist_ok=True)

            # Download the model package using pip into /tmp
            # Using subprocess for cleaner execution in serverless
            pip_command = [
                sys.executable, # Use the current Python interpreter
                "-m", "pip", "install",
                "--target", "/tmp",    # Install specifically into /tmp
                "--no-deps",           # Don't install dependencies (spacy core already installed)
                model_url              # Direct URL to the model wheel file
            ]
            print(f"Executing: {' '.join(pip_command)}") # Log the command
            subprocess.run(pip_command, check=True) # Raise exception if download fails

            print(f"Model downloaded to /tmp. Loading model...")
            # Load the model from the /tmp directory
            # spaCy expects the directory containing the model data,
            # which pip install --target creates correctly.
            nlp_instance = spacy.load(tmp_model_path)
            print("Model loaded successfully after download.")

    except subprocess.CalledProcessError as e:
        print(f"CRITICAL ERROR: Failed to download spaCy model using pip: {e}")
        print(f"Command attempted: {' '.join(e.cmd)}")
        print("Check model URL, network connectivity in Vercel, and /tmp permissions/space.")
        nlp_instance = None # Ensure it's None on failure
    except OSError as e:
        # This might catch errors loading from /tmp even if it exists
        print(f"CRITICAL ERROR: Failed to load spaCy model from {tmp_model_path} (OSError): {e}")
        print("This could happen if the download was corrupted or if there's an issue with the /tmp path.")
        nlp_instance = None # Ensure it's None on failure
    except Exception as e:
        print(f"CRITICAL ERROR: An unexpected error occurred loading/downloading spaCy model: {e}")
        traceback.print_exc()
        nlp_instance = None # Ensure it's None on failure

    # Cache the loaded instance (or None if failed)
    app.config['NLP_MODEL'] = nlp_instance

    if not nlp_instance:
         print("!!! NER for name extraction will likely be unavailable due to model load failure!!!")

    print("--- spaCy Model Loading Process Complete ---")
    return nlp_instance

# --- Trigger Model Load during App Initialization ---
# Call the *new* function during startup. It handles caching internally.
load_spacy_model_on_demand(app.config['NLP_MODEL_NAME'], app.config['NLP_MODEL_VERSION'])

# --- Initialize NLTK ---
# Call the initializer function from utils.py
# Consider similar on-demand download logic for NLTK data if needed
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
    # Re-check the model status from config (it might have failed to load)
    spacy_loaded = app.config.get('NLP_MODEL') is not None
    spacy_status = "Loaded" if spacy_loaded else "Failed/Disabled"

    # Access NLTK status via the global var in utils (or add a check function)
    import utils
    nltk_status = "Initialized" if utils.lemmatizer else "Failed/Disabled"

    return jsonify({
        "status": "ok",
        "message": "ATS Backend is running",
        "spacy_model": f"{app.config['NLP_MODEL_NAME']} ({spacy_status})",
        "nltk_status": nltk_status
        }), 200

# --- Main Execution (Only for Local Development) ---
# Vercel does NOT use this __main__ block. It imports the `app` object.
if __name__ == '__main__':
    print("\n" + "="*50)
    print("     Starting ATS Backend Flask Server (Local Development)")
    print("="*50)
    # Local startup messages... (rest of the print statements from your original)
    print(f" * Environment: Development")
    print(f" * Base Directory: {config.BASE_DIR}")
    print(f" * Job Descriptions: {app.config['JOB_DESC_FOLDER']}")
    print(f" * Original Resumes: {app.config['ORIGINAL_RESUME_FOLDER']}")
    print(f" * Parsed Resumes: {app.config['PARSED_DATA_FOLDER']}")
    print(f" * Max Upload Size: {app.config['MAX_CONTENT_LENGTH'] // (1024*1024)} MB")
    print(f" * spaCy Model Status on Start: {'Loaded (' + app.config['NLP_MODEL_NAME'] + ')' if app.config['NLP_MODEL'] else 'Load Attempted - Check Logs!'}")
    import utils
    print(f" * NLTK Ready: {'Yes' if utils.lemmatizer else 'NO - Check Logs!'}")
    print(f" * Running on http://0.0.0.0:5000 (Press CTRL+C to quit)")
    print("="*50 + "\n")

    # Run the Flask development server
    app.run(debug=True, host='0.0.0.0', port=5000, threaded=True)

    print("\n" + "="*50)
    print("     Flask Server Has Been Shut Down")
    print("="*50 + "\n")