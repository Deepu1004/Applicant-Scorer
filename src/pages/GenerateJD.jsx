import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Sparkles, FilePenLine, LoaderCircle, Save, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Get API base URL from environment variables or default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SAVE_JD_URL = `${API_BASE_URL}/jd/save`;

// WARNING: Hardcoding keys is insecure. Use environment variables.
// Example using env var: const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_KEY = "AIzaSyD1NyRNqR6dshyZ7ti8de8ai2No402bbew"; // <-- Replace with YOUR actual key or use env vars securely

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// --- Helper Function (callGeminiApi) ---
async function callGeminiApi(jobTitle, experience) {
  console.log("Attempting to call Gemini API with:", { jobTitle, experience });

  if (!GEMINI_API_KEY || GEMINI_API_KEY.startsWith("AIzaSy") === false || GEMINI_API_KEY.length < 30) {
    console.error("Gemini API Key not configured or looks invalid.");
    throw new Error("AI Config Error: API Key is missing or appears invalid. Please configure it securely (e.g., using VITE_GEMINI_API_KEY environment variable).");
  }

  const prompt = `
    Generate a comprehensive and professional job description for the position of "${jobTitle}" at a modern tech company. The description should be tailored for a candidate with "${experience}" level of relevant experience. Analyze the typical requirements, responsibilities, and daily activities for this role and level. Include relevant keywords optimized for Applicant Tracking Systems (ATS). The description must be detailed, structured, and focus on all job aspects: skills, tools, languages, and soft skills. Structure the job description clearly with the following sections, using natural language within paragraphs, **strictly avoiding bullet points, numbered lists, or markdown formatting (#, *, -).** Ensure distinct paragraphs for each section header (which should also be naturally integrated or omitted in the final output).

1.  **Job Overview:** Summarize the role's purpose, main objectives, and its contribution to the team or company goals in a compelling paragraph.
2.  **Key Responsibilities:** Describe the primary duties and tasks in paragraph form. Detail the nature of the work, potential projects, and key focus areas or challenges using descriptive language.
3.  **Required Skills & Qualifications:** In paragraph form, describe the essential technical foundation. Detail specific programming languages, frameworks, databases, cloud platforms, and other tools crucial for success in the role. Weave these requirements into sentences.
4.  **Required Soft Skills & Competencies:** In paragraph form, elaborate on vital soft skills. For example, discuss the importance of clear communication for collaborating with cross-functional teams (like design, product, backend), effective problem-solving abilities for tackling technical challenges, and a proactive learning attitude to keep pace with the evolving tech landscape.
5.  **Required Experience:** Elaborate on the type and duration of professional experience necessary in paragraph form. Relate this directly to the "${jobTitle}" role and "${experience}" level. Mention relevant project types, industry experience, or past achievements expected.
6.  **Preferred Qualifications (Optional):** In a separate paragraph, describe any additional skills, experiences (e.g., specific testing frameworks, CI/CD tools, design system familiarity, accessibility expertise), or academic qualifications that are advantageous but not strictly mandatory.
7.  **Work Environment / Team Culture (Optional):** Briefly describe the team dynamics, company values, or work environment in a paragraph to give candidates a feel for the culture.

Ensure the overall tone is professional, clear, engaging, and inclusive. Use ONLY plain text formatting and standard paragraphs separated by a single blank line. The final output should read naturally, as if written by a hiring manager, ready for direct use on a job board and optimized for resume keyword matching. Avoid any meta-commentary about the generation process itself.
  `;

  try {
    console.log("Sending request to Gemini...");
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    console.log("Received response status:", response.status);

    if (!response.ok) {
      let errorData = { error: { message: `HTTP error ${response.status}` } };
      try { errorData = await response.json(); console.error('Gemini API Error Body:', errorData); }
      catch (parseError) { console.error('Could not parse error response:', await response.text()); }

      let errorMessage = `AI Error (${response.status})`;
      if (errorData.error?.message) { errorMessage += `: ${errorData.error.message.split('\n')[0]}`; }
      if (response.status === 400 && errorData.error?.message?.includes('API key not valid')) {
         errorMessage = "AI Config Error: The provided API Key is not valid. Please check your configuration.";
      } else if (response.status === 429) {
         errorMessage = "AI Rate Limit: Too many requests. Please wait and try again later.";
      } else if (response.status >= 500) {
          errorMessage += ". The AI service might be temporarily unavailable.";
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
        if (data.candidates?.[0]?.finishReason === 'SAFETY') {
            const safetyRatings = data.candidates?.[0]?.safetyRatings?.map(r => `${r.category}: ${r.probability}`).join(', ');
            throw new Error(`AI Safety Block: Generation stopped due to safety concerns (${safetyRatings || 'details unavailable'}). Try rephrasing your input.`);
        }
        if (data.candidates?.[0]?.finishReason) {
             throw new Error(`AI Error: Generation finished unexpectedly. Reason: ${data.candidates[0].finishReason}.`);
        }
        throw new Error("AI Error: No content generated by the AI service. Response might be empty.");
    }

    let sanitizedText = generatedText
      .replace(/^[\s]*([\*\-\+]|\d+\.)\s+/gm, '')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/^\s*(#+\s*.*)/gm, '')
      .replace(/^\s*\d+\.\s*\**[A-Za-z\s&/\(\)]+\**[:\s]*/gm, '')
      .replace(/^\s*\**[A-Za-z\s&/\(\)]+\**[:\s]*\n+/gm, (match, offset, string) => {
          const nextChar = string.charAt(offset + match.length);
          if (nextChar === '\n') return '';
          return match;
      })
      .replace(/(?<!\*)\*(?!\*)/g, '')
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    console.log("Sanitized Text (first 100 chars):", sanitizedText.substring(0, 100));
    return sanitizedText;

  } catch (error) {
    console.error("Error calling or processing Gemini API:", error);
    if (error.message.startsWith("AI Config Error") || error.message.startsWith("AI Error") || error.message.startsWith("AI Rate Limit") || error.message.startsWith("AI Safety Block")) {
      throw error;
    }
    throw new Error("An unexpected error occurred during AI generation. Check console/network logs.");
  }
}

// --- Framer Motion Variants ---
const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
    out: { opacity: 0, y: -20, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};
const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};
const itemVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -10, scale: 0.97, transition: { duration: 0.2 } }
};
const buttonVariants = {
    hover: { scale: 1.03, boxShadow: "0px 6px 20px rgba(0, 0, 0, 0.12)", transition: { type: "spring", stiffness: 300, damping: 15 } },
    tap: { scale: 0.97 },
    // Visual style for when button is NOT interactive (but still allows hover)
    disabled: { scale: 1, opacity: 0.5, boxShadow: "none" }, // REMOVED cursor: 'not-allowed'
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 }, // Normal active/ready state
    exit: { opacity: 0, y: -10 }
};
const messageVariants = {
    initial: { opacity: 0, y: -10, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20, delay: 0.1 } },
    exit: { opacity: 0, y: 5, scale: 0.95, transition: { duration: 0.2 } }
};
const pulseVariant = {
    pulse: {
      scale: [1, 1.005, 1], opacity: [0.95, 1, 0.95],
      transition: { duration: 1.8, ease: "easeInOut", repeat: Infinity }
    }
};

// --- React Component (GenerateJD) ---
const GenerateJD = () => {
  // --- State ---
  const [mode, setMode] = useState('ai');
  const [jobTitle, setJobTitle] = useState('');
  const [experience, setExperience] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ text: '', type: 'info', key: Date.now() });
  const [savedFilename, setSavedFilename] = useState(null);

  const dataToSaveRef = useRef();

  // --- Determine Button States ---
  const canSave = jobTitle.trim() !== '' && experience.trim() !== '' && jobDescription.trim() !== '';
  const isSaveButtonActionable = canSave && !isGenerating && !isSaving;
  const isGenerateButtonActionable = jobTitle && experience && !isGenerating && !isSaving;

  // --- Handlers ---
  const handleGenerateWithAI = useCallback(async () => {
    // Check if actionable inside the handler
    if (!isGenerateButtonActionable) {
       if (!jobTitle || !experience) {
         setGenerationError("Please provide both Job Title and Experience level.");
       }
      // If generating/saving, do nothing silently
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setJobDescription('');
    setSaveMessage({ text: '', type: 'info', key: Date.now() });
    setSavedFilename(null);

    try {
      const generatedJD = await callGeminiApi(jobTitle, experience);
      setJobDescription(generatedJD);
    } catch (err) {
      console.error("Generation failed:", err);
      setGenerationError(err.message || "Failed to generate Job Description.");
    } finally {
      setIsGenerating(false);
    }
    // Use the derived state directly in dependencies
  }, [jobTitle, experience, isGenerateButtonActionable]);

  const handleSave = useCallback(async () => {
    // Check if actionable inside the handler
    if (!isSaveButtonActionable) {
        if (!canSave) {
             setSaveMessage({ text: 'Cannot save: Please provide Job Title, Experience, and Description.', type: 'error', key: Date.now() });
        }
        // If generating/saving, do nothing silently
        return;
    }

    setIsSaving(true);
    setSavedFilename(null);
    setSaveMessage({ text: 'Saving...', type: 'info', key: Date.now() });

    const dataToSave = { title: jobTitle.trim(), experience: experience.trim(), description: jobDescription.trim() };
    dataToSaveRef.current = dataToSave;

    try {
      const response = await axios.post(SAVE_JD_URL, dataToSave, { headers: { 'Content-Type': 'application/json' } });
      setSaveMessage({ text: response.data?.message || 'Job Description saved successfully!', type: 'success', key: Date.now() });
      setSavedFilename(response.data?.filename || null);
    } catch (error) {
      console.error("Save JD error:", error);
      let errorMsg = "Failed to save Job Description.";
      if (error.response) { errorMsg = `Save failed: ${error.response.data?.error || `Server error (${error.response.status})`}`; }
      else if (error.request) { errorMsg = `Save failed: Cannot reach server. Is it running?`; }
      else { errorMsg = `Save failed: ${error.message}`; }
      setSaveMessage({ text: errorMsg, type: 'error', key: Date.now() });
      setSavedFilename(null);
      dataToSaveRef.current = dataToSave;
    } finally {
      setIsSaving(false);
    }
    // Use the derived state directly in dependencies
  }, [jobTitle, experience, jobDescription, isSaveButtonActionable, canSave]);

  // --- Effects ---
  useEffect(() => {
    if (generationError && (jobTitle !== dataToSaveRef.current?.title || experience !== dataToSaveRef.current?.experience)) {
        setGenerationError(null);
    }
    if (saveMessage.text && !isSaving) {
        const timeoutId = setTimeout(() => {
             if (jobTitle !== dataToSaveRef.current?.title ||
                 experience !== dataToSaveRef.current?.experience ||
                 jobDescription !== dataToSaveRef.current?.description) {
                 setSaveMessage({ text: '', type: 'info', key: Date.now() });
                 setSavedFilename(null);
             }
        }, 100);
        return () => clearTimeout(timeoutId);
    }
  }, [jobTitle, experience, jobDescription, generationError, isSaving, saveMessage.text]);

  useEffect(() => {
    dataToSaveRef.current = { title: jobTitle, experience: experience, description: jobDescription };
  });


  const getMessageStyle = (type) => {
    switch (type) {
      case 'error': return 'text-red-700 bg-red-100 border-red-400';
      case 'success': return 'text-green-700 bg-green-100 border-green-400';
      default: return 'text-blue-700 bg-blue-100 border-blue-400';
    }
  };

  // --- Render Logic ---
  return (
    <motion.main
      key="generate-jd-page"
      className="min-h-screen bg-gradient-to-br from-sky-100 via-indigo-50 to-purple-100/60 py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="out"
    >
      {/* Background Decorations */}
       <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 opacity-80">
           <div className="absolute -top-80 -right-60 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-blue-200/50 via-sky-200/40 to-cyan-200/30 blur-[100px] opacity-60 animate-pulse-slow" />
           <div className="absolute -bottom-80 -left-60 w-[900px] h-[900px] rounded-full bg-gradient-to-tr from-purple-200/40 via-indigo-200/50 to-blue-200/30 blur-[100px] opacity-50 animate-pulse-slow-delay" />
           <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMDAwMCIgb3BhY2l0eT0iMC4wNSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50"></div>
       </div>
       {/* Tailwind custom animation classes */}
       <style jsx global>{`
        @keyframes pulse-slow { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }
        .animate-pulse-slow { animation: pulse-slow 8s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse-slow-delay { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.05); } }
        .animate-pulse-slow-delay { animation: pulse-slow-delay 9s cubic-bezier(0.4, 0, 0.6, 1) infinite 1s; }
        .animate-gradient {
            background-size: 200% auto;
            animation: gradient-animation 5s linear infinite;
        }
        @keyframes gradient-animation {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
       `}</style>

      <motion.div
        className="max-w-4xl mx-auto relative z-10"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Page Header */}
        <motion.div className="text-center mb-12" variants={itemVariants}>
           <motion.div
            className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-100/70 to-purple-100/70 backdrop-blur-sm text-blue-700 font-medium text-xs px-3 py-1 rounded-full mb-3 border border-blue-200/50 shadow-sm"
            variants={itemVariants}
           >
             <Sparkles className="w-3.5 h-3.5 text-blue-500" />
             Powered By AI
           </motion.div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 mb-4 pb-1 animate-gradient">
            Job Description Studio
          </h1>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Craft compelling job descriptions manually or generate them instantly using our advanced analysis engine.
          </p>
        </motion.div>

        {/* Mode Toggle */}
        <motion.div className="mb-10 flex justify-center" variants={itemVariants}>
           {/* ... (Mode toggle buttons remain the same) ... */}
           <div className="inline-flex rounded-full bg-white/60 backdrop-blur-md p-1 shadow-md border border-gray-200/70">
            {['ai', 'manual'].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setGenerationError(null);
                  setSaveMessage({ text: '', type: 'info', key: Date.now() });
                  setSavedFilename(null);
                }}
                className={`relative px-5 py-2 sm:px-7 rounded-full text-sm font-semibold transition-colors duration-300 ease-out flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${mode === m ? 'text-white' : 'text-gray-600 hover:text-gray-900'}`}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                {mode === m && (
                  <motion.div
                    layoutId="activeModePillStudioEnhanced"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-lg z-0"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {m === 'ai' ? <Sparkles className="w-4 h-4" /> : <FilePenLine className="w-4 h-4" />}
                  {m === 'ai' ? 'AI Generate' : 'Manual Input'}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Input and Description Area Card */}
        <motion.div
          className="bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-2xl shadow-2xl mb-8 border border-gray-200/50 overflow-hidden"
          variants={itemVariants}
          layout
        >
          {/* Inputs */}
          <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8" layout>
            {/* ... (Input fields remain the same, disabled during generating/saving) ... */}
             <motion.div variants={itemVariants}>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-800 mb-1.5">
                Job Title <span className="text-red-500">*</span>
              </label>
              <motion.input
                type="text" id="jobTitle" value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Senior Frontend Developer"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 transition duration-150 ease-in-out disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 placeholder-gray-400"
                required disabled={isGenerating || isSaving}
                whileFocus={{ borderColor: '#818cf8', boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.3)' }}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <label htmlFor="experience" className="block text-sm font-medium text-gray-800 mb-1.5">
                Experience Level <span className="text-red-500">*</span>
              </label>
              <motion.input
                type="text" id="experience" value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g., 5+ Years, Mid-Level"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 transition duration-150 ease-in-out disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 placeholder-gray-400"
                required disabled={isGenerating || isSaving}
                whileFocus={{ borderColor: '#818cf8', boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.3)' }}
              />
            </motion.div>
          </motion.div>

         {/* AI Generation Section - Updated Button Logic */}
         <AnimatePresence>
            {mode === 'ai' && (
              <motion.div
                key="ai-generate-section"
                className="mb-8 text-center"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto', transition: { delay: 0.1, duration: 0.4 } }}
                exit={{ opacity: 0, height: 0, transition: { duration: 0.3 } }}
                layout
              >
                <motion.button
                  onClick={handleGenerateWithAI}
                  // REMOVED disabled attribute
                  className={`
                    px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl
                    transition-all duration-300 ease-in-out flex items-center justify-center gap-2 mx-auto transform focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 min-w-[200px] h-[52px]
                    ${!isGenerateButtonActionable ? 'opacity-50' : ''}
                    cursor-pointer /* Explicitly set pointer cursor */
                  `}
                  variants={buttonVariants}
                  initial="initial"
                  // Animate controls the framer-motion visual state (opacity/scale)
                  animate={!isGenerateButtonActionable ? 'disabled' : 'animate'}
                  exit="exit"
                  // Apply hover animation ONLY if actionable
                  whileHover={isGenerateButtonActionable ? 'hover' : ''}
                  // Apply tap animation ONLY if actionable
                  whileTap={isGenerateButtonActionable ? 'tap' : ''}
                  aria-disabled={!isGenerateButtonActionable} // For accessibility, indicates non-actionable state
                  title={!jobTitle || !experience ? "Please fill Job Title and Experience Level" : (isGenerating || isSaving) ? "Operation in progress..." : "Generate Job Description with AI"}
                >
                   <AnimatePresence mode="wait">
                    {isGenerating ? (
                      <motion.span key="gen-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2"> <LoaderCircle className="w-5 h-5 animate-spin" /> Generating... </motion.span>
                    ) : (
                      <motion.span key="gen-ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2"> <Sparkles className="w-5 h-5" /> Generate with AI </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
                {/* Generation Error Message */}
                <AnimatePresence>
                  {generationError && (
                     <motion.div
                      key="gen-error-msg"
                      className="mt-5 text-sm text-red-700 flex items-center justify-center gap-2 bg-red-100/80 px-4 py-2.5 rounded-lg border border-red-300 max-w-md mx-auto shadow-sm"
                      variants={messageVariants} initial="initial" animate="animate" exit="exit"
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span className="text-left">{generationError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>


          {/* Job Description Textarea */}
          <motion.div layout variants={itemVariants}>
             {/* ... (Textarea remains the same, readOnly during generating/saving) ... */}
              <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-800 mb-2  justify-between items-center">
              <span>Job Description <span className="text-red-500">*</span></span>
              <AnimatePresence mode="wait">
                 {mode === 'manual' && <motion.span key="manual-hint" {...messageVariants} className="text-xs text-gray-500 font-normal italic"> (Enter or paste here)</motion.span>}
                 {mode === 'ai' && !isGenerating && jobDescription && <motion.span key="ai-edit-hint" {...messageVariants} className="text-xs text-green-600 font-normal italic"> (AI Generated - Edit below)</motion.span>}
                 {mode === 'ai' && isGenerating && <motion.span key="ai-wait-hint" {...messageVariants} className="text-xs text-blue-600 font-normal italic"> (Waiting for AI generation...)</motion.span>}
                 {mode === 'ai' && !isGenerating && !jobDescription && !generationError && <motion.span key="ai-ready-hint" {...messageVariants} className="text-xs text-gray-500 font-normal italic"> (Click 'Generate with AI' above)</motion.span>}
               </AnimatePresence>
            </label>
            <motion.textarea
              id="jobDescription"
              rows={18}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder={ mode === 'ai' ? (isGenerating ? 'AI is crafting the description...' : 'Generated description will appear here. You can then edit it.') : 'Paste or write the full job description here...' }
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 resize-y transition-colors duration-200 placeholder-gray-400/90 text-sm leading-relaxed ${isSaving ? 'bg-gray-100 opacity-70' : 'bg-white'} ${isGenerating && mode === 'ai' ? 'opacity-70' : ''} read-only:cursor-not-allowed`} // Added read-only cursor style
              readOnly={isSaving || (isGenerating && mode === 'ai')}
              required
              animate={isGenerating && mode === 'ai' ? 'pulse' : {}}
              variants={pulseVariant}
              style={{ backgroundColor: isGenerating && mode === 'ai' ? 'rgba(238, 242, 255, 0.6)' : '' }}
              layout
            />
          </motion.div>
        </motion.div> {/* End Input Card */}

        {/* Action Buttons Area - Centered Save Button */}
        <motion.div className="mt-8" variants={itemVariants}>
           {/* Save Message Area */}
           <div className="min-h-[60px] flex justify-center items-center mb-4">
              {/* ... (Save message display remains the same) ... */}
               <AnimatePresence>
               {saveMessage.text && (
                 <motion.div
                   key={saveMessage.key}
                   className={`text-sm p-3 border-l-4 rounded-md shadow-md inline-flex items-center gap-2.5 ${getMessageStyle(saveMessage.type)} max-w-lg bg-opacity-90 backdrop-blur-sm`}
                   variants={messageVariants} initial="initial" animate="animate" exit="exit"
                 >
                   {saveMessage.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
                   {saveMessage.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                   {saveMessage.type === 'info' && saveMessage.text === 'Saving...' && <LoaderCircle className="w-5 h-5 flex-shrink-0 animate-spin" />}
                   {saveMessage.type === 'info' && saveMessage.text !== 'Saving...' && <Info className="w-5 h-5 flex-shrink-0" />}
                   <span className="flex-grow text-left">{saveMessage.text}</span>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>

          {/* Centered Save Button Container */}
          <motion.div
            className="flex justify-center items-center"
            variants={itemVariants}
            layout
          >
            {/* Save Button - Updated Logic */}
            <motion.button
              onClick={handleSave}
              // REMOVED disabled attribute
              className={`
                px-10 py-3.5 rounded-full font-semibold text-white
                bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 /* Green/Teal Theme */
                shadow-lg hover:shadow-xl focus:outline-none
                focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500 focus-visible:ring-offset-white/80
                transition-all duration-300 ease-in-out
                flex items-center justify-center gap-2 transform
                min-w-[180px] h-[52px]
                ${!isSaveButtonActionable ? 'opacity-50' : ''} /* Apply opacity manually */
                cursor-pointer /* Explicitly set pointer cursor */
              `}
              variants={buttonVariants}
              initial="initial"
              // Animate controls the framer-motion visual state (opacity/scale)
              animate={!isSaveButtonActionable ? 'disabled' : 'animate'}
              exit="exit"
              // Apply hover/tap effects ONLY if actionable
              whileHover={isSaveButtonActionable ? 'hover' : ''}
              whileTap={isSaveButtonActionable ? 'tap' : ''}
              aria-disabled={!isSaveButtonActionable} // For accessibility
              title={!canSave ? "Fill required fields and description to enable save" : (isGenerating || isSaving) ? "Operation in progress..." : "Save Job Description"}
            >
               <AnimatePresence mode="wait">
                    {isSaving ? (
                      <motion.span key="save-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2"> <LoaderCircle className="w-5 h-5 animate-spin" /> Saving... </motion.span>
                    ) : (
                      <motion.span key="save-ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2"> <Save className="w-5 h-5" /> Save JD </motion.span>
                    )}
                </AnimatePresence>
            </motion.button>
          </motion.div>

           {/* Helper text */}
           <div className="min-h-[24px] mt-5 text-center">
              {/* ... (Helper text display remains the same) ... */}
              <AnimatePresence>
                 {canSave && !isSaving && !saveMessage.text && (
                      <motion.p key="save-ready-hint" {...messageVariants} className="text-xs text-gray-600 italic"> Ready to save the job description. </motion.p>
                  )}
                 {saveMessage.type === 'error' && saveMessage.text.includes('Cannot save:') && (
                      <motion.p key="fill-hint-error" {...messageVariants} className="text-xs text-red-600 mt-1"> Please fill all required fields (*) above. </motion.p>
                  )}
                 {!canSave && !isGenerating && !isSaving && !saveMessage.text && (
                   <motion.p key="save-hint-inactive" {...messageVariants} className="text-xs text-gray-500"> Fill required fields (*) and description to Save. </motion.p>
                 )}
               </AnimatePresence>
           </div>
        </motion.div> {/* End Action Buttons Area */}

      </motion.div> {/* End Stagger Container */}
    </motion.main>
  );
};

export default GenerateJD;