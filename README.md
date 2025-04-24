# Applicant Scorer - AI-Powered ATS Assistant

<p align="center">
  <img src="https://github.com/Deepu1004/Applicant-Scorer/blob/main/public/logo.png" alt="Applicant Scorer Logo" width="120">
</p>

<p align="center">
  <strong>Unlock smarter hiring and optimize your job search with AI-driven resume analysis, keyword insights, and effortless job description generation.</strong>
</p>

<p align="center">
  <a href="#✨-why-applicant-scorer">Why Applicant Scorer?</a> •
  <a href="#🚀-key-features">Features</a> •
  <a href="#🛠️-tech-stack">Tech Stack</a> •
  <a href="#⚙️-setup--installation">Setup</a> •
  <a href="#▶️-running-the-application">Running</a> •
  <a href="#📖-usage-guide">Usage</a> •
  <a href="#🔒-code-privacy">Code Privacy</a>
</p>

---

## ✨ Why Applicant Scorer?

In today's competitive landscape, both hiring managers and job seekers face significant challenges. Recruiters sift through hundreds of resumes, struggling to identify the best fit quickly. Job seekers strive to tailor their applications to pass automated screening systems (ATS).

**Applicant Scorer** bridges this gap. It's a sophisticated full-stack application designed to:

*   **For Recruiters:** Dramatically reduce screening time, identify top candidates based on objective data, and ensure job descriptions are clear and effective.
*   **For Job Seekers:** Understand how their resume matches specific job requirements, identify keyword gaps, and gain insights to improve their application success rate.

Leveraging the power of Google Gemini for AI generation and robust NLP libraries (spaCy, NLTK) for analysis, Applicant Scorer provides actionable intelligence within a sleek, modern interface.

---

## 📸 Application Showcase

**Homepage:**
![Homepage Preview](https://github.com/Deepu1004/Applicant-Scorer/blob/main/public/HomePage.png)

**Resume Upload & Parsing:**
![Resume Upload Preview](https://github.com/Deepu1004/Applicant-Scorer/blob/main/public/Resume_Upload.png)

**AI Job Description Generation:**
![JD Generation Preview](https://github.com/Deepu1004/Applicant-Scorer/blob/main/public/JD_Generation.png)

**Resume Scanning Interface:**
![Resume Scan Page Preview](https://github.com/Deepu1004/Applicant-Scorer/blob/main/public/Resume_Scan.png)

**JD Selection in Resume Scan page:**
![JD Selection Modal](https://github.com/Deepu1004/Applicant-Scorer/blob/main/public/JD_Selection.png)

**Insightful Scan Results:**
![Sample Results Preview](https://github.com/Deepu1004/Applicant-Scorer/blob/main/public/Sample_Results.png)

---

## 🚀 Key Features

*   📄 **Seamless Resume Processing:**
    *   Effortlessly upload multiple resumes (`.pdf`, `.docx`).
    *   Secure storage of original files.
    *   Intelligent text extraction and parsing using NLP.
    *   Identifies key sections: contact info (name, email, phone), links (LinkedIn, GitHub), summary, experience, education, skills, projects.
    *   Stores structured data (JSON) for efficient analysis.
*   ✍️ **Intelligent JD Generation (AI-Powered):**
    *   Utilizes Google Gemini to craft professional, ATS-optimized job descriptions.
    *   Simply provide a job title and experience level.
    *   Generates comprehensive JDs covering responsibilities, qualifications, and skills.
    *   Option for manual input and editing.
*   💾 **Job Description Management:**
    *   Save generated or manually created JDs as organized `.txt` files.
    *   Easily browse, preview, and select saved JDs for scanning.
*   🔍 **Advanced Resume Scanning & Analysis:**
    *   Select a saved JD and scan your entire pool of uploaded resumes against it in batch.
    *   Sophisticated keyword extraction using NLTK (lemmatization, POS tagging, stop-word removal) for accurate matching.
*   📊 **Actionable Insights & Candidate Ranking:**
    *   View a clearly ranked list of candidates based on their percentage match score to the JD.
    *   Instantly access extracted contact information.
    *   Detailed breakdown of **Matched Keywords** and **Missing Keywords** for each candidate, highlighting strengths and areas for improvement (or interview focus).
    *   Direct download links to original resume files.
*   🎨 **Modern & Intuitive UI/UX:**
    *   Built with React and Tailwind CSS for a clean, responsive experience on any device.
    *   Engaging animations via Framer Motion for smooth navigation and interactions.
    *   User-friendly workflows guide you through each step.
    *   Clear visual feedback with loading states and error handling.

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
*   ![spaCy](https://img.shields.io/badge/spaCy-09A3D5?style=flat&logo=spacy&logoColor=white) (Name Extraction, NLP Utilities)
*   ![NLTK](https://img.shields.io/badge/NLTK-3776AB?style=flat) (Keyword Extraction, Matching Logic)
*   ![PyMuPDF](https://img.shields.io/badge/PyMuPDF-fitz-orange?style=flat) (PDF Parsing)
*   ![python-docx](https://img.shields.io/badge/python--docx-2B579A?style=flat) (DOCX Parsing)
*   ![Flask-CORS](https://img.shields.io/badge/Flask_CORS-F05032?style=flat&logo=flask&logoColor=white)

**AI Service:**
*   ![Google Cloud](https://img.shields.io/badge/Google_Gemini-4285F4?style=flat&logo=googlecloud&logoColor=white)

---

## 📋 Prerequisites

Ensure the following are installed on your system:

*   **Python:** Version 3.8 or higher.
*   **Node.js:** Version 18.x or higher (includes npm).
*   **Google Gemini API Key:** Obtain an API key from [Google AI Studio](https://aistudio.google.com/) or Google Cloud Platform. This is required for the JD Generation feature.

---

## ⚙️ Setup & Installation

**Note:** The source code for Applicant Scorer is private. These instructions assume you have obtained the codebase through authorized means and have the necessary files.

1.  **Organize Project Files:**
    *   Ensure you have the complete project structure, typically with a main backend directory (containing `app.py`, `config.py`, etc.) and a `frontend` subdirectory.
    *   Place the entire project folder in your desired location.

2.  **Backend Setup (Flask & NLP):**
    *   **Navigate to the Backend Directory:** Open your terminal/command prompt and change to the root directory of the project (where `app.py` resides).
    *   **Create & Activate Virtual Environment:**
        ```bash
        python -m venv venv
        # Windows
        .\venv\Scripts\activate
        # macOS/Linux
        source venv/bin/activate
        ```
    *   **Generate `requirements.txt` (If Missing):** If you received the code without a `requirements.txt` but know the necessary packages were installed in the development environment, you *could* try freezing them (though having a definitive `requirements.txt` is best):
        ```bash
        # Make sure Flask, Flask-Cors, google-generativeai, spacy, nltk, PyMuPDF, python-docx are installed
        pip freeze > requirements.txt
        ```
    *   **Install Python Dependencies:**
        ```bash
        pip install -r requirements.txt
        ```
    *   **Download NLP Models:** The application attempts to download necessary NLTK data and the spaCy model automatically on first run. If this fails, or for manual setup, run:
        ```bash
        python -m nltk.downloader punkt stopwords wordnet omw-1.4 averaged_perceptron_tagger
        python -m spacy download en_core_web_sm
        ```

3.  **Frontend Setup (React):**
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
    *   In the `frontend/` directory, create a file named `.env`.
    *   Add your Google Gemini API key to this file:
        ```env
        # Example: If your backend runs on the default port
        VITE_API_URL=http://127.0.0.1:5000
        VITE_GEMINI_API_KEY=YOUR_ACTUAL_GEMINI_API_KEY
        ```
    *   **Replace `YOUR_ACTUAL_GEMINI_API_KEY` with your real key.**
    *   **Security:** Ensure `.env` is listed in your project's `.gitignore` file (if using version control internally) to prevent accidentally committing your API key.

*   **Backend:**
    *   Key settings (like upload folder paths, allowed extensions, AI model names) are often managed in a `config.py` file (or directly in `app.py`). Review this file if specific adjustments are needed.
    *   The application is designed to automatically create necessary directories (`job_descriptions`, `uploads/resumes_original`, `uploads/resumes_parsed`) upon starting the backend server. Ensure the application has write permissions in its installation directory.

---

## ▶️ Running the Application

Applicant Scorer requires both the backend and frontend servers to be running.

1.  **Start the Backend Server (Flask):**
    *   Ensure you are in the project's root directory (where `app.py` is).
    *   Make sure your Python virtual environment (`venv`) is activated.
    *   Run the command:
        ```bash
        flask run
        # or potentially: python app.py
        ```
    *   The backend will typically start on `http://127.0.0.1:5000`. Note the address shown in the terminal.

2.  **Start the Frontend Server (Vite):**
    *   Open a **new** terminal window or tab.
    *   Navigate to the `frontend/` directory.
    *   Run the command:
        ```bash
        npm run dev
        ```
    *   The frontend development server will usually start on `http://localhost:5173`. Open this URL in your web browser.

The application should now be accessible! The frontend is configured to communicate with the backend running on port 5000.

---

## 📖 Usage Guide

1.  **Navigate:** Use the sidebar or homepage links to access different modules.
2.  **Upload Resumes (`/bulk-upload`):**
    *   Drag and drop or select multiple `.pdf` or `.docx` resume files.
    *   Click "Save Resumes". Files are uploaded, processed, and parsed data is stored for scanning. You'll see success messages or errors.
3.  **Create Job Description (`/job-creation`):**
    *   **AI Generation:** Select "AI Generate", enter a "Job Title" and "Experience Level", then click "Generate with AI". Review and edit the generated text.
    *   **Manual Input:** Select "Manual Input" and paste or type your JD text.
    *   **Save:** Provide a "Job Title" and "Experience Level" (used for the filename) and click "Save JD". It's stored on the backend.
4.  **Scan Resumes (`/scan`):**
    *   Click "Start Scanning".
    *   A modal appears listing saved Job Descriptions (`.txt` files).
    *   Select the desired JD. You can click "Preview" to verify its content.
    *   Click "Confirm & Scan".
    *   The backend analyzes all parsed resumes against the selected JD's keywords.
    *   **View Results:** The page updates with a ranked list of candidates:
        *   Candidate Name & Score Badge.
        *   Contact Details (Email/Phone if found).
        *   Expandable lists showing **Matched Keywords** and **Missing Keywords**.
        *   A "Download Resume" link for the original file.

---

## 💬 Feedback & Support

For questions, feedback, or support regarding Applicant Scorer (for authorized users), please reach out through the designated internal channels or contact the project owner/maintainer.