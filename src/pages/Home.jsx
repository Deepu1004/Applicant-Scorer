import React, { useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  FileSearch, Award, Zap, Check, ArrowRight, User, Briefcase,
  BarChart3, CloudUpload, Target, Clock, FileText, Files,
  Github, Linkedin, Search, ArrowUpRight, Star,
  LoaderCircle // Ensured LoaderCircle is imported
} from 'lucide-react';

// Import the Footer component (assuming it's in the same directory or adjust path)
// import Footer from './Footer'; // Or wherever your Footer component is located

const preview = '/Scan.png'; // Make sure this path is correct

// --- Animation Variants (Optimized for smoothness) ---
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  exit: { opacity: 0, y: 10, transition: { duration: 0.3, ease: "easeIn" } },
};
const fadeInUpInView = {
  initial: { opacity: 0, y: 25 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 }, // Trigger animation once when 20% is in view
  transition: { duration: 0.7, ease: "easeOut" }
};
const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};
const staggerItem = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};
const tapScale = { scale: 0.97 };
const buttonHoverBlue = {
    scale: 1.04, // Slightly increased scale
    y: -2,
    boxShadow: "0 12px 25px -8px rgba(59, 130, 246, 0.45)", // Enhanced blue shadow
    transition: { type: "spring", stiffness: 300, damping: 15 }
};
const buttonHoverOutline = {
    scale: 1.04,
    y: -2,
    boxShadow: "0 8px 18px -5px rgba(59, 130, 246, 0.25)", // Lighter blue shadow
    backgroundColor: "rgba(239, 246, 255, 0.7)", // Subtle blue background tint on hover
    transition: { type: "spring", stiffness: 300, damping: 15 }
};


// --- Noise Texture Component ---
const NoiseOverlay = () => (
    <div className="absolute inset-0 pointer-events-none opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
);

// --- Footer Component (Included directly for completeness, use import if preferred) ---
const Footer = () => (
  <footer className="bg-gradient-to-b from-gray-900 to-black text-gray-400 py-8 relative overflow-hidden">
    <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgb3BhY2l0eT0iMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]"></div>
    <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
      <motion.div initial="hidden" whileInView="show" viewport={{ amount: 0.1, once: true }} variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
        <motion.div variants={staggerItem} className="md:col-span-1">
          <div className="flex items-center mb-4">
            <motion.div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-sky-500 rounded-lg flex items-center justify-center mr-2.5 shadow-md" animate={{ rotate: [0, 8, -4, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}><Zap className="w-4 h-4 text-white" /></motion.div>
            <span className="text-lg font-bold text-white tracking-tight">ApplicantScorer</span>
          </div>
          <p className="text-[13px] mb-6 leading-relaxed text-gray-300">Empowering job seekers with free, AI-driven tools to analyze resumes, craft job descriptions, and accelerate the path to their next career move.</p>
          <div className="flex space-x-4">
            <motion.a whileHover={{ y: -2, color: '#60a5fa' }} href="https://github.com/Deepu1004" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-gray-400 transition duration-300"><Github className="w-4 h-4" /></motion.a>
            <motion.a whileHover={{ y: -2, color: '#60a5fa' }} href="https://www.linkedin.com/in/saideepakvaranasi/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-gray-400 transition duration-300"><Linkedin className="w-4 h-4" /></motion.a>
          </div>
        </motion.div>
        <motion.div variants={staggerItem}>
          <h5 className="font-semibold text-white mb-4 uppercase text-xs tracking-wider">Tools</h5>
          <ul className="space-y-2.5 text-xs">
              <li><a href="/bulk-upload" className="hover:text-sky-300 transition-colors duration-200 flex items-center group">Bulk Resume Upload <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"/></a></li>
              <li><a href="/job-creation" className="hover:text-sky-300 transition-colors duration-200 flex items-center group">JD Generator <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"/></a></li>
             <li><a href="/scan" className="hover:text-sky-300 transition-colors duration-200 flex items-center group">Resume Scanner <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"/></a></li>
             <li><a href="#features" className="hover:text-sky-300 transition-colors duration-200">Features</a></li>
             <li><a href="#how-it-works" className="hover:text-sky-300 transition-colors duration-200">How It Works</a></li>
          </ul>
        </motion.div>
        <motion.div variants={staggerItem}>
           <h5 className="font-semibold text-white mb-4 uppercase text-xs tracking-wider">Resources</h5>
          <ul className="space-y-2.5 text-xs">
            <li><a href="#" className="hover:text-sky-300 transition-colors duration-200">Contact Us</a></li>
            <li><a href="#" className="hover:text-sky-300 transition-colors duration-200">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-sky-300 transition-colors duration-200">Terms of Service</a></li>
          </ul>
        </motion.div>
      </motion.div>
      <div className="h-px bg-gradient-to-r from-transparent via-sky-500/30 to-transparent my-4"></div>
      <div className="text-center text-xs text-gray-500">© {new Date().getFullYear()} ApplicantScorer. Built with <span className="text-red-400 mx-0.5">❤️</span> by Sai Deepak.</div>
    </div>
  </footer>
);


const Home = () => {
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const { scrollYProgress } = useScroll();
  // Slightly adjusted parallax for smoothness
  const heroImageY = useTransform(scrollYProgress, [0, 0.3], [0, -25]);
  // Parallax for background elements (slower)
  const blob1Y = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const blob2Y = useTransform(scrollYProgress, [0, 1], [0, -80]);

  return (
    <>
      {/* Apply the theme gradient to the main container */}
      <main className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100 overflow-x-hidden font-sans antialiased relative">
        <NoiseOverlay /> {/* Add subtle noise texture */}

        {/* Custom animation styles */}
         <style>{`
            @keyframes pulse-float-1 { 0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.6; } 50% { transform: translate(-10px, 15px) scale(1.05); opacity: 0.7; } }
            .animate-pulse-float-1 { animation: pulse-float-1 12s ease-in-out infinite; }
            @keyframes pulse-float-2 { 0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; } 50% { transform: translate(15px, -10px) scale(1.05); opacity: 0.6; } }
            .animate-pulse-float-2 { animation: pulse-float-2 14s ease-in-out infinite 1s; }
            @keyframes gradient-blue-anim { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
            .animate-gradient-blue { background-size: 200% 200%; animation: gradient-blue-anim 4s linear infinite; }
        `}</style>

        {/* === Hero Section === */}
        <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28 isolate">
           {/* Updated Background Blobs with Blue/Sky Theme and parallax */}
           <motion.div
            style={{ y: blob1Y }}
            className="absolute -right-60 -top-40 w-[550px] h-[550px] bg-gradient-to-br from-sky-300/50 via-blue-300/40 to-blue-400/30 rounded-full filter blur-[130px] pointer-events-none animate-pulse-float-1" // Updated gradient and animation
           />
           <motion.div
             style={{ y: blob2Y }}
            className="absolute -left-52 bottom-[-10rem] w-[650px] h-[650px] bg-gradient-to-tr from-blue-300/40 via-sky-300/30 to-sky-400/20 rounded-full filter blur-[140px] pointer-events-none animate-pulse-float-2" // Updated gradient and animation
           />

          <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
               {/* Headline with Blue/Sky Gradient */}
               <motion.h1
                 variants={fadeInUp} initial="initial" animate="animate"
                 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-blue-600 to-blue-700 mb-5 leading-tight tracking-tighter drop-shadow-lg animate-gradient-blue pb-1"> {/* Updated Gradient */}
                 Beat the ATS. Land the Job.
               </motion.h1>
               {/* Subtitle */}
               <motion.p
                 variants={fadeInUp} initial="initial" animate="animate" transition={{ delay: 0.1 }}
                 className="text-lg md:text-xl text-blue-900/80 mb-10 max-w-3xl mx-auto leading-relaxed"> {/* Updated Text Color */}
                 Optimize your resume for Applicant Tracking Systems with our free AI scanner. Match keywords, refine formatting, and skyrocket your interview chances.
               </motion.p>
               {/* Buttons with Blue Theme */}
               <motion.div
                 variants={staggerContainer} initial="hidden" animate="show" transition={{ delayChildren: 0.2 }}
                 className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-20">
                 {/* Primary Button - Blue/Sky Gradient */}
                 <motion.a
                   href="/scan"
                   variants={staggerItem}
                   whileHover={buttonHoverBlue} // Use blue hover variant
                   whileTap={tapScale}
                   className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 to-sky-500 text-white text-base font-semibold rounded-full shadow-lg hover:shadow-xl transform transition duration-300 ease-out flex items-center justify-center group cursor-pointer"> {/* Increased padding */}
                   Scan My Resume <Search className="ml-2 w-4.5 h-4.5 transform transition-transform duration-300 group-hover:rotate-12"/>
                 </motion.a>
                 {/* Secondary Button - Outline Blue */}
                 <motion.a
                   href="#how-it-works"
                   variants={staggerItem}
                   whileHover={buttonHoverOutline} // Use outline hover variant
                   whileTap={tapScale}
                   className="w-full sm:w-auto px-8 py-3.5 bg-white/70 backdrop-blur-sm text-blue-700 text-base font-semibold rounded-full shadow-md border-2 border-blue-200/80 hover:border-blue-400 hover:text-blue-800 transform transition duration-300 ease-out flex items-center justify-center group cursor-pointer"> {/* Updated style */}
                   Learn More <ArrowRight className="ml-2 w-4 h-4 text-blue-500 group-hover:text-blue-700 transition-colors duration-200"/>
                 </motion.a>
               </motion.div>

              {/* Demo Preview Image - Enhanced Border/Shadow */}
              <motion.div
                style={{ y: heroImageY }}
                variants={fadeInUp} initial="initial" animate="animate" transition={{ delay: 0.3 }}
                className={`relative mx-auto max-w-5xl rounded-xl overflow-hidden border-2 border-blue-200/50 shadow-2xl shadow-blue-500/10 bg-gradient-to-br from-white/80 via-sky-50/50 to-blue-50/50 backdrop-blur-lg`}> {/* Enhanced style */}
                {/* Browser Chrome - Subtle Blue Tint */}
                <div className="bg-gradient-to-r from-gray-100 via-sky-50 to-blue-100/70 h-9 flex items-center px-3.5 rounded-t-xl border-b border-blue-200/60"> {/* Updated style */}
                   <div className="flex space-x-1.5">
                    <div className="w-3 h-3 bg-red-400 rounded-full border border-red-500/30"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full border border-yellow-500/30"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full border border-green-500/30"></div>
                  </div>
                  <div className="flex-grow text-center text-xs text-blue-900/70 font-medium tracking-wide">ApplicantScorer - Analysis Preview</div> {/* Updated text */}
                   <div className="w-10"></div>
                </div>
                {/* Image */}
                <div className="relative aspect-video overflow-hidden"> {/* Maintain aspect ratio */}
                    <AnimatePresence>
                        {!heroImageLoaded && (
                             <motion.div
                                key="loader" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                                className="absolute inset-0 bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100 flex items-center justify-center rounded-b-xl z-10">
                                <div className="flex flex-col items-center text-blue-600">
                                    <LoaderCircle className="w-7 h-7 animate-spin mb-2"/>
                                    <p className="text-xs font-semibold">Loading Preview...</p>
                                </div>
                            </motion.div>
                        )}
                     </AnimatePresence>
                    <img
                      src={preview} alt="Resume Analysis Preview"
                      className="absolute inset-0 w-full h-full object-cover object-top rounded-b-xl transition-opacity duration-500"
                      style={{ opacity: heroImageLoaded ? 1 : 0 }}
                      onLoad={() => setHeroImageLoaded(true)} onError={() => setHeroImageLoaded(true)}
                    />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* === How It Works Section === */}
        <section id="how-it-works" className="py-20 md:py-28 bg-white"> {/* Increased padding */}
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            {/* Title Area */}
            <motion.div
                className="text-center mb-16 md:mb-20"
                variants={fadeInUpInView} initial="initial" whileInView="whileInView" viewport={{ once: true, amount: 0.3 }}
            >
              {/* Updated Title Badge */}
              <span className="inline-block bg-gradient-to-r from-sky-100 to-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-3 shadow-sm border border-blue-200/50">Simple Steps</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue-900 mb-4 tracking-tight">Get Your ATS Score Instantly</h2> {/* Updated text color */}
              <p className="text-base md:text-lg text-blue-900/70 max-w-3xl mx-auto leading-relaxed"> {/* Updated text color */}
                Unlock insights in just three steps. See how your resume compares and get actionable feedback.
              </p>
            </motion.div>

            {/* Staggered Grid Items */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14" // Increased gap
                variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}
             >
              {[
                { icon: CloudUpload, title: 'Upload Resume', description: 'Securely upload your resume (PDF or DOCX). We respect your privacy.' },
                { icon: FileText, title: 'Add Job Description', description: 'Paste the job details to analyze against specific requirements.' },
                { icon: BarChart3, title: 'Receive Insights', description: 'Get your match score, keyword analysis, and tailored improvement tips.' },
              ].map((step, index) => (
                <motion.div
                    key={index} className="flex flex-col items-center text-center group" variants={staggerItem}
                 >
                  <div className="relative mb-7">
                    {/* Icon Container with Blue Theme */}
                    <motion.div
                      className="w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-sky-100 via-blue-100 to-blue-200/80 text-blue-600 shadow-lg transition-all duration-300 ease-out group-hover:shadow-xl group-hover:scale-105 group-hover:text-blue-700 border-2 border-white/80"> {/* Increased size, updated gradient, border */}
                      <step.icon className="w-9 h-9 transition-transform duration-300 group-hover:scale-110" /> {/* Increased size */}
                    </motion.div>
                    {/* Number Badge with Blue Gradient */}
                    <motion.span
                       initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true, amount: 0.5 }}
                       transition={{ type: "spring", stiffness: 250, damping: 15, delay: index * 0.1 + 0.3 }}
                       className="absolute -top-2 -left-2 flex items-center justify-center w-7 h-7 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold rounded-full text-[11px] shadow-md border-2 border-white"> {/* Increased size */}
                      {index + 1}
                    </motion.span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2.5 text-blue-900 group-hover:text-blue-700 transition-colors duration-200">{step.title}</h3> {/* Updated color/size */}
                  <p className="text-sm text-blue-900/60 leading-relaxed px-4">{step.description}</p> {/* Updated color */}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* === Core Features Section === */}
        <section id="features" className="py-20 md:py-28 bg-gradient-to-b from-sky-50/50 via-blue-50/60 to-sky-100/70"> {/* Updated BG */}
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
             {/* Title Area */}
            <motion.div
                className="text-center mb-16 md:mb-20"
                 variants={fadeInUpInView} initial="initial" whileInView="whileInView" viewport={{ once: true, amount: 0.3 }}
            >
               {/* Updated Title Badge */}
              <span className="inline-block bg-gradient-to-r from-blue-100 to-sky-100 text-blue-700 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-3 shadow-sm border border-blue-200/50">Our Toolkit</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue-900 mb-4 tracking-tight">Free Tools for Your Success</h2> {/* Updated text color */}
              <p className="text-base md:text-lg text-blue-900/70 max-w-3xl mx-auto leading-relaxed"> {/* Updated text color */}
                Leverage our suite of AI-powered tools designed to streamline your job application process.
              </p>
            </motion.div>

            {/* Feature Cards - Enhanced Hover and Blue Theme */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" // Increased gap
              variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}
            >
              {[
                { icon: FileSearch, title: 'AI Resume Scanner', description: 'Deep analysis of resume vs. job description, keyword matching, and ATS compatibility checks.', path: '/scan', color: 'blue' },
                { icon: FileText, title: 'JD Generator Assistant', description: 'Craft optimized job descriptions or tailor existing ones using AI suggestions for clarity and impact.', path: '/job-creation', color: 'sky' }, // Use sky for variety
                { icon: Files, title: 'Bulk Resume Upload', description: 'Efficiently process multiple resumes for screening or analysis. Perfect for recruiters and career coaches.', path: '/bulk-upload', color: 'blue' },
              ].map((feature, index) => {
                const featureColor = feature.color === 'sky' ? 'sky' : 'blue'; // Determine color prefix
                return (
                    <motion.div
                        key={index}
                        variants={staggerItem}
                        whileHover={{ y: -6, scale: 1.03, boxShadow: `0 15px 30px -5px rgba(59, 130, 246, 0.15)` }} // Enhanced hover
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className={`bg-white p-7 rounded-xl shadow-lg transition-all duration-300 ease-out border border-gray-200/60 hover:border-${featureColor}-300/80 flex flex-col cursor-pointer relative group overflow-hidden`} // Increased padding, enhanced border/shadow
                    >
                        {/* Subtle Gradient Glow on Hover via pseudo-element */}
                        <div className={`absolute -inset-px rounded-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 bg-gradient-to-br from-${featureColor}-100 via-transparent to-transparent -z-10 pointer-events-none`}></div>

                        {/* Updated Icon Styling */}
                        <div className={`w-14 h-14 flex items-center justify-center rounded-xl bg-gradient-to-br from-${featureColor}-100 to-${featureColor}-200 mb-5 flex-shrink-0 shadow-inner border border-${featureColor}-200/50`}>
                            <feature.icon className={`w-7 h-7 text-${featureColor}-600 transition-transform duration-300 group-hover:scale-110`} />
                        </div>
                        <h3 className={`text-xl font-semibold text-blue-900 mb-2.5 group-hover:text-${featureColor}-700 transition-colors`}>{feature.title}</h3>
                        <p className="text-sm text-blue-900/70 leading-relaxed flex-grow mb-5">{feature.description}</p>
                        <a
                            href={feature.path}
                            className={`mt-auto text-${featureColor}-600 hover:text-${featureColor}-800 font-semibold inline-flex items-center text-sm group/link transition-colors duration-200`}
                        >
                            Explore Tool <ArrowRight className="ml-1.5 w-3.5 h-3.5 transition-transform duration-200 group-hover/link:translate-x-1"/>
                        </a>
                    </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

         {/* === Benefits Section === */}
        <section className="py-20 md:py-28 bg-white relative overflow-hidden">
          {/* Updated Background Shape */}
          <div className="absolute top-0 left-0 -translate-x-1/3 -translate-y-1/3 pointer-events-none opacity-80" aria-hidden="true">
            <div className="w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-sky-200/40 via-blue-100/30 to-transparent blur-[100px]"></div> {/* Updated gradient */}
          </div>
           <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 pointer-events-none opacity-60" aria-hidden="true">
            <div className="w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-blue-200/30 via-sky-100/20 to-transparent blur-[90px]"></div> {/* Added another subtle blob */}
          </div>
          <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">
              {/* Text Content */}
              <motion.div
                  variants={fadeInUpInView} initial="initial" whileInView="whileInView" viewport={{ once: true, amount: 0.3 }}
              >
                 {/* Updated Title Badge */}
                <span className="inline-block bg-gradient-to-r from-blue-100 to-sky-100 text-blue-700 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-3 shadow-sm border border-blue-200/50">Your Advantage</span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue-900 mt-1 mb-5 leading-tight tracking-tight">Stop Guessing, Start Interviewing</h2>
                <p className="text-base md:text-lg text-blue-900/70 mb-9 leading-relaxed">
                  Gain the competitive edge. Our free tools provide the clarity and optimization needed to impress recruiters and land interviews.
                </p>
                {/* List */}
                <motion.ul
                    className="space-y-5" // Increased spacing
                    variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}
                 >
                  {[
                    { icon: Clock, text: 'Save Precious Time: Instantly analyze and optimize resumes.' },
                    { icon: Target, text: 'Increase Callback Rate: Align perfectly with job requirements.' },
                    { icon: Star, text: 'Improve Application Quality: Learn ATS best practices easily.' },
                    { icon: Award, text: 'Boost Confidence: Apply knowing your resume stands out.' },
                  ].map((benefit, index) => (
                    <motion.li key={index} className="flex items-start" variants={staggerItem}>
                       {/* Updated Icon Style - Using blue gradient */}
                      <motion.div
                        initial={{ scale: 0, rotate: -90 }} whileInView={{ scale: 1, rotate: 0 }} viewport={{ once: true, amount: 0.5 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20, delay: index * 0.1 + 0.2 }}
                        className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-gradient-to-br from-sky-100 to-blue-200 mr-3.5 mt-0.5  shadow-md border border-blue-200/60"> {/* Updated style */}
                         <benefit.icon className="w-4 h-4 text-blue-600" /> {/* Updated color */}
                      </motion.div>
                      <span className="text-sm md:text-base mt-1.25 text-blue-900/80 leading-snug">{benefit.text}</span> {/* Updated color/size */}
                    </motion.li>
                  ))}
                </motion.ul>
                {/* Button */}
                 <motion.a
                    href="/scan"
                    variants={fadeInUp} initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.5 }} transition={{ delay: 0.3 }}
                    whileHover={buttonHoverBlue} // Use blue hover
                    whileTap={tapScale}
                    className="mt-12 inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-semibold text-base rounded-full shadow-lg hover:shadow-xl transition duration-300 ease-out group cursor-pointer"> {/* Increased padding */}
                   Try the Scanner Now <Zap className="ml-2 w-4.5 h-4.5 transition-transform duration-300 group-hover:scale-110"/>
                 </motion.a>
              </motion.div>

              {/* Visual Element - Enhanced with Blue Theme */}
              <motion.div
                className="relative mt-10 lg:mt-0 h-[420px] md:h-[520px] rounded-2xl overflow-hidden shadow-2xl border-2 border-blue-100/70" // Increased size, roundness, shadow
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                 {/* Updated Background Gradient */}
                 <div className="absolute inset-0 bg-gradient-to-br from-sky-300 via-blue-400 to-blue-500 flex items-center justify-center p-8">
                    {/* Central Icon */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
                        viewport={{ once: true, amount: 0.5 }}
                    >
                        <motion.div
                          animate={{ scale: [1, 1.04, 1] }}
                          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                         >
                            <FileSearch className="w-28 h-28 text-white/80 drop-shadow-lg" /> {/* Increased size, added drop shadow */}
                        </motion.div>
                    </motion.div>
                 </div>
                 {/* Updated Decorative Shapes */}
                 <motion.div
                    initial={{ x: 60, y: 60, opacity: 0, rotate: -20 }} whileInView={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                    transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }} viewport={{ once: true }}
                    className="absolute -bottom-12 -right-12 w-40 h-40 bg-gradient-to-tl from-sky-400/50 to-transparent rounded-full -z-10 blur-xl" // Updated gradient/size/blur
                 />
                 <motion.div
                    initial={{ x: -60, y: -60, opacity: 0, rotate: 15 }} whileInView={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                    transition={{ duration: 1.2, delay: 0.7, ease: "easeOut" }} viewport={{ once: true }}
                    className="absolute -top-12 -left-12 w-48 h-48 bg-gradient-to-br from-blue-400/50 to-transparent rounded-full -z-10 blur-xl" // Updated gradient/size/blur
                 />
                 {/* Floating icons - Updated Colors & Positions */}
                  <motion.div animate={{ y: [0, -10, 0], x: [0, 5, 0], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} className="absolute top-[20%] left-[15%] pointer-events-none"><Check className="w-6 h-6 text-white drop-shadow-md"/></motion.div>
                  <motion.div animate={{ y: [0, 8, 0], x: [0, -6, 0], opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} className="absolute bottom-[25%] right-[18%] pointer-events-none"><Target className="w-5 h-5 text-white drop-shadow-md"/></motion.div>
                  <motion.div animate={{ y: [0, -7, 0], x: [0, 4, 0], opacity: [0.4, 0.6, 0.4] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }} className="absolute top-[35%] right-[30%] pointer-events-none"><Star className="w-4 h-4 text-white drop-shadow-md"/></motion.div>
                  <motion.div animate={{ y: [0, 9, 0], x: [0, -5, 0], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }} className="absolute bottom-[40%] left-[25%] pointer-events-none"><Award className="w-5 h-5 text-white drop-shadow-md"/></motion.div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer /> {/* Ensure Footer is imported or included */}
    </>
  );
};

export default Home;