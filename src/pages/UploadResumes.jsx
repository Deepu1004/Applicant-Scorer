import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    UploadCloud, FileText, X, LoaderCircle, AlertTriangle, CheckCircle, Info, Paperclip, FileType
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Constants --- (Keep as is)
const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];
const ACCEPT_MIME_TYPES = "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_FILE_SIZE_MB = 15;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const UPLOAD_URL = `${API_BASE_URL}/resumes/upload`;
// const NEXT_STEP_ROUTE = '/scan';

// --- Utility Function --- (Keep as is)
function formatBytes(bytes, decimals = 1) {
    if (!+bytes || bytes < 0) return '0 Bytes';
    const k = 1024; const dm = decimals < 0 ? 0 : decimals; const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k)); const sizeIndex = Math.min(i, sizes.length - 1);
    return `${parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(dm))} ${sizes[sizeIndex]}`;
}

// --- File Type Icon Helper --- (Keep as is)
const getFileTypeIcon = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileType size={24} className="text-red-500 flex-shrink-0" />;
    if (ext === 'docx') return <FileType size={24} className="text-blue-500 flex-shrink-0" />;
    return <FileText size={24} className="text-gray-400 flex-shrink-0" />;
};

// --- Framer Motion Variants (Optimized) ---
const pageVariants = {
    initial: { opacity: 0, y: 15 }, // Simpler initial state
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }, // Slightly faster entry
    exit: { opacity: 0, y: -10, transition: { duration: 0.3, ease: "easeIn" } }
};
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5, ease: "easeOut", delayChildren: 0.2, staggerChildren: 0.1 } }, // Increased delayChildren, adjusted stagger
};
const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 }, // Slightly adjusted hidden state
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }, // Smooth easing
};
const fileListVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: 'auto', transition: { when: "beforeChildren", staggerChildren: 0.07, duration: 0.3, ease: "easeOut" } }, // Added easing
    exit: { opacity: 0, height: 0, transition: { duration: 0.25, ease: "easeIn" } } // Added easing
};
const fileItemVariants = {
    hidden: { opacity: 0, x: -20 }, // Slightly less movement
    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 180, damping: 22 } },
    exit: { opacity: 0, x: 10, transition: { duration: 0.15 } } // Simpler exit
};
const messageVariants = {
    hidden: { opacity: 0, y: -15 }, // Adjusted y
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 25, delay: 0.05 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
};
const buttonVariants = {
    hover: { scale: 1.04, y: -1, boxShadow: "0px 10px 30px rgba(59, 130, 246, 0.25)", transition: { type: "spring", stiffness: 350, damping: 15 } }, // Adjusted shadow
    tap: { scale: 0.96, boxShadow: "0px 5px 15px rgba(59, 130, 246, 0.2)", transition: { type: "spring", stiffness: 400, damping: 20 } }, // Adjusted shadow
    hidden: { opacity: 0, y: 10 }, // Adjusted y
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 180, damping: 20, delay: 0.1 } },
    exit: { opacity: 0, y: -5, transition: { duration: 0.15 } } // Adjusted y
};
const iconPulseDrag = { scale: [1, 1.15, 1], opacity: [0.85, 1, 0.85], transition: { duration: 1.0, repeat: Infinity, ease: "easeInOut" } }; // Slightly faster pulse

// --- Main Component ---
const UploadResumes = () => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: 'info', key: Date.now() });
    const [uploadSuccessful, setUploadSuccessful] = useState(false); // Kept for potential future use

    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // --- Callbacks (Largely unchanged logic, ensure efficiency) ---
    const isValidExtension = useCallback((filename) => {
        if (!filename) return false;
        const lowerCaseFilename = filename.toLowerCase();
        return ALLOWED_EXTENSIONS.some(ext => lowerCaseFilename.endsWith(ext));
    }, []); // Empty dependency array is correct here

    const handleFiles = useCallback((incomingFiles) => {
        setMessage({ text: '', type: 'info', key: Date.now() }); // Reset message
        setUploadSuccessful(false); // Reset success state

        // Use a Map for efficient checking of existing files (name + lastModified)
        const currentFileMap = new Map(selectedFiles.map(f => [`${f.name}-${f.lastModified}`, true]));
        const filesToAdd = [];
        const errors = [];

        for (const file of incomingFiles) {
            const fileId = `${file.name}-${file.lastModified}`;

            if (currentFileMap.has(fileId)) {
                errors.push(`${file.name}: Already listed.`);
                continue;
            }
            if (!isValidExtension(file.name)) {
                errors.push(`${file.name}: Invalid type (only ${ALLOWED_EXTENSIONS.join(', ')}).`);
                continue;
            }
             if (file.size > MAX_FILE_SIZE_BYTES) {
                 errors.push(`${file.name}: Too large (max ${MAX_FILE_SIZE_MB}MB).`);
                 continue;
             }
            // If valid and not duplicate, add to list and update map for next iteration
            filesToAdd.push(file);
            currentFileMap.set(fileId, true);
        }

        if (filesToAdd.length > 0) {
             setSelectedFiles(prev => [...prev, ...filesToAdd]); // Functional update is slightly safer
             const successMsg = `Added ${filesToAdd.length} file(s). Ready to upload.`;
             if (errors.length > 0) {
                 // More concise error summary
                 const errorSummary = errors.length > 1 ? `${errors[0]} (+${errors.length-1} more)` : errors[0];
                 setMessage({ text: `${successMsg} | Ignored ${errors.length}: ${errorSummary}`, type: 'warning', key: Date.now() });
             } else {
                  setMessage({ text: successMsg, type: 'info', key: Date.now() });
             }
        } else if (errors.length > 0) {
             // Combine multiple errors if only errors occurred
             setMessage({ text: `Could not add files. Errors: ${errors.join(' ')}`, type: 'error', key: Date.now() });
        }
    }, [selectedFiles, isValidExtension]); // Dependencies are correct

    const handleFileChange = useCallback((e) => {
        if (e.target.files?.length) {
            handleFiles(e.target.files);
        }
        // Reset input value to allow re-selecting the same file(s) after removal or failed upload
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [handleFiles]);

    const handleDragEvents = useCallback((e, draggingState) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isLoading) { // Only update state if not loading
            setIsDragging(draggingState);
        }
    }, [isLoading]); // Dependency is correct

    const handleDrop = useCallback((e) => {
        handleDragEvents(e, false); // Ensure dragging state is set to false
        if (isLoading) return; // Double check loading state

        if (e.dataTransfer.files?.length) {
            handleFiles(e.dataTransfer.files);
            e.dataTransfer.clearData(); // Recommended practice
        }
    }, [isLoading, handleFiles, handleDragEvents]); // Added handleDragEvents

    const handleRemoveFile = useCallback((fileToRemove) => {
        if (isLoading) return;
        const fileIdToRemove = `${fileToRemove.name}-${fileToRemove.lastModified}`;
        setSelectedFiles(prev => prev.filter(f => `${f.name}-${f.lastModified}` !== fileIdToRemove));
        setUploadSuccessful(false);

        // Optionally clear message if it pertains only to this file or general info
        if (message.type === 'info' || (message.text && message.text.includes(fileToRemove.name))) {
             setMessage({ text: '', type: 'info', key: Date.now() });
        }
    }, [isLoading, message.type, message.text]); // Added message dependencies

    const handleUploadResumes = useCallback(async () => {
        if (selectedFiles.length === 0 || isLoading) { // Added isLoading check
            if (!isLoading) setMessage({ text: 'Please select or drop resume files first.', type: 'warning', key: Date.now() });
            return;
        }

        setMessage({ text: 'Uploading and processing resumes...', type: 'info', key: Date.now() });
        setIsLoading(true);
        setUploadSuccessful(false);

        const formData = new FormData();
        selectedFiles.forEach(file => formData.append('files', file));

        try {
            const response = await axios.post(UPLOAD_URL, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const responseData = response.data || {};
            const successInfo = responseData.success;
            const errorsInfo = responseData.errors;
            const numSuccess = successInfo?.files?.length || 0;
            const numErrors = errorsInfo?.length || 0;

            // Handle success/partial success/failure based on status and data
             if (response.status === 200 || response.status === 201 || (response.status === 207 && numSuccess > 0 && numErrors === 0)) { // Treat 207 with only success as full success
                setMessage({ text: successInfo?.message || `${numSuccess} resume(s) uploaded and processed successfully!`, type: 'success', key: Date.now() });
                setUploadSuccessful(true);
                setSelectedFiles([]);
                // Optional navigation:
                // setTimeout(() => navigate(NEXT_STEP_ROUTE), 1500);
             } else if (response.status === 207 && numErrors > 0) { // Explicit partial success with errors
                 const errorSummary = errorsInfo?.slice(0, 2).map(e => `${e.filename}: ${e.error}`).join('; ') || 'some files failed';
                 const moreErrors = errorsInfo.length > 2 ? ` (+${errorsInfo.length - 2} more)` : '';
                setMessage({ text: `Processed ${numSuccess} file(s). Errors on ${numErrors}: ${errorSummary}${moreErrors}. Failed files remain below.`, type: 'warning', key: Date.now() });
                setUploadSuccessful(false);
                const failedFileNames = new Set(errorsInfo?.map(e => e.filename));
                setSelectedFiles(current => current.filter(f => failedFileNames.has(f.name)));
            } else {
                 // Catch-all for other potentially successful but unexpected statuses
                 setMessage({ text: `Upload finished. ${responseData.message || 'Server returned an unexpected status.'}`, type: 'warning', key: Date.now() });
                 setUploadSuccessful(false);
            }

        } catch (error) {
            console.error("Upload Axios Error:", error);
            let errorMsg = 'An unexpected network or server error occurred during upload.';
            let retainFilesOnError = false; // Default to clearing files on error

            if (error.response) {
                const backendErrorData = error.response.data;
                const specificErrorMsg = backendErrorData?.error || backendErrorData?.message || (Array.isArray(backendErrorData?.errors) && backendErrorData.errors.length > 0 ? backendErrorData.errors[0]?.error : `Server responded with status ${error.response.status}`);
                errorMsg = `Upload Failed: ${specificErrorMsg}`;

                // If backend specifies failed files, keep only those and flag to retain
                if (backendErrorData?.errors) {
                    const failedFileNames = new Set(backendErrorData.errors.map(e => e.filename));
                     setSelectedFiles(current => current.filter(f => failedFileNames.has(f.name)));
                     retainFilesOnError = true; // Keep the filtered list
                     errorMsg += ". Failed files remain below."; // Append info
                }
            } else if (error.request) {
                errorMsg = 'Upload Failed: Cannot reach the server. Please check connection.';
            } else {
                errorMsg = `Upload Failed: ${error.message}`;
            }
            setMessage({ text: errorMsg, type: 'error', key: Date.now() });
            setUploadSuccessful(false);
            if (!retainFilesOnError) {
                setSelectedFiles([]); // Clear files only if we don't know which failed specifically
            }
        } finally {
            setIsLoading(false);
        }
    }, [selectedFiles, isLoading, navigate]); // Added isLoading, navigate

    // --- Message Styling Helper --- (Keep as is)
    const getMessageStyle = useCallback((type) => {
        switch (type) {
            case 'error': return 'bg-red-100 border-red-500 text-red-800';
            case 'warning': return 'bg-yellow-100 border-yellow-500 text-yellow-900';
            case 'success': return 'bg-green-100 border-green-500 text-green-800';
            default: return 'bg-blue-100 border-blue-500 text-blue-800';
        }
    }, []);

    // --- JSX Structure ---
    return (
        <motion.div
            className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-100 to-sky-100/80 py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center overflow-hidden relative font-sans"
            variants={pageVariants} initial="initial" animate="animate" exit="exit"
        >
            {/* Background Elements (Gentler Animations + Delay) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                <motion.div
                    className="absolute -top-60 -right-40 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-blue-300/40 via-sky-300/30 to-blue-200/20 blur-[160px] opacity-50"
                    animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.6, 0.4] }} // Simpler animation
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 0.8 }} // Added delay
                 />
                <motion.div
                    className="absolute -bottom-60 -left-40 w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-sky-300/30 via-blue-200/20 to-sky-100/10 blur-[150px] opacity-40"
                    animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.5, 0.3] }} // Simpler animation
                    transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2.0 }} // Added delay
                />
                {/* Grid can stay, it's low impact */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDgwIEwgODAgODAgODAgMCBNIDQwIDAgTCA0MCA4MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjYWRkOGU2IiBvcGFjaXR5PSIwLjA4IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-80"></div>
            </div>
            {/* CSS Styles (Keep as is) */}
            <style>{`
                .pattern-dots-blue { background-image: radial-gradient(circle, rgba(191, 219, 254, 0.5) 1px, transparent 1px); background-size: 12px 12px; transition: background-color 0.3s ease, border-color 0.3s ease; }
                .pattern-dots-blue-active { background-image: radial-gradient(circle, rgba(96, 165, 250, 0.8) 1.5px, transparent 1.5px); background-size: 12px 12px; }
                .custom-scrollbar::-webkit-scrollbar { width: 7px; height: 7px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(224, 242, 254, 0.3); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #93c5fd; border-radius: 10px; border: 1px solid rgba(224, 242, 254, 0.5); }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #60a5fa; }
                 @keyframes gradient-animation-blue { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
                 .animate-gradient-blue { background-size: 200% 200%; animation: gradient-animation-blue 4s linear infinite; }
            `}</style>

            {/* Main Card */}
            <motion.div
                className="relative max-w-3xl w-full bg-white/75 backdrop-blur-xl p-8 sm:p-12 rounded-2xl shadow-2xl shadow-blue-500/10 border border-blue-100/80 z-10 overflow-hidden"
                variants={containerVariants} initial="hidden" animate="visible" // Use optimized container variant
            >
                {/* Wrap inner content for staggering */}
                <motion.div variants={{ visible: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="visible">

                    {/* Header */}
                    <motion.div className="text-center mb-12 relative" variants={itemVariants}>
                         {/* Keep subtle header decoration */}
                         <motion.div className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-24 h-24 bg-gradient-to-br from-sky-300 to-blue-300 rounded-full opacity-15 blur-2xl" animate={{ scale: [1, 1.08, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1.0 }} />
                         <motion.div whileHover={{ scale: 1.1, rotate: -8 }} transition={{ type: 'spring', stiffness: 300, damping: 10 }}>
                            <Paperclip className="w-11 h-11 text-blue-500 mb-4 mx-auto relative z-10 drop-shadow-md" />
                         </motion.div>
                         <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-blue-600 to-blue-700 mb-3 pb-1 animate-gradient-blue" style={{ backgroundSize: '200% auto' }}>
                            Upload Resumes
                         </h1>
                         <p className="text-lg text-blue-900/70 max-w-md mx-auto leading-relaxed">
                            Select or drop candidate resumes below. Accepts <span className="font-semibold text-blue-600">PDF</span> & <span className="font-semibold text-blue-600">DOCX</span> formats.
                         </p>
                    </motion.div>

                    {/* Dropzone */}
                    <motion.div className="mb-10" variants={itemVariants}>
                        {/* Use motion.label for direct animation */}
                        <motion.label
                            htmlFor="resume-upload-enhanced"
                            className={`relative flex flex-col items-center justify-center w-full min-h-[17rem] sm:min-h-[20rem] border-[3px] border-dashed rounded-xl overflow-hidden group transition-colors duration-300 ease-in-out ${isLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${isDragging ? 'pattern-dots-blue-active border-blue-500' : 'pattern-dots-blue border-sky-300/80 hover:border-blue-400/90'}`}
                            onDragOver={(e) => handleDragEvents(e, true)} // Prevent default handled by handleDragEvents
                            onDragEnter={(e) => handleDragEvents(e, true)}
                            onDragLeave={(e) => handleDragEvents(e, false)}
                            onDrop={handleDrop}
                            // Animate background color smoothly
                            animate={{ backgroundColor: isDragging && !isLoading ? 'rgba(219, 234, 254, 0.8)' : (isLoading ? 'rgba(241, 245, 249, 0.7)' : 'rgba(239, 246, 255, 0.5)') }}
                            transition={{ duration: 0.3 }} // Smooth background transition
                        >
                            <div className="text-center p-6 z-10 flex flex-col items-center transition-transform duration-300 group-hover:scale-105">
                                <motion.div
                                    // Use variant for pulse animation only when dragging
                                    animate={isDragging && !isLoading ? "pulse" : "idle"}
                                    variants={{
                                        idle: { scale: 1, opacity: 1 },
                                        pulse: iconPulseDrag.animate // Reference the animation properties
                                    }}
                                    transition={isDragging && !isLoading ? iconPulseDrag.transition : { duration: 0.3 }} // Apply transition conditionally
                                >
                                    <UploadCloud className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 transition-colors duration-300 ${isDragging && !isLoading ? 'text-blue-600' : 'text-sky-400 group-hover:text-blue-500'}`} strokeWidth={1.5} />
                                </motion.div>
                                <AnimatePresence mode="wait">
                                    <motion.p key={isDragging ? 'drop-text' : 'select-text'} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="text-lg font-medium text-blue-900/80 group-hover:text-blue-700 transition-colors">
                                        {isDragging ? <span className="font-semibold text-blue-600">Drop files to upload!</span> : <> <span className="font-semibold text-blue-600 hover:underline">Click to select files</span> <span className="text-blue-900/60"> or drop them here</span> </>}
                                    </motion.p>
                                </AnimatePresence>
                                <p className="text-sm text-blue-900/60 mt-2 uppercase tracking-wider font-medium">PDF & DOCX supported (Max {MAX_FILE_SIZE_MB}MB)</p>
                            </div>
                            <input id="resume-upload-enhanced" ref={fileInputRef} type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" multiple accept={ACCEPT_MIME_TYPES} onChange={handleFileChange} disabled={isLoading} />
                            {/* Loading Overlay */}
                            <AnimatePresence>
                                {isLoading && (
                                    <motion.div key="loading-overlay" className="absolute inset-0 bg-gradient-to-br from-sky-100/90 via-blue-100/90 to-white/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl z-30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                                        <LoaderCircle className="w-14 h-14 text-blue-500 animate-spin" />
                                        <p className="text-xl text-blue-700 mt-5 font-semibold tracking-wide">Processing Resumes...</p>
                                        <p className="text-sm text-blue-600/80 mt-1">Please wait a moment.</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.label>
                    </motion.div>

                    {/* Message Area */}
                    <motion.div className="min-h-[60px] mb-10" variants={itemVariants}>
                         <AnimatePresence mode="popLayout"> {/* popLayout helps smooth transitions */}
                            {message.text && (
                                <motion.div key={message.key} className={`text-[15px] p-4 border-l-4 rounded-lg shadow-lg ${getMessageStyle(message.type)} flex items-start gap-3.5 backdrop-blur-sm bg-opacity-90`} variants={messageVariants} initial="hidden" animate="visible" exit="exit" layout> {/* Added layout prop */}
                                    {message.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5"/>}
                                    {message.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5"/>}
                                    {message.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5"/>}
                                    {message.type === 'info' && <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5"/>}
                                    <span className="flex-grow font-medium leading-snug">{message.text}</span>
                                </motion.div>
                             )}
                         </AnimatePresence>
                    </motion.div>

                    {/* File List */}
                    <AnimatePresence>
                        {selectedFiles.length > 0 && (
                            <motion.div key="file-list-container" className="mb-10" variants={fileListVariants} initial="hidden" animate="visible" exit="exit" layout >
                                <motion.h3 className="text-xl font-semibold text-blue-900 mb-5" layout="position"> Files Ready ({selectedFiles.length}): </motion.h3>
                                {/* Use motion component for list itself to enable layout animation */}
                                <motion.ul layout className="space-y-3.5 max-h-72 overflow-y-auto border border-blue-200/70 p-4 rounded-xl bg-gradient-to-br from-white/60 via-sky-50/40 to-blue-50/50 shadow-inner custom-scrollbar backdrop-blur-md" >
                                    <AnimatePresence initial={false}> {/* initial=false prevents exit animation on first load */}
                                        {selectedFiles.map((file) => (
                                            <motion.li
                                                key={`${file.name}-${file.lastModified}`}
                                                variants={fileItemVariants} // Use optimized variant
                                                initial="hidden" animate="visible" exit="exit"
                                                layout="position" // Animate position changes smoothly
                                                className="flex items-center justify-between text-sm p-4 bg-white/80 rounded-lg shadow-md border border-blue-100/90 hover:border-blue-300 transition-all duration-200 group relative overflow-hidden"
                                                whileHover={!isLoading ? { scale: 1.015, zIndex: 1, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" } : {}} // Slightly reduced hover scale
                                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                            >
                                                <motion.div className="absolute inset-0 bg-gradient-to-r from-sky-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                                                <div className="flex items-center gap-4 overflow-hidden flex-grow mr-4">
                                                    {getFileTypeIcon(file.name)}
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="text-blue-900 truncate font-medium" title={file.name}>{file.name}</span>
                                                        <span className="text-blue-700/70 text-xs mt-0.5">{formatBytes(file.size)}</span>
                                                    </div>
                                                </div>
                                                <motion.button
                                                    onClick={() => handleRemoveFile(file)}
                                                    disabled={isLoading}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-full focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 focus:ring-offset-white/80 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 transition-colors bg-slate-100/50 hover:bg-red-100/70"
                                                    aria-label={`Remove ${file.name}`}
                                                    whileHover={!isLoading ? { scale: 1.2, rotate: 90 } : {}} whileTap={!isLoading ? { scale: 0.9, rotate: 45 } : {}}
                                                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                                > <X className="w-4 h-4" /> </motion.button>
                                            </motion.li>
                                        ))}
                                    </AnimatePresence>
                                </motion.ul>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Action Button */}
                    <motion.div className="text-center mt-12" variants={itemVariants}>
                        <AnimatePresence mode="wait">
                            {selectedFiles.length > 0 && !uploadSuccessful && ( // Added !uploadSuccessful check
                                <motion.button
                                    key="upload-button"
                                    onClick={handleUploadResumes}
                                    disabled={isLoading || selectedFiles.length === 0}
                                    className="w-full sm:w-auto inline-flex items-center justify-center px-12 py-4 bg-gradient-to-r from-sky-500 via-blue-500 to-blue-600 text-white font-semibold text-base rounded-xl shadow-lg hover:shadow-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100 transition-all duration-300 gap-2.5 h-[56px] transform focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white/90"
                                    variants={buttonVariants} initial="hidden" animate="visible" exit="exit"
                                    whileHover={!isLoading ? "hover" : ""} whileTap={!isLoading ? "tap" : ""}
                                >
                                    {isLoading ? <LoaderCircle className="w-6 h-6 animate-spin" /> : <UploadCloud className="w-6 h-6" /> }
                                    <span className="text-lg"> {isLoading ? "Uploading..." : `Upload ${selectedFiles.length} Resume(s)`} </span>
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </motion.div>

                </motion.div>
            </motion.div>
        </motion.div>
    );
};

export default UploadResumes;