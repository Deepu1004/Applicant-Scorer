import React, { useState, useRef, memo } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  FileSearch,
  Award,
  Zap,
  Check,
  ArrowRight,
  User,
  Briefcase,
  BarChart3,
  CloudUpload,
  Target,
  Clock,
  FileText,
  Files,
  Cpu,
  Github,
  Linkedin,
  Search,
  ArrowUpRight,
  Star,
  LayoutGrid,
  MessageSquare,
  LoaderCircle,
  CheckCircle, // Ensure CheckCircle is imported
} from "lucide-react";

// --- Animation Variants ---
const fadeInUp = {
  initial: { opacity: 0, y: 25 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.6, -0.05, 0.01, 0.99] },
  },
  exit: {
    opacity: 0,
    y: 15,
    transition: { duration: 0.4, ease: [0.6, -0.05, 0.01, 0.99] },
  },
};
const fadeInUpInView = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] },
};
const staggerContainer = (stagger = 0.1, delay = 0.1) => ({
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: stagger,
      delayChildren: delay,
    },
  },
});
const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.6, -0.05, 0.01, 0.99] },
  },
};
const cardHover = {
  y: -6,
  scale: 1.03,
  boxShadow: "0 18px 35px -8px rgba(59, 130, 246, 0.18)",
  transition: { type: "spring", stiffness: 280, damping: 20 },
};
const tapScale = { scale: 0.97 };
const buttonHoverBlue = {
  scale: 1.04,
  y: -2,
  boxShadow: "0 12px 28px -6px rgba(59, 130, 246, 0.45)",
  transition: { type: "spring", stiffness: 320, damping: 15 },
};
const buttonHoverOutline = {
  scale: 1.04,
  y: -2,
  boxShadow: "0 8px 18px -4px rgba(59, 130, 246, 0.18)",
  backgroundColor: "rgba(239, 246, 255, 0.9)",
  borderColor: "rgb(147, 197, 253)",
  transition: { type: "spring", stiffness: 320, damping: 15 },
};

// Style object with will-change hint
const transformOpacityStyle = { willChange: "transform, opacity" };

// --- Subtle Grain Overlay (Optional, Memoized) ---
const GrainOverlay = memo(() => (
  <div
    className="fixed inset-0 pointer-events-none opacity-[0.02] z-50"
    style={{
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 600 600' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.6' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
    }}
  />
));
GrainOverlay.displayName = "GrainOverlay";

// --- Footer Component (Memoized) ---
const Footer = memo(() => (
  <footer className="bg-gradient-to-b from-gray-950 to-black text-gray-400 py-16 md:py-20 relative overflow-hidden border-t border-gray-800/50">
    <div
      className="absolute inset-0 opacity-[0.02]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    ></div>
    <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[80vw] max-w-4xl h-48 bg-gradient-to-t from-transparent via-blue-800/20 to-transparent blur-3xl pointer-events-none opacity-50 rounded-full"></div>
    <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ amount: 0.1, once: true }}
        variants={staggerContainer(0.1, 0.1)}
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-14"
      >
        {/* Col 1: Brand & Socials */}
        <motion.div variants={staggerItem} className="col-span-2 lg:col-span-2">
          <a href="/" className="flex items-center mb-5 group w-fit">
            <motion.div
              className="w-8 h-8 bg-gradient-to-br from-blue-500 to-sky-400 rounded-lg flex items-center justify-center mr-3 shadow-md group-hover:shadow-blue-500/40 transition-shadow duration-300"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
            >
              <Zap className="w-4 h-4 text-white transform group-hover:rotate-[-10deg] transition-transform duration-300" />
            </motion.div>
            <span className="text-xl font-bold text-white tracking-tight group-hover:text-sky-300 transition-colors">
              ApplicantScorer
            </span>
          </a>
          <p className="text-sm mb-7 leading-relaxed text-gray-300/80 max-w-xs">
            Free AI tools for job seekers: optimize resumes, generate JDs, and
            accelerate your career.
          </p>
          <div className="flex space-x-5">
            <motion.a
              whileHover={{ y: -3, color: "#38bdf8" }}
              transition={{ type: "spring", stiffness: 300 }}
              href="https://github.com/Deepu1004"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="text-gray-400 hover:text-sky-300"
            >
              <Github className="w-5 h-5" />
            </motion.a>
            <motion.a
              whileHover={{ y: -3, color: "#38bdf8" }}
              transition={{ type: "spring", stiffness: 300 }}
              href="https://www.linkedin.com/in/saideepakvaranasi/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="text-gray-400 hover:text-sky-300"
            >
              <Linkedin className="w-5 h-5" />
            </motion.a>
          </div>
        </motion.div>
        {/* Col 2: Tools */}
        <motion.div variants={staggerItem}>
          <h5 className="font-semibold text-gray-200/90 mb-5 uppercase text-xs tracking-wider">
            Tools
          </h5>
          <ul className="space-y-3 text-sm">
            <li><a href="/scan" className="hover:text-sky-300 transition-colors duration-200 flex items-center group">Resume Scanner <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0.5"/></a></li>
            <li><a href="https://snap-resume-builder.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-sky-300 transition-colors duration-200 flex items-center group">SnapResume Builder <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0.5"/></a></li>
            <li><a href="/bulk-upload" className="hover:text-sky-300 transition-colors duration-200 flex items-center group">Bulk Upload <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0.5"/></a></li>
            <li><a href="/job-creation" className="hover:text-sky-300 transition-colors duration-200 flex items-center group">JD Generator <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0.5"/></a></li>
          </ul>
        </motion.div>
         {/* Col 3: Navigation */}
         <motion.div variants={staggerItem}>
            <h5 className="font-semibold text-gray-200/90 mb-5 uppercase text-xs tracking-wider">Navigate</h5>
            <ul className="space-y-3 text-sm">
                <li><a href="#features" className="hover:text-sky-300 transition-colors duration-200">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-sky-300 transition-colors duration-200">How It Works</a></li>
                <li><a href="#benefits" className="hover:text-sky-300 transition-colors duration-200">Benefits</a></li>
                 <li><a href="#resume-builder" className="hover:text-sky-300 transition-colors duration-200">Builder</a></li>
            </ul>
        </motion.div>
        {/* Col 4: Legal */}
        <motion.div variants={staggerItem}>
            <h5 className="font-semibold text-gray-200/90 mb-5 uppercase text-xs tracking-wider">Legal</h5>
            <ul className="space-y-3 text-sm">
                <li><a href="/contact" className="hover:text-sky-300 transition-colors duration-200">Contact</a></li>
                <li><a href="/privacy" className="hover:text-sky-300 transition-colors duration-200">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-sky-300 transition-colors duration-200">Terms of Service</a></li>
            </ul>
        </motion.div>
      </motion.div>
      <div className="h-px bg-gradient-to-r from-transparent via-sky-700/20 to-transparent my-8"></div>
      <div className="text-center text-xs text-gray-500">
        © {new Date().getFullYear()} ApplicantScorer. Crafted with{" "}
        <motion.span initial={{ scale: 1 }} animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} className="inline-block mx-0.5 text-red-400/80">❤️</motion.span>{" "}
        by Sai Deepak.
      </div>
    </div>
  </footer>
));
Footer.displayName = "Footer";

const preview = "/Scan.png";

// --- Main Home Component ---
const Home = () => {
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const { scrollYProgress } = useScroll();

  // Parallax setup
  const heroImageY = useTransform(scrollYProgress, [0, 0.3], [0, -15], { clamp: false });
  const blob1Y = useTransform(scrollYProgress, [0, 1], [0, 40], { clamp: false });
  const blob2Y = useTransform(scrollYProgress, [0, 1], [0, -35], { clamp: false });
  const parallaxStyle = { willChange: "transform" };

  // --- NEW Variants for the Benefits Section Visual ---
  const visualContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3, }
    }
  };
  const layerVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95, rotateX: -10 },
    show: {
      opacity: 1, y: 0, scale: 1, rotateX: 0,
      transition: { duration: 0.7, ease: [0.4, 0, 0.2, 1] }
    }
  };
  const dataDotVariants = (duration = 3, delay = 0) => ({
    initial: { y: -15, opacity: 0 },
    animate: {
      y: [null, 115],
      opacity: [0, 0.8, 0.8, 0],
      scale: [0.5, 1, 1, 0.5],
      transition: { duration: duration, delay: delay, repeat: Infinity, ease: "linear" }
    }
  });
  const scanLineVariants = {
    hidden: { y: '-100%', opacity: 0.5 },
    show: {
      y: ['-100%', '200%'],
      opacity: [0.5, 0.8, 0.5],
      transition: { duration: 2.5, delay: 0.8, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }
    }
  };
  // --- End of NEW Variants ---

  return (
    <>
      {/* <GrainOverlay /> */}
      <main className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-100 to-sky-100/50 overflow-x-hidden font-sans antialiased relative text-gray-800">
        <style>{`
            @keyframes gradient-blue-anim { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
            .animate-gradient-blue { background-size: 250% 250%; animation: gradient-blue-anim 6s linear infinite; }
            @keyframes pulse-glow-1 { 0%, 100% { transform: scale(1); opacity: 0.5; filter: blur(130px); } 50% { transform: scale(1.06); opacity: 0.65; filter: blur(140px); } }
            .animate-pulse-glow-1 { animation: pulse-glow-1 15s ease-in-out infinite; }
            @keyframes pulse-glow-2 { 0%, 100% { transform: scale(1); opacity: 0.4; filter: blur(140px); } 50% { transform: scale(1.05); opacity: 0.55; filter: blur(150px); } }
            .animate-pulse-glow-2 { animation: pulse-glow-2 17s ease-in-out infinite 1s; }
            @keyframes aurora { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
            .aurora-bg { background: radial-gradient(ellipse at top left, rgba(186, 230, 253, 0.3), transparent 65%), radial-gradient(ellipse at bottom right, rgba(191, 219, 254, 0.3), transparent 65%); background-size: 300% 300%; animation: aurora 28s ease-in-out infinite; }
            .grid-bg { background-image: linear-gradient(to right, rgba(59, 130, 246, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(59, 130, 246, 0.05) 1px, transparent 1px); background-size: 50px 50px; }
            .section-bg-white { background-color: #ffffff; position: relative; z-index: 1; }
            .section-bg-gradient { background-image: linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 50%, #dbeafe 100%); position: relative; z-index: 1; }
            @keyframes icon-pop-in { 0% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1); } }
            /* Remove core-glow if not used */
            /* @keyframes core-glow { ... } */
            /* .animate-core-glow { ... } */
        `}</style>

        {/* === Hero Section === */}
        <section className="relative overflow-hidden pt-36 pb-24 md:pt-48 md:pb-32 isolate aurora-bg">
          <motion.div style={{ ...parallaxStyle, y: blob1Y }} className="absolute -right-40 -top-60 w-[650px] h-[650px] bg-gradient-to-br from-sky-400/30 via-blue-400/25 to-sky-500/20 rounded-full filter pointer-events-none animate-pulse-glow-1" />
          <motion.div style={{ ...parallaxStyle, y: blob2Y }} className="absolute -left-60 bottom-[-12rem] w-[750px] h-[750px] bg-gradient-to-tr from-blue-400/25 via-sky-400/20 to-blue-500/15 rounded-full filter pointer-events-none animate-pulse-glow-2" />
          <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
            <motion.div className="text-center max-w-4xl mx-auto" style={transformOpacityStyle}>
              <motion.h1 variants={fadeInUp} initial="initial" animate="animate" className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-blue-600 to-blue-700 mb-6 leading-tight tracking-tighter pb-1 animate-gradient-blue"> Optimize. Scan. Succeed. </motion.h1>
              <motion.p variants={fadeInUp} initial="initial" animate="animate" transition={{ delay: 0.1 }} className="text-lg md:text-xl text-blue-900/80 mb-12 max-w-3xl mx-auto leading-relaxed font-medium"> Instantly analyze your resume against job descriptions with our free AI scanner. Boost your ATS score and land more interviews. </motion.p>
              <motion.div variants={staggerContainer(0.12, 0.25)} initial="hidden" animate="show" className="flex flex-col sm:flex-row justify-center items-center gap-5 mb-24">
                <motion.a href="/scan" variants={staggerItem} whileHover={buttonHoverBlue} whileTap={tapScale} className="w-full sm:w-auto px-9 py-4 bg-gradient-to-r from-blue-600 to-sky-500 text-white text-base font-semibold rounded-full shadow-lg hover:shadow-xl transform transition duration-300 ease-out flex items-center justify-center group cursor-pointer">Scan Resume Now <Search className="ml-2.5 w-5 h-5 transform transition-transform duration-300 group-hover:rotate-12" /></motion.a>
                <motion.a href="#how-it-works" variants={staggerItem} whileHover={buttonHoverOutline} whileTap={tapScale} className="w-full sm:w-auto px-9 py-4 bg-white/80 backdrop-blur-sm text-blue-700 text-base font-semibold rounded-full shadow-md border-2 border-blue-200/90 hover:text-blue-800 transform transition duration-300 ease-out flex items-center justify-center group cursor-pointer">How It Works <ArrowRight className="ml-2 w-4.5 h-4.5 text-blue-500 group-hover:text-blue-700 transition-colors duration-200 group-hover:translate-x-1" /></motion.a>
              </motion.div>
            </motion.div>
            <motion.div style={{ ...parallaxStyle, y: heroImageY }} variants={fadeInUp} initial="initial" animate="animate" transition={{ delay: 0.4, duration: 0.8 }} className="relative mx-auto max-w-6xl rounded-xl overflow-hidden border-2 border-blue-200/40 shadow-2xl shadow-blue-500/15 bg-gradient-to-br from-white/90 via-sky-50/70 to-blue-50/60 backdrop-blur-md">
              <div className="bg-gradient-to-r from-gray-100 via-sky-50 to-blue-100/80 h-10 flex items-center px-4 rounded-t-xl border-b border-blue-200/70"> <div className="flex space-x-2"> <div className="w-3.5 h-3.5 bg-red-400 rounded-full border border-red-500/40"></div> <div className="w-3.5 h-3.5 bg-yellow-400 rounded-full border border-yellow-500/40"></div> <div className="w-3.5 h-3.5 bg-green-400 rounded-full border border-green-500/40"></div> </div> <div className="flex-grow text-center text-[13px] text-blue-900/70 font-medium tracking-normal">ApplicantScorer - Results</div> <div className="w-16"></div> </div>
              <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-sky-100 to-blue-100">
                <AnimatePresence> {!heroImageLoaded && ( <motion.div key="loader" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="absolute inset-0 bg-white flex items-center justify-center rounded-b-xl z-10"> <div className="flex flex-col items-center text-blue-600/80"> <LoaderCircle className="w-8 h-8 animate-spin mb-3 text-blue-500" /> <p className="text-sm font-semibold">Loading Preview...</p> </div> </motion.div> )} </AnimatePresence>
                <img src={preview} alt="Resume Analysis Preview" loading="lazy" decoding="async" width={1152} height={720} className="absolute inset-0 w-full h-full object-cover object-top rounded-b-xl transition-opacity duration-700 ease-in-out" style={{ opacity: heroImageLoaded ? 1 : 0 }} onLoad={() => setHeroImageLoaded(true)} onError={() => setHeroImageLoaded(true)} />
              </div>
            </motion.div>
          </div>
        </section>

        {/* === How It Works Section === */}
        <section id="how-it-works" className="py-24 md:py-32 section-bg-white grid-bg">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <motion.div className="text-center mb-20 md:mb-24" variants={fadeInUpInView} initial="initial" whileInView="whileInView" style={transformOpacityStyle} > <span className="inline-block bg-gradient-to-r from-sky-100 to-blue-100 text-blue-700 text-sm font-semibold tracking-wide px-4 py-1.5 rounded-full mb-4 shadow-sm border border-blue-200/60">How It Works</span> <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-5 tracking-tight">Instant Insights in 3 Steps</h2> <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed"> Effortlessly check your resume's compatibility and get actionable feedback. </p> </motion.div>
            <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16" variants={staggerContainer(0.12, 0.15)} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} >
              {[ { icon: CloudUpload, title: 'Upload Resume', description: 'Drag & drop or select your resume file (PDF, DOCX accepted).' }, { icon: FileText, title: 'Paste Job Details', description: 'Copy the job description you\'re targeting into the text area.' }, { icon: BarChart3, title: 'Get Instant Score', description: 'Receive your match percentage, keyword analysis, and improvement tips.' }, ].map((step, index) => (
                  <motion.div key={index} className="flex flex-col items-center text-center group" variants={staggerItem} style={transformOpacityStyle} >
                      <div className="relative mb-8"> <motion.div whileHover={{ scale: 1.08, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.25)" }} transition={{ type: 'spring', stiffness: 300, damping: 15 }} className="w-24 h-24 flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 via-blue-100 to-blue-200/90 text-blue-600 shadow-lg border-2 border-white/90"> <step.icon className="w-11 h-11 transition-transform duration-300 group-hover:scale-105" /> </motion.div> <motion.span initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true, amount: 0.6 }} transition={{ type: "spring", stiffness: 300, damping: 15, delay: index * 0.15 + 0.4 }} className="absolute -top-3 -left-3 flex items-center justify-center w-9 h-9 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold text-sm rounded-full shadow-md border-2 border-white"> {index + 1} </motion.span> </div>
                      <h3 className="text-xl lg:text-2xl font-semibold mb-3 text-gray-800 group-hover:text-blue-700 transition-colors duration-200">{step.title}</h3> <p className="text-base text-gray-600 leading-relaxed px-2">{step.description}</p>
                  </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* === Core Features Section === */}
        <section id="features" className="py-24 md:py-32 section-bg-gradient">
          <div className="absolute inset-0 opacity-[0.03] grid-bg -z-0"></div>
          <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
            <motion.div className="text-center mb-20 md:mb-24" variants={fadeInUpInView} initial="initial" whileInView="whileInView" style={transformOpacityStyle} > <span className="inline-block bg-gradient-to-r from-white via-blue-50 to-white text-blue-700 text-sm font-semibold tracking-wide px-4 py-1.5 rounded-full mb-4 shadow-sm border border-blue-200/50">Core Features</span> <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-5 tracking-tight">Your Job Search Toolkit</h2> <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed"> Access a suite of AI tools designed to give you a competitive edge, completely free. </p> </motion.div>
            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10" variants={staggerContainer(0.1, 0.1)} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} >
              {[ { icon: Files, title: 'Bulk Resume Upload', description: 'Efficiently process and screen multiple resumes at once. Ideal for recruiters, coaches, or comparing different versions.', path: '/bulk-upload', color: 'sky' }, { icon: FileText, title: 'JD Generator Assistant', description: 'Craft compelling and keyword-rich job descriptions or refine existing ones with AI-powered suggestions for maximum impact.', path: '/job-creation', color: 'sky' }, { icon: FileSearch, title: 'AI Resume Scanner', description: 'In-depth analysis comparing your resume to job descriptions. Highlights keyword matches, gaps, and suggests ATS optimizations.', path: '/scan', color: 'sky' }, ].map((feature, index) => { const color = feature.color === 'sky' ? 'sky' : 'blue'; return (
                <motion.div key={index} variants={staggerItem} whileHover={cardHover} className={`bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-lg transition-all duration-300 ease-out border border-gray-200/70 hover:border-${color}-300/90 flex flex-col relative group overflow-hidden`} style={transformOpacityStyle} >
                    <div className={`absolute -inset-px rounded-xl opacity-0 group-hover:opacity-60 transition-opacity duration-400 bg-gradient-to-br from-${color}-100/80 via-transparent to-transparent -z-10 pointer-events-none`}></div>
                    <div className={`w-16 h-16 flex items-center justify-center rounded-xl bg-gradient-to-br from-${color}-100 to-${color}-200 mb-6 flex-shrink-0 shadow-inner border border-${color}-200/60`}> <feature.icon className={`w-8 h-8 text-${color}-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-3deg]`} /> </div>
                    <h3 className={`text-xl font-semibold text-gray-900 mb-3 group-hover:text-${color}-700 transition-colors`}>{feature.title}</h3> <p className="text-sm text-gray-600 leading-relaxed flex-grow mb-6">{feature.description}</p>
                    <a href={feature.path} className={`mt-auto text-${color}-600 hover:text-${color}-800 font-semibold inline-flex items-center text-sm group/link transition-colors duration-200 self-start relative z-10`} > Explore Tool <ArrowRight className="ml-1.5 w-4 h-4 transition-transform duration-200 group-hover/link:translate-x-1" /> </a>
                </motion.div>
              ); })}
            </motion.div>
          </div>
        </section>

        {/* === SnapResume Builder Section === */}
        <section id="resume-builder" className="py-24 md:py-32 section-bg-white relative overflow-hidden">
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-gradient-to-tr from-sky-200/30 via-blue-100/20 to-transparent rounded-full blur-3xl opacity-80 pointer-events-none -z-10"></div>
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-gradient-to-bl from-blue-200/20 via-sky-100/10 to-transparent rounded-full blur-3xl opacity-70 pointer-events-none -z-10"></div>
          <div className="absolute inset-0 opacity-[0.03] grid-bg -z-10"></div>
          <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              <motion.div variants={fadeInUpInView} initial="initial" whileInView="whileInView" transition={{ delay: 0.1 }} style={transformOpacityStyle} > <span className="inline-block bg-gradient-to-r from-blue-100 to-sky-100 text-blue-700 text-sm font-semibold tracking-wide px-4 py-1.5 rounded-full mb-5 shadow-sm border border-blue-200/60">Build Your Resume</span> <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-1 mb-6 leading-tight tracking-tight">Don't Have a Resume Yet?</h2> <p className="text-lg text-gray-600 mb-10 leading-relaxed"> Craft a professional, ATS-optimized resume effortlessly with <strong className="font-semibold text-blue-600">SnapResume Builder</strong>. Choose modern templates, get AI suggestions, and build a standout resume in minutes. </p> <motion.a href="https://snap-resume-builder.vercel.app/" target="_blank" rel="noopener noreferrer" whileHover={buttonHoverBlue} whileTap={tapScale} className="inline-flex items-center px-9 py-4 bg-gradient-to-r from-blue-600 to-sky-500 text-white text-base font-semibold rounded-full shadow-lg hover:shadow-xl transition duration-300 ease-out group cursor-pointer"> Try SnapResume Builder <Briefcase className="ml-2.5 w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" /> </motion.a> </motion.div>
              <motion.div className="relative mt-12 lg:mt-0 h-[400px] md:h-[480px] flex items-center justify-center" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} variants={staggerContainer(0.15, 0.3)} > <motion.div variants={fadeInUp} className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-sky-100/50 to-transparent rounded-3xl" /> {[0, 1, 2].map((i) => ( <motion.div key={i} className="absolute w-[70%] max-w-sm h-[80%] bg-white rounded-xl shadow-xl border border-gray-200/80 overflow-hidden" style={{ originX: 0.5, originY: 1, zIndex: 3 - i, willChange: 'transform, opacity' }} variants={{ hidden: { opacity: 0, y: 40 + i * 10, rotate: i * 2 + 5, scale: 0.9 }, show: { opacity: 1, y: i * -10, x: i * 8, rotate: i * 1.5, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15, opacity: { duration: 0.5 } } } }} > <div className={`p-4 h-full ${i === 0 ? 'bg-gradient-to-br from-blue-50/50 to-sky-50/50' : 'bg-white'}`}> <div className={`h-5 w-1/3 rounded ${i === 0 ? 'bg-blue-200/70' : 'bg-gray-200/70'} mb-3`}></div> <div className={`h-2.5 rounded ${i === 0 ? 'bg-blue-100' : 'bg-gray-100'} mb-2 w-11/12`}></div> <div className={`h-2.5 rounded ${i === 0 ? 'bg-blue-100' : 'bg-gray-100'} mb-2 w-10/12`}></div> <div className={`h-2.5 rounded ${i === 0 ? 'bg-blue-100' : 'bg-gray-100'} mb-4 w-11/12`}></div> <div className={`h-2.5 rounded ${i === 0 ? 'bg-blue-100/80' : 'bg-gray-100/80'} mb-2 w-10/12`}></div> <div className={`h-2.5 rounded ${i === 0 ? 'bg-blue-100/80' : 'bg-gray-100/80'} mb-2 w-9/12`}></div> </div> {i === 0 && ( <motion.div className="absolute bottom-4 right-4 w-10 h-10 bg-gradient-to-br from-blue-500 to-sky-400 rounded-full shadow-lg flex items-center justify-center" initial={{scale: 0}} animate={{scale: 1}} transition={{delay: 1.2, type: 'spring', stiffness: 200}} > <LayoutGrid className="w-5 h-5 text-white"/> </motion.div> )} </motion.div> ))} </motion.div>
            </div>
          </div>
        </section>

        {/* === Benefits Section (NEW Abstract Data Flow Visual) === */}
        <section id="benefits" className="py-24 md:py-32 section-bg-gradient relative overflow-hidden">
          {/* Subtle Backgrounds */}
          <div className="absolute top-0 left-0 w-full h-full opacity-50 -z-10" style={{ background: 'radial-gradient(circle at 10% 20%, rgba(191, 219, 254, 0.2), transparent 60%), radial-gradient(circle at 80% 70%, rgba(186, 230, 253, 0.15), transparent 60%)' }}></div>
          <div className="absolute inset-0 opacity-[0.03] grid-bg -z-0"></div>

          <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              {/* Text Content (Left Side) */}
              <motion.div
                variants={fadeInUpInView}
                initial="initial"
                whileInView="whileInView"
                style={transformOpacityStyle}
              >
                 <span className="inline-block bg-gradient-to-r from-white via-blue-50 to-white text-blue-700 text-sm font-semibold tracking-wide px-4 py-1.5 rounded-full mb-5 shadow-sm border border-blue-200/50">The ApplicantScorer Edge</span>
                 <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-1 mb-6 leading-tight tracking-tight">Turn Applications into Interviews</h2>
                 <p className="text-lg text-gray-600 mb-10 leading-relaxed">
                     Stop the guesswork. Our AI analysis provides the clarity and optimization needed to impress ATS and recruiters, significantly boosting your chances.
                 </p>
                 <motion.ul
                    className="space-y-5"
                    variants={staggerContainer(0.1, 0.2)}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.2 }}
                 >
                    {[
                        { icon: Check, text: 'Gain Confidence: Apply knowing your resume is truly optimized.' },
                        { icon: Target, text: 'Increase Callbacks: Align perfectly with job requirements.' },
                        { icon: Clock, text: 'Save Valuable Time: Get instant feedback, skip manual checks.' },
                        { icon: Star, text: 'Improve Quality: Learn ATS best practices as you go.' },
                    ].map((benefit, index) => (
                        <motion.li key={index} className="flex items-center" variants={staggerItem} style={transformOpacityStyle}>
                            <motion.div
                                initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true, amount: 0.6 }}
                                transition={{ type: "spring", stiffness: 300, damping: 15, delay: index * 0.1 + 0.3 }}
                                className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mr-3.5 shadow-md border border-white/50">
                                <benefit.icon className="w-4 h-4 text-white" />
                            </motion.div>
                            <span className="text-base md:text-lg text-gray-700 font-medium">{benefit.text}</span>
                        </motion.li>
                    ))}
                 </motion.ul>
                 <motion.a
                    href="/scan"
                    variants={fadeInUp} initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.5 }} transition={{ delay: 0.5 }}
                    whileHover={buttonHoverBlue} whileTap={tapScale}
                    className="mt-12 inline-flex items-center px-9 py-4 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-semibold text-base rounded-full shadow-lg hover:shadow-xl transition duration-300 ease-out group cursor-pointer">
                    Get My Score <ArrowRight className="ml-2.5 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                 </motion.a>
              </motion.div>

              {/* Right Side: Abstract Data Flow Visual */}
              <motion.div
                className="relative w-full mt-16 lg:mt-0 h-[450px] md:h-[500px] flex items-center justify-center" // Use flex centering
                variants={visualContainerVariants} // Stagger children
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.4 }} // Trigger when visible
              >
                 {/* Optional: Soft Background Glow */}
                  <motion.div
                      className="absolute inset-0 scale-[1.3]" // Slightly larger than container
                      variants={layerVariants} // Use layer variant for entry
                      transition={{ delay: 0.1, duration: 0.9 }} // Slightly delayed entry
                   >
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-sky-400/10 via-blue-500/15 to-sky-400/10 blur-3xl opacity-80"></div>
                  </motion.div>

                  {/* Perspective Container - gives depth */}
                  <div className="w-[300px] h-[350px] md:w-[350px] md:h-[400px]" style={{ perspective: '1000px' }}>

                      {/* Layer 1 (Back) */}
                      <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg overflow-hidden"
                          variants={layerVariants}
                          style={{ transformStyle: 'preserve-3d', transform: 'translateZ(-40px) rotateX(5deg)' }} // Pushed back, slightly tilted
                      >
                          {/* Data dots starting from this layer */}
                          {Array.from({ length: 8 }).map((_, i) => (
                              <motion.div
                                  key={`dot-back-${i}`}
                                  className="absolute w-1.5 h-1.5 bg-sky-300 rounded-full shadow-sm"
                                  style={{ left: `${10 + i * 11}%`, willChange: 'transform, opacity' }} // Spread out horizontally
                                  variants={dataDotVariants(2.5 + Math.random() * 1, 0.5 + Math.random() * 1)} // Random duration/delay
                                  initial="initial"
                                  animate="animate" // Inherit from parent's whileInView
                             />
                          ))}
                      </motion.div>

                      {/* Layer 2 (Middle) */}
                      <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-white/15 to-white/10 backdrop-blur-md border border-white/30 rounded-xl shadow-xl overflow-hidden"
                          variants={layerVariants}
                          style={{ transformStyle: 'preserve-3d' }} // Default depth
                      >
                           {/* Data dots starting from this layer */}
                           {Array.from({ length: 10 }).map((_, i) => (
                              <motion.div
                                  key={`dot-mid-${i}`}
                                  className="absolute w-1.5 h-1.5 bg-blue-300 rounded-full"
                                  style={{ left: `${5 + i * 9}%`, willChange: 'transform, opacity' }}
                                  variants={dataDotVariants(2 + Math.random() * 0.8, 0.8 + Math.random() * 1.2)}
                                  initial="initial"
                                  animate="animate"
                             />
                          ))}
                           {/* Subtle Scan Line */}
                           <motion.div
                              className="absolute left-0 top-0 w-full h-1 bg-sky-200/60 blur-[3px]"
                              variants={scanLineVariants}
                              initial="hidden"
                              animate="show" // Uses parent's whileInView
                          />
                      </motion.div>

                      {/* Layer 3 (Front) - Hinting at success */}
                      <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/15 backdrop-blur-lg border border-white/40 rounded-xl shadow-2xl overflow-hidden flex items-center justify-center p-4" // Added flex centering for icons
                          variants={layerVariants}
                          style={{ transformStyle: 'preserve-3d', transform: 'translateZ(40px) rotateX(-5deg)' }} // Pulled forward, slight opposite tilt
                      >
                          {/* Organized elements / Success indicators */}
                          <motion.div
                              className="flex space-x-4 opacity-0" // Initially hidden, animate with delay
                              animate={{ opacity: 1 }} // Animate from parent's whileInView
                              transition={{ delay: 1.5, duration: 0.8 }} // Appear after layers
                          >
                               <CheckCircle className="w-7 h-7 text-emerald-400/80 opacity-80 drop-shadow-md" />
                               {/* Simple abstract bar representation */}
                               <div className="flex items-end space-x-1.5 h-8">
                                  <div className="w-2 h-4/5 rounded bg-gradient-to-b from-sky-300 to-blue-400 opacity-70"></div>
                                  <div className="w-2 h-full rounded bg-gradient-to-b from-sky-300 to-blue-400 opacity-90"></div>
                                  <div className="w-2 h-3/5 rounded bg-gradient-to-b from-sky-300 to-blue-400 opacity-60"></div>
                               </div>
                               <Target className="w-7 h-7 text-blue-400/80 opacity-80 drop-shadow-md" />
                          </motion.div>
                      </motion.div>

                  </div> {/* End Perspective Container */}

              </motion.div> {/* End Visual Container */}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Home;