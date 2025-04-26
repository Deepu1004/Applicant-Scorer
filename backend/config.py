# backend/config.py
# -*- coding: utf-8 -*-
import os
import re

# --- Base Directory ---
# Get the directory where this config.py file resides (inside backend/)
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
# Get the project root directory (one level up from the backend package)
PROJECT_ROOT = os.path.dirname(BASE_DIR)

# --- File Storage Paths (USING /tmp RECOMMENDED FOR RENDER/VERCEL FREE TIER) ---
# Vercel/Render free tiers often have ephemeral filesystems; only /tmp is writable reliably.
# Data stored in /tmp will be LOST between deployments or server restarts/sleeps.
# For persistent storage, use external services (AWS S3, GCS) or Render Disks (paid).

TMP_DATA_DIR = "/tmp/ats_data" # Base directory within /tmp for this app's data

# Create specific subdirectories within the /tmp base
# Ensure these directory creation attempts happen in create_app() in __init__.py
JOB_DESC_FOLDER = os.path.join(TMP_DATA_DIR, 'job_descriptions')
ORIGINAL_RESUME_FOLDER = os.path.join(TMP_DATA_DIR, 'resumes_original')
PARSED_DATA_FOLDER = os.path.join(TMP_DATA_DIR, 'resumes_parsed')

# --- File Upload Settings ---
ALLOWED_EXTENSIONS = {'pdf', 'docx'}
MAX_FILE_SIZE = 15 * 1024 * 1024 # 15MB limit

# --- NLP Model Settings ---
NLP_MODEL_NAME = "en_core_web_sm"
# **ADJUST THIS VERSION TO MATCH YOUR SPACY INSTALLATION ON THE SERVER**
# Find compatible versions: https://github.com/explosion/spacy-models/releases
# Check Render/Vercel build logs for installed spacy version if unsure.
NLP_MODEL_VERSION = "3.7.0" # Example - CHANGE AS NEEDED

# --- CORS Settings ---
# IMPORTANT: In production, restrict origins STRICTLY to your frontend URL(s)
ALLOWED_ORIGINS = [
    "http://localhost:5173",      # Local dev frontend
    "http://127.0.0.1:5173",     # Local dev frontend
    "https://applicant-scorer.onrender.com", # Your Render frontend URL (example)
    # Add your Vercel frontend URL here if applicable
    # "https://your-vercel-app-name.vercel.app"
]

# --- Regex Patterns ---
EMAIL_REGEX = r'[\w\.-]+@[\w\.-]+\.\w+'
# Refined phone regex to handle common formats and avoid false positives like years
PHONE_REGEX = r'(?:(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{1,4}\)?[-.\s]?)|(?:\d{1,4}[-.\s]?)){1,}\d{3,4}[-.\s]?\d{3,4}(?:\s*(?:ext|x|extension)\.?\s*\d+)?'
GITHUB_REGEX = r'(?:https?://)?(?:www\.)?github\.com/[\w\.-]+/?'
LINKEDIN_REGEX = r'(?:https?://)?(?:www\.)?linkedin\.com/(?:in|pub|company)/[\w\-\._~:/?#[\]@!$&\'\(\)\*\+,;=]+/?'

# --- Section Keywords for Parsing ---
# Review and expand these keywords based on common resume formats
SECTION_KEYWORDS = {
    "contact": ["contact", "contact information", "personal details", "personal data", "address", "phone", "email"], # Keywords for identifying contact info *lines*, not usually a header itself
    "summary": ["summary", "objective", "profile", "about me", "career objective", "professional summary", "personal profile", "executive summary", "professional objective"],
    "education": ["education", "academic background", "qualifications", "academic qualifications", "academic history", "degrees", "university", "college", "institute", "academic training"],
    "experience": ["experience", "work experience", "professional experience", "employment history", "career summary", "work history", "professional background", "employment", "positions held", "internship", "internships", "relevant experience"],
    "skills": ["skills", "technical skills", "programming languages", "competencies", "proficiencies", "technical expertise", "technologies", "tools", "software", "languages", "key skills", "core competencies", "technical proficiency", "expertise", "platforms", "skill set"],
    "projects": ["projects", "personal projects", "portfolio", "github projects", "side projects", "key projects", "academic projects", "selected projects", "relevant projects"],
    "certifications": ["certifications", "licenses & certifications", "courses", "training & certifications", "professional development", "licenses", "awards", "honors", "training", "achievements", "certificates", "accomplishments", "recognition", "professional memberships"],
    "coding_profiles": ["coding profiles", "online profiles", "github", "portfolio links", "social profiles", "linkedin", "links", "profiles", "web presence", "websites", "repositories", "urls"] # For explicit link sections
}

# --- NLTK Configuration ---
# POS tags deemed relevant for keyword extraction (Nouns, Proper Nouns, Adjectives, Verbs)
ALLOWED_POS_TAGS = {'NN', 'NNS', 'NNP', 'NNPS', 'JJ', 'JJR', 'JJS', 'VB', 'VBD', 'VBG', 'VBN', 'VBP', 'VBZ'}

# Custom stop words list - review and potentially shorten/refine this extensive list
# Consider removing very common technical terms if they are *always* expected and don't differentiate candidates.
custom_stops = {
    # Basic stopwords (already covered by NLTK, but explicit doesn't hurt)
    'a', 'an', 'the', 'in', 'on', 'at', 'for', 'to', 'from', 'of', 'with', 'by', 'as', 'is', 'are', 'was', 'were', 'be', 'being', 'been', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'd', 'll', 'm', 'o', 're', 've', 'y',
    # Common Resume/Job Context Words (Maybe keep some action verbs?)
    'ability', 'able', 'about', 'above', 'across', 'act', 'action', 'activities', 'activity', 'adapt', 'addition', 'additional', 'advantage', 'advantageous', 'affect', 'after', 'afterward', 'agency', 'all', 'almost', 'along', 'alongside', 'already', 'also', 'although', 'always', 'among', 'amongst', 'amount', 'and', 'annual', 'another', 'any', 'anyhow', 'anyone', 'anything', 'anyway', 'anywhere', 'appeal', 'applicable', 'apply', 'approach', 'appropriate', 'are', 'area', 'around', 'as', 'asset', 'aspect', 'aspects', 'associated', 'at', 'atmosphere', 'attractive', 'attitude', 'background', 'based', 'basis', 'be', 'because', 'become', 'becomes', 'becoming', 'been', 'before', 'beforehand', 'behind', 'being', 'below', 'beneficial', 'benefit', 'benefits', 'beside', 'besides', 'best', 'better', 'between', 'beyond', 'bonus', 'both', 'bring', 'building', 'business', 'but', 'by',
    'candidate', 'candidates', 'capability', 'capacity', 'career', 'cause', 'center', 'certain', 'certainly', 'challenge', 'chance', 'change', 'changes', 'clear', 'clearly', 'client', 'collaboration', 'collaborative', 'colleague', 'come', 'commensurate', 'commitment', 'common', 'communication', 'company', 'compared', 'compensation', 'competency', 'complete', 'comprehensive', 'computer', 'concept', 'concern', 'concerning', 'condition', 'consider', 'considering', 'consistent', 'contact', 'continuous', 'contribution', 'coordinate', 'could', 'country', 'course', 'cover', 'create', 'criteria', 'critical', 'crucial', 'culture', 'current', 'currently', 'customer', 'cv', 'resume', 'biodata',
    'daily', 'deadline', 'degree', 'deliver', 'demonstrable', 'demonstrate', 'department', 'description', 'desirable', 'detail', 'details', 'different', 'direct', 'directly', 'disability', 'discussion', 'diverse', 'do', 'does', 'doing', 'done', 'down', 'due', 'during', 'duties', 'duty', 'date', 'birth', 'gender', 'nationality', 'address', 'phone', 'email',
    'each', 'early', 'e', 'g', 'eg', 'effect', 'effective', 'effectively', 'efficiency', 'efficient', 'effort', 'efforts', 'either', 'eligible', 'employee', 'employer', 'employment', 'enable', 'encourage', 'end', 'engage', 'ensure', 'enter', 'entire', 'environment', 'equal', 'especially', 'essential', 'etc', 'evolution', 'even', 'event', 'ever', 'every', 'everybody', 'everyone', 'everything', 'everywhere', 'evidence', 'example', 'excellent', 'except', 'exchange', 'execute', 'experienced', 'exposure', 'explain', 'extend', 'extent', 'extra',
    'facilitate', 'fact', 'factor', 'familiar', 'familiarity', 'fastpaced', 'fast-paced', 'father', 'feel', 'few', 'field', 'final', 'finally', 'find', 'first', 'five', 'focus', 'follow', 'following', 'for', 'found', 'foundational', 'four', 'frequently', 'from', 'full', 'fully', 'function', 'functional', 'further', 'furthermore', 'future',
    'general', 'generally', 'get', 'give', 'given', 'global', 'go', 'goal', 'goals', 'good', 'graduate', 'grasp', 'great', 'group', 'grow', 'growing', 'growth', 'guidance', 'gpa', 'cgpa', 'grade',
    'handson', 'happy', 'hard', 'has', 'have', 'having', 'he', 'health', 'help', 'helpful', 'hence', 'her', 'here', 'hereafter', 'hereby', 'herein', 'hereupon', 'hers', 'herself', 'high', 'high-quality', 'highquality', 'highly', 'him', 'himself', 'his', 'holiday', 'home', 'hour', 'hours', 'how', 'however', 'human', 'i', 'ideal', 'ie', 'if', 'impact', 'important', 'improve', 'in', 'inc', 'include', 'includes', 'including', 'increase', 'indeed', 'individual', 'industry', 'influence', 'information', 'initiative', 'initiatives', 'inner', 'input', 'inside', 'insight', 'instance', 'instead', 'insure', 'interest', 'interested', 'internal', 'into', 'introduce', 'introduction', 'involved', 'involving', 'is', 'issue', 'it', 'its', 'itself', 'internship',
    'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december', 'job', 'join', 'just',
    'keen', 'key', 'keep', 'kind',
    'large', 'last', 'later', 'latter', 'latterly', 'least', 'leave', 'less', 'let', 'level', 'like', 'likely', 'limited', 'little', 'location', 'long', 'look', 'looking', 'ltd', 'llc', 'corp', 'corporation', 'languages', 'linkedin', 'github',
    'made', 'main', 'mainly', 'maintain', 'major', 'make', 'making', 'man', 'manage', 'many', 'market', 'may', 'maybe', 'me', 'mean', 'meanwhile', 'member', 'mention', 'might', 'minimum', 'mission', 'monday', 'month', 'monthly', 'more', 'moreover', 'morning', 'most', 'mostly', 'move', 'much', 'multiple', 'must', 'mutual', 'my', 'myself',
    'name', 'namely', 'navigate', 'near', 'necessary', 'need', 'needs', 'neither', 'never', 'nevertheless', 'new', 'next', 'nine', 'no', 'nobody', 'non', 'none', 'noone', 'nor', 'normal', 'normally', 'not', 'nothing', 'notice', 'now', 'nowhere', 'number',
    'obtain', 'occasionally', 'of', 'off', 'offer', 'office', 'often', 'on', 'online', 'once', 'one', 'ones', 'only', 'onto', 'open', 'opportunity', 'opportunities', 'opposite', 'or', 'order', 'organization', 'organizational', 'other', 'others', 'otherwise', 'ought', 'our', 'ours', 'ourselves', 'out', 'outside', 'over', 'overall', 'overview', 'own',
    'package', 'paid', 'part', 'particular', 'particularly', 'partner', 'party', 'pass', 'past', 'passion', 'pay', 'people', 'per', 'perform', 'perhaps', 'period', 'phase', 'person', 'personal', 'place', 'plan', 'please', 'plus', 'point', 'popular', 'position', 'possible', 'post', 'potential', 'practical', 'practice', 'preferred', 'presence', 'present', 'principle', 'previous', 'previously', 'price', 'primary', 'prior', 'priority', 'private', 'proactive', 'probably', 'problem-solving', 'problem-solving', 'productive', 'profession', 'professional', 'proficiency', 'proficient', 'program', 'progress', 'promote', 'property', 'provide', 'provided', 'purpose', 'put', 'portfolio', 'profile', 'publications', 'present',
    'qualification', 'quality', 'quantity', 'quarter', 'question', 'quick', 'quickly', 'quite',
    'rather', 'reach', 'readily', 'ready', 'really', 'reason', 'recent', 'regarding', 'region', 'regular', 'relaxed', 'related', 'relation', 'relationship', 'relevant', 'report', 'reporting', 'respect', 'responsible', 'responsibilities', 'result', 'results', 'role', 'room', 'round', 'references',
    'said', 'salary', 'same', 'saturday', 'say', 'says', 'scope', 'seamless', 'season', 'second', 'see', 'seeing', 'seek', 'seeking', 'seem', 'seemed', 'seeming', 'seems', 'seen', 'select', 'self', 'self-directed', 'selfdirected', 'send', 'sense', 'senior', 'serious', 'serve', 'several', 'shall', 'share', 'she', 'shift', 'short', 'should', 'show', 'showcasing', 'showing', 'side', 'significant', 'similar', 'similarly', 'simple', 'since', 'sincere', 'six', 'small', 'so', 'soft', 'some', 'somehow', 'someone', 'something', 'sometime', 'sometimes', 'somewhat', 'somewhere', 'soon', 'sorry', 'specific', 'specifically', 'staff', 'stakeholder', 'stakeholders', 'standard', 'standards', 'start', 'state', 'status', 'stay', 'step', 'still', 'strategic', 'strategy', 'strong', 'structure', 'student', 'study', 'style', 'subject', 'submit', 'success', 'successful', 'such', 'suitable', 'summary', 'sunday', 'support', 'supportive', 'sure', 'school', 'software', 'specialist',
    'take', 'taking', 'task', 'tasks', 'teamwork', 'tell', 'ten', 'term', 'terms', 'than', 'thank', 'thanks', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'thence', 'there', 'thereafter', 'thereby', 'therefore', 'therein', 'thereupon', 'these', 'they', 'thing', 'things', 'think', 'third', 'this', 'thorough', 'thoroughly', 'those', 'though', 'three', 'through', 'throughout', 'thru', 'thus', 'thursday', 'time', 'timely', 'to', 'today', 'together', 'tomorrow', 'too', 'top', 'total', 'toward', 'towards', 'track', 'train', 'trend', 'tuesday', 'turn', 'two', 'type', 'technical', 'technologies', 'tools', 'training',
    'under', 'understand', 'understanding', 'unless', 'unlike', 'unlikely', 'unique', 'until', 'up', 'update', 'upon', 'us', 'use', 'used', 'useful', 'user-friendly', 'userfriendly', 'using', 'usually', 'utilize', 'university',
    'valuable', 'value', 'various', 'verbal', 'version', 'very', 'via', 'view', 'visit', 'volume', 'vital', 'vitae', 'volunteer',
    'want', 'was', 'way', 'ways', 'we', 'wednesday', 'week', 'weekly', 'welcome', 'well-documented', 'welldocumented', 'well', 'went', 'were', 'what', 'whatever', 'when', 'whence', 'whenever', 'where', 'whereafter', 'whereas', 'whereby', 'wherein', 'whereupon', 'wherever', 'whether', 'which', 'while', 'whither', 'who', 'whoever', 'whole', 'whom', 'whose', 'why', 'wide', 'will', 'willingness', 'with', 'within', 'without', 'woman', 'world', 'worldwide', 'would', 'write', 'written', 'work',
    'year', 'years', 'yes', 'yet', 'you', 'your', 'yours', 'yourself', 'yourselves',
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'
}