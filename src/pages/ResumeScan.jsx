import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
    UploadCloud, FileText, Zap, AlertCircle, CheckCircle, Loader2, X, FileSearch,
    FileWarning, ListOrdered, ChevronDown, Mail, Phone, User, Download, Info, Target, ArrowRight, Star,
    Search,
    ArrowUpRight,
    TrendingUp, // Icon for High Score (Excellent)
    Check,      // Icon for Medium Score (Good)
    MinusCircle // Icon for Low Score
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';

// --- Environment Variable ---
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// --- Animation Variants (Refined for consistency) ---
const pageTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};
const staggerContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } } // Slightly adjusted stagger
};
const fadeInUp = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};
const itemVariants = { // Keep simpler for list items
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
};
const messageVariants = {
    initial: { opacity: 0, y: -10, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20, delay: 0.05 } },
    exit: { opacity: 0, y: 5, scale: 0.95, transition: { duration: 0.2 } }
};
const buttonHoverTap = {
    hover: { scale: 1.03, transition: { type: "spring", stiffness: 400, damping: 15 } },
    tap: { scale: 0.97 }
};
const modalOverlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, transition: { duration: 0.25, ease: "easeIn" } }
};
const modalContentVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 25 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1], delay: 0.05 } }, // Smoother ease
    exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.25, ease: "easeIn" } }
};
const collapseVariants = {
    open: { opacity: 1, height: 'auto', marginTop: '6px', transition: { duration: 0.3, ease: "easeOut" } },
    closed: { opacity: 0, height: 0, marginTop: '0px', transition: { duration: 0.25, ease: "easeIn" } }
};
const floatingAnimation = { // Subtle pulse for loading
    animate: { scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8], transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } }
};


// --- Utility Function for Score Tier (Blue/Sky/Gray Theme) ---
const getScoreTierConfig = (score) => {
    const numericScore = score ?? 0;
    if (numericScore >= 80) return { name: 'high', color: 'blue', label: 'Excellent Match', icon: TrendingUp, textClass: 'text-blue-600', borderClass: 'border-blue-500', bgClass: 'bg-blue-50/70' };
    if (numericScore >= 55) return { name: 'medium', color: 'sky', label: 'Good Match', icon: Check, textClass: 'text-sky-600', borderClass: 'border-sky-400', bgClass: 'bg-sky-50/70' };
    return { name: 'low', color: 'gray', label: 'Low Match', icon: MinusCircle, textClass: 'text-gray-500', borderClass: 'border-gray-300', bgClass: 'bg-gray-50/70' };
};

// --- KeywordList Component (Refined Styling) ---
const KeywordList = React.memo(({ title, keywords, colorScheme = 'gray' }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!keywords || keywords.length === 0) {
        return (
            <div className="px-1.5 py-0.5 "> {/* Added padding */}
                <p className={`text-xs italic text-gray-500`}>
                    {title === 'Matched Keywords' ? 'No matches found.' : (title === 'Missing Keywords' ? 'No missing essentials.' : 'No keywords listed.')}
                </p>
            </div>
        );
    }

    const baseColor = colorScheme === 'blue' ? 'blue' : 'gray';
    const Icon = colorScheme === 'blue' ? CheckCircle : AlertCircle;

    const colorClasses = {
        blue: { bg: 'bg-blue-100', text: 'text-blue-800', hoverBg: 'hover:bg-blue-100/80', border: 'border-blue-200', tagBg: 'bg-blue-100', tagText: 'text-blue-800', tagBorder: 'border-blue-200/70' },
        gray: { bg: 'bg-gray-100', text: 'text-gray-700', hoverBg: 'hover:bg-gray-200/70', border: 'border-gray-200', tagBg: 'bg-gray-100', tagText: 'text-gray-700', tagBorder: 'border-gray-200/70' },
    };
    const currentClasses = colorClasses[baseColor] || colorClasses.gray;

    return (
        <div className="mt-1.5 first:mt-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex justify-between items-center w-full text-left text-xs font-medium ${currentClasses.text} focus:outline-none px-2 py-1.5 rounded ${currentClasses.hoverBg} transition-colors duration-150 group`}
                aria-expanded={isOpen}
                aria-controls={`keyword-content-${title.replace(/\s+/g, '-')}`}
            >
                <span className="flex items-center">
                    <Icon size={13} className={`mr-1.5 opacity-90 ${currentClasses.text}`} />
                    {title} <span className="ml-1.5 text-gray-500 group-hover:text-gray-600 font-normal">({keywords.length})</span>
                </span>
                <ChevronDown size={15} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} text-gray-400 group-hover:text-gray-500`} />
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        id={`keyword-content-${title.replace(/\s+/g, '-')}`}
                        key="keyword-content"
                        variants={collapseVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        className="flex flex-wrap gap-1.5 overflow-hidden px-2 pb-1 pt-1" // Adjusted padding
                        aria-live="polite"
                    >
                        {keywords.map((keyword, index) => (
                            <motion.span
                                key={`${keyword}-${index}`}
                                className={`${currentClasses.tagBg} ${currentClasses.tagText} text-[10px] font-medium px-2 py-0.5 rounded-full border ${currentClasses.tagBorder}`} // Rounded tags
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1, transition: { delay: index * 0.02, duration: 0.15 } }}
                            >
                                {keyword}
                            </motion.span>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});
KeywordList.displayName = 'KeywordList';


// --- JD Selection Modal (Glassmorphism & Blue Accents) ---
const JdSelectionModal = ({
    isOpen, onClose, availableJds, selectedJdFile, onJdSelect,
    onConfirm, jdContent, onShowContent, isJdContentLoading,
    isConfirmLoading, jdContentError, isJdListLoading // <-- Prop accepted here
}) => {

    useEffect(() => {
        const handleKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
        if (isOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleLocalJdSelect = useCallback((jd) => onJdSelect(jd), [onJdSelect]);
    const handleLocalShowContent = useCallback((jd) => onShowContent(jd), [onShowContent]);
    const handleOverlayClick = useCallback(() => onClose(), [onClose]);
    const stopPropagation = useCallback((e) => e.stopPropagation(), []);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="jdModalOverlay"
                    className="fixed inset-0 bg-gradient-to-br from-gray-900/50 via-slate-900/60 to-black/60 backdrop-blur-md flex items-center justify-center z-[100] px-4 py-6" // Increased blur
                    variants={modalOverlayVariants} initial="hidden" animate="visible" exit="exit"
                    onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-labelledby="jd-modal-title"
                >
                    <motion.div
                        key="jdModalContent"
                        className="bg-white/80 backdrop-blur-xl rounded-xl shadow-2x p-6 sm:p-7 w-full max-w-lg max-h-[90vh] flex flex-col relative overflow-hidden border border-gray-200/60" // Glassmorphism
                        variants={modalContentVariants} initial="hidden" animate="visible" exit="exit"
                        onClick={stopPropagation}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-5 border-b border-gray-200/80 pb-3.5">
                            <h2 id="jd-modal-title" className="text-lg font-semibold text-gray-800 flex items-center gap-2.5">
                                <Target size={20} className="text-blue-600" />
                                Select Job Description
                            </h2>
                            <motion.button
                                onClick={onClose} className="text-gray-500 hover:text-red-600 focus:outline-none focus:ring-1 focus:ring-red-300 rounded-full p-1 transition-colors duration-150 hover:bg-red-100/70"
                                aria-label="Close" {...buttonHoverTap} disabled={isConfirmLoading} >
                                <X size={18} />
                            </motion.button>
                        </div>

                        {/* Scrollable Content Area */}
                        <div className="flex-grow overflow-y-auto mb-5 -mr-3 pr-3 custom-scrollbar space-y-4">
                             {/* Correctly use isJdListLoading */}
                             {isJdListLoading ? (
                                 <motion.div variants={itemVariants} className="text-center text-gray-500 my-6 flex flex-col items-center p-5">
                                     <Loader2 size={28} className="text-blue-500 animate-spin mb-3" />
                                     <p className="text-sm">Loading Job Descriptions...</p>
                                 </motion.div>
                             ) : availableJds.length === 0 ? (
                                <motion.div variants={itemVariants} className="text-center text-gray-600 my-6 flex flex-col items-center p-5 bg-gray-100/50 rounded-lg border border-gray-200/80">
                                     <FileWarning size={32} className="text-yellow-500 mb-2.5" />
                                     <p className="font-medium mb-1 text-gray-700">No Job Descriptions Found</p>
                                     <p className="text-sm text-gray-500 mb-3">Please create a job description first.</p>
                                    <Link to="/job-creation" className="text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 group">
                                        Create JD <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                                    </Link>
                                </motion.div>
                            ) : (
                                <>
                                    {/* JD List */}
                                    <motion.div variants={itemVariants} className="max-h-56 overflow-y-auto border border-gray-200/70 rounded-lg p-1.5 space-y-1 bg-gray-100/40 shadow-inner custom-scrollbar">
                                        <fieldset>
                                            <legend className="sr-only">Job Description Selection</legend>
                                            {availableJds.map((jd) => (
                                                <motion.div
                                                    key={jd}
                                                    layout
                                                    className={`flex items-center justify-between p-2.5 rounded-md transition-all duration-150 cursor-pointer mt-1 border ${selectedJdFile === jd ? 'bg-blue-100 border-blue-300 shadow-sm' : 'bg-white/70 border-transparent hover:bg-blue-50 hover:border-blue-200/70'}`}
                                                    onClick={() => handleLocalJdSelect(jd)}
                                                    >
                                                    <label className="flex items-center space-x-2.5 flex-grow text-sm mr-2 group pointer-events-none">
                                                        <input
                                                            type="radio" name="jdSelection" value={jd} checked={selectedJdFile === jd}
                                                            readOnly
                                                            className="form-radio h-4 w-4 text-blue-600 border-gray-400 focus:ring-blue-500 focus:ring-offset-1 shrink-0 transition"
                                                            disabled={isConfirmLoading || isJdContentLoading}
                                                         />
                                                         <span className={`truncate font-medium ${selectedJdFile === jd ? 'text-blue-800' : 'text-gray-800 group-hover:text-gray-900'}`} title={jd}>
                                                             {jd.replace(/^JD_/, '').replace(/_\d{8}_\d{6,}\.txt$/, '') || jd}
                                                         </span>
                                                    </label>
                                                     <motion.button
                                                         onClick={(e) => { e.stopPropagation(); handleLocalShowContent(jd); }}
                                                         disabled={(isJdContentLoading && selectedJdFile === jd) || isConfirmLoading}
                                                         className="ml-2 text-xs text-blue-600 hover:text-blue-800  disabled:opacity-50 disabled:cursor-wait whitespace-nowrap focus:outline-none focus:underline font-medium px-1.5 py-0.5 rounded hover:bg-blue-100/80 transition-colors"
                                                         {...buttonHoverTap}
                                                     >
                                                         <AnimatePresence mode="wait">
                                                             {(isJdContentLoading && selectedJdFile === jd) ? (
                                                                 <motion.span key="loading" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className=" flex items-center justify-center w-[45px]"><Loader2 size={12} className="animate-spin text-blue-500"/></motion.span>
                                                             ) : ( <motion.span key="preview" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="w-[45px] cursor-pointer">Preview</motion.span> )}
                                                         </AnimatePresence>
                                                     </motion.button>
                                                 </motion.div>
                                             ))}
                                        </fieldset>
                                    </motion.div>

                                    {/* JD Content Preview Area */}
                                    <div className="min-h-[120px] relative"> {/* Increased min height */}
                                        <AnimatePresence mode="wait">
                                            {isJdContentLoading && (
                                                <motion.div key="jdLoading" variants={messageVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 flex items-center justify-center text-sm text-gray-500 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200/70">
                                                    <Loader2 size={18} className="animate-spin mr-2 text-blue-500"/> Loading Preview...
                                                </motion.div>
                                            )}
                                            {jdContentError && !isJdContentLoading && (
                                                <motion.div key="jdError" variants={messageVariants} initial="initial" animate="animate" exit="exit" className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2 shadow-sm">
                                                    <AlertCircle size={16} className='shrink-0 mt-0.5'/> <div><span className="font-medium">Error:</span> {jdContentError}</div>
                                                </motion.div>
                                            )}
                                            {jdContent && !jdContentError && !isJdContentLoading && (
                                                <motion.div key="jdContent" variants={messageVariants} initial="initial" animate="animate" exit="exit" className="border border-gray-200/80 rounded-lg p-3.5 bg-white/90 max-h-60 overflow-y-auto shadow-sm custom-scrollbar">
                                                    <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Preview</h4>
                                                    <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words font-sans leading-relaxed">{jdContent}</pre>
                                                </motion.div>
                                            )}
                                            {/* Placeholders with consistent styling */}
                                            {!isJdContentLoading && !jdContentError && !jdContent && selectedJdFile && (
                                                 <motion.div key="jdSelectPreview" variants={messageVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 flex items-center justify-center text-sm text-gray-400 italic bg-gray-100/50 rounded-lg border border-dashed border-gray-300/80">
                                                      Click 'Preview' to load description.
                                                 </motion.div>
                                            )}
                                             {!selectedJdFile && !isJdContentLoading && availableJds.length > 0 && (
                                                <motion.div key="jdInitialPlaceholder" variants={messageVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 flex items-center justify-center text-sm text-gray-400 italic bg-gray-100/50 rounded-lg border border-dashed border-gray-300/80">
                                                     Select a Job Description above.
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="mt-auto pt-5 border-t border-gray-200/80 flex justify-end space-x-3">
                             <motion.button type="button" onClick={onClose} disabled={isConfirmLoading}
                                 className="px-5 py-2 text-sm cursor-pointer font-medium text-gray-700 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-400 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed" // Indigo focus
                                 {...buttonHoverTap} > Cancel
                             </motion.button>
                             <motion.button type="button" onClick={onConfirm}
                                 disabled={!selectedJdFile || availableJds.length === 0 || isConfirmLoading || isJdContentLoading}
                                 className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-full shadow-md text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-w-[150px] h-[40px]" // Gradient button
                                 {...buttonHoverTap}
                             >
                                 <AnimatePresence mode="wait">
                                 {isConfirmLoading ? (
                                     <motion.span key="confirming" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex items-center gap-1.5"> <Loader2 className="animate-spin h-4 w-4"/> Please wait... </motion.span>
                                 ) : (
                                      <motion.span key="confirm" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex items-center gap-1.5 hover:cursor-pointer"> Confirm & Scan <Zap size={14}/> </motion.span>
                                 )}
                                 </AnimatePresence>
                             </motion.button>
                         </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


// --- Batch Analysis Results (Glassmorphism Cards & Blue Theme) ---
const BatchAnalysisResults = ({ resultsData, error, infoMessage }) => {
    if (!resultsData) return null;

    const { jd_used, results = [], scan_errors = [], summary = {} } = resultsData;

    const getDownloadUrl = useCallback((filename) => {
        if (!filename || typeof filename !== 'string') return null;
        try { return `${API_BASE_URL}/resumes/download/${encodeURIComponent(filename)}`; }
        catch (e) { console.error("Error creating download URL:", e); return null; }
    }, []);

    const MemoizedKeywordList = React.memo(KeywordList);
    MemoizedKeywordList.displayName = 'MemoizedKeywordList';

    const hasSuccessfulResults = results.length > 0;
    const hasScanErrors = scan_errors.length > 0;

    return (
        <motion.div
            className="mt-12 space-y-8" // Increased spacing
        >
            {/* Header/Summary Section - Enhanced Style */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50/60 p-6 rounded-xl border border-blue-200/50 shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-1.5">Scan Results</h2>
                        <p className="text-sm text-gray-600">Analyzed against: <span className="font-medium text-indigo-700">{jd_used ? jd_used.replace(/^JD_/, '').replace(/_\d{8}_\d{6,}\.txt$/, '') : 'N/A'}</span></p>
                    </div>
                    {summary && Object.keys(summary).length > 0 && (
                        <div className="text-xs text-indigo-900 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-indigo-200/80 space-y-1 text-right sm:text-left shadow-md shrink-0">
                            <p><strong className="font-semibold">{summary.successfully_scanned ?? '?'}</strong> Scanned / <strong className="font-semibold">{summary.total_resumes_found ?? '?'}</strong> Found</p>
                            <p><strong className="font-semibold">{summary.errors ?? '0'}</strong> Errors | Time: <strong className="font-semibold">{summary.duration_seconds?.toFixed(1) ?? '?'}s</strong></p>
                        </div>
                    )}
                </div>
            </div>

            {/* Scan Errors (If any) */}
            <AnimatePresence>
                {hasScanErrors && (
                    <motion.div
                        key="scanErrors" variants={messageVariants} initial="initial" animate="animate" exit="exit"
                        className="bg-red-50/80 p-4 rounded-lg border border-red-300/80 shadow-md backdrop-blur-sm">
                        <h3 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
                            <FileWarning className="w-4 h-4 shrink-0" /> Issues During Scan ({scan_errors.length})
                        </h3>
                        <ul className="space-y-1.5 text-[11px] text-red-700 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                            {scan_errors.map((err, index) => (
                                <li key={`err-${index}`} className="flex items-start gap-2">
                                    <strong className="font-semibold break-words opacity-95 shrink-0 max-w-[160px] truncate" title={err.filename}>{err.filename || 'Unknown File'}:</strong>
                                    <span className="opacity-85">{err.error || 'Unknown error'}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Successful Results (or empty state) */}
            {hasSuccessfulResults ? (
                <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-5"> {/* Added stagger */}
                     <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2.5 px-1">
                         <ListOrdered className="w-5 h-5 text-indigo-500 shrink-0" /> Ranked Candidate Resumes ({results.length})
                     </h3>
                     {results.map((result, index) => {
                         const score = result.score ?? 0;
                         const tierConfig = getScoreTierConfig(score);
                         const downloadUrl = getDownloadUrl(result.original_filename);
                         const ScoreIcon = tierConfig.icon;

                         return (
                             <motion.div
                                 key={`res-${index}-${result.original_filename || index}`}
                                 variants={fadeInUp} // Use fadeInUp for card entry
                                 layout
                                 className={`bg-white/80 backdrop-blur-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/60 overflow-hidden border-l-4 ${tierConfig.borderClass}`} // Glassmorphism Card
                             >
                                 <div className="p-5 sm:p-6">
                                     {/* Card Header: Name & Score */}
                                     <div className="flex justify-between items-start mb-4 gap-3">
                                         <div className="flex items-center gap-3 flex-1 min-w-0">
                                             <User size={20} className="text-indigo-500 shrink-0 mt-0.5" />
                                             <span className="font-semibold text-gray-900 text-lg sm:text-xl leading-tight truncate" title={result.name || 'N/A'}>
                                                 {result.name || <span className="italic text-gray-500 text-sm">Name Not Found</span>}
                                             </span>
                                         </div>
                                         <div className={`flex items-center gap-1.5 text-sm font-bold ${tierConfig.textClass} shrink-0 px-2.5 py-1 rounded-full ${tierConfig.bgClass} border ${tierConfig.borderClass}`}> {/* Badge-like score */}
                                             <ScoreIcon size={16} />
                                             <span>{score.toFixed(0)}%</span>
                                         </div>
                                     </div>

                                     {/* Contact Info */}
                                     <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-600 mb-4 border-b border-gray-200/70 pb-3.5">
                                         {result.email && result.email !== 'N/A' ? (
                                             <a href={`mailto:${result.email}`} className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors group" title={`Email ${result.name || ''}`}> <Mail size={14} className="opacity-80 group-hover:text-indigo-500"/>{result.email} </a>
                                         ) : ( <span className="flex items-center gap-1.5 text-gray-400 italic"><Mail size={14} className="opacity-70"/>N/A</span> )}
                                         {result.phone && result.phone !== 'N/A' ? (
                                             <a href={`tel:${result.phone}`} className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors group" title={`Call ${result.name || ''}`}> <Phone size={14} className="opacity-80 group-hover:text-indigo-500"/>{result.phone} </a>
                                         ) : ( <span className="flex items-center gap-1.5 text-gray-400 italic"><Phone size={14} className="opacity-70"/>N/A</span> )}
                                     </div>

                                     {/* Keyword Analysis Section */}
                                     <div className={`space-y-1.5 p-3.5 rounded-lg border bg-gray-100/30 border-gray-200/60 `}>
                                         <MemoizedKeywordList title="Matched Keywords" keywords={result.matching_keywords || []} colorScheme="blue" />
                                         <MemoizedKeywordList title="Missing Keywords" keywords={result.missing_keywords || []} colorScheme="gray" />
                                     </div>
                                 </div>

                                 {/* Card Footer: Filename & Download */}
                                 <div className={`bg-gray-100/40 px-5 py-3 border-t border-gray-200/60 flex items-center justify-between text-xs`}>
                                     <span className="text-gray-600 max-w-[200px] sm:max-w-[300px] italic flex items-center gap-1.5" title={result.original_filename}>
                                         <FileText size={14} className="shrink-0 opacity-70"/> {result.original_filename || 'N/A'}
                                     </span>
                                     {downloadUrl ? (
                                         <motion.a href={downloadUrl} download target="_blank" rel="noopener noreferrer"
                                             className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 focus:outline-none focus:ring-1 focus:ring-indigo-300 rounded-full px-3 py-1 transition-colors bg-indigo-100 hover:bg-indigo-200/80 font-medium text-xs" // Indigo download link
                                             title={`Download ${result.original_filename}`} {...buttonHoverTap} >
                                             <Download size={13}/> Download
                                         </motion.a>
                                     ) : ( <span className="flex items-center gap-1 text-gray-400 cursor-not-allowed px-3 py-1 text-xs"><Download size={13}/> Download</span> )}
                                 </div>
                             </motion.div>
                         );
                     })}
                 </motion.div>
             ) : (
                  // Display "No Matching Resumes" only if no errors or info messages are present
                  !hasScanErrors && !error && !infoMessage && (
                      <motion.div key="no-results" variants={fadeInUp} initial="hidden" animate="show" // Use fadeInUp
                          className="text-center text-gray-500 mt-12 py-12 px-6 bg-white/70 backdrop-blur-sm rounded-xl border border-dashed border-gray-300/80 shadow-lg">
                          <FileSearch size={40} className="mx-auto text-gray-400 mb-4"/>
                          <p className="font-semibold text-gray-700 mb-1.5 text-lg">No Matching Resumes Found</p>
                          <p className="text-sm">The scan completed, but no resumes matched the criteria or were processed successfully.</p>
                      </motion.div>
                  )
             )}
        </motion.div>
    );
};


// --- Main ResumeScan Component (Applying New Design) ---
const ResumeScan = () => {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

    const [isLoadingScan, setIsLoadingScan] = useState(false);
    const [error, setError] = useState(null);
    const [infoMessage, setInfoMessage] = useState(null);
    const [analysisResults, setAnalysisResults] = useState(null);
    const navigate = useNavigate();
    const [isJdModalOpen, setIsJdModalOpen] = useState(false);
    const [availableJds, setAvailableJds] = useState([]);
    const [selectedJdFile, setSelectedJdFile] = useState(null);
    const [selectedJdContent, setSelectedJdContent] = useState('');
    const [jdContentError, setJdContentError] = useState(null);
    const [isJdListLoading, setIsJdListLoading] = useState(true);
    const [isJdContentLoading, setIsJdContentLoading] = useState(false);
    const [jdListError, setJdListError] = useState(null);
    const [scanConfirmLoading, setScanConfirmLoading] = useState(false);

    // --- Effects and Handlers (Keep existing logic) ---
    useEffect(() => {
        const fetchJds = async () => {
            setIsJdListLoading(true); setJdListError(null); setAvailableJds([]); setInfoMessage(null); setError(null);
            try {
                const response = await axios.get(`${API_BASE_URL}/jd/list`);
                setAvailableJds(response.data?.jd_files || []);
            } catch (err) {
                console.error("Error fetching JD list:", err);
                setJdListError(err.response?.data?.message || err.message || 'Could not load job descriptions.');
                setInfoMessage(null);
            } finally { setIsJdListLoading(false); }
         };
        fetchJds();
        return () => { setIsLoadingScan(false); setScanConfirmLoading(false); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleShowJdContent = useCallback(async (filename) => {
        if (!filename || isJdContentLoading) return;
        if (filename === selectedJdFile && selectedJdContent && !jdContentError) return; // Avoid reload if already shown
        setIsJdContentLoading(true); setSelectedJdContent(''); setJdContentError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/jd/content/${encodeURIComponent(filename)}`);
            setSelectedJdContent(response.data?.content || 'Content preview is empty or unavailable.');
        } catch (err) {
            console.error("Error fetching JD content:", err);
            setJdContentError(err.response?.data?.description || err.response?.data?.message || err.message || 'Could not load description.'); setSelectedJdContent('');
        } finally { setIsJdContentLoading(false); }
    }, [selectedJdFile, selectedJdContent, jdContentError, isJdContentLoading]);

    const handleJdSelectionChange = useCallback((filename) => {
        setSelectedJdFile(filename);
        setSelectedJdContent(''); setJdContentError(null); // Clear preview on new selection
        // Optional: Auto-show content
        // handleShowJdContent(filename);
    }, [handleShowJdContent]); // Remove handleShowJdContent dependency if not auto-showing

    const handleTriggerBatchScan = useCallback(async () => {
        if (!selectedJdFile || isLoadingScan || scanConfirmLoading) return;
        setScanConfirmLoading(true); setError(null); setInfoMessage(null); setAnalysisResults(null);
        await new Promise(resolve => setTimeout(resolve, 300)); // Smooth transition
        setIsJdModalOpen(false); setIsLoadingScan(true); setScanConfirmLoading(false); // Close modal before showing main loader
        try {
            const response = await axios.post(`${API_BASE_URL}/scan/batch`,
                { jd_filename: selectedJdFile }, { headers: { 'Content-Type': 'application/json' } }
            );
            setAnalysisResults(response.data);
            const resultsExist = response.data?.results?.length > 0;
            const errorsExist = response.data?.scan_errors?.length > 0;
            if (!resultsExist && !errorsExist) { setInfoMessage(response.data.message || "Scan complete. No relevant resumes found or processed."); }
            else if (errorsExist && resultsExist) { setError(`Scan partially completed with ${response.data.scan_errors.length} error(s).`); }
            else if (errorsExist && !resultsExist) { setError(response.data.error || response.data.message || `Scan failed or only produced errors.`); }
            // Success with results needs no extra message
        } catch (err) {
             console.error("Batch Scan Error:", err);
             let errorMsg = 'An unknown error occurred during analysis.';
             if (err.response) {
                 errorMsg = err.response.data?.error || err.response.data?.message || `Server error: ${err.response.status}`;
                 if (err.response.data) setAnalysisResults(err.response.data); // Show partial errors if data available
             } else if (err.request) { errorMsg = 'Network error: Cannot reach the server.'; }
             else { errorMsg = err.message; }
             setError(errorMsg);
             if (!err.response?.data) setAnalysisResults(null); // Clear results if no server response data
        } finally { setIsLoadingScan(false); }
    }, [selectedJdFile, isLoadingScan, scanConfirmLoading]);

    const openJdModal = useCallback(() => {
         setError(null); setInfoMessage(null); setAnalysisResults(null);
         setSelectedJdContent(''); setJdContentError(null);
         // Keep selectedJdFile to avoid re-selection if modal is reopened
         setIsJdModalOpen(true);
    }, []);

    const closeJdModal = useCallback(() => { if (!scanConfirmLoading) setIsJdModalOpen(false); }, [scanConfirmLoading]);
    const goToCreateJD = useCallback(() => navigate('/job-creation'), [navigate]);

    const canStartScan = !isJdListLoading && availableJds.length > 0 && !jdListError;

    return (
        <>
            {/* Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 transform origin-left z-[110]"
                style={{ scaleX }}
            />

            {/* Custom Scrollbar Styles & Global Animations */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #a5b4fc; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #818cf8; }
                .min-w-\\[150px\\] { min-width: 150px; } .h-\\[38px\\] { height: 38px; } .h-\\[40px\\] { height: 40px; } .w-\\[45px\\] { width: 45px; }
                .min-w-\\[200px\\] { min-width: 200px; } .min-w-\\[220px\\] { min-width: 220px; }
                .h-\\[52px\\] { height: 52px; } .h-\\[54px\\] { height: 54px; }
                @keyframes pulse-slow { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.05); } }
                .animate-pulse-slow { animation: pulse-slow 8s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                @keyframes pulse-slow-delay { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }
                .animate-pulse-slow-delay { animation: pulse-slow-delay 9s cubic-bezier(0.4, 0, 0.6, 1) infinite 1s; }
                .animate-gradient { background-size: 200% auto; animation: gradient-animation 4s linear infinite; }
                @keyframes gradient-animation { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
            `}</style>

            <motion.main
                className="min-h-screen bg-gradient-to-br from-sky-100 via-indigo-50 to-purple-100/60 relative overflow-x-hidden"
                initial="initial" animate="animate" exit="exit" variants={pageTransition}
            >
                {/* Enhanced Background Decorations */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 opacity-90">
                    <div className="absolute -top-80 -right-60 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-blue-200/50 via-indigo-200/40 to-purple-200/30 blur-[120px] opacity-60 animate-pulse-slow" />
                    <div className="absolute -bottom-80 -left-60 w-[900px] h-[900px] rounded-full bg-gradient-to-tr from-purple-200/40 via-blue-200/50 to-indigo-200/30 blur-[120px] opacity-50 animate-pulse-slow-delay" />
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMDAwMCIgb3BhY2l0eT0iMC4wNSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>
                </div>

                {/* Hero Section */}
                <div className="relative pt-24 pb-20 sm:pt-28 sm:pb-24 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <motion.div
                            className="text-center"
                            variants={staggerContainer} initial="hidden" animate="show"
                        >
                            <motion.div
                                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-indigo-100 shadow-lg mb-6"
                                variants={fadeInUp}
                            >
                                <Search className="w-4 h-4 text-indigo-600" />
                                <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 text-transparent bg-clip-text">
                                    Analysis Engine
                                </span>
                            </motion.div>
                            <motion.h1
                                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight"
                                variants={fadeInUp}
                            >
                                <span className="inline-block bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 text-transparent bg-clip-text animate-gradient pb-2">
                                    Resume Scan Engine
                                </span>
                            </motion.h1>
                            <motion.p
                                className="mt-6 text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed"
                                variants={fadeInUp}
                            >
                                Seamlessly analyze batches of resumes against your job descriptions. Identify top candidates faster with AI-powered matching and keyword analysis.
                            </motion.p>
                            <motion.div
                                className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-5"
                                variants={fadeInUp}
                            >
                                <motion.button
                                    onClick={openJdModal}
                                    disabled={isLoadingScan || isJdListLoading || !canStartScan}
                                    className="group relative inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl hover:cursor-pointer transition-all duration-300 hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-sky-100/80 disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed min-w-[220px] h-[54px]"
                                    {...buttonHoverTap}
                                >
                                    <AnimatePresence mode="wait">
                                        {isJdListLoading ? (
                                            <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2"> <Loader2 className="w-5 h-5 animate-spin" /> Loading JDs... </motion.span>
                                        ) : isLoadingScan ? (
                                             <motion.span key="scanning-hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2"> <Loader2 className="w-5 h-5 animate-spin" /> Scanning... </motion.span>
                                        ) : (
                                            <motion.span key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2"> <Zap className="w-5 h-5" /> Start Scanning <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /> </motion.span>
                                        )}
                                    </AnimatePresence>
                                </motion.button>
                                <Link
                                    to="/job-creation"
                                    className="inline-flex items-center justify-center px-7 py-3 border border-gray-300/80 text-gray-700 rounded-full font-medium hover:bg-white/80 hover:border-indigo-300/80 hover:text-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md backdrop-blur-sm"
                                >
                                    Create New JD
                                </Link>
                            </motion.div>
                             {!isJdListLoading && !canStartScan && !jdListError && (
                                <motion.p variants={fadeInUp} className="text-sm text-yellow-800 bg-yellow-100/70 px-3 py-1.5 rounded-md border border-yellow-300/70 inline-flex items-center justify-center gap-1.5 mt-6 shadow-sm">
                                   <FileWarning className="inline w-4 h-4"/> No Job Descriptions found. <Link to="/job-creation" className="underline hover:text-yellow-900 font-semibold">Create one?</Link>
                                </motion.p>
                            )}
                        </motion.div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 relative z-[5]">
                    {/* Messages Area */}
                    <div className="mb-8 space-y-4 max-w-4xl mx-auto min-h-[45px]">
                        <AnimatePresence>
                            {error && ( <motion.div key="errorMsg" variants={messageVariants} initial="initial" animate="animate" exit="exit" className="bg-red-100/80 backdrop-blur-sm border-l-4 border-red-500 text-red-900 px-4 py-3 rounded-lg shadow-md flex justify-between items-center" role="alert"> <div className='flex items-center gap-2.5 text-sm font-medium'><AlertCircle className="h-5 w-5 shrink-0 text-red-600"/><span>{error}</span></div> <motion.button onClick={() => setError(null)} className="p-1 rounded-full hover:bg-red-200/80 text-red-700" aria-label="Close error" {...buttonHoverTap}><X className="w-4 h-4"/></motion.button> </motion.div> )}
                            {infoMessage && !error && ( <motion.div key="infoMsg" variants={messageVariants} initial="initial" animate="animate" exit="exit" className="bg-blue-100/80 backdrop-blur-sm border-l-4 border-blue-500 text-blue-900 px-4 py-3 rounded-lg shadow-md flex justify-between items-center" role="status"> <div className='flex items-center gap-2.5 text-sm font-medium'><Info className="h-5 w-5 shrink-0 text-blue-600"/><span>{infoMessage}</span></div> <motion.button onClick={() => setInfoMessage(null)} className="p-1 rounded-full hover:bg-blue-200/80 text-blue-700" aria-label="Dismiss" {...buttonHoverTap}><X className="w-4 h-4"/></motion.button> </motion.div> )}
                            {jdListError && !isJdListLoading && ( <motion.div key="jdListError" variants={messageVariants} initial="initial" animate="animate" exit="exit" className="bg-yellow-100/80 backdrop-blur-sm border-l-4 border-yellow-500 text-yellow-900 px-4 py-3 rounded-lg shadow-md text-sm flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 sm:space-x-4" role="alert"> <div className="flex items-center gap-1.5 font-semibold shrink-0"><FileWarning className="inline w-4 h-4 text-yellow-600"/> JD Loading Error: <span className="font-normal opacity-90 ml-1">{jdListError}</span></div> <button onClick={goToCreateJD} className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full shadow-sm text-yellow-900 bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-yellow-500 transition-colors whitespace-nowrap"> Go to Create JD </button> </motion.div> )}
                        </AnimatePresence>
                    </div>

                    {/* Loading State */}
                    <AnimatePresence>
                        {isLoadingScan && (
                            <motion.div
                                key="mainLoadingIndicator"
                                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                                className="max-w-xl mx-auto mt-16 p-10 rounded-2xl bg-white/70 backdrop-blur-xl border border-indigo-100/80 shadow-2xl"
                            >
                                <motion.div
                                    className="flex flex-col items-center"
                                    variants={floatingAnimation} initial="initial" animate="animate"
                                >
                                    <div className="relative mb-5">
                                         <motion.div
                                            className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-400 blur-xl opacity-70"
                                            animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.8, 0.6] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                        />
                                        <Loader2 className="w-10 h-10 text-indigo-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-spin" />
                                    </div>
                                    <h3 className="mt-6 text-xl font-semibold text-gray-900">Analyzing Resumes...</h3>
                                    <p className="mt-2 text-gray-600 text-center text-sm">Hang tight while we process and match the candidates.</p>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Results Area */}
                    <AnimatePresence>
                        {!isLoadingScan && analysisResults && (
                            <motion.div
                                key="resultsDisplayArea"
                                initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.1 } }} exit={{ opacity: 0 }}
                                className="mt-12"
                            >
                                <BatchAnalysisResults resultsData={analysisResults} error={error} infoMessage={infoMessage} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                 {/* JD Selection Modal */}
                 <JdSelectionModal
                    isOpen={isJdModalOpen} onClose={closeJdModal} availableJds={availableJds}
                    selectedJdFile={selectedJdFile} onJdSelect={handleJdSelectionChange}
                    onConfirm={handleTriggerBatchScan} jdContent={selectedJdContent}
                    onShowContent={handleShowJdContent} isJdContentLoading={isJdContentLoading}
                    isConfirmLoading={scanConfirmLoading} jdContentError={jdContentError}
                    isJdListLoading={isJdListLoading} // <-- Prop passed here
                 />
            </motion.main>
        </>
    );
};

export default ResumeScan;