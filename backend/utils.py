# backend/utils.py
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

# Use current_app from Flask to access configuration and logger within functions
from flask import current_app

# Import configuration constants directly from config within the package
from . import config # Use relative import

# --- Setup Logger ---
# This logger can be used by functions outside the Flask app context (like initialize_nltk)
# Inside request handlers, prefer current_app.logger
logger = logging.getLogger(__name__)
# Basic config in case Flask logging isn't fully set up yet, or called standalone.
# Flask app's logging config in create_app should take precedence.
if not logger.hasHandlers():
     logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(name)s: %(message)s')

# --- Global NLTK Objects ---
# These will be initialized by initialize_nltk() called from create_app()
lemmatizer: Optional[nltk.stem.WordNetLemmatizer] = None
all_stop_words: Set[str] = set()

# --- NLTK Initialization ---
def initialize_nltk():
    """
    Initializes NLTK components (Lemmatizer, Stopwords).
    Call this ONCE during Flask app startup (within create_app).
    Handles download if data is missing. Returns True on success, False on failure.
    """
    global lemmatizer, all_stop_words
    if lemmatizer is not None:
        logger.info("NLTK components appear to be already initialized.")
        return True # Indicate success or already done

    logger.info("--- Initializing NLTK components in utils ---")
    required_data = [
        ('tokenizers/punkt', 'punkt'),
        ('corpora/stopwords', 'stopwords'),
        ('corpora/wordnet', 'wordnet'),
        ('corpora/omw-1.4', 'omw-1.4'), # Needed by WordNetLemmatizer
        ('taggers/averaged_perceptron_tagger', 'averaged_perceptron_tagger')
    ]
    all_found_or_downloaded = True

    # Optional: Specify download directory for serverless environments like /tmp
    # nltk_data_path = "/tmp/nltk_data"
    # try:
    #     os.makedirs(nltk_data_path, exist_ok=True)
    #     if nltk_data_path not in nltk.data.path:
    #         nltk.data.path.append(nltk_data_path)
    #     logger.info(f"Ensured NLTK data path: {nltk_data_path}")
    # except OSError as e:
    #     logger.error(f"Could not create or access NLTK data path {nltk_data_path}: {e}")
    #     # Proceed with default paths, but log the error

    for path, pkg_id in required_data:
        try:
            nltk.data.find(path)
            logger.debug(f"[NLTK] Data package '{pkg_id}' found.")
        except LookupError:
            logger.warning(f"[NLTK] Data package '{pkg_id}' not found. Attempting download...")
            try:
                # Use download_dir=nltk_data_path if using /tmp target
                download_successful = nltk.download(pkg_id, quiet=False) # Set quiet=True for less verbosity
                if not download_successful:
                     logger.error(f"[NLTK] Download command for '{pkg_id}' reported failure.")
                     all_found_or_downloaded = False
                     continue # Try next package

                logger.info(f"[NLTK] Download command for '{pkg_id}' finished. Verifying access...")
                # Verify after download (sometimes download says success but access fails)
                nltk.data.find(path)
                logger.info(f"[NLTK] Verified '{pkg_id}' is now available.")
            except Exception as e:
                 logger.error(f"[NLTK] ERROR downloading or accessing '{pkg_id}': {e}. Keyword extraction might fail.")
                 logger.error(f"         Try manual download or check server permissions: python -m nltk.downloader {pkg_id}")
                 all_found_or_downloaded = False

    if not all_found_or_downloaded:
        logger.error("[NLTK] One or more essential data packages could not be found or downloaded. Check logs above.")
    else:
        logger.info("[NLTK] All required NLTK data packages seem available.")

    # Load components only if all data seems present
    if all_found_or_downloaded:
        try:
            lemmatizer = nltk.stem.WordNetLemmatizer()
            nltk_stop_words = set(nltk.corpus.stopwords.words('english'))
            # Use custom_stops from the imported config
            all_stop_words = nltk_stop_words.union(config.custom_stops)
            logger.info(f"[NLTK] Lemmatizer loaded. Combined stop word list size: {len(all_stop_words)}")
            logger.info("--- NLTK Initialization successful ---")
            return True
        except Exception as e:
            logger.critical(f"[NLTK CRITICAL ERROR] Failed to load Lemmatizer/Stopwords even after download check: {e}", exc_info=True)
            lemmatizer = None
            all_stop_words = set()
            logger.info("--- NLTK Initialization failed during component loading ---")
            return False
    else:
        lemmatizer = None
        all_stop_words = set()
        logger.info("--- NLTK Initialization failed due to missing data ---")
        return False


# --- File Handling Helper ---
def allowed_file(filename: str) -> bool:
    """Check if the file has an allowed extension (uses config)"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in config.ALLOWED_EXTENSIONS

# --- Text Extraction Functions ---
def extract_text_from_pdf(pdf_path: str) -> Optional[str]:
    """Extracts text from a PDF file using PyMuPDF (fitz), preserving basic layout."""
    text = ""
    log = current_app.logger if current_app else logger # Use app logger if in context
    log.debug(f"Attempting to extract text from PDF: {os.path.basename(pdf_path)}")
    try:
        with fitz.open(pdf_path) as doc:
            for page_num, page in enumerate(doc):
                blocks = page.get_text("blocks", sort=True)
                page_text = ""
                last_y1 = 0
                for b in blocks:
                    if b[6] == 0: # Text block
                         # Add newline logic based on vertical spacing
                         if b[1] > last_y1 + 10: page_text += "\n\n" # Likely new paragraph
                         elif b[1] > last_y1 + 2: page_text += "\n"  # Likely new line
                         page_text += b[4].strip() + " " # Add space after block text
                         last_y1 = b[3] # Update last y position
                text += page_text.strip() + "\n\n" # Add double newline between pages

        # Post-processing to clean up extra whitespace
        lines = text.splitlines()
        stripped_lines = [line.strip() for line in lines if line.strip()] # Remove empty lines
        text = "\n".join(stripped_lines)
        text = re.sub(r'[ \t]{2,}', ' ', text) # Normalize multiple spaces within lines
        text = re.sub(r'\n{3,}', '\n\n', text) # Reduce excessive blank lines
        text = text.strip()

        if text:
             log.info(f"Successfully extracted text from PDF: {os.path.basename(pdf_path)} (Length: {len(text)})")
             return text
        else:
             log.warning(f"Extracted empty text from PDF: {os.path.basename(pdf_path)}")
             return None
    except Exception as e:
        log.error(f"Error processing PDF {os.path.basename(pdf_path)}: {e}", exc_info=True)
        return None

def extract_text_from_docx(docx_path: str) -> Optional[str]:
    """Extracts text from a DOCX file using python-docx, preserving paragraphs."""
    log = current_app.logger if current_app else logger
    log.debug(f"Attempting to extract text from DOCX: {os.path.basename(docx_path)}")
    try:
        doc = docx.Document(docx_path)
        text_list = [para.text.strip() for para in doc.paragraphs if para.text.strip()]
        text = '\n\n'.join(text_list) # Join paragraphs with double newlines

        # Post-processing (similar to PDF)
        text = re.sub(r'[ \t]{2,}', ' ', text) # Normalize spaces within paragraphs
        text = re.sub(r'\n{3,}', '\n\n', text).strip() # Reduce excessive blank lines

        if text:
            log.info(f"Successfully extracted text from DOCX: {os.path.basename(docx_path)} (Length: {len(text)})")
            return text
        else:
            log.warning(f"Extracted empty text from DOCX: {os.path.basename(docx_path)}")
            return None
    except Exception as e:
        log.error(f"Error processing DOCX {os.path.basename(docx_path)}: {e}", exc_info=True)
        return None


# --- Section Finding Function ---
def find_section_keyword(line: str, section_map: Dict[str, List[str]]) -> Optional[str]:
    """
    Finds if a line likely marks the start of a known section.
    Relies heavily on the comprehensiveness of SECTION_KEYWORDS in config.
    """
    log = current_app.logger if current_app else logger
    line_stripped = line.strip()
    line_lower = line_stripped.lower()

    # Basic checks to quickly discard non-header lines
    if not line_lower or len(line_lower) < 3 or len(line_stripped.split()) > 7: # Too short or too many words
        return None
    # Avoid identifying list items (like bullet points) as headers
    if re.match(r"^\s*[\*\-•\d]+\.?\s+.{10,}", line_stripped): # Starts with symbol/digit, opt dot, space, then longer text
        return None

    # Check for mostly uppercase (common header format)
    alpha_chars = [c for c in line_stripped if c.isalpha()]
    if not alpha_chars: return None # No alphabetic characters
    upper_chars = [c for c in alpha_chars if c.isupper()]
    # Use a threshold for uppercase ratio, avoid division by zero
    is_mostly_upper = (len(upper_chars) / len(alpha_chars)) > 0.7 if alpha_chars else False

    # Clean line for keyword matching (remove leading symbols, trailing punctuation)
    line_cleaned_lower = re.sub(r"^\s*[^A-Za-z0-9]+|[^A-Za-z0-9]+\s*$", "", line_lower).strip()
    line_cleaned_orig = re.sub(r"^\s*[^A-Za-z0-9]+|[^A-Za-z0-9]+\s*$", "", line_stripped).strip()
    if not line_cleaned_lower: return None # Skip if only punctuation/symbols

    # Use section_map directly (passed as argument, expected to be config.SECTION_KEYWORDS)
    # 1. Exact Match (case-insensitive on cleaned line)
    for section_name, keywords in section_map.items():
        if section_name == 'contact': continue # Skip matching 'contact' as a section header itself
        for keyword in keywords:
            if line_cleaned_lower == keyword:
                log.debug(f"Section keyword exact match: '{line_stripped}' -> {section_name} (keyword: {keyword})")
                return section_name

    # 2. Starts With Match (case-insensitive on cleaned line)
    for section_name, keywords in section_map.items():
         if section_name == 'contact': continue
         for keyword in keywords:
            # Using \b ensures it matches the whole word at the beginning
            pattern = r'^' + re.escape(keyword) + r'\b'
            # Allow few extra chars like ':' or short non-alpha sequences after keyword
            if re.match(pattern, line_cleaned_lower) and len(line_cleaned_lower) < len(keyword) + 10:
                 log.debug(f"Section keyword starts-with match: '{line_stripped}' -> {section_name} (keyword: {keyword})")
                 return section_name

    # 3. Mostly Uppercase Heuristic (check if keyword is present in the original case cleaned line)
    if is_mostly_upper and len(line_cleaned_orig.split()) <= 5: # Limit word count for uppercase headers
        for section_name, keywords in section_map.items():
            if section_name == 'contact': continue
            for keyword in keywords:
                 # Search for the keyword as a whole word within the line (case-insensitive)
                 if re.search(r'\b' + re.escape(keyword) + r'\b', line_cleaned_orig, re.IGNORECASE):
                      log.debug(f"Section keyword uppercase heuristic match: '{line_stripped}' -> {section_name} (keyword: {keyword})")
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
# Expanded list of words unlikely to be part of a name (copied from your snippet)
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
    'inc', 'llc', 'ltd', 'corp', 'corporation', 'developer', 'engineer', 'manager',
    'analyst', 'specialist', 'consultant', 'designer', 'architect' # Common job titles
}


# --- MAIN RESUME PARSING FUNCTION ---
def parse_resume_text(text: str, original_filename: Optional[str]) -> Optional[Dict[str, Any]]:
    """
    Parses extracted resume text to identify contact info, name, and section content.
    Uses current_app.config for NLP model and settings.
    """
    log = current_app.logger # Use Flask's logger within request context
    if not text or not isinstance(text, str):
        log.warning(f"Attempting to parse empty or non-string text for {original_filename}")
        return None

    log.info(f"--- Starting parsing for: {original_filename} ---")

    # --- Get NLP model from Flask app context ---
    nlp = current_app.config.get('NLP_MODEL', None)
    if not nlp:
        log.warning("SpaCy NLP model ('NLP_MODEL') not found in app config. Name extraction will be limited.")

    # Initialize data structure with defaults using config SECTION_KEYWORDS
    parsed_data = {
        "_original_filename": original_filename,
        "name": "Not Found",
        "email": "Not Found",
        "phone": "Not Found",
        "linkedin": "Not Found",
        "github": "Not Found",
        **{key: "Not Found" for key in config.SECTION_KEYWORDS if key != 'contact'},
        # "_raw_text": text # Uncomment this line if you want to include the full raw text in the output JSON
    }

    lines = text.split('\n')
    # Remove empty lines for easier processing, but keep original indices if needed later
    lines_stripped = [line for line in lines if line.strip()]
    if not lines_stripped:
        log.warning(f"Resume text contains no content after stripping lines for {original_filename}")
        return parsed_data # Return default data if text was just whitespace

    text_normalized_spaces = ' '.join(lines_stripped) # For regex matching across original line breaks

    # --- 1. Extract Contact Information (Email, Phone, LinkedIn, GitHub) ---
    log.debug("Extracting contact information...")
    # Prioritize searching in the top part of the resume
    top_lines_for_contact = lines_stripped[:max(NAME_HEURISTIC_LINES, 5)]
    top_text_chunk = "\n".join(top_lines_for_contact)
    # Wider check using normalized text if not found in top lines chunk
    wider_text_chunk = text_normalized_spaces[:1500] # Check first ~1500 chars

    # Email (using config regex)
    emails = list(set(re.findall(config.EMAIL_REGEX, top_text_chunk, re.IGNORECASE) + \
                      re.findall(config.EMAIL_REGEX, wider_text_chunk, re.IGNORECASE)))
    if emails:
        emails.sort(key=len) # Prefer shorter emails if multiple found near top
        parsed_data["email"] = emails[0].strip()
        log.info(f"Found Email: {parsed_data['email']}")

    # Phone (using config regex)
    phones = list(set(re.findall(config.PHONE_REGEX, top_text_chunk) + \
                      re.findall(config.PHONE_REGEX, wider_text_chunk)))
    valid_phones = []
    seen_normalized_phones = set()
    for p in phones:
        p_strip = p.strip()
        normalized_phone = re.sub(r'\D', '', p_strip) # Get only digits
        # Basic validation: length and diversity of digits, avoid simple sequences/years
        if 9 <= len(normalized_phone) <= 15 and len(set(normalized_phone)) > 3 \
           and not re.match(r"^(19|20)\d{2}$", normalized_phone) \
           and normalized_phone not in seen_normalized_phones:
                 valid_phones.append(p_strip) # Store original format found
                 seen_normalized_phones.add(normalized_phone)
    if valid_phones:
        # Could add preference logic here (e.g., prefer '+')
        parsed_data["phone"] = valid_phones[0]
        log.info(f"Found Phone: {parsed_data['phone']}")
    elif phones: # Fallback if regex matched something but validation failed
        parsed_data["phone"] = phones[0].strip()
        log.warning(f"Found potential Phone (validation heuristic failed/skipped): {parsed_data['phone']}")


    # LinkedIn & GitHub (using config regex, search entire normalized text)
    github_links = list(set(re.findall(config.GITHUB_REGEX, text_normalized_spaces, re.IGNORECASE)))
    if github_links:
        github_links.sort(key=len) # Prefer shorter URLs
        parsed_data["github"] = github_links[0].strip().rstrip('/')
        log.info(f"Found GitHub: {parsed_data['github']}")

    linkedin_links = list(set(re.findall(config.LINKEDIN_REGEX, text_normalized_spaces, re.IGNORECASE)))
    if linkedin_links:
        linkedin_links.sort(key=len)
        parsed_data["linkedin"] = linkedin_links[0].strip().rstrip('/')
        log.info(f"Found LinkedIn: {parsed_data['linkedin']}")

    # --- 2. Extract Applicant Name (Using NER and Heuristics) ---
    log.debug("Extracting applicant name...")
    extracted_name = "Not Found"
    name_candidates: List[Tuple[str, int, str]] = [] # (name, score, source)

    # Strategy 1: spaCy NER (if model is available)
    if nlp:
        try:
            # Analyze only the top portion for efficiency
            doc = nlp(text_normalized_spaces[:NAME_NER_CHUNK_SIZE]) # Use normalized text chunk

            for ent in doc.ents:
                if ent.label_ == "PERSON":
                    name_text = ent.text.strip()
                    # Clean up potential leading/trailing non-alpha chars missed by NER
                    name_text = re.sub(r"^[^\w\s]+|[^\w\s]+$", "", name_text).strip()
                    words = name_text.split()
                    word_count = len(words)

                    # Filtering based on constants and patterns
                    if (NAME_MIN_LEN <= len(name_text) <= NAME_MAX_LEN and
                        NAME_MIN_WORDS <= word_count <= NAME_MAX_WORDS and
                        name_text[0].isupper() and # Starts with capital
                        re.fullmatch(r"^[A-Za-z\s'\-\.]+$", name_text) and # Allows internal hyphens, apostrophes, periods
                        all(w.lower() not in COMMON_NON_NAME_WORDS for w in words) and
                        not find_section_keyword(name_text, config.SECTION_KEYWORDS)): # Check it's not a section header

                        # Scoring logic
                        score = 10
                        if word_count >= 2: score += 5
                        # Penalize if near certain keywords on the same line (check original lines)
                        line_containing_ent = ""
                        for line in lines_stripped: # Check the non-empty stripped lines
                            if name_text in line:
                                line_containing_ent = line.lower()
                                break
                        if any(non_name in line_containing_ent for non_name in ['university', 'college', 'inc.', 'ltd.', 'llc', 'corp.']):
                             score -= 5
                        # Penalize if looks like email prefix
                        if parsed_data["email"] != "Not Found" and name_text.lower() in parsed_data["email"].split('@')[0].lower():
                            score -= 3

                        if score > 0:
                             name_candidates.append((name_text, score, 'ner'))
                             log.debug(f"NER Candidate: '{name_text}' (Score: {score})")

        except Exception as ner_error:
            log.error(f"Error during spaCy NER processing: {ner_error}", exc_info=True)

    # Strategy 2: Heuristic Check of Top Lines
    log.debug("Attempting heuristic name check...")
    for line_num, line in enumerate(lines_stripped[:NAME_HEURISTIC_LINES]):
        # Use the line directly as it's already stripped
        line_cleaned = re.sub(r"^\W+|\W+$", "", line).strip() # More aggressive cleaning

        if not line_cleaned or len(line_cleaned) < NAME_MIN_LEN or len(line_cleaned) > NAME_MAX_LEN:
            continue

        # Skip if it looks like contact info, section header, or contains digits/urls
        if find_section_keyword(line, config.SECTION_KEYWORDS): continue
        if any(kw in line.lower() for kw in ['http', 'www.', '.com', '@', 'phone', 'email', 'fax']): continue
        if parsed_data["email"] != "Not Found" and parsed_data["email"].lower() in line.lower(): continue
        if parsed_data["phone"] != "Not Found" and parsed_data["phone"] in line: continue
        if re.search(r'\d{3,}', line): continue # Contains 3+ consecutive digits

        words = line_cleaned.split()
        word_count = len(words)
        # Check name pattern, capitalization, non-common words
        if (NAME_MIN_WORDS <= word_count <= NAME_MAX_WORDS and
            re.fullmatch(r"^[A-Za-z\s'\-\.]+$", line_cleaned) and
            any(c.isupper() for c in line_cleaned) and # Must contain at least one uppercase
            all(w.lower() not in COMMON_NON_NAME_WORDS for w in words)):

            # Scoring logic
            score = 5
            if word_count >= 2: score += 5
            if line_num < 3: score += 5 # Strong bonus for top lines
            elif line_num < 7: score += 2
            # Check Title Case (approximate)
            if all(word[0].isupper() or not word[0].isalpha() for word in words): score += 3
            # Penalize ALL CAPS heavily if more than 1 word
            if line_cleaned.isupper() and word_count > 1: score -= 7

            if score > 0:
                 name_candidates.append((line_cleaned, score, 'heuristic'))
                 log.debug(f"Heuristic Candidate: '{line_cleaned}' (Score: {score})")

    # Select the best name candidate
    if name_candidates:
        # Sort by score (desc), then prefer NER, then shorter length as tie-breaker
        name_candidates.sort(key=lambda x: (x[1], 1 if x[2] == 'ner' else 0, -len(x[0])), reverse=True)
        best_candidate = name_candidates[0]
        extracted_name = best_candidate[0]
        log.info(f"Selected Name: '{extracted_name}' (Source: {best_candidate[2]}, Score: {best_candidate[1]})")
        # Log if competition was close
        if len(name_candidates) > 1 and best_candidate[1] < name_candidates[1][1] + 3 and best_candidate[0] != name_candidates[1][0]:
             log.warning(f"Close competition for name: Best '{best_candidate[0]}' ({best_candidate[1]}) vs Next '{name_candidates[1][0]}' ({name_candidates[1][1]})")
    else:
        log.warning("No suitable name candidates found by NER or heuristics.")

    parsed_data["name"] = extracted_name

    # --- 3. Identify Sections and Extract Content ---
    log.debug("Identifying sections and extracting content...")
    # Use config.SECTION_KEYWORDS keys for the map
    section_content_map: Dict[str, List[str]] = {key: [] for key in config.SECTION_KEYWORDS if key != 'contact'}
    current_section_key: Optional[str] = None
    potential_summary_lines: List[str] = []
    first_section_found = False

    # Determine where the name/contact info likely ends to identify potential summary start
    name_line_index = -1
    if parsed_data["name"] != "Not Found":
        for idx, line in enumerate(lines_stripped):
            if parsed_data["name"] in line:
                name_line_index = idx
                break
    # Assume contact info/name is within first few lines or near the found name
    contact_end_index = max(name_line_index + 2, min(NAME_HEURISTIC_LINES // 2, len(lines_stripped)-1))
    start_scan_index = 0 # Line index where main section scanning should begin

    # Scan lines before the main scan to gather potential summary and find first real header
    for idx in range(contact_end_index + 1):
         line = lines_stripped[idx]
         potential_early_header = find_section_keyword(line, config.SECTION_KEYWORDS)
         if potential_early_header and potential_early_header != 'contact':
              start_scan_index = idx # Start main scan from this header line
              log.debug(f"Found early section header '{potential_early_header}', starting section scan from index {idx}")
              first_section_found = True # Treat this as the first section
              current_section_key = potential_early_header
              break # Stop pre-scan
         else:
             # Collect potential summary lines (avoiding contact info remnants)
             is_likely_contact = any(kw in line.lower() for kw in ['http', '@', 'phone', 'email', 'linkedin', 'github']) or \
                                 (parsed_data['email'] != "Not Found" and parsed_data['email'].split('@')[0].lower() in line.lower()) or \
                                 (parsed_data['phone'] != "Not Found" and parsed_data['phone'] in line)
             is_likely_name_line = (parsed_data['name'] != "Not Found" and parsed_data['name'] in line)

             if not is_likely_contact and not is_likely_name_line and len(line) > 15:
                 potential_summary_lines.append(line)
                 log.debug(f"Adding potential summary line (pre-scan): '{line[:60]}...'")
         # If no early header found, main scan starts after this pre-scan block
         if not first_section_found:
            start_scan_index = idx + 1


    log.debug(f"Starting main section scan from line index: {start_scan_index}")
    # Continue scanning from where pre-scan left off, or the determined start_scan_index
    for i in range(start_scan_index, len(lines_stripped)):
        line = lines_stripped[i]
        matched_section_key = find_section_keyword(line, config.SECTION_KEYWORDS)

        if matched_section_key and matched_section_key != 'contact':
            # Starting a new, valid section
            current_section_key = matched_section_key
            first_section_found = True
            log.debug(f"Switched to section: '{current_section_key}' (Line: '{line[:60]}...')")
            # Don't add the header itself to the content
            continue
        elif current_section_key:
            # Add line to the *current* active section's content
            section_content_map[current_section_key].append(line)
        elif not first_section_found:
             # Still haven't found the first *real* section header, keep collecting potential summary
             if len(line) > 15: # Basic check against very short lines
                 potential_summary_lines.append(line)
                 log.debug(f"Adding potential summary line (in-scan): '{line[:60]}...'")


    # --- 4. Assemble Final Parsed Data ---
    log.debug("Assembling final parsed data from sections...")
    # Assign collected section content
    for section_key, content_lines in section_content_map.items():
        if content_lines:
            full_section_text = "\n".join(content_lines).strip()
            # Further cleaning of section text could happen here (e.g., remove redundant whitespace)
            if full_section_text:
                parsed_data[section_key] = full_section_text
                log.debug(f"Assigned content for section '{section_key}' (length: {len(full_section_text)})")

    # Handle Implicit Summary
    # Check if any of the keys associated with 'summary' in config have content
    summary_keys = [k for k, keywords in config.SECTION_KEYWORDS.items() if any(sk in ['summary', 'objective', 'profile'] for sk in keywords)]
    summary_found_explicitly = any(parsed_data.get(key, "Not Found") != "Not Found" for key in summary_keys)

    if not summary_found_explicitly and potential_summary_lines:
        implicit_summary = "\n".join(potential_summary_lines).strip()
        # Basic check: needs enough content to be a summary
        if len(implicit_summary.split()) >= 10 and len(implicit_summary) > 50:
            # Assign to the primary 'summary' key if defined, or the first alias found
            target_summary_key = 'summary' if 'summary' in section_content_map else (summary_keys[0] if summary_keys else None)
            if target_summary_key:
                 parsed_data[target_summary_key] = implicit_summary
                 log.info(f"Assigned implicit summary to key '{target_summary_key}' (length: {len(implicit_summary)})")
            else:
                 log.warning("Potential implicit summary found, but no 'summary'/'objective'/'profile' key defined in SECTION_KEYWORDS config.")
        else:
             log.debug(f"Potential implicit summary discarded (too short/invalid): Words={len(implicit_summary.split())}")


    # Consolidate Coding Profiles / Links (optional refinement)
    profiles_set = set()
    if parsed_data["linkedin"] != "Not Found": profiles_set.add(f"LinkedIn: {parsed_data['linkedin']}")
    if parsed_data["github"] != "Not Found": profiles_set.add(f"GitHub: {parsed_data['github']}")

    # Check explicit coding_profiles section for other links
    coding_profile_text = parsed_data.get('coding_profiles', "Not Found")
    if coding_profile_text != 'Not Found':
        for line in coding_profile_text.split('\n'):
             line_strip = line.strip()
             if 'http' in line_strip.lower(): # Basic check for a URL
                 # Avoid re-adding linkedin/github if already captured
                  if not any(known_domain in line_strip.lower() for known_domain in ['linkedin.com', 'github.com']):
                      profiles_set.add(line_strip)

    # Update the coding_profiles field if any profiles were found/consolidated
    target_coding_key = 'coding_profiles' # Assuming this is the desired key
    if profiles_set:
        parsed_data[target_coding_key] = "\n".join(sorted(list(profiles_set)))
        log.info(f"Updated '{target_coding_key}' field with consolidated links.")
    elif target_coding_key in parsed_data and parsed_data[target_coding_key] == "Not Found":
        # If no profiles found and field exists as "Not Found", keep it that way or remove?
        # Keeping "Not Found" is consistent.
        pass


    # Final check: ensure all expected sections from config have at least "Not Found"
    for key in config.SECTION_KEYWORDS:
        if key != 'contact': # 'contact' is not a section, just keywords
             parsed_data.setdefault(key, "Not Found") # Ensures key exists if missed


    log.info(f"--- Finished parsing for: {original_filename} ---")
    return parsed_data


# --- Keyword Extraction/Matching Functions ---
def preprocess_and_extract_keywords_nltk(text: str) -> Set[str]:
    """Applies NLTK preprocessing to extract relevant keywords from text."""
    log = current_app.logger if current_app else logger
    global lemmatizer, all_stop_words # Use the globally initialized objects
    keywords = set()
    if not text or not isinstance(text, str):
        return keywords
    if not lemmatizer:
        # Log this warning here as well, as it affects matching directly
        log.warning("NLTK Lemmatizer not available. Skipping keyword extraction.")
        return keywords

    try:
        # Tokenize, lowercase
        tokens = word_tokenize(text.lower())

        # Remove punctuation and digits more robustly
        # Keep internal hyphens/apostrophes if desired? Current table removes them.
        table = str.maketrans('', '', string.punctuation + string.digits)
        stripped_tokens = [w.translate(table) for w in tokens]

        # Filter tokens: non-empty, length > 1, not a stopword (use global all_stop_words)
        filtered_tokens = [
            word for word in stripped_tokens
            if word and len(word) > 1 and word not in all_stop_words
        ]

        # Part-of-Speech Tagging
        tagged_tokens = nltk.pos_tag(filtered_tokens)

        # Lemmatize based on POS tag (use config.ALLOWED_POS_TAGS)
        pos_map = {'J': 'a', 'V': 'v', 'N': 'n', 'R': 'r'} # Adjective, Verb, Noun, Adverb
        for word, tag in tagged_tokens:
            # Check against configured allowed POS tags
            if tag[:2] in config.ALLOWED_POS_TAGS:
                 # Get WordNet POS tag, default to Noun ('n')
                 wordnet_pos = pos_map.get(tag[0].upper(), 'n')
                 lemma = lemmatizer.lemmatize(word, pos=wordnet_pos)
                 # Final check for lemma validity (non-empty, >1 char, not stopword again)
                 if lemma and len(lemma) > 1 and lemma not in all_stop_words:
                     keywords.add(lemma)

        log.debug(f"Extracted {len(keywords)} keywords from text snippet (length {len(text)}).")
        return keywords

    except Exception as e:
        log.error(f"Error during NLTK keyword extraction: {e}", exc_info=True)
        return set() # Return empty set on error

def get_match_results(resume_text: str, jd_text: str) -> Dict[str, Any]:
    """
    Calculates keyword match score and details between resume text and job description text.
    """
    log = current_app.logger if current_app else logger
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
        error_msg = "NLTK components (Lemmatizer/Stopwords) not available. Cannot perform keyword analysis."
        analysis_result["error"] = error_msg
        log.error(f"Error in get_match_results: {error_msg}")
        return analysis_result

    # Preprocess and extract keywords from both texts
    log.debug("Extracting keywords from resume...")
    resume_keywords = preprocess_and_extract_keywords_nltk(resume_text)
    log.debug("Extracting keywords from job description...")
    jd_keywords = preprocess_and_extract_keywords_nltk(jd_text)

    analysis_result["resume_keyword_count"] = len(resume_keywords)
    analysis_result["jd_keyword_count"] = len(jd_keywords)

    if not jd_keywords:
        log.warning("No relevant keywords extracted from Job Description. Match score will be 0.")
        # Still return counts, score is 0
        return analysis_result
    if not resume_keywords:
        log.warning("No relevant keywords extracted from Resume. Match score will be 0.")
         # Still return counts, score is 0
        return analysis_result


    # Calculate intersection (matching) and difference (missing from resume)
    matching = resume_keywords.intersection(jd_keywords)
    missing = jd_keywords.difference(resume_keywords) # Keywords in JD but not in Resume

    analysis_result["matching_keywords"] = sorted(list(matching))
    analysis_result["missing_keywords"] = sorted(list(missing))
    analysis_result["match_count"] = len(matching)

    # Calculate score as percentage of JD keywords found in resume
    # Avoid division by zero if jd_keywords is somehow empty after the check (defensive)
    try:
        analysis_result["score"] = round((len(matching) / len(jd_keywords)) * 100, 2)
    except ZeroDivisionError:
         analysis_result["score"] = 0.0

    log.info(f"Match calculation complete. Score: {analysis_result['score']}%, Matches: {analysis_result['match_count']}/{analysis_result['jd_keyword_count']}")
    return analysis_result

# Note: No `if __name__ == '__main__':` block should be here.