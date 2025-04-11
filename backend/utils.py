# -*- coding: utf-8 -*-
import os
import re
import fitz  # PyMuPDF
import docx # python-docx
import spacy
import traceback
import json
import nltk
import string
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from flask import current_app # To access app config for models

# Import constants from config
from config import (
    ALLOWED_EXTENSIONS, SECTION_KEYWORDS, EMAIL_REGEX, PHONE_REGEX,
    GITHUB_REGEX, LINKEDIN_REGEX, ALLOWED_POS_TAGS, custom_stops
)

# --- Global NLTK Objects (will be initialized by app.py) ---
lemmatizer = None
all_stop_words = set()

def initialize_nltk():
    """Initializes NLTK components (call this from app.py)."""
    global lemmatizer, all_stop_words
    print("--- Initializing NLTK in utils ---")
    required_data = [
        ('tokenizers/punkt', 'punkt'),
        ('corpora/stopwords', 'stopwords'),
        ('corpora/wordnet', 'wordnet'),
        ('corpora/omw-1.4', 'omw-1.4'),
        ('taggers/averaged_perceptron_tagger', 'averaged_perceptron_tagger')
    ]
    print("Checking NLTK data...")
    all_found = True
    for path, pkg_id in required_data:
        try:
            nltk.data.find(path)
            print(f"[NLTK] '{pkg_id}' found.")
        except LookupError:
            all_found = False
            print(f"[NLTK] '{pkg_id}' not found. Downloading...")
            try:
                nltk.download(pkg_id, quiet=False)
                print(f"[NLTK] Finished downloading '{pkg_id}'.")
            except Exception as e:
                 print(f"[NLTK] ERROR downloading '{pkg_id}': {e}. Keyword extraction might fail.")
                 print(f"         Try manual download: python -m nltk.downloader {pkg_id}")
    if all_found:
        print("[NLTK] All required data found.")
    else:
        print("[NLTK] Some data was missing; download was attempted.")

    try:
        lemmatizer = WordNetLemmatizer()
        nltk_stop_words = set(stopwords.words('english'))
        all_stop_words = nltk_stop_words.union(custom_stops)
        print("[NLTK] Lemmatizer and Stopwords loaded.")
        print(f"[NLTK] Combined stop word list size: {len(all_stop_words)}")
    except LookupError as e:
        print(f"[NLTK CRITICAL ERROR] Failed to load essential NLTK data (stopwords/wordnet): {e}")
        print("Keyword extraction WILL NOT WORK correctly. Please ensure NLTK data is downloaded.")
        lemmatizer = None # Ensure it's None if failed
        all_stop_words = set() # Ensure it's empty
    print("--- NLTK Initialization Complete in utils ---")

# --- Helper Functions ---

def allowed_file(filename):
    """Check if the file has an allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- Text Extraction Functions ---
def extract_text_from_pdf(pdf_path):
    """Extracts text from a PDF file using PyMuPDF (fitz), preserving line breaks."""
    text = ""
    try:
        with fitz.open(pdf_path) as doc:
            for page in doc:
                page_text = page.get_text("text", sort=True)
                text += page_text + "\n" # Add newline between pages

        lines = text.splitlines()
        stripped_lines = [line.strip() for line in lines]
        text = "\n".join(stripped_lines)
        text = re.sub(r'[ \t]+', ' ', text) # Normalize spaces within lines
        text = re.sub(r'\n{3,}', '\n\n', text) # Reduce excessive blank lines
        return text if text.strip() else None
    except Exception as e:
        print(f"Error processing PDF {os.path.basename(pdf_path)}: {e}")
        traceback.print_exc()
        return None

def extract_text_from_docx(docx_path):
    """Extracts text from a DOCX file using python-docx, preserving paragraphs."""
    try:
        doc = docx.Document(docx_path)
        text_list = [para.text.strip() for para in doc.paragraphs]
        text = '\n\n'.join(text_list) # Join paragraphs with double newlines
        text = re.sub(r'[ \t]+', ' ', text) # Normalize spaces within paragraphs
        text = re.sub(r'\n{3,}', '\n\n', text).strip() # Reduce excessive blank lines
        return text if text else None
    except Exception as e:
        print(f"Error processing DOCX {os.path.basename(docx_path)}: {e}")
        traceback.print_exc()
        return None

# --- Section Finding Function ---
def find_section_keyword(line, section_map):
    """Finds if a line likely marks the start of a known section. Improved robustness."""
    line_stripped = line.strip()
    line_lower = line_stripped.lower()

    if not line_lower or len(line_lower) < 3 or len(line_stripped.split()) > 7 or re.match(r"^\s*[\*\-•\d]+\s+.{15,}", line_stripped):
        return None

    alpha_chars = [c for c in line_stripped if c.isalpha()]
    upper_chars = [c for c in alpha_chars if c.isupper()]
    is_mostly_upper = len(alpha_chars) > 2 and (len(upper_chars) / len(alpha_chars)) > 0.7

    line_cleaned = re.sub(r"^\s*[\*\-•\d\.]+\s*", "", line_lower).strip()
    line_cleaned = re.sub(r"\s*[:\-]\s*$", "", line_cleaned).strip()

    for section_name, keywords in section_map.items():
        for keyword in keywords:
            if line_cleaned == keyword or line_lower == keyword:
                return section_name

    for section_name, keywords in section_map.items():
        for keyword in keywords:
            pattern = r'^\s*' + re.escape(keyword) + r'\b'
            if re.match(pattern, line_cleaned) and len(line_cleaned) < len(keyword) + 10:
                 return section_name
            elif re.match(pattern, line_lower) and len(line_stripped) < len(keyword) + 15:
                 return section_name

    if is_mostly_upper:
        for section_name, keywords in section_map.items():
            for keyword in keywords:
                 if re.search(r'\b' + re.escape(keyword) + r'\b', line_lower) and len(line_stripped.split()) <= 7:
                      return section_name
    return None

# --- Resume Parsing Function ---
def parse_resume_text(text, original_filename):
    """Parses extracted text to find key information and sections. Relies on loaded NLP model."""
    if not text:
        print(f"Warning: Attempting to parse empty text for {original_filename}")
        return None

    # Access the loaded NLP model from Flask's app context
    # Assumes app.py loaded it into app.config['NLP_MODEL']
    nlp = current_app.config.get('NLP_MODEL', None)

    parsed_data = {
        "_original_filename": original_filename,
        "name": "Not Found", "phone": "Not Found", "email": "Not Found",
        "linkedin": "Not Found", "github": "Not Found",
        **{key: "Not Found" for key in SECTION_KEYWORDS.keys() if key != 'contact'},
        "_raw_text": text
    }

    lines_for_contact = text.split('\n')[:15]
    top_text_for_contact = "\n".join(lines_for_contact)
    top_text_wider = text[:min(len(text), 1000)]

    emails = re.findall(EMAIL_REGEX, top_text_for_contact) or re.findall(EMAIL_REGEX, top_text_wider) or re.findall(EMAIL_REGEX, text)
    parsed_data["email"] = emails[0] if emails else "Not Found"

    phones = re.findall(PHONE_REGEX, top_text_for_contact) or re.findall(PHONE_REGEX, top_text_wider) or re.findall(PHONE_REGEX, text)
    valid_phones = [p.strip() for p in phones if 9 <= len(re.sub(r'\D', '', p)) <= 15]
    parsed_data["phone"] = valid_phones[0] if valid_phones else (phones[0].strip() if phones else "Not Found")

    github_links = re.findall(GITHUB_REGEX, text, re.IGNORECASE)
    parsed_data["github"] = github_links[0].strip().rstrip('/') if github_links else "Not Found"

    linkedin_links = re.findall(LINKEDIN_REGEX, text, re.IGNORECASE)
    parsed_data["linkedin"] = linkedin_links[0].strip().rstrip('/') if linkedin_links else "Not Found"

    extracted_name = "Not Found"
    if nlp:
        doc = nlp(text[:min(len(text), 800)])
        potential_names = []
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                 name_text = ent.text.strip()
                 if 3 < len(name_text) < 35 and '@' not in name_text and 'http' not in name_text \
                   and not re.search(r'\d', name_text) and name_text[0].isupper() \
                   and len(name_text.split()) >= 2 and not find_section_keyword(name_text, SECTION_KEYWORDS):
                     potential_names.append(name_text)
        if potential_names: extracted_name = potential_names[0]

    if extracted_name == "Not Found":
        lines = text.split('\n')[:10]
        for line_num, line in enumerate(lines):
            line_stripped = line.strip()
            if line_stripped and 4 < len(line_stripped) < 35 and 1 < len(line_stripped.split()) < 5 \
                and line_stripped[0].isupper() and line_stripped.replace(' ','').isalpha() \
                and '@' not in line_stripped and not re.search(PHONE_REGEX, line_stripped) \
                and 'http' not in line_stripped.lower() \
                and parsed_data["email"] not in line_stripped \
                and parsed_data["phone"] not in line_stripped \
                and not find_section_keyword(line_stripped, SECTION_KEYWORDS):
                    if line_num < 5 :
                        extracted_name = line_stripped
                        break
    parsed_data["name"] = extracted_name

    lines = text.split('\n')
    current_section_key = None
    section_content_map = {key: [] for key in SECTION_KEYWORDS.keys() if key != 'contact'}

    for i, line in enumerate(lines):
        line_strip = line.strip()
        if not line_strip: continue

        matched_section_key = find_section_keyword(line, SECTION_KEYWORDS)

        if matched_section_key:
            if matched_section_key != 'contact':
                 current_section_key = matched_section_key
                 continue
        if current_section_key:
            potential_next_header = find_section_keyword(line, SECTION_KEYWORDS)
            if potential_next_header and potential_next_header != current_section_key and potential_next_header != 'contact':
                 current_section_key = potential_next_header
                 continue
            section_content_map[current_section_key].append(line_strip)

    for section_key, content_lines in section_content_map.items():
        if content_lines:
            full_section_text = "\n".join(content_lines).strip()
            if full_section_text:
                parsed_data[section_key] = full_section_text

    profiles_content = set()
    if parsed_data["linkedin"] != "Not Found": profiles_content.add(f"LinkedIn: {parsed_data['linkedin']}")
    if parsed_data["github"] != "Not Found": profiles_content.add(f"GitHub: {parsed_data['github']}")
    coding_section_text = parsed_data.get("coding_profiles")
    if coding_section_text and coding_section_text != "Not Found":
        for line in coding_section_text.split('\n'):
            line_strip = line.strip()
            line_lower = line_strip.lower()
            if line_strip and ('http' in line_lower or any(prof in line_lower for prof in ['gitlab', 'bitbucket', 'leetcode', 'hackerrank', 'codepen', 'portfolio', 'behance', 'dribbble', 'stack overflow', 'medium'])):
                if "linkedin.com" not in line_lower and "github.com" not in line_lower:
                     profiles_content.add(line_strip)
    for key_to_check in ['summary']:
        section_text = parsed_data.get(key_to_check)
        if section_text and section_text != "Not Found":
             for line in section_text.split('\n'):
                 line_strip = line.strip()
                 line_lower = line_strip.lower()
                 if line_strip and 'http' in line_lower:
                     is_linkedin = "linkedin.com" in line_lower
                     is_github = "github.com" in line_lower
                     if not (is_linkedin and parsed_data["linkedin"] != "Not Found") and \
                        not (is_github and parsed_data["github"] != "Not Found"):
                          profiles_content.add(line_strip)
    if profiles_content:
        parsed_data["coding_profiles"] = "\n".join(sorted(list(profiles_content)))
    elif "coding_profiles" in parsed_data and parsed_data["coding_profiles"] != "Not Found":
        parsed_data["coding_profiles"] = "Not Found"

    for key in SECTION_KEYWORDS.keys():
        if key != 'contact' and key not in parsed_data:
             parsed_data[key] = "Not Found"

    return parsed_data

def preprocess_and_extract_keywords_nltk(text):
    """Applies NLTK preprocessing to extract relevant keywords."""
    global lemmatizer, all_stop_words # Use the globally initialized objects
    if not text or not isinstance(text, str) or not lemmatizer:
        # print("Warning: Skipping keyword extraction (no text or NLTK unavailable).")
        return set()

    keywords = set()
    try:
        tokens = word_tokenize(text.lower())
        table = str.maketrans('', '', string.punctuation + string.digits)
        stripped_tokens = [w.translate(table) for w in tokens]
        filtered_tokens = [word for word in stripped_tokens if word and len(word) > 1 and word not in all_stop_words]
        tagged_tokens = nltk.pos_tag(filtered_tokens)

        pos_map = {'J': 'a', 'V': 'v', 'N': 'n', 'R': 'r'}
        for word, tag in tagged_tokens:
            if tag in ALLOWED_POS_TAGS:
                 # Use the globally loaded lemmatizer
                 lemma = lemmatizer.lemmatize(word, pos=pos_map.get(tag[0].upper(), 'n'))
                 if lemma and len(lemma) > 1 and lemma not in all_stop_words:
                     keywords.add(lemma)
        return keywords
    except Exception as e:
        print(f"Error during NLTK keyword extraction: {e}")
        traceback.print_exc()
        return set()

def get_match_results(resume_text, jd_text):
    """Calculates keyword match between resume and JD text."""
    global lemmatizer, all_stop_words # Ensure access to initialized NLTK objects
    analysis_result = {
        "score": 0.0, "matching_keywords": [], "missing_keywords": [],
        "jd_keyword_count": 0, "resume_keyword_count": 0, "match_count": 0,
        "error": None
    }
    # Check if NLTK is functional (lemmatizer is a good proxy)
    if not lemmatizer:
        analysis_result["error"] = "NLTK components (Lemmatizer/Stopwords) not available. Cannot perform keyword analysis."
        print(f"Error in get_match_results: {analysis_result['error']}")
        return analysis_result

    resume_keywords = preprocess_and_extract_keywords_nltk(resume_text)
    jd_keywords = preprocess_and_extract_keywords_nltk(jd_text)

    analysis_result["resume_keyword_count"] = len(resume_keywords)
    analysis_result["jd_keyword_count"] = len(jd_keywords)

    if not jd_keywords:
        print("Warning: No relevant keywords extracted from Job Description. Match score will be 0.")
        return analysis_result # Return counts but score 0

    matching = resume_keywords.intersection(jd_keywords)
    missing = jd_keywords.difference(resume_keywords)

    analysis_result["matching_keywords"] = sorted(list(matching))
    analysis_result["missing_keywords"] = sorted(list(missing))
    analysis_result["match_count"] = len(matching)
    analysis_result["score"] = round((len(matching) / len(jd_keywords)) * 100, 2)

    return analysis_result