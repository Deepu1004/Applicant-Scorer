# utils.py
# -*- coding: utf-8 -*-

import os
import re
import fitz  # PyMuPDF
import docx  # python-docx
import spacy
import traceback
import json
import nltk
import string
import logging
from typing import Dict, Any, Optional, List, Tuple, Set

# Ensure NLTK components are available
# nltk.download('punkt')
# nltk.download('stopwords')
# nltk.download('wordnet')
# nltk.download('omw-1.4')
# nltk.download('averaged_perceptron_tagger')

from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from flask import current_app # To access app config for models

# --- Configuration Import ---
# IMPORTANT: Ensure you have a config.py file with these constants defined!
try:
    from config import (
        ALLOWED_EXTENSIONS, SECTION_KEYWORDS, EMAIL_REGEX, PHONE_REGEX,
        GITHUB_REGEX, LINKEDIN_REGEX, ALLOWED_POS_TAGS, custom_stops
    )
except ImportError:
    # Provide default fallbacks ONLY for basic operation, strongly recommend config.py
    logging.critical("Could not import from config.py! Using default values. Parsing may be inaccurate.")
    ALLOWED_EXTENSIONS = {'pdf', 'docx'}
    EMAIL_REGEX = r"[a-z0-9\.\-+_]+@[a-z0-9\.\-+_]+\.[a-z]+"
    PHONE_REGEX = r"\(?\+?\d{1,3}\)?[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}"
    LINKEDIN_REGEX = r"linkedin\.com\/in\/[a-zA-Z0-9_-]+"
    GITHUB_REGEX = r"github\.com\/[a-zA-Z0-9_-]+"
    SECTION_KEYWORDS = { # Example - Make this comprehensive in your config.py!
            'summary': ['summary', 'objective', 'profile'],
            'experience': ['experience', 'work experience', 'employment history', 'internship'],
            'education': ['education', 'academic background'],
            'skills': ['skills', 'technical skills', 'technologies'],
            'projects': ['projects', 'personal projects'],
            'certifications': ['certifications', 'certificates', 'licenses'],
            'achievements': ['achievements', 'awards', 'honors'],
            'coding_profiles': ['coding profiles', 'online profiles', 'links'],
            'contact': ['contact', 'contact information', 'personal details']
    }
    ALLOWED_POS_TAGS = {'NN', 'NNS', 'NNP', 'NNPS', 'JJ', 'JJR', 'JJS', 'VB', 'VBD', 'VBG', 'VBN', 'VBP', 'VBZ'}
    custom_stops = {'cv', 'resume', 'contact', 'address', 'phone', 'email', 'date', 'birth', 'sex', 'nationality'}


# --- Setup Logger ---
# Configure this further in your main Flask app setup if needed
logger = logging.getLogger(__name__)
# Basic config if run standalone or not configured by Flask app
if not logger.hasHandlers():
     logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')


# --- Global NLTK Objects ---
lemmatizer: Optional[WordNetLemmatizer] = None
all_stop_words: Set[str] = set()

# --- NLTK Initialization ---
def initialize_nltk():
    """
    Initializes NLTK components (Lemmatizer, Stopwords).
    Call this ONCE during Flask app startup.
    """
    global lemmatizer, all_stop_words
    if lemmatizer is not None:
        logger.info("NLTK components already initialized.")
        return

    logger.info("--- Initializing NLTK components in utils ---")
    required_data = [
        ('tokenizers/punkt', 'punkt'),
        ('corpora/stopwords', 'stopwords'),
        ('corpora/wordnet', 'wordnet'),
        ('corpora/omw-1.4', 'omw-1.4'), # Needed by WordNetLemmatizer
        ('taggers/averaged_perceptron_tagger', 'averaged_perceptron_tagger')
    ]
    all_found = True
    for path, pkg_id in required_data:
        try:
            nltk.data.find(path)
            logger.debug(f"[NLTK] Data package '{pkg_id}' found.")
        except LookupError:
            all_found = False
            logger.warning(f"[NLTK] Data package '{pkg_id}' not found. Attempting download...")
            try:
                nltk.download(pkg_id, quiet=False) # Set quiet=True for less verbose downloads
                logger.info(f"[NLTK] Finished downloading '{pkg_id}'.")
            except Exception as e:
                 logger.error(f"[NLTK] ERROR downloading '{pkg_id}': {e}. Keyword extraction might fail.")
                 logger.error(f"         Try manual download: python -m nltk.downloader {pkg_id}")

    if not all_found:
        logger.warning("[NLTK] Some data was missing; download was attempted. Check logs for errors.")
    else:
        logger.info("[NLTK] All required NLTK data packages found.")

    try:
        lemmatizer = WordNetLemmatizer()
        nltk_stop_words = set(stopwords.words('english'))
        all_stop_words = nltk_stop_words.union(custom_stops) # Combine standard and custom stops
        logger.info(f"[NLTK] Lemmatizer loaded. Combined stop word list size: {len(all_stop_words)}")
    except LookupError as e:
        logger.critical(f"[NLTK CRITICAL ERROR] Failed to load essential NLTK data (stopwords/wordnet): {e}")
        logger.critical("Keyword extraction WILL NOT WORK correctly. Please ensure NLTK data is downloaded and accessible.")
        lemmatizer = None # Ensure it's None if failed
        all_stop_words = set() # Ensure it's empty

    logger.info("--- NLTK Initialization process complete ---")

# --- File Handling Helper ---
def allowed_file(filename: str) -> bool:
    """Check if the file has an allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- Text Extraction Functions ---
def extract_text_from_pdf(pdf_path: str) -> Optional[str]:
    """Extracts text from a PDF file using PyMuPDF (fitz), preserving basic layout."""
    text = ""
    logger.debug(f"Attempting to extract text from PDF: {os.path.basename(pdf_path)}")
    try:
        with fitz.open(pdf_path) as doc:
            for page_num, page in enumerate(doc):
                # Using "blocks" can sometimes preserve structure better than plain "text"
                # Format: (x0, y0, x1, y1, "text", block_no, block_type) block_type 0 is text
                blocks = page.get_text("blocks", sort=True)
                page_text = ""
                last_y1 = 0
                for b in blocks:
                    if b[6] == 0: # It's a text block
                         # Add double newline if vertical space is large (new paragraph)
                         if b[1] > last_y1 + 10: # Threshold might need tuning
                              page_text += "\n\n"
                         elif b[1] > last_y1 + 2: # Single newline for closer lines
                              page_text += "\n"
                         page_text += b[4].strip() + " " # Add space after block text
                         last_y1 = b[3] # Update last y position
                text += page_text.strip() + "\n\n" # Add double newline between pages

        # Post-processing
        lines = text.splitlines()
        stripped_lines = [line.strip() for line in lines]
        text = "\n".join(stripped_lines)
        text = re.sub(r'[ \t]+', ' ', text) # Normalize spaces within lines
        text = re.sub(r'\n{3,}', '\n\n', text) # Reduce excessive blank lines
        text = text.strip()

        if text:
             logger.info(f"Successfully extracted text from PDF: {os.path.basename(pdf_path)} (Length: {len(text)})")
             return text
        else:
             logger.warning(f"Extracted empty text from PDF: {os.path.basename(pdf_path)}")
             return None
    except Exception as e:
        logger.error(f"Error processing PDF {os.path.basename(pdf_path)}: {e}", exc_info=True)
        return None

def extract_text_from_docx(docx_path: str) -> Optional[str]:
    """Extracts text from a DOCX file using python-docx, preserving paragraphs."""
    logger.debug(f"Attempting to extract text from DOCX: {os.path.basename(docx_path)}")
    try:
        doc = docx.Document(docx_path)
        text_list = [para.text.strip() for para in doc.paragraphs if para.text.strip()]
        text = '\n\n'.join(text_list) # Join paragraphs with double newlines

        # Post-processing (similar to PDF)
        text = re.sub(r'[ \t]+', ' ', text) # Normalize spaces within paragraphs
        text = re.sub(r'\n{3,}', '\n\n', text).strip() # Reduce excessive blank lines

        if text:
            logger.info(f"Successfully extracted text from DOCX: {os.path.basename(docx_path)} (Length: {len(text)})")
            return text
        else:
            logger.warning(f"Extracted empty text from DOCX: {os.path.basename(docx_path)}")
            return None
    except Exception as e:
        logger.error(f"Error processing DOCX {os.path.basename(docx_path)}: {e}", exc_info=True)
        return None


# --- Section Finding Function ---
def find_section_keyword(line: str, section_map: Dict[str, List[str]]) -> Optional[str]:
    """
    Finds if a line likely marks the start of a known section.
    Relies heavily on the comprehensiveness of SECTION_KEYWORDS in config.
    """
    line_stripped = line.strip()
    line_lower = line_stripped.lower()

    # Basic checks to quickly discard non-header lines
    if not line_lower or len(line_lower) < 3 or len(line_stripped.split()) > 7: # Too short or too many words
        return None
    # Avoid identifying list items (like bullet points) as headers
    if re.match(r"^\s*[\*\-•\d]+\s+.{10,}", line_stripped): # Starts with symbol, space, then longer text
        return None

    # Check for mostly uppercase (common header format)
    alpha_chars = [c for c in line_stripped if c.isalpha()]
    if not alpha_chars: return None # No alphabetic characters
    upper_chars = [c for c in alpha_chars if c.isupper()]
    is_mostly_upper = (len(upper_chars) / len(alpha_chars)) > 0.7

    # Clean line for keyword matching (remove leading symbols, trailing punctuation)
    # Keep original case version for potential uppercase matching
    line_cleaned_lower = re.sub(r"^\s*[^A-Za-z0-9]+|[^A-Za-z0-9]+\s*$", "", line_lower).strip()
    line_cleaned_orig = re.sub(r"^\s*[^A-Za-z0-9]+|[^A-Za-z0-9]+\s*$", "", line_stripped).strip()

    # 1. Exact Match (case-insensitive on cleaned line)
    for section_name, keywords in section_map.items():
        if section_name == 'contact': continue # Skip matching 'contact' as a section header itself
        for keyword in keywords:
            if line_cleaned_lower == keyword:
                logger.debug(f"Section keyword exact match: '{line_stripped}' -> {section_name} (keyword: {keyword})")
                return section_name

    # 2. Starts With Match (case-insensitive on cleaned line)
    for section_name, keywords in section_map.items():
         if section_name == 'contact': continue
         for keyword in keywords:
            # Using \b ensures it matches the whole word at the beginning
            pattern = r'^' + re.escape(keyword) + r'\b'
            if re.match(pattern, line_cleaned_lower) and len(line_cleaned_lower) < len(keyword) + 10: # Allow few extra chars
                 logger.debug(f"Section keyword starts-with match: '{line_stripped}' -> {section_name} (keyword: {keyword})")
                 return section_name

    # 3. Mostly Uppercase Heuristic (check if keyword is present in the original case cleaned line)
    if is_mostly_upper and len(line_cleaned_orig.split()) <= 5: # Limit word count for uppercase headers
        for section_name, keywords in section_map.items():
            if section_name == 'contact': continue
            for keyword in keywords:
                 # Search for the keyword as a whole word within the line (case-insensitive)
                 if re.search(r'\b' + re.escape(keyword) + r'\b', line_cleaned_orig, re.IGNORECASE):
                      logger.debug(f"Section keyword uppercase heuristic match: '{line_stripped}' -> {section_name} (keyword: {keyword})")
                      return section_name

    # No match found
    return None


# --- Constants for Name Extraction ---
NAME_MAX_LEN = 40
NAME_MIN_LEN = 3
NAME_MAX_WORDS = 5
NAME_MIN_WORDS = 1
NAME_NER_CHUNK_SIZE = 600 # Process top N chars for NER name check
NAME_HEURISTIC_LINES = 15 # Check top N lines for heuristic name check
# Expanded list of words unlikely to be part of a name
COMMON_NON_NAME_WORDS = {
    'summary', 'objective', 'profile', 'skills', 'experience', 'education', 'projects',
    'contact', 'information', 'details', 'address', 'phone', 'email', 'linkedin',
    'github', 'portfolio', 'references', 'curriculum', 'vitae', 'resume', 'biodata',
    'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
    'september', 'october', 'november', 'december', 'present', 'date', 'birth',
    'gender', 'nationality', 'technologies', 'languages', 'frameworks', 'tools',
    'university', 'college', 'institute', 'school', 'gpa', 'cgpa', 'grade',
    'technical', 'professional', 'work', 'history', 'employment', 'internship',
    'volunteer', 'publications', 'certifications', 'awards', 'honors', 'achievements',
    'inc', 'llc', 'ltd', 'corp', 'corporation'
}


# --- MAIN RESUME PARSING FUNCTION ---
def parse_resume_text(text: str, original_filename: Optional[str]) -> Optional[Dict[str, Any]]:
    """
    Parses extracted resume text to identify contact information, name,
    and content within standard sections (Summary, Experience, Education, etc.).

    Args:
        text: The raw text extracted from the resume.
        original_filename: The original name of the uploaded file (for context).

    Returns:
        A dictionary containing parsed data, or None if input text is empty.
        Keys include 'name', 'email', 'phone', 'linkedin', 'github',
        keys matching SECTION_KEYWORDS (e.g., 'summary', 'experience'),
        '_original_filename', and optionally '_raw_text' (controlled by flag if needed).
    """
    if not text:
        logger.warning(f"Attempting to parse empty text for {original_filename}")
        return None

    logger.info(f"--- Starting parsing for: {original_filename} ---")

    # --- Initialization ---
    nlp = current_app.config.get('NLP_MODEL', None)
    if not nlp:
        logger.warning("SpaCy NLP model ('NLP_MODEL') not found in app config. Name extraction will be limited.")

    # Initialize data structure with defaults
    parsed_data = {
        "_original_filename": original_filename,
        "name": "Not Found",
        "email": "Not Found",
        "phone": "Not Found",
        "linkedin": "Not Found",
        "github": "Not Found",
        # Initialize all expected sections from config keys
        **{key: "Not Found" for key in SECTION_KEYWORDS if key != 'contact'},
        "_raw_text": text # Uncomment if raw text is needed in output
    }

    lines = text.split('\n')
    # Remove empty lines for easier processing
    lines = [line for line in lines if line.strip()]
    if not lines:
        logger.warning(f"Resume text contains no content after splitting lines for {original_filename}")
        return parsed_data # Return default data if text was just whitespace

    text_normalized_spaces = ' '.join(lines) # For regex matching across original line breaks

    # --- 1. Extract Contact Information (Email, Phone, LinkedIn, GitHub) ---
    logger.debug("Extracting contact information...")
    # Prioritize searching in the top part of the resume
    top_lines_for_contact = lines[:max(NAME_HEURISTIC_LINES, 5)] # Use more lines if heuristic check is deep
    top_text_chunk = "\n".join(top_lines_for_contact)
    wider_text_chunk = text_normalized_spaces[:1500] # Wider check if not found in top

    # Email
    emails = list(set(re.findall(EMAIL_REGEX, top_text_chunk, re.IGNORECASE) + \
                      re.findall(EMAIL_REGEX, wider_text_chunk, re.IGNORECASE)))
    if emails:
        # Simple heuristic: prefer shorter emails if multiple found near top
        emails.sort(key=len)
        parsed_data["email"] = emails[0].strip()
        logger.info(f"Found Email: {parsed_data['email']}")

    # Phone
    phones = list(set(re.findall(PHONE_REGEX, top_text_chunk) + \
                      re.findall(PHONE_REGEX, wider_text_chunk)))
    valid_phones = []
    seen_normalized_phones = set()
    for p in phones:
        p_strip = p.strip()
        # Basic cleanup of common separators before digit extraction
        p_cleaned = re.sub(r"[\s\(\)\-\.]", "", p_strip)
        normalized_phone = re.sub(r'\D', '', p_cleaned) # Get only digits
        if 9 <= len(normalized_phone) <= 15 and normalized_phone not in seen_normalized_phones:
            # Simple check to avoid sequences that are likely not phone numbers (e.g., years)
            if not re.match(r"^(19|20)\d{2}$", normalized_phone) and len(set(normalized_phone)) > 3: # Avoid YYYY, needs diversity
                 valid_phones.append(p_strip) # Store original format found
                 seen_normalized_phones.add(normalized_phone)
    if valid_phones:
        # Might add sorting later (e.g., prefer numbers starting with '+')
        parsed_data["phone"] = valid_phones[0] # Take the first valid one found
        logger.info(f"Found Phone: {parsed_data['phone']}")
    elif phones: # Fallback if no strictly valid ones but regex matched something
        parsed_data["phone"] = phones[0].strip()
        logger.warning(f"Found potential Phone (validation failed/heuristic skip): {parsed_data['phone']}")


    # LinkedIn & GitHub (Search entire text, case-insensitive)
    github_links = list(set(re.findall(GITHUB_REGEX, text, re.IGNORECASE)))
    if github_links:
        # Prefer shorter, cleaner URLs if multiple found
        github_links.sort(key=len)
        parsed_data["github"] = github_links[0].strip().rstrip('/')
        logger.info(f"Found GitHub: {parsed_data['github']}")

    linkedin_links = list(set(re.findall(LINKEDIN_REGEX, text, re.IGNORECASE)))
    if linkedin_links:
        linkedin_links.sort(key=len)
        parsed_data["linkedin"] = linkedin_links[0].strip().rstrip('/')
        logger.info(f"Found LinkedIn: {parsed_data['linkedin']}")

    # --- 2. Extract Applicant Name (Using NER and Heuristics) ---
    logger.debug("Extracting applicant name...")
    extracted_name = "Not Found"
    name_candidates: List[Tuple[str, int, str]] = [] # (name, score, source)

    # Strategy 1: spaCy NER (if model is available)
    if nlp:
        try:
            # Analyze only the top portion for efficiency
            doc = nlp(text[:NAME_NER_CHUNK_SIZE])

            for ent in doc.ents:
                if ent.label_ == "PERSON":
                    name_text = ent.text.strip()
                    # Clean up potential leading/trailing non-alpha chars missed by NER
                    name_text = re.sub(r"^[^\w]+|[^\w]+$", "", name_text).strip()
                    words = name_text.split()
                    word_count = len(words)

                    # Basic filtering
                    if (NAME_MIN_LEN <= len(name_text) <= NAME_MAX_LEN and
                            NAME_MIN_WORDS <= word_count <= NAME_MAX_WORDS and
                            name_text[0].isupper() and # Starts with capital
                            # Check pattern allows letters, spaces, hyphens, apostrophes, periods
                            re.fullmatch(r"^[A-Za-z\s'\-\.]+$", name_text) and
                            all(w.lower() not in COMMON_NON_NAME_WORDS for w in words) and
                            not find_section_keyword(name_text, SECTION_KEYWORDS)):

                        # Score based on likelihood (higher is better)
                        score = 10 # Base score for NER PERSON
                        if word_count >= 2: score += 5
                        # Penalize if near common non-name words found on same line in original text
                        line_containing_ent = ""
                        for line in lines:
                            if name_text in line:
                                line_containing_ent = line.lower()
                                break
                        if any(non_name in line_containing_ent for non_name in ['university', 'college', 'inc.', 'ltd.', 'llc', 'corp.']):
                             score -= 5
                        # Penalize if looks like an email prefix
                        if parsed_data["email"] != "Not Found" and name_text.lower() in parsed_data["email"].split('@')[0].lower():
                            score -= 3

                        if score > 0:
                             # Add candidate with score and source ('ner')
                             name_candidates.append((name_text, score, 'ner'))
                             logger.debug(f"NER Candidate: '{name_text}' (Score: {score})")

        except Exception as ner_error:
            logger.error(f"Error during spaCy NER processing: {ner_error}", exc_info=True)

    # Strategy 2: Heuristic Check of Top Lines
    logger.debug("Attempting heuristic name check...")
    for line_num, line in enumerate(lines[:NAME_HEURISTIC_LINES]):
        line_stripped = line.strip()
        # Try to remove leading/trailing noise more aggressively
        line_cleaned = re.sub(r"^\W+|\W+$", "", line_stripped).strip()

        if not line_cleaned or len(line_cleaned) < NAME_MIN_LEN or len(line_cleaned) > NAME_MAX_LEN:
            continue

        # Skip if it looks like contact info or section header
        if find_section_keyword(line_cleaned, SECTION_KEYWORDS): continue
        if any(kw in line_cleaned.lower() for kw in ['http', 'www.', '.com', '@', 'phone', 'email']): continue
        if parsed_data["email"] != "Not Found" and parsed_data["email"] in line_cleaned: continue
        if parsed_data["phone"] != "Not Found" and parsed_data["phone"] in line_cleaned: continue
        if re.search(r'\d{3,}', line_cleaned): continue # Contains 3+ digits

        # Check name pattern & capitalization
        words = line_cleaned.split()
        word_count = len(words)
        if (NAME_MIN_WORDS <= word_count <= NAME_MAX_WORDS and
            re.fullmatch(r"^[A-Za-z\s'\-\.]+$", line_cleaned) and
            any(c.isupper() for c in line_cleaned) and # Must contain uppercase
            all(w.lower() not in COMMON_NON_NAME_WORDS for w in words)):

            # Score based on heuristics
            score = 5 # Base score for heuristic pass
            if word_count >= 2: score += 5
            if line_num < 3: score += 5 # Strong bonus for very top lines
            elif line_num < 7: score += 2
            # Check Title Case (approximate)
            if all(word[0].isupper() or not word[0].isalpha() for word in words): score += 3
            # Penalize ALL CAPS heavily if more than 1 word
            if line_cleaned.isupper() and word_count > 1: score -= 7
            # Penalize if contains common job title keywords
            if any(title_kw in line_cleaned.lower() for title_kw in ['engineer', 'developer', 'manager', 'analyst', 'specialist']):
                score -= 3

            if score > 0:
                 # Add candidate with score and source ('heuristic')
                 name_candidates.append((line_cleaned, score, 'heuristic'))
                 logger.debug(f"Heuristic Candidate: '{line_cleaned}' (Score: {score})")

    # Select the best name candidate
    if name_candidates:
        # Sort by score (desc), then prefer NER, then shorter length as tie-breaker
        name_candidates.sort(key=lambda x: (x[1], 1 if x[2] == 'ner' else 0, -len(x[0])), reverse=True)
        best_candidate = name_candidates[0]
        # Check if the best candidate is significantly better than the next best different name
        if len(name_candidates) > 1 and best_candidate[1] < name_candidates[1][1] + 3 and best_candidate[0] != name_candidates[1][0]:
             logger.warning(f"Close competition for name: '{best_candidate[0]}' (Score: {best_candidate[1]}) vs '{name_candidates[1][0]}' (Score: {name_candidates[1][1]})")
        extracted_name = best_candidate[0]
        logger.info(f"Selected Name: '{extracted_name}' (Source: {best_candidate[2]}, Score: {best_candidate[1]})")
    else:
        logger.warning("No suitable name candidates found by NER or heuristics.")

    parsed_data["name"] = extracted_name

    # --- 3. Identify Sections and Extract Content ---
    logger.debug("Identifying sections and extracting content...")
    section_content_map: Dict[str, List[str]] = {key: [] for key in SECTION_KEYWORDS if key != 'contact'}
    current_section_key: Optional[str] = None
    potential_summary_lines: List[str] = []
    first_section_found = False

    # Determine where the name/contact info likely ends
    # Heuristic: check first few lines after the name was theoretically found or top lines
    name_line_index = -1
    if parsed_data["name"] != "Not Found":
        for idx, line in enumerate(lines):
            if parsed_data["name"] in line:
                name_line_index = idx
                break
    # Assume contact info is within a few lines of the name or the top lines
    contact_end_index = max(name_line_index + 2, min(5, len(lines)-1)) # Check ~2 lines after name, or first 5 lines
    start_scan_index = 0
    for idx in range(contact_end_index + 1):
         line = lines[idx]
         # If a section keyword is found very early, start scanning sections from there
         potential_early_header = find_section_keyword(line, SECTION_KEYWORDS)
         if potential_early_header and potential_early_header != 'contact':
              start_scan_index = idx
              logger.debug(f"Found early section header '{potential_early_header}', starting section scan from index {idx}")
              break
         # Otherwise, assume content before the first header might be summary
         start_scan_index = idx + 1 # Default to start scanning after this block


    logger.debug(f"Starting main section scan from line index: {start_scan_index}")

    for i, line in enumerate(lines):
        line_strip = line.strip() # Use already stripped line

        # Capture potential summary lines before the first *real* section header
        if i < start_scan_index and not first_section_found:
             # Avoid capturing contact info again if it extends low
             is_likely_contact = (parsed_data['email'] != "Not Found" and parsed_data['email'].split('@')[0] in line_strip.lower()) or \
                                 (parsed_data['phone'] != "Not Found" and parsed_data['phone'] in line_strip) or \
                                 ('http' in line_strip.lower()) or ('linkedin' in line_strip.lower()) or ('github' in line_strip.lower())
             # Avoid capturing the name itself if it spans multiple lines
             is_likely_name = (parsed_data['name'] != "Not Found" and parsed_data['name'] in line_strip)

             if not is_likely_contact and not is_likely_name and len(line_strip) > 15: # Require reasonable length
                 potential_summary_lines.append(line_strip)
                 logger.debug(f"Adding potential summary line (pre-scan): '{line_strip[:60]}...'")
             continue # Move to next line until start_scan_index

        # --- Main Section Scanning Loop ---
        if i >= start_scan_index:
            matched_section_key = find_section_keyword(line, SECTION_KEYWORDS)

            if matched_section_key and matched_section_key != 'contact':
                # If starting a new section, assign the previous block if valid
                current_section_key = matched_section_key
                first_section_found = True # Mark that we've entered structured sections
                logger.debug(f"Switched to section: '{current_section_key}' (Line: '{line_strip[:60]}...')")
                # Don't add the header itself to the content
                continue
            elif current_section_key:
                # Add line to the current section's content if we are inside a known section
                section_content_map[current_section_key].append(line_strip)
            elif not first_section_found:
                 # Still haven't found the first section header, keep collecting potential summary
                 if len(line_strip) > 15:
                     potential_summary_lines.append(line_strip)
                     logger.debug(f"Adding potential summary line (in-scan): '{line_strip[:60]}...'")


    # --- 4. Assemble Final Parsed Data ---
    logger.debug("Assembling final parsed data from sections...")
    # Assign collected section content
    for section_key, content_lines in section_content_map.items():
        if content_lines:
            # Join lines, attempt to preserve paragraph breaks if double newlines were common
            # Simple join first, refinement possible later if needed
            full_section_text = "\n".join(content_lines).strip()
            if full_section_text:
                parsed_data[section_key] = full_section_text
                logger.debug(f"Assigned content for section '{section_key}' (length: {len(full_section_text)})")

    # Handle Implicit Summary (if no explicit summary section was found or filled)
    # Check SECTION_KEYWORDS config for 'summary' aliases
    summary_keys = [k for k,v in SECTION_KEYWORDS.items() if 'summary' in v or 'objective' in v or 'profile' in v]
    summary_found = any(parsed_data.get(key, "Not Found") != "Not Found" for key in summary_keys)

    if not summary_found and potential_summary_lines:
        implicit_summary = "\n".join(potential_summary_lines).strip()
        # Basic check: needs enough content to be a summary
        if len(implicit_summary.split()) >= 10 and len(implicit_summary) > 50:
            # Assign to the primary 'summary' key (or first alias found in config)
            target_summary_key = 'summary' if 'summary' in SECTION_KEYWORDS else (summary_keys[0] if summary_keys else None)
            if target_summary_key:
                 parsed_data[target_summary_key] = implicit_summary
                 logger.info(f"Assigned implicit summary to key '{target_summary_key}' (length: {len(implicit_summary)})")
            else:
                 logger.warning("Potential implicit summary found, but no 'summary' key defined in SECTION_KEYWORDS.")
        else:
             logger.debug(f"Potential implicit summary found but seemed too short or invalid (Words: {len(implicit_summary.split())}, Chars: {len(implicit_summary)}).")


    # Consolidate Coding Profiles / Links (optional refinement)
    # (Keep the logic from previous version or simplify if needed)
    # ... logic to gather unique links from contact fields and relevant sections ...
    # Example (Simplified):
    profiles_set = set()
    if parsed_data["linkedin"] != "Not Found": profiles_set.add(f"LinkedIn: {parsed_data['linkedin']}")
    if parsed_data["github"] != "Not Found": profiles_set.add(f"GitHub: {parsed_data['github']}")
    # Add parsing for 'coding_profiles' section text here if needed
    coding_profile_text = parsed_data.get('coding_profiles', 'Not Found')
    if coding_profile_text != 'Not Found':
        for line in coding_profile_text.split('\n'):
             if 'http' in line.lower() and 'linkedin.com' not in line.lower() and 'github.com' not in line.lower():
                  profiles_set.add(line.strip())

    if profiles_set:
        parsed_data["coding_profiles"] = "\n".join(sorted(list(profiles_set)))
        logger.info(f"Updated coding_profiles field.")
    elif "coding_profiles" in parsed_data: # Ensure key exists if expected
         parsed_data["coding_profiles"] = "Not Found"


    # Final check: ensure all expected sections have at least "Not Found"
    for key in SECTION_KEYWORDS:
        if key != 'contact' and key not in parsed_data:
             parsed_data[key] = "Not Found"
        # Ensure existing keys are not None (shouldn't happen with init, but safe)
        elif parsed_data.get(key) is None:
             parsed_data[key] = "Not Found"


    # --- Add Raw Text if desired (controlled by flag/config ideally) ---
    # parsed_data["_raw_text"] = text # Uncomment if needed

    logger.info(f"--- Finished parsing for: {original_filename} ---")
    return parsed_data


# --- Keyword Extraction/Matching Functions ---
def preprocess_and_extract_keywords_nltk(text: str) -> Set[str]:
    """Applies NLTK preprocessing to extract relevant keywords from text."""
    global lemmatizer, all_stop_words # Use the globally initialized objects
    keywords = set()
    if not text or not isinstance(text, str):
        return keywords
    if not lemmatizer:
        logger.warning("NLTK Lemmatizer not available. Skipping keyword extraction.")
        return keywords

    try:
        # Tokenize, lowercase
        tokens = word_tokenize(text.lower())

        # Remove punctuation and digits
        table = str.maketrans('', '', string.punctuation + string.digits)
        stripped_tokens = [w.translate(table) for w in tokens]

        # Filter tokens: non-empty, length > 1, not a stopword
        filtered_tokens = [
            word for word in stripped_tokens
            if word and len(word) > 1 and word not in all_stop_words
        ]

        # Part-of-Speech Tagging
        tagged_tokens = nltk.pos_tag(filtered_tokens)

        # Lemmatize based on POS tag
        pos_map = {'J': 'a', 'V': 'v', 'N': 'n', 'R': 'r'} # Adjective, Verb, Noun, Adverb
        for word, tag in tagged_tokens:
            # Only keep desired POS tags (nouns, adjectives, verbs often most relevant)
            if tag[:2] in ALLOWED_POS_TAGS:
                 # Get WordNet POS tag, default to Noun ('n')
                 wordnet_pos = pos_map.get(tag[0].upper(), 'n')
                 lemma = lemmatizer.lemmatize(word, pos=wordnet_pos)
                 # Final check for lemma validity
                 if lemma and len(lemma) > 1 and lemma not in all_stop_words:
                     keywords.add(lemma)

        logger.debug(f"Extracted {len(keywords)} keywords from text snippet (length {len(text)}).")
        return keywords

    except Exception as e:
        logger.error(f"Error during NLTK keyword extraction: {e}", exc_info=True)
        return set() # Return empty set on error

def get_match_results(resume_text: str, jd_text: str) -> Dict[str, Any]:
    """
    Calculates keyword match score and details between resume text and job description text.
    """
    analysis_result = {
        "score": 0.0,
        "matching_keywords": [],
        "missing_keywords": [],
        "jd_keyword_count": 0,
        "resume_keyword_count": 0,
        "match_count": 0,
        "error": None
    }

    # Check if NLTK is functional (lemmatizer is a good proxy)
    if not lemmatizer:
        analysis_result["error"] = "NLTK components (Lemmatizer/Stopwords) not available. Cannot perform keyword analysis."
        logger.error(f"Error in get_match_results: {analysis_result['error']}")
        return analysis_result

    # Preprocess and extract keywords from both texts
    resume_keywords = preprocess_and_extract_keywords_nltk(resume_text)
    jd_keywords = preprocess_and_extract_keywords_nltk(jd_text)

    analysis_result["resume_keyword_count"] = len(resume_keywords)
    analysis_result["jd_keyword_count"] = len(jd_keywords)

    if not jd_keywords:
        logger.warning("No relevant keywords extracted from Job Description. Match score will be 0.")
        # Still return counts, score is 0
        return analysis_result

    # Calculate intersection (matching) and difference (missing from resume)
    matching = resume_keywords.intersection(jd_keywords)
    missing = jd_keywords.difference(resume_keywords) # Keywords in JD but not in Resume

    analysis_result["matching_keywords"] = sorted(list(matching))
    analysis_result["missing_keywords"] = sorted(list(missing))
    analysis_result["match_count"] = len(matching)

    # Calculate score as percentage of JD keywords found in resume
    analysis_result["score"] = round((len(matching) / len(jd_keywords)) * 100, 2)

    logger.info(f"Match calculation complete. Score: {analysis_result['score']}%, Matches: {analysis_result['match_count']}/{analysis_result['jd_keyword_count']}")
    return analysis_result


# Example of how to call initialization (should be done in your Flask app startup)
if __name__ == '__main__':
     print("Running utils.py directly - initializing NLTK for potential testing.")
     initialize_nltk()
     # Add any test code here if needed
     print("NLTK initialization attempted.")