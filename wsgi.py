# wsgi.py (Place this file in your project root, OUTSIDE the 'backend' folder)
import os
import logging

# Import the factory function from your backend package
from backend import create_app

# Configure logging early (optional, but good practice)
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(name)s: %(message)s')
logger = logging.getLogger(__name__)

logger.info("WSGI script started. Creating Flask app instance...")
# Create the Flask app instance using the factory
# This instance is what Gunicorn (or other WSGI servers) will use
app = create_app()
logger.info("Flask app instance created.")

# --- Main Execution Block (Only for Local Development) ---
# This block is NOT used by Gunicorn/Vercel/Render deployments
# It's only for running `python wsgi.py` locally
if __name__ == '__main__':
    print("\n" + "="*50)
    print("     Starting ATS Backend Flask Server (Local Development via wsgi.py)")
    print("="*50)
    # Access config through the app instance
    print(f" * Environment: {'Development' if app.debug else 'Production'}")
    print(f" * Debug Mode: {app.debug}")
    print(f" * Job Descriptions: {app.config.get('JOB_DESC_FOLDER', 'N/A')}")
    print(f" * Original Resumes: {app.config.get('ORIGINAL_RESUME_FOLDER', 'N/A')}")
    print(f" * Parsed Resumes: {app.config.get('PARSED_DATA_FOLDER', 'N/A')}")
    print(f" * Max Upload Size: {app.config.get('MAX_FILE_SIZE', 'N/A') // (1024*1024)} MB")

    # Check status after app creation attempts loading
    spacy_model = app.config.get('NLP_MODEL')
    spacy_status = "Loaded" if spacy_model else "Failed/Unavailable"
    nltk_status = "Ready" if app.config.get('NLTK_READY') else "Failed/Unavailable"

    print(f" * spaCy Model Status: {app.config.get('NLP_MODEL_NAME', 'N/A')} ({spacy_status})")
    print(f" * NLTK Status: {nltk_status}")
    print(f" * Allowed Origins: {app.config.get('ALLOWED_ORIGINS', [])}")
    print(f" * Running on http://0.0.0.0:5000 (Press CTRL+C to quit)")
    print("="*50 + "\n")

    # Run the Flask development server
    # Use host='0.0.0.0' to be accessible on the network
    # Use debug=True carefully in development (enables reloader and debugger)
    # threaded=True can help with concurrent requests but subject to GIL
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)

    print("\n" + "="*50)
    print("     Flask Server Has Been Shut Down")
    print("="*50 + "\n")