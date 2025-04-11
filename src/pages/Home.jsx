import React, { useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  FileSearch, Award, Zap, Check, ArrowRight, User, Briefcase,
  BarChart3, CloudUpload, Target, Clock, FileText, Files,
  Github, Linkedin, Search, ArrowUpRight, Star,
  LoaderCircle // Ensured LoaderCircle is imported
} from 'lucide-react';

const preview = '/Scan.png'; // Make sure this path is correct

// --- Animation Variants (Refined for Smoothness) ---

// Gentle fade-in-up for load/initial view
const fadeInUp = {
  initial: { opacity: 0, y: 20 }, // Reduced initial Y
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }, // Simpler ease
  exit: { opacity: 0, y: 10, transition: { duration: 0.3, ease: "easeIn" } }, // Reduced exit Y
};

// Fade-in-up for scroll-triggered sections
const fadeInUpInView = {
  initial: { opacity: 0, y: 25 }, // Reduced initial Y
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: "easeOut" } // Simpler ease
};

// Stagger container (Slightly slower stagger for clarity)
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12, // Slightly increased stagger delay
      delayChildren: 0.1
    }
  }
};

// Staggered item (Smoother ease)
const staggerItem = {
  hidden: { opacity: 0, y: 15 }, // Reduced initial Y
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } // Simpler ease
};

// Subtle Hover/Tap Effects
const hoverScaleSubtle = {
    scale: 1.03, // More subtle scale
    transition: { duration: 0.25, ease: "easeOut" } // Smoother transition for scale
};
const tapScale = {
    scale: 0.97 // Consistent tap scale
};

// --- Footer Component (Font sizes potentially adjusted if needed, keeping structure) ---
// Keeping Footer mostly the same as the previous "cool" version,
// as font sizes there were already reasonable. Adjust if necessary.
const Footer = () => (
  <footer className="bg-gradient-to-b from-gray-900 to-black text-gray-400 py-16 relative overflow-hidden">
    {/* Subtle background pattern */}
    <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgb3BhY2l0eT0iMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]"></div>

    <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ amount: 0.1, once: true }} // Animate footer once
        variants={staggerContainer}
        className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12" // Slightly reduced gap
      >
        {/* Branding & Description */}
        <motion.div variants={staggerItem} className="md:col-span-1">
          <div className="flex items-center mb-4">
            <motion.div
              className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-2.5 shadow-md" // Slightly smaller icon box
              animate={{ rotate: [0, 8, -4, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <Zap className="w-4 h-4 text-white" />
            </motion.div>
            <span className="text-lg font-bold text-white tracking-tight">ATS Scorer</span> {/* Adjusted size */}
          </div>
          <p className="text-[13px] mb-6 leading-relaxed text-gray-300"> {/* Adjusted size */}
            Empowering job seekers with free, AI-driven tools to analyze resumes, craft job descriptions, and accelerate the path to their next career move.
          </p>
          <div className="flex space-x-4"> {/* Reduced space */}
            <motion.a whileHover={{ y: -2, color: '#ffffff' }} href="https://github.com/Deepu1004" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-gray-400 transition duration-300"><Github className="w-4 h-4" /></motion.a>
            <motion.a whileHover={{ y: -2, color: '#ffffff' }} href="https://www.linkedin.com/in/saideepakvaranasi/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-gray-400 transition duration-300"><Linkedin className="w-4 h-4" /></motion.a>
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div variants={staggerItem}>
          <h5 className="font-semibold text-white mb-4 uppercase text-xs tracking-wider">Tools</h5> {/* Adjusted size */}
          <ul className="space-y-2.5 text-xs"> {/* Adjusted size & spacing */}
             <li><a href="/scan" className="hover:text-blue-300 transition-colors duration-200 flex items-center group">Resume Scanner <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"/></a></li>
             <li><a href="/job-creation" className="hover:text-blue-300 transition-colors duration-200 flex items-center group">JD Generator <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"/></a></li>
             <li><a href="/bulk-upload" className="hover:text-blue-300 transition-colors duration-200 flex items-center group">Bulk Resume Upload <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"/></a></li>
             <li><a href="#features" className="hover:text-blue-300 transition-colors duration-200">Features</a></li>
             <li><a href="#how-it-works" className="hover:text-blue-300 transition-colors duration-200">How It Works</a></li>
          </ul>
        </motion.div>

        {/* Resources & Contact */}
        <motion.div variants={staggerItem}>
           <h5 className="font-semibold text-white mb-4 uppercase text-xs tracking-wider">Resources</h5> {/* Adjusted size */}
          <ul className="space-y-2.5 text-xs"> {/* Adjusted size & spacing */}
            <li><a href="#" className="hover:text-blue-300 transition-colors duration-200">Contact Us</a></li>
            <li><a href="#" className="hover:text-blue-300 transition-colors duration-200">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-blue-300 transition-colors duration-200">Terms of Service</a></li>
          </ul>
        </motion.div>

      </motion.div>
      {/* Divider with Gradient */}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent my-8"></div> {/* Adjusted margin */}
      <div className="text-center text-xs text-gray-500"> {/* Adjusted size */}
        © {new Date().getFullYear()} ATS Scorer. Built with <span className="text-red-400 mx-0.5">❤️</span> by Sai Deepak.
      </div>
    </div>
  </footer>
);


const Home = () => {
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  // Keep viewport settings flexible, but add `once: true` where needed
  const viewportOnce = { amount: 0.2, once: true };
  const viewportRepeat = { amount: 0.2, once: false }; // For sections needing re-animation

  // Parallax (Keep it simple)
  const { scrollYProgress } = useScroll();
  // Reduce the parallax effect slightly to minimize perceived stutter
  const heroImageY = useTransform(scrollYProgress, [0, 0.3], [0, -30]);

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 overflow-x-hidden font-sans antialiased">

        {/* === Hero Section === */}
        <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28 isolate"> {/* Adjusted padding */}
           {/* Background Blobs (Animations remain continuous) */}
           <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
            animate={{ opacity: 1, scale: 1.2, rotate: 15 }}
            transition={{ duration: 25, repeat: Infinity, repeatType: "mirror", ease: "linear" }} // Use linear for smoother continuous feel
            className="absolute -right-60 -top-40 w-[500px] h-[500px] bg-gradient-to-br from-purple-300/60 via-blue-300/50 to-indigo-400/40 rounded-full filter blur-[120px] pointer-events-none opacity-60" // Slightly reduced opacity/intensity
           />
           <motion.div
            initial={{ opacity: 0, scale: 0.6, rotate: 0 }}
            animate={{ opacity: 1, scale: 1.1, rotate: -10 }}
            transition={{ duration: 30, repeat: Infinity, repeatType: "mirror", ease: "linear", delay: 1 }} // Use linear
            className="absolute -left-52 bottom-[-10rem] w-[600px] h-[600px] bg-gradient-to-tr from-blue-300/50 via-sky-300/40 to-purple-300/30 rounded-full filter blur-[130px] pointer-events-none opacity-50" // Slightly reduced opacity/intensity
           />

          <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
               {/* Headline */}
               <motion.h1
                 initial={{ opacity: 0, y: -20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }} // Faster duration, simple ease
                 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 mb-5 leading-tight tracking-tighter drop-shadow-md"> {/* Reduced size */}
                 Beat the ATS. Land the Job.
               </motion.h1>
               {/* Subtitle */}
               <motion.p
                 initial={{ opacity: 0, y: -15 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }} // Adjusted delay/duration
                 className="text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed"> {/* Reduced size */}
                 Optimize your resume for Applicant Tracking Systems with our free AI scanner. Match keywords, refine formatting, and skyrocket your interview chances.
               </motion.p>
               {/* Buttons - Simpler Hover */}
               <motion.div
                 initial="hidden"
                 animate="show"
                 variants={staggerContainer}
                 transition={{ staggerChildren: 0.1, delayChildren: 0.4 }} // Faster delay
                 className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-20"> {/* Reduced gap/margin */}
                 <motion.a
                   href="/scan"
                   variants={staggerItem}
                   whileHover={{ scale: 1.04, y: -2, boxShadow: "0 10px 20px -8px rgba(99, 102, 241, 0.4)" }} // Subtle hover scale/shadow
                   whileTap={tapScale}
                   className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-base font-semibold rounded-full shadow-md hover:shadow-lg transform transition duration-200 ease-out flex items-center justify-center group"> {/* Reduced size/padding */}
                   Scan My Resume <Search className="ml-1.5 w-4 h-4 transform transition-transform duration-300 group-hover:rotate-12"/>
                 </motion.a>
                 <motion.a
                   href="#how-it-works"
                   variants={staggerItem}
                   whileHover={{ scale: 1.04, y: -2, boxShadow: "0 8px 15px -5px rgba(0, 0, 0, 0.1)" }} // Subtle hover
                   whileTap={tapScale}
                   className="w-full sm:w-auto px-7 py-3 bg-white text-gray-700 text-base font-semibold rounded-full shadow-sm border border-gray-200 hover:border-gray-300 hover:shadow-md transform transition duration-200 ease-out flex items-center justify-center group"> {/* Reduced size/padding */}
                   Learn More <ArrowRight className="ml-1.5 w-3 h-3 text-gray-500 group-hover:text-gray-700 transition-colors duration-200"/>
                 </motion.a>
               </motion.div>

              {/* Demo Preview Image */}
              <motion.div
                style={{ y: heroImageY }}
                initial={{ opacity: 0, y: 30, scale: 0.98 }} // Adjusted initial state
                animate={heroImageLoaded ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }} // Adjusted timing
                className={`relative mx-auto max-w-5xl rounded-xl overflow-hidden border border-gray-300/50 shadow-xl bg-white/60 backdrop-blur-sm`}> {/* Slightly smaller radius, simpler shadow */}
                {/* Browser Chrome */}
                <div className="bg-gray-100/80 h-8 flex items-center px-3 rounded-t-xl border-b border-gray-300/50"> {/* Reduced height */}
                   <div className="flex space-x-1.5">
                    <div className="w-2.5 h-2.5 bg-red-400/80 rounded-full border border-red-500/20"></div> {/* Smaller dots */}
                    <div className="w-2.5 h-2.5 bg-yellow-400/80 rounded-full border border-yellow-500/20"></div>
                    <div className="w-2.5 h-2.5 bg-green-400/80 rounded-full border border-green-500/20"></div>
                  </div>
                  <div className="flex-grow text-center text-[11px] text-gray-600 font-medium tracking-wide">ATS Scorer - Result Preview</div> {/* Smaller text */}
                   <div className="w-10"></div> {/* Spacer */}
                </div>
                {/* Image */}
                <div className="relative">
                    <AnimatePresence>
                        {!heroImageLoaded && (
                             <motion.div
                                key="loader" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                                className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center rounded-b-xl z-10">
                                <div className="flex flex-col items-center text-gray-500">
                                    <LoaderCircle className="w-6 h-6 animate-spin mb-1.5 text-blue-500"/> {/* Smaller loader */}
                                    <p className="text-xs font-medium">Loading Analysis Preview...</p> {/* Smaller text */}
                                </div>
                            </motion.div>
                        )}
                     </AnimatePresence>
                    <img
                      src={preview} alt="Resume Analysis Preview"
                      className="relative object-cover object-top rounded-b-xl w-full h-auto block transition-opacity duration-400" // Faster transition
                      style={{ opacity: heroImageLoaded ? 1 : 0 }}
                      onLoad={() => setHeroImageLoaded(true)} onError={() => setHeroImageLoaded(true)}
                    />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* === How It Works Section === */}
        <section id="how-it-works" className="py-20 md:py-24 bg-white"> {/* Adjusted padding */}
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            {/* Title Area - Animate Once */}
            <motion.div
                className="text-center mb-16" // Reduced margin
                initial="initial" whileInView="whileInView" viewport={viewportOnce} variants={fadeInUpInView} // Use viewportOnce
            >
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1.5 block">Simple Steps</span> {/* Adjusted size */}
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3 tracking-tight">Get Your ATS Score Instantly</h2> {/* Reduced size */}
              <p className="text-base text-gray-600 max-w-3xl mx-auto leading-relaxed"> {/* Reduced size */}
                Unlock insights in just three steps. See how your resume compares and get actionable feedback.
              </p>
            </motion.div>

            {/* Staggered Grid Items - Animate Once */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12" // Reduced gap
                initial="hidden" whileInView="show" viewport={viewportOnce} variants={staggerContainer} // Use viewportOnce
             >
              {[
                { icon: CloudUpload, title: 'Upload Resume', description: 'Securely upload your resume (PDF or DOCX). We respect your privacy.' },
                { icon: FileText, title: 'Add Job Description', description: 'Paste the job details to analyze against specific requirements.' },
                { icon: BarChart3, title: 'Receive Insights', description: 'Get your match score, keyword analysis, and tailored improvement tips.' },
              ].map((step, index) => (
                <motion.div
                    key={index} className="flex flex-col items-center text-center group" variants={staggerItem}
                 >
                  <div className="relative mb-6"> {/* Reduced margin */}
                    {/* Icon Container - Simpler Hover */}
                    <motion.div
                      // Removed Framer motion hover, rely on CSS transition + group-hover below
                      className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 text-blue-600 shadow-md transition-all duration-300 ease-out group-hover:shadow-lg group-hover:scale-105 group-hover:text-indigo-700 border border-white/50"> {/* Reduced size, simpler shadow, added CSS transition & hover */}
                      <step.icon className="w-8 h-8" /> {/* Reduced size */}
                    </motion.div>
                    {/* Number Badge - Spring Animation is fine here */}
                    <motion.span
                       initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={viewportOnce} // Animate once
                       transition={{ type: "spring", stiffness: 250, damping: 15, delay: index * 0.1 + 0.3 }}
                       className="absolute -top-1.5 -left-1.5 flex items-center justify-center w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-full text-xs shadow-sm border border-white"> {/* Reduced size */}
                      {index + 1}
                    </motion.span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800 group-hover:text-indigo-700 transition-colors duration-200">{step.title}</h3> {/* Reduced size */}
                  <p className="text-sm text-gray-500 leading-relaxed px-4">{step.description}</p> {/* Reduced size */}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* === Core Features Section === */}
        <section id="features" className="py-20 md:py-24 bg-gradient-to-b from-gray-50 to-indigo-50/30"> {/* Adjusted padding/gradient */}
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
             {/* Title Area - Animate Once */}
            <motion.div
                className="text-center mb-16" // Reduced margin
                initial="initial" whileInView="whileInView" viewport={viewportOnce} variants={fadeInUpInView} // Use viewportOnce
            >
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1.5 block">Our Toolkit</span> {/* Adjusted size */}
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3 tracking-tight">Free Tools for Your Success</h2> {/* Reduced size */}
              <p className="text-base text-gray-600 max-w-3xl mx-auto leading-relaxed"> {/* Reduced size */}
                Leverage our suite of AI-powered tools designed to streamline your job application process.
              </p>
            </motion.div>

            {/* Feature Cards - Animate Once, Simpler Hover */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" // Reduced gap
              initial="hidden" whileInView="show" viewport={viewportOnce} variants={staggerContainer} // Use viewportOnce
            >
              {[
                { icon: FileSearch, title: 'AI Resume Scanner', description: 'Deep analysis of resume vs. job description, keyword matching, and ATS compatibility checks.', path: '/scan', color: 'blue' },
                { icon: FileText, title: 'JD Generator Assistant', description: 'Craft optimized job descriptions or tailor existing ones using AI suggestions for clarity and impact.', path: '/job-creation', color: 'blue' },
                { icon: Files, title: 'Bulk Resume Upload', description: 'Efficiently process multiple resumes for screening or analysis. Perfect for recruiters and career coaches.', path: '/bulk-upload', color: 'blue' },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  variants={staggerItem}
                  // Use CSS transitions for hover effects now
                  className="bg-white p-6 rounded-lg shadow-md transition-all duration-300 ease-out border border-gray-200/60 hover:shadow-lg hover:scale-[1.02] hover:border-transparent flex flex-col cursor-pointer relative group overflow-hidden" // Adjusted padding/radius/shadow/border, simpler hover via CSS
                >
                   {/* Subtle Gradient Glow on Hover via pseudo-element */}
                   <div className={`absolute -inset-px rounded-lg opacity-0 group-hover:opacity-40 transition-opacity duration-300 bg-gradient-to-br from-${feature.color}-100 via-transparent to-transparent -z-10 pointer-events-none`}></div>

                   <div className={`w-12 h-12 flex items-center justify-center rounded-lg bg-gradient-to-br from-${feature.color}-100 to-${feature.color}-200 mb-4 flex-shrink-0 shadow-inner`}> {/* Reduced size/margin */}
                     <feature.icon className={`w-6 h-6 text-${feature.color}-600`} /> {/* Reduced size */}
                   </div>
                   <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3> {/* Reduced size */}
                   <p className="text-sm text-gray-600 leading-relaxed flex-grow mb-4">{feature.description}</p> {/* Reduced size */}
                   <a // Changed to simple anchor, hover effect on parent card
                      href={feature.path}
                      className={`mt-auto text-${feature.color}-600 hover:text-${feature.color}-700 font-medium inline-flex items-center text-xs group/link transition-colors duration-200`} // Reduced size
                    >
                     Explore Tool <ArrowRight className="ml-1 w-3 h-3 transition-transform duration-200 group-hover/link:translate-x-0.5"/>
                   </a>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

         {/* === Benefits Section === */}
        <section className="py-20 md:py-24 bg-white relative overflow-hidden"> {/* Adjusted padding */}
          {/* Background Shape */}
          <div className="absolute top-0 left-0 -translate-x-1/3 -translate-y-1/3 pointer-events-none opacity-70" aria-hidden="true"> {/* Added opacity */}
            <div className="w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-blue-100/40 via-purple-100/30 to-transparent blur-[90px]"></div> {/* Reduced size/blur */}
          </div>
          <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center"> {/* Reduced gap */}
              {/* Text Content - Animate Once */}
              <motion.div
                  initial="initial" whileInView="whileInView" viewport={viewportOnce} variants={fadeInUpInView} // Use viewportOnce
              >
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2 block">Your Advantage</span> {/* Adjusted size */}
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mt-1 mb-4 leading-tight tracking-tight">Stop Guessing, Start Interviewing</h2> {/* Reduced size */}
                <p className="text-base text-gray-600 mb-8 leading-relaxed"> {/* Reduced size */}
                  Gain the competitive edge. Our free tools provide the clarity and optimization needed to impress recruiters and land interviews.
                </p>
                {/* List - Animate Once */}
                <motion.ul
                    className="space-y-4" // Reduced spacing
                    initial="hidden" whileInView="show" viewport={viewportOnce} variants={staggerContainer} // Use viewportOnce
                 >
                  {[
                    { icon: Clock, text: 'Save Precious Time: Instantly analyze and optimize resumes.' },
                    { icon: Target, text: 'Increase Callback Rate: Align perfectly with job requirements.' },
                    { icon: Star, text: 'Improve Application Quality: Learn ATS best practices easily.' },
                    { icon: Award, text: 'Boost Confidence: Apply knowing your resume stands out.' },
                  ].map((benefit, index) => (
                    <motion.li key={index} className="flex items-start" variants={staggerItem}>
                       {/* Icon - Spring Animation is fine */}
                      <motion.div
                        initial={{ scale: 0, rotate: -90 }} whileInView={{ scale: 1, rotate: 0 }} viewport={viewportOnce} // Animate once
                        transition={{ type: "spring", stiffness: 260, damping: 20, delay: index * 0.1 + 0.2 }} // Adjusted delay
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-gradient-to-br from-green-100 to-emerald-100 mr-3 mt-0.5 shadow-sm border border-green-200/40"> {/* Reduced size/margin */}
                         <benefit.icon className="w-3.5 h-3.5 text-green-600" /> {/* Reduced size */}
                      </motion.div>
                      <span className="text-sm text-gray-700 leading-snug">{benefit.text}</span> {/* Reduced size */}
                    </motion.li>
                  ))}
                </motion.ul>
                {/* Button - Simpler Hover */}
                 <motion.a
                    href="/scan"
                    variants={fadeInUp} // Simple fade in
                    initial="initial"
                    whileInView="animate" // Animate when in view
                    viewport={viewportOnce} // Animate once
                    whileHover={{ scale: 1.04, y: -2 }} // Simple scale/lift hover
                    whileTap={tapScale}
                    className="mt-10 inline-flex items-center px-7 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium text-sm rounded-full shadow-md hover:shadow-lg transition duration-200 ease-out group"> {/* Reduced size/padding */}
                   Try the Scanner Now <Zap className="ml-1.5 w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110"/>
                 </motion.a>
              </motion.div>

              {/* Visual Element - Animate Once, Simpler content animations */}
              <motion.div
                className="relative mt-10 lg:mt-0 h-[400px] md:h-[480px] rounded-xl overflow-hidden shadow-lg border border-gray-200/50" // Adjusted size/radius/shadow
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={viewportOnce} // Use viewportOnce
                transition={{ duration: 0.7, ease: "easeOut" }}
              >
                 {/* Background Gradient */}
                 <div className="absolute inset-0 bg-gradient-to-br from-blue-300 via-purple-300 to-indigo-400 flex items-center justify-center p-6">
                    {/* Central Icon - Simpler Animation */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
                        viewport={viewportOnce}
                    >
                        <motion.div
                          // Removed complex filter animation, rely on subtle scale pulse
                          animate={{ scale: [1, 1.03, 1] }}
                          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                         >
                            <FileSearch className="w-24 h-24 text-white opacity-70" /> {/* Reduced size */}
                        </motion.div>
                    </motion.div>
                 </div>
                 {/* Decorative Shapes - Simplified */}
                 <motion.div
                    initial={{ x: 50, y: 50, opacity: 0 }} whileInView={{ x: 0, y: 0, opacity: 1 }}
                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }} viewport={viewportOnce}
                    className="absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-tl from-blue-400/40 to-transparent rounded-full -z-10 blur-lg"
                 />
                 <motion.div
                    initial={{ x: -50, y: -50, opacity: 0 }} whileInView={{ x: 0, y: 0, opacity: 1 }}
                    transition={{ duration: 1, delay: 0.7, ease: "easeOut" }} viewport={viewportOnce}
                    className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-purple-400/40 to-transparent rounded-full -z-10 blur-lg"
                 />
                 {/* Floating icons - Simplified & Fewer */}
                  <motion.div animate={{ y: [0, -8, 0], opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} className="absolute top-[25%] left-[20%] pointer-events-none"><Check className="w-5 h-5 text-white"/></motion.div>
                  <motion.div animate={{ y: [0, 6, 0], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} className="absolute bottom-[30%] right-[22%] pointer-events-none"><Target className="w-4 h-4 text-white"/></motion.div>
                  <motion.div animate={{ y: [0, -5, 0], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }} className="absolute top-[40%] right-[35%] pointer-events-none"><Star className="w-3 h-3 text-white"/></motion.div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Home;