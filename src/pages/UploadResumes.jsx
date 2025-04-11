import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
// Keep useNavigate if you intend to navigate somewhere after successful save, otherwise remove it.
import { useNavigate } from 'react-router-dom';
import {
    UploadCloud, FileText, X, LoaderCircle, AlertTriangle, CheckCircle, Info, Paperclip, Save // Use Save icon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Constants ---
const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];
const ACCEPT_MIME_TYPES = "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const UPLOAD_URL = `${API_BASE_URL}/resumes/upload`;
// const NEXT_STEP_ROUTE = '/job-creation'; // Define if you want to navigate after save

// --- Utility Function ---
function formatBytes(bytes, decimals = 1) {
    if (!+bytes || bytes < 0) return '0 Bytes';
    const k = 1024; const dm = decimals < 0 ? 0 : decimals; const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k)); const sizeIndex = Math.min(i, sizes.length - 1);
    return `${parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(dm))} ${sizes[sizeIndex]}`;
}

// --- Framer Motion Variants (Refined Easing) ---
const pageVariants = { initial: { opacity: 0, scale: 0.98, y: 20 }, animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }, exit: { opacity: 0, scale: 0.98, y: -10, transition: { duration: 0.4, ease: "easeIn" } } };
const containerVariants = { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.08 } }, }; // Added staggerChildren
const itemVariants = { hidden: { opacity: 0, y: 20, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }, };
const fileListVariants = { hidden: { opacity: 0, height: 0 }, visible: { opacity: 1, height: 'auto', transition: { when: "beforeChildren", staggerChildren: 0.06, duration: 0.3 } }, exit: { opacity: 0, height: 0, transition: { duration: 0.25 } } };
const fileItemVariants = { hidden: { opacity: 0, x: -25, scale: 0.9 }, visible: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 150, damping: 20 } }, exit: { opacity: 0, x: 30, scale: 0.9, transition: { duration: 0.2 } } };
const messageVariants = { hidden: { opacity: 0, y: -15, scale: 0.9 }, visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 250, damping: 25, delay: 0.05 } }, exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } } };
const buttonVariants = {
    hover: { scale: 1.05, boxShadow: "0px 10px 30px rgba(59, 130, 246, 0.25)", transition: { type: "spring", stiffness: 300, damping: 15 } },
    tap: { scale: 0.95, boxShadow: "0px 5px 15px rgba(59, 130, 246, 0.2)", transition: { type: "spring", stiffness: 400, damping: 20 } },
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 150, damping: 20, delay: 0.1 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.15 } }
};
const iconPulse = { scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7], transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" } };

// --- Main Component (Enhanced) ---
const UploadResumes = () => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: 'info', key: Date.now() });
    const [uploadSuccessful, setUploadSuccessful] = useState(false);

    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // --- Callbacks (mostly unchanged logic) ---
    const isValidExtension = useCallback((filename) => {
        if (!filename) return false;
        return ALLOWED_EXTENSIONS.some(ext => filename.toLowerCase().endsWith(ext));
    }, []);

    const handleFiles = useCallback((incomingFiles) => {
        setMessage({ text: '', type: 'info', key: Date.now() });
        setUploadSuccessful(false);
        const currentFilenames = new Set(selectedFiles.map(f => `${f.name}-${f.lastModified}`));
        const newFiles = Array.from(incomingFiles);
        const filesToAdd = [];
        let invalidTypeFound = false;

        newFiles.forEach(file => {
            const fileId = `${file.name}-${file.lastModified}`;
            if (!currentFilenames.has(fileId)) {
                if (isValidExtension(file.name)) {
                    filesToAdd.push(file);
                    currentFilenames.add(fileId);
                } else {
                    invalidTypeFound = true;
                    console.warn(`Invalid file type skipped: ${file.name}`);
                }
            } else {
                console.log(`Duplicate file skipped: ${file.name}`);
            }
        });

        if (filesToAdd.length > 0) {
             setSelectedFiles(prev => [...prev, ...filesToAdd]);
             setMessage({ text: `Added ${filesToAdd.length} file(s). ${invalidTypeFound ? 'Invalid types ignored.' : 'Ready to save.'}`, type: invalidTypeFound ? 'warning' : 'info', key: Date.now() });
        } else if (invalidTypeFound) {
             setMessage({ text: 'Invalid file type(s). Please use PDF or DOCX.', type: 'error', key: Date.now() });
        } else if (newFiles.length > 0) {
             setMessage({ text: 'Selected file(s) already listed.', type: 'info', key: Date.now() });
        }
    }, [selectedFiles, isValidExtension]);

    const handleFileChange = useCallback((e) => {
        if (e.target.files) {
            handleFiles(e.target.files);
            if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
        }
    }, [handleFiles]);

    const handleDragEvents = useCallback((e, draggingState) => {
        e.preventDefault(); e.stopPropagation();
        if (!isLoading && isDragging !== draggingState) {
            setIsDragging(draggingState);
        }
    }, [isLoading, isDragging]);

    const handleDrop = useCallback((e) => {
        e.preventDefault(); e.stopPropagation();
        if (isLoading) return;
        setIsDragging(false);
        if (e.dataTransfer.files?.length) {
            handleFiles(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    }, [isLoading, handleFiles]);

    const handleRemoveFile = useCallback((fileToRemove) => {
        if (isLoading) return;
        setSelectedFiles(p => p.filter(f => !(f.name === fileToRemove.name && f.lastModified === fileToRemove.lastModified)));
        setUploadSuccessful(false);
        setMessage({ text: '', type: 'info', key: Date.now() });
    }, [isLoading]);

    const handleSaveResumes = useCallback(async () => {
        if (selectedFiles.length === 0) {
            setMessage({ text: 'Please select files to save.', type: 'error', key: Date.now() });
            return;
        }

        setMessage({ text: 'Saving resumes...', type: 'info', key: Date.now() });
        setIsLoading(true);
        setUploadSuccessful(false);

        const formData = new FormData();
        selectedFiles.forEach(file => formData.append('files', file));

        try {
            const response = await axios.post(UPLOAD_URL, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            const responseData = response.data || {};
            const successInfo = responseData.success;
            const errorsInfo = responseData.errors;

            if (response.status === 200 || response.status === 201) {
                setMessage({ text: successInfo?.message || 'Resumes saved successfully!', type: 'success', key: Date.now() });
                setUploadSuccessful(true);
                setSelectedFiles([]); // Clear list on full success
                // Optionally navigate
                // setTimeout(() => navigate(NEXT_STEP_ROUTE), 1500);
            } else if (response.status === 207) { // Partial success
                const failedFiles = errorsInfo?.map(e => e.filename || 'Unknown file').join(', ') || 'some files';
                setMessage({ text: `Partial success. Errors occurred with: ${failedFiles}.`, type: 'warning', key: Date.now() });
                setUploadSuccessful(false); // Not fully successful
                const failedFileNames = new Set(errorsInfo?.map(e => e.filename));
                setSelectedFiles(current => current.filter(f => failedFileNames.has(f.name))); // Keep only failed files
            } else {
                 setMessage({ text: `Save finished with status ${response.status}. ${responseData.message || 'Unexpected response.'}`, type: 'warning', key: Date.now() });
                 setUploadSuccessful(false);
            }
        } catch (error) {
            console.error("Save/Upload Axios Error:", error);
            let errorMsg = 'An unexpected error occurred.';
            if (error.response) {
                const backendError = error.response.data?.error || error.response.data?.message || (Array.isArray(error.response.data?.errors) ? error.response.data.errors[0]?.error : null) || `Status ${error.response.status}`;
                errorMsg = `Server Error: ${backendError}`;
            } else if (error.request) {
                errorMsg = 'No response from server. Check connection or CORS settings.';
            } else {
                errorMsg = error.message;
            }
            setMessage({ text: `Failed to save resumes: ${errorMsg}`, type: 'error', key: Date.now() });
            setUploadSuccessful(false);
        } finally {
            setIsLoading(false);
        }
    }, [selectedFiles, navigate]); // Added navigate

    const getMessageStyle = useCallback((type) => {
        switch (type) {
            case 'error': return 'bg-red-100/80 border-red-400/80 text-red-800';
            case 'warning': return 'bg-yellow-100/80 border-yellow-400/80 text-yellow-900';
            case 'success': return 'bg-green-100/80 border-green-400/80 text-green-800';
            default: return 'bg-blue-100/80 border-blue-400/80 text-blue-800';
        }
    }, []);

    // --- JSX Structure (Enhanced) ---
    return (
        <motion.div
            className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-100 to-indigo-100/70 py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center overflow-hidden relative font-sans"
            variants={pageVariants} initial="initial" animate="animate" exit="exit"
        >
            {/* Enhanced Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute -top-80 -right-60 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-blue-200/50 via-indigo-200/40 to-sky-200/30 blur-[150px] opacity-60 animate-pulse-slow" />
                <div className="absolute -bottom-80 -left-60 w-[900px] h-[900px] rounded-full bg-gradient-to-tr from-indigo-200/40 via-sky-200/50 to-blue-200/30 blur-[150px] opacity-50 animate-pulse-slow-delay" />
                {/* Subtle Grid Pattern */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDY0IEwgNjQgNjQgNjQgMCBNIDMyIDAgTCAzMiA2NCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzE4MkU4IiBvcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-70"></div>
            </div>
            <style>{`
                @keyframes pulse-slow { 0%, 100% { opacity: .6; transform: scale(1) rotate(0deg); } 50% { opacity: .8; transform: scale(1.05) rotate(5deg); } }
                .animate-pulse-slow { animation: pulse-slow 10s cubic-bezier(.4,0,.6,1) infinite; }
                @keyframes pulse-slow-delay { 0%, 100% { opacity: .5; transform: scale(1) rotate(0deg); } 50% { opacity: .7; transform: scale(1.05) rotate(-5deg); } }
                .animate-pulse-slow-delay { animation: pulse-slow-delay 12s cubic-bezier(.4,0,.6,1) infinite .5s; }
                @keyframes gradient-animation-blue { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
                .animate-gradient-blue { background-size: 200% 200%; animation: gradient-animation-blue 5s ease infinite; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #a5b4fc; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #818cf8; }
                /* Pattern for Dropzone Hover/Drag */
                .pattern-dots-blue {
                    background-image: radial-gradient(circle, rgba(96, 165, 250, 0.2) 1px, transparent 1px);
                    background-size: 10px 10px;
                    transition: background-color 0.3s ease-in-out;
                }
                .pattern-dots-blue-active {
                     background-image: radial-gradient(circle, rgba(59, 130, 246, 0.4) 1px, transparent 1px);
                     background-size: 10px 10px;
                }
            `}</style>

            {/* Main Card with Glassmorphism */}
            <motion.div
                className="relative max-w-3xl w-full bg-white/80 backdrop-blur-lg p-8 sm:p-12 rounded-2xl shadow-xl border border-gray-200/50 z-10 overflow-hidden" // Increased blur, padding, shadow
                variants={containerVariants} initial="hidden" animate="visible"
            >
                {/* Inner content wrapper for stagger animation */}
                <motion.div variants={{ visible: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="visible">

                    {/* Header - More prominent */}
                    <motion.div className="text-center mb-10 relative" variants={itemVariants}>
                         <motion.div className="absolute top-[-20px] left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-full opacity-20 blur-xl" animate={{ scale: [1, 1.1, 1], rotate: [0, 8, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.3 }} />
                         <Paperclip className="w-10 h-10 text-indigo-500 mb-4 mx-auto relative z-10" /> {/* Changed color */}
                        <motion.h1
                            className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-600 mb-3 pb-1 animate-gradient-blue"
                            style={{ backgroundSize: '200% auto' }} // Inline style for animation
                        >
                            Upload Resumes
                        </motion.h1>
                        <motion.p className="text-lg text-slate-600 max-w-md mx-auto leading-relaxed">
                            Select or drop candidate resumes below. Accepts <span className="font-semibold text-indigo-600">PDF</span> and <span className="font-semibold text-indigo-600">DOCX</span> formats.
                        </motion.p>
                    </motion.div>

                    {/* Dropzone - Enhanced Styling */}
                    <motion.div className="mb-8" variants={itemVariants}>
                        <motion.label
                            htmlFor="resume-upload-enhanced"
                            className={`flex flex-col items-center justify-center w-full min-h-[16rem] sm:min-h-[18rem] border-3 border-dashed rounded-xl transition-all duration-300 ease-in-out relative overflow-hidden group ${isLoading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'} ${isDragging && !isLoading ? 'pattern-dots-blue-active' : 'pattern-dots-blue'}`} // Added pattern classes
                            onDragOver={(e) => !isLoading && handleDragEvents(e, true)}
                            onDragEnter={(e) => !isLoading && handleDragEvents(e, true)}
                            onDragLeave={(e) => !isLoading && handleDragEvents(e, false)}
                            onDrop={(e) => !isLoading && handleDrop(e)}
                            animate={{
                                borderColor: isDragging && !isLoading ? 'rgba(96, 165, 250, 1)' : (isLoading ? 'rgba(203, 213, 225, 0.7)' : 'rgba(191, 219, 254, 0.8)'),
                                backgroundColor: isDragging && !isLoading ? 'rgba(219, 234, 254, 0.7)' : (isLoading ? 'rgba(241, 245, 249, 0.6)' : 'rgba(239, 246, 255, 0.4)'),
                                scale: isDragging && !isLoading ? 1.02 : 1, // Subtle scale on drag
                            }}
                            whileHover={!isLoading && !isDragging ? { scale: 1.01, borderColor: 'rgba(147, 197, 253, 1)', backgroundColor: 'rgba(219, 234, 254, 0.5)' } : {}}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        >
                            <div className="text-center p-6 z-10 flex flex-col items-center transition-transform duration-300 group-hover:scale-105">
                                <motion.div animate={isDragging && !isLoading ? iconPulse : { scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
                                    <UploadCloud className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-5 transition-colors duration-300 ${isDragging && !isLoading ? 'text-blue-500' : 'text-slate-400 group-hover:text-blue-500'}`} />
                                </motion.div>
                                <p className="text-lg font-medium text-slate-700 group-hover:text-blue-700 transition-colors">
                                    <span className="font-semibold text-indigo-600">Click to select files</span>
                                    <span className="text-slate-500"> or drop them here</span>
                                </p>
                                <p className="text-sm text-slate-500 mt-2 uppercase tracking-wider">PDF & DOCX only</p>
                            </div>
                            {/* Hidden Input */}
                            <input id="resume-upload-enhanced" ref={fileInputRef} type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" multiple accept={ACCEPT_MIME_TYPES} onChange={handleFileChange} disabled={isLoading} />

                            {/* Loading Overlay - Improved Style */}
                            <AnimatePresence>
                                {isLoading && (
                                    <motion.div
                                        key="loading-overlay"
                                        className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl z-30"
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                                    >
                                        <LoaderCircle className="w-12 h-12 text-indigo-600 animate-spin" />
                                        <p className="text-lg text-indigo-700 mt-4 font-semibold tracking-wide">Saving Resumes...</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.label>
                    </motion.div>

                    {/* Message Area - Enhanced Styling */}
                    <motion.div className="min-h-[55px] mb-8" variants={itemVariants}> {/* Increased min-height slightly */}
                         <AnimatePresence>
                            {message.text && (
                                <motion.div
                                    key={message.key}
                                    className={`text-sm p-4 border-l-4 rounded-lg shadow-md ${getMessageStyle(message.type)} flex items-start gap-3 backdrop-blur-sm bg-opacity-80`} // Adjusted padding, added bg-opacity
                                    variants={messageVariants} initial="hidden" animate="visible" exit="exit"
                                >
                                    {message.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5"/>}
                                    {message.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-700 shrink-0 mt-0.5"/>}
                                    {message.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5"/>}
                                    {message.type === 'info' && <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5"/>}
                                    <span className="flex-grow font-medium leading-snug">{message.text}</span> {/* Improved line height */}
                                </motion.div>
                             )}
                         </AnimatePresence>
                    </motion.div>

                    {/* File List - Polished Appearance */}
                    <AnimatePresence>
                        {selectedFiles.length > 0 && (
                            <motion.div
                                key="file-list-container"
                                className="mb-8"
                                variants={fileListVariants} initial="hidden" animate="visible" exit="exit"
                                layout // Animate size changes
                            >
                                <motion.h3 className="text-lg font-semibold text-slate-800 mb-4" layout="position">
                                    Files to Save ({selectedFiles.length}):
                                </motion.h3>
                                <motion.ul
                                    layout // Animate list item positions
                                    className="space-y-3 max-h-64 overflow-y-auto border border-blue-100/80 p-4 rounded-lg bg-white/70 shadow-inner custom-scrollbar backdrop-blur-sm" // Added backdrop-blur, bg-opacity
                                >
                                    <AnimatePresence>
                                        {selectedFiles.map((file) => (
                                            <motion.li
                                                key={`${file.name}-${file.lastModified}`} // Unique key
                                                variants={fileItemVariants} initial="hidden" animate="visible" exit="exit"
                                                layout="position" // Animate position changes smoothly
                                                className="flex items-center justify-between text-sm p-3.5 bg-white/90 rounded-lg shadow-sm border border-slate-200/70 hover:border-blue-300/80 transition-all duration-200 group relative" // Increased padding, better border/hover
                                                whileHover={!isLoading ? { scale: 1.015, zIndex: 1, boxShadow: "0 3px 10px rgba(0,0,0,0.05)" } : {}}
                                                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                                            >
                                                <div className="flex items-center gap-3.5 overflow-hidden flex-grow mr-3"> {/* Increased gap */}
                                                    <FileText className="w-6 h-6 text-indigo-500 flex-shrink-0" /> {/* Slightly larger icon, changed color */}
                                                    <span className="text-slate-800 truncate font-medium" title={file.name}>{file.name}</span>
                                                    <span className="text-slate-500 text-xs flex-shrink-0 ml-auto pl-2 whitespace-nowrap">({formatBytes(file.size)})</span> {/* Added whitespace-nowrap */}
                                                </div>
                                                <motion.button
                                                    onClick={() => handleRemoveFile(file)}
                                                    disabled={isLoading}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-full focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 transition-colors"
                                                    aria-label={`Remove ${file.name}`}
                                                    whileHover={!isLoading ? { scale: 1.2, rotate: 90, backgroundColor: 'rgba(254, 226, 226, 0.8)' } : {}} // Enhanced hover
                                                    whileTap={!isLoading ? { scale: 0.9, rotate: 45 } : {}}
                                                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                                >
                                                    <X className="w-4 h-4" />
                                                </motion.button>
                                            </motion.li>
                                        ))}
                                    </AnimatePresence>
                                </motion.ul>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Action Button - Centered & Prominent */}
                    <motion.div
                        className="text-center mt-10" // Increased top margin
                        variants={itemVariants}
                    >
                        <AnimatePresence mode="wait">
                            {selectedFiles.length > 0 && (
                                <motion.button
                                    key="save-button"
                                    onClick={handleSaveResumes}
                                    disabled={isLoading || selectedFiles.length === 0}
                                    className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-3.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-600 text-white font-semibold text-base rounded-lg shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 gap-2.5 h-[52px] transform focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-white/80" // Added focus styles
                                    variants={buttonVariants} initial="hidden" animate="visible" exit="exit"
                                    whileHover={!isLoading ? "hover" : ""}
                                    whileTap={!isLoading ? "tap" : ""}
                                >
                                    {isLoading ? (
                                        <LoaderCircle className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Save className="w-5 h-5" />
                                    )}
                                    <span>
                                        {isLoading ? "Saving..." : `Save ${selectedFiles.length} Resume(s)`}
                                    </span>
                                </motion.button>
                            )}
                        </AnimatePresence>
                         {/* Optional: Success Confirmation (could be integrated into the main message) */}
                         {/* {uploadSuccessful && !isLoading && selectedFiles.length === 0 && (
                             <motion.p
                                 key="save-success-msg-final"
                                 className="mt-5 text-green-700 font-medium"
                                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                             >
                                 <CheckCircle className="inline w-5 h-5 mr-1.5 mb-0.5"/> All resumes saved successfully!
                             </motion.p>
                         )} */}
                    </motion.div>

                </motion.div> {/* End inner content wrapper */}
            </motion.div> {/* End Main Card */}
        </motion.div> // End Main container
    );
};

export default UploadResumes;