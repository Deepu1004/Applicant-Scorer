# Applicant Scorer - AI-Powered ATS Assistant

<p align="center">
  <img src="https://github.com/Deepu1004/Applicant-Scorer-Private/blob/main/public/logo.png" alt="Applicant Scorer Logo" width="120">
</p>

<p align="center">
  <strong>Streamline your hiring process and job search with AI-driven resume scanning, keyword analysis, and job description generation.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#installation--setup">Setup</a> •
  <a href="#running-the-application">Running</a> •
  <a href="#usage">Usage</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## ✨ Overview

Applicant Scorer is a full-stack web application designed to assist both recruiters and job seekers. It leverages AI (Google Gemini) and NLP techniques (spaCy, NLTK) to:

*   **Generate** professional, ATS-friendly job descriptions based on title and experience level.
*   **Upload and parse** resumes (PDF, DOCX) to extract key information.
*   **Scan** uploaded resumes against a specific job description.
*   **Rank** candidates based on keyword matching scores.
*   **Provide insights** into matched and missing keywords.

The application features a modern, responsive frontend built with React and Tailwind CSS, enhanced with smooth animations using Framer Motion. The backend is a robust Flask server handling file management, parsing, AI interaction, and analysis logic.

## 📸 Screenshots

*(Add screenshots of your application here! This significantly improves the README.)*

**Example: Homepage**
![Homepage Preview](frontend/public/Scan.png)

**Example: JD Generation**
*(Placeholder: Add a screenshot of the Job Description Studio page)*

**Example: Resume Scanning Results**
*(Placeholder: Add a screenshot of the Scan Results page)*

**Example: Resume Upload**
*(Placeholder: Add a screenshot of the Bulk Upload page)*

---

## 🚀 Key Features

*   📄 **Resume Upload & Parsing:**
    *   Supports `.pdf` and `.docx` formats.
    *   Securely saves original files.
    *   Extracts text content efficiently.
    *   Parses resumes to identify contact info (name, email, phone), links (LinkedIn, GitHub), and key sections (summary, experience, education, skills, projects, etc.).
    *   Saves parsed data as structured JSON.
*   ✍️ **AI Job Description Generation:**
    *   Uses Google Gemini (Flash model) to generate comprehensive JDs.
    *   Input job title and experience level.
    *   Generates structured, professional descriptions optimized for ATS keywords.
    *   Allows manual editing and saving of JDs.
*   💾 **Job Description Management:**
    *   Save generated or manually entered JDs as `.txt` files.
    *   List and preview saved JDs.
*   🔍 **Batch Resume Scanning:**
    *   Select a saved JD.
    *   Scan all previously parsed resumes against the chosen JD.
    *   Utilizes NLTK for robust keyword extraction and comparison (lemmatization, POS tagging, stop word removal).
*   📊 **Ranked Results & Insights:**
    *   Displays a ranked list of candidates based on match score (%).
    *   Shows extracted contact information for top candidates.
    *   Highlights matched and missing keywords for each resume vs. the JD.
    *   Provides download links for original resumes.
*   🎨 **Modern UI/UX:**
    *   Clean, responsive design with Tailwind CSS.
    *   Smooth page transitions and element animations using Framer Motion.
    *   Intuitive user flow across different modules.
    *   Clear loading states and error handling.

---

## 🛠️ Tech Stack

**Frontend:**
*   ![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
*   ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
*   ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
*   ![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat&logo=framer&logoColor=white)
*   ![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat&logo=axios&logoColor=white)
*   ![Lucide Icons](https://img.shields.io/badge/Lucide-Icons-3296f2?style=flat)

**Backend:**
*   ![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
*   ![Flask](https://img.shields.io/badge/Flask-000000?style=flat&logo=flask&logoColor=white)
*   ![spaCy](https://img.shields.io/badge/spaCy-09A3D5?style=flat&logo=spacy&logoColor=white) (for NLP tasks like Name Extraction)
*   ![NLTK](https://img.shields.io/badge/NLTK-3776AB?style=flat) (for Keyword Extraction & Matching)
*   ![PyMuPDF](https://img.shields.io/badge/PyMuPDF-fitz-orange?style=flat) (for PDF text extraction)
*   ![python-docx](https://img.shields.io/badge/python--docx-2B579A?style=flat) (for DOCX text extraction)

**AI Service:**
*   ![Google Cloud](https://img.shields.io/badge/Google_Gemini-4285F4?style=flat&logo=googlecloud&logoColor=white)

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

*   **Python:** Version 3.8 or higher.
*   **Node.js:** Version 18.x or higher (comes with npm).
*   **Git:** For cloning the repository.
*   **Google Gemini API Key:** You need an API key from Google AI Studio or Google Cloud for the JD Generation feature.

---

## ⚙️ Installation & Setup

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-username/applicant-scorer.git # Replace with your repo URL
    cd applicant-scorer
    ```

2.  **Backend Setup:**
    *   **Navigate to Backend (Root Directory):** The backend code (`app.py`, etc.) is assumed to be in the root directory based on your file structure.
    *   **Create a Virtual Environment:**
        ```bash
        python -m venv venv
        ```
    *   **Activate the Virtual Environment:**
        *   Windows: `.\venv\Scripts\activate`
        *   macOS/Linux: `source venv/bin/activate`
    *   **Install Python Dependencies:**
        *   ***IMPORTANT:*** Create a `requirements.txt` file in the root directory by running:
            ```bash
            pip freeze > requirements.txt
            ```
            *(Do this *after* ensuring all necessary packages like Flask, spacy, nltk, PyMuPDF, python-docx, Flask-Cors, etc., are installed in your development environment)*
        *   Then install the requirements:
            ```bash
            pip install -r requirements.txt
            ```
    *   **NLTK and spaCy Data:** The application attempts to download required NLTK data (`punkt`, `stopwords`, `wordnet`, `omw-1.4`, `averaged_perceptron_tagger`) and the spaCy model (`en_core_web_sm`) automatically on the first run if they are missing. If you encounter issues, you might need to download them manually:
        ```bash
        python -m nltk.downloader punkt stopwords wordnet omw-1.4 averaged_perceptron_tagger
        python -m spacy download en_core_web_sm
        ```

3.  **Frontend Setup:**
    *   **Navigate to Frontend Directory:**
        ```bash
        cd frontend
        ```
    *   **Install Node.js Dependencies:**
        ```bash
        npm install
        ```

---

## 🔧 Configuration

*   **Frontend (Gemini API Key):**
    *   The frontend needs your Google Gemini API key to generate job descriptions.
    *   Create a `.env` file in the `frontend/` directory:
        ```bash
        cd frontend
        touch .env
        ```
    *   Add your API key to the `.env` file:
        ```env
        VITE_API_URL=http://localhost:5000 # Optional: Set if backend runs elsewhere
        VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
        ```
    *   **Replace `YOUR_GEMINI_API_KEY_HERE` with your actual key.**
    *   **IMPORTANT:** Do NOT commit your `.env` file to Git. Add it to your `.gitignore` file if it's not already there.

*   **Backend:**
    *   Most backend configurations (folder paths, file size limits, NLP models) are set in `config.py`. You can modify this file directly if needed.
    *   The required directories (`job_descriptions`, `uploads/resumes_original`, `uploads/resumes_parsed`) will be created automatically when the Flask server starts. Ensure the application has write permissions in its root directory.

---

## ▶️ Running the Application

You need to run both the backend and frontend servers simultaneously.

1.  **Start the Backend (Flask Server):**
    *   Make sure you are in the root directory of the project and your virtual environment is activated.
    *   Run the Flask app:
        ```bash
        flask run
        # OR
        python app.py
        ```
    *   The backend server will typically start on `http://127.0.0.1:5000`. Check the console output for the exact URL.

2.  **Start the Frontend (Vite Dev Server):**
    *   Open a *new* terminal window/tab.
    *   Navigate to the `frontend/` directory:
        ```bash
        cd frontend
        ```
    *   Run the Vite development server:
        ```bash
        npm run dev
        ```
    *   The frontend application will typically start on `http://localhost:5173`. Open this URL in your web browser.

*(The backend is configured with CORS to allow requests from `http://localhost:5173`.)*

---

## 📖 Usage

1.  **Home:** Provides an overview of the application's features and links to the main tools.
2.  **Bulk Upload (`/bulk-upload`):**
    *   Select or drag-and-drop multiple resume files (`.pdf`, `.docx`).
    *   Click "Save Resumes". The backend will save the originals and parse them, storing the extracted data as JSON files (for internal use by the scanner).
3.  **Generate JD (`/job-creation`):**
    *   Choose "AI Generate" or "Manual Input".
    *   **AI:** Enter a "Job Title" and "Experience Level", then click "Generate with AI". The Gemini API will be called to create a description.
    *   **Manual:** Paste or write your job description directly into the textarea.
    *   Edit the description as needed.
    *   Enter the "Job Title" and "Experience Level" (required for saving).
    *   Click "Save JD". The description will be saved as a `.txt` file on the backend.
4.  **Scan Resume (`/scan`):**
    *   Click "Start Scanning". A modal will appear.
    *   If JDs are available, the modal lists them. Select the desired JD file to scan against.
    *   You can optionally "Preview" the content of the selected JD.
    *   Click "Confirm & Scan".
    *   The backend processes all previously uploaded/parsed resumes against the selected JD's keywords.
    *   Results are displayed, ranked by match score (%). Each result shows:
        *   Candidate Name (if found) & Score Badge
        *   Contact Info (Email, Phone)
        *   Matched Keywords (Expandable list)
        *   Missing Keywords (Expandable list)
        *   A link to download the original resume file.

---

## 📂 Project Structure (Simplified)