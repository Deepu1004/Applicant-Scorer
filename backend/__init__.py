# backend/__init__.py
# -*- coding: utf-8 -*-
import os
import sys
import spacy
import traceback
import subprocess
import logging # Import logging
from flask import Flask, jsonify
from flask_cors import CORS

# --- Relative Imports within the 'backend' package ---
from . import config  # Import config from the same package
from . import utils   # Import utils from the same package

# Import Blueprints from the same package
from .upload_resume import upload_bp
from .generate_jd import jd_bp
from .scan_resumes import scan_bp

# --- spaCy Model Loading Logic ---
def load_spacy_model_on_demand(app, model_name, model_version):
    """
    Loads or downloads spaCy model into /tmp. Caches in app.config.
    Now uses app.logger for logging.
    """
    if app.config.get('NLP_MODEL') is not None:
        app.logger.info("spaCy model already loaded in memory.")
        return app.config['NLP_MODEL']

    # Define paths and URL using model name and version
    tmp_model_base_path = "/tmp/spacy_models" # Base dir in tmp for models
    tmp_model_path = os.path.join(tmp_model_base_path, model_name) # Path for specific model
    full_model_name_version = f"{model_name}-{model_version}"
    model_load_path = os.path.join(tmp_model_path, model_name, full_model_name_version) # Expected installed path
    model_url = f"https://github.com/explosion/spacy-models/releases/download/{full_model_name_version}/{full_model_name_version}-py3-none-any.whl"

    app.logger.info(f"--- Loading spaCy Model On-Demand: {model_name} v{model_version} ---")
    nlp_instance = None
    try:
        # Ensure base /tmp directory for models exists
        os.makedirs(tmp_model_base_path, exist_ok=True)

        # Check if model seems correctly installed in the target /tmp location
        if os.path.exists(os.path.join(model_load_path, "meta.json")):
             app.logger.info(f"Loading spaCy model from expected path: {model_load_path}...")
             nlp_instance = spacy.load(model_load_path)
             app.logger.info("Model loaded successfully from /tmp.")
        else:
            app.logger.info(f"Model not found in {model_load_path}. Attempting download from {model_url}...")

            # Use pip to install the model wheel directly into the target subdirectory
            # --target installs into the specified dir, creating package structure needed by spacy.load
            pip_command = [
                sys.executable, "-m", "pip", "install",
                "--target", tmp_model_path, # Install *into* /tmp/spacy_models/en_core_web_sm/
                "--no-deps",
                model_url
            ]
            app.logger.info(f"Executing: {' '.join(pip_command)}")
            result = subprocess.run(pip_command, check=True, capture_output=True, text=True)
            app.logger.debug(f"Pip install stdout:\n{result.stdout}")
            if result.stderr:
                 app.logger.warning(f"Pip install stderr:\n{result.stderr}") # Log stderr as warning

            app.logger.info(f"Model downloaded and installed to {tmp_model_path}. Verifying installation...")

            # Verify the expected directory structure was created by pip install --target
            if not os.path.exists(os.path.join(model_load_path, "meta.json")):
                 # Log contents of tmp_model_path for debugging if structure is wrong
                 app.logger.error(f"Model directory structure not found as expected at {model_load_path} after install.")
                 try:
                     dir_contents = os.listdir(tmp_model_path)
                     app.logger.error(f"Contents of {tmp_model_path}: {dir_contents}")
                     # Attempt to find the correct subdir if possible (less reliable)
                     found_path = None
                     for item in dir_contents:
                         potential_path = os.path.join(tmp_model_path, item)
                         if os.path.isdir(potential_path) and os.path.exists(os.path.join(potential_path, "meta.json")):
                              # Check if it contains the model name and version
                              if model_name in item and model_version in item:
                                   model_load_path = potential_path
                                   found_path = True
                                   app.logger.warning(f"Found model data in unexpected subdirectory: {model_load_path}. Attempting load.")
                                   break
                     if not found_path:
                          raise OSError(f"Could not locate spaCy model data directory within {tmp_model_path}")

                 except Exception as list_err:
                     app.logger.error(f"Could not list directory {tmp_model_path} to debug: {list_err}")
                     raise OSError(f"Could not find spaCy model data directory within {tmp_model_path} after install.")


            app.logger.info(f"Loading model from: {model_load_path}...")
            nlp_instance = spacy.load(model_load_path)
            app.logger.info("Model loaded successfully after download.")

    except subprocess.CalledProcessError as e:
        app.logger.critical(f"CRITICAL ERROR: Failed to download/install spaCy model using pip: {e}")
        app.logger.critical(f"Command attempted: {' '.join(e.cmd)}")
        app.logger.critical(f"Pip stdout:\n{e.stdout}")
        app.logger.critical(f"Pip stderr:\n{e.stderr}")
        app.logger.critical("Check model URL/version, network connectivity, and /tmp permissions/space.")
        nlp_instance = None
    except OSError as e:
        app.logger.critical(f"CRITICAL ERROR: Failed to load spaCy model from {model_load_path} (OSError): {e}", exc_info=True)
        nlp_instance = None
    except Exception as e:
        app.logger.critical(f"CRITICAL ERROR: An unexpected error occurred loading/downloading spaCy model: {e}", exc_info=True)
        nlp_instance = None

    # Cache the result (even if None)
    app.config['NLP_MODEL'] = nlp_instance

    if not nlp_instance:
        app.logger.error("!!! NER capabilities might be limited due to spaCy model load failure!!!")

    app.logger.info("--- spaCy Model Loading Process Complete ---")
    return nlp_instance

# --- Application Factory ---
def create_app(test_config=None):
    """Flask application factory."""
    app = Flask(__name__, instance_relative_config=True)

    # --- Configure Logging ---
    # Use Flask's default logger or customize further
    # Example: Set level based on environment
    log_level = logging.DEBUG if app.debug else logging.INFO
    logging.basicConfig(level=log_level, format='%(asctime)s %(levelname)s %(name)s: %(message)s')
    app.logger.setLevel(log_level)
    app.logger.info("Flask application logger configured.")

    # --- Load Configuration ---
    app.logger.info("Loading configuration...")
    app.config.from_object(config) # Load from backend/config.py

    if test_config:
        app.config.from_mapping(test_config)
    app.logger.info("Configuration loaded.")
    app.logger.debug(f"Job Desc Folder: {app.config.get('JOB_DESC_FOLDER')}")
    app.logger.debug(f"Original Resume Folder: {app.config.get('ORIGINAL_RESUME_FOLDER')}")
    app.logger.debug(f"Parsed Data Folder: {app.config.get('PARSED_DATA_FOLDER')}")

    # --- Configure CORS ---
    app.logger.info(f"Configuring CORS for origins: {app.config.get('ALLOWED_ORIGINS')}")
    CORS(app, resources={
        r"/*": {
            "origins": app.config['ALLOWED_ORIGINS'],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"], # Add common headers
            "supports_credentials": True
        }
    })
    app.logger.info("CORS configured.")

    # --- Create Directories (using /tmp paths from config) ---
    app.logger.info("--- Ensuring /tmp Directories Exist ---")
    # Using /tmp is generally necessary on serverless platforms like Vercel/Render free tier
    for folder_path_key in ['JOB_DESC_FOLDER', 'ORIGINAL_RESUME_FOLDER', 'PARSED_DATA_FOLDER']:
        folder_path = app.config.get(folder_path_key)
        if folder_path:
             try:
                 os.makedirs(folder_path, exist_ok=True)
                 app.logger.info(f"Directory ensured: {folder_path}")
             except OSError as e:
                 app.logger.error(f"Error creating directory {folder_path}: {e}", exc_info=True)
                 # This could be critical depending on the route
        else:
            app.logger.error(f"Configuration key {folder_path_key} not found!")

    # --- Initialize NLP Models and NLTK within App Context ---
    with app.app_context():
        app.logger.info("Initializing NLP resources...")
        # Load spaCy Model
        load_spacy_model_on_demand(
            app,
            app.config['NLP_MODEL_NAME'],
            app.config['NLP_MODEL_VERSION']
        )
        # Initialize NLTK
        nltk_ready = utils.initialize_nltk()
        app.config['NLTK_READY'] = nltk_ready # Store status if needed
        app.logger.info(f"NLTK initialization status: {'OK' if nltk_ready else 'FAILED'}")
        app.logger.info("NLP resources initialization attempt complete.")

    # --- Register Blueprints ---
    app.logger.info("Registering blueprints...")
    app.register_blueprint(upload_bp)
    app.register_blueprint(jd_bp)
    app.register_blueprint(scan_bp)
    app.logger.info("Blueprints registered.")

    # --- Basic Health Check Route ---
    @app.route('/health', methods=['GET']) # Changed path to /health
    def health_check():
        """Basic health check endpoint."""
        app.logger.debug("Health check endpoint '/health' accessed.")
        spacy_model = app.config.get('NLP_MODEL')
        spacy_status = "Loaded" if spacy_model else "Failed/Unavailable"
        nltk_status = "Ready" if app.config.get('NLTK_READY') else "Failed/Unavailable"

        return jsonify({
            "status": "ok",
            "message": "ATS Backend is running",
            "spacy_model": f"{app.config.get('NLP_MODEL_NAME', 'N/A')} ({spacy_status})",
            "nltk_status": nltk_status
        }), 200

    # --- Error Handlers ---
    @app.errorhandler(404)
    def not_found(error):
        app.logger.warning(f"404 Not Found: {request.path}")
        return jsonify({"error": "Not Found", "message": "The requested URL was not found on the server."}), 404

    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error(f"500 Internal Server Error: {error}", exc_info=True)
        return jsonify({"error": "Internal Server Error", "message": "An unexpected error occurred processing your request."}), 500

    @app.errorhandler(413)
    def request_entity_too_large(error):
        max_size_mb = app.config.get('MAX_CONTENT_LENGTH', 15*1024*1024) // (1024*1024)
        app.logger.warning(f"413 Payload Too Large: {request.content_length} bytes")
        return jsonify({"error": "Payload Too Large", "message": f"The file exceeds the maximum allowed size of {max_size_mb} MB."}), 413

    @app.errorhandler(400)
    def bad_request(error):
         # Log the description if available from abort()
        description = error.description if hasattr(error, 'description') else "Bad request structure or data."
        app.logger.warning(f"400 Bad Request: {request.path} - {description}")
        return jsonify({"error": "Bad Request", "message": description}), 400

    app.logger.info("--- Flask App Creation Complete ---")
    return app