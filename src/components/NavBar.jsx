import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutGrid, // Dashboard/Home icon
    FileScan,   // Scan icon
    Upload,     // Generate JD icon (representing creation/upload)
    Files,      // Bulk Upload icon
    Menu,       // Mobile menu open
    X           // Mobile menu close
} from 'lucide-react';
import logo from '/logo2.png'; // Assuming logo import is correct

// --- Animation Variants --- (Keep as is)
const navbarEntry = {
    hidden: { y: -70, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 } },
};
const mobileMenuOverlay = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2, ease: "easeIn" } },
    exit: { opacity: 0, transition: { duration: 0.25, ease: "easeOut" } }
};
const mobileMenuContainer = {
    hidden: { y: "-100%", opacity: 0.8, transition: { duration: 0.3, ease: [0.32, 0, 0.67, 0], when: "afterChildren" } },
    visible: { y: "0%", opacity: 1, transition: { duration: 0.4, ease: [0.33, 1, 0.68, 1], when: "beforeChildren", staggerChildren: 0.07, delayChildren: 0.1 } },
    exit: { y: "-100%", opacity: 0.8, transition: { duration: 0.3, ease: [0.32, 0, 0.67, 0], when: "afterChildren", staggerChildren: 0.05, staggerDirection: -1 } }
};
const mobileMenuItem = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 180, damping: 25 } },
    exit: { opacity: 0, x: -15, transition: { duration: 0.15 }}
};
const highlightPillTransition = {
    type: 'spring',
    stiffness: 280,
    damping: 30,
    mass: 0.8
};

// --- Noise Texture Component --- (Keep as is)
const NoiseOverlay = () => (
    <div className="absolute inset-0 pointer-events-none opacity-[0.025]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.7\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
);

// --- Main Navbar Component ---
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { href: '/', label: 'Home', icon: LayoutGrid },
    { href: '/bulk-upload', label: 'Bulk Upload', icon: Files },
    { href: '/job-creation', label: 'Generate JD', icon: Upload },
    { href: '/scan', label: 'Scan Resume', icon: FileScan },
  ];

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);


  return (
    <>
      <motion.nav
          variants={navbarEntry}
          initial="hidden"
          animate="visible"
          className="fixed top-0 left-0 right-0 bg-gradient-to-r from-sky-100/80 via-blue-100/80 to-indigo-100/80 backdrop-blur-xl text-blue-950 shadow-md z-50 border-b border-blue-200/60"
      >
        <NoiseOverlay />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 relative">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2.5 group cursor-pointer flex-shrink-0 -ml-1 z-10">
              <motion.div
                whileHover={{ scale: 1.08, rotate: -6 }}
                transition={{ type: 'spring', stiffness: 350, damping: 15 }}
                className="h-9 w-9 rounded-lg bg-white/60 shadow-sm border border-slate-200/40 overflow-hidden flex-shrink-0 backdrop-blur-sm"
              >
                <img src={logo} className="w-full h-full object-cover" alt="Applicant Scorer Logo"/>
              </motion.div>
              <span className="font-bold text-xl tracking-tight text-blue-950">
                Applicant<span className="text-blue-600">Scorer</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1 relative">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={location.pathname === item.href}
                />
              ))}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden z-10">
              <motion.button
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="inline-flex items-center justify-center p-1.5 rounded-lg bg-sky-100/70 hover:bg-sky-200/60 text-blue-700 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:ring-offset-1 focus:ring-offset-sky-50"
                  aria-label="Toggle menu">
                  <AnimatePresence initial={false} mode="wait">
                      <motion.div
                          key={isMenuOpen ? 'close' : 'open'}
                          initial={{ rotate: -90, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: 90, opacity: 0 }}
                          transition={{ duration: 0.2 }}>
                          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                      </motion.div>
                  </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="mobile-menu-backdrop"
              variants={mobileMenuOverlay} initial="hidden" animate="visible" exit="exit"
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            />
             {/* Menu Content */}
            <motion.div
              key="mobile-menu"
              variants={mobileMenuContainer} initial="hidden" animate="visible" exit="exit"
              className={`md:hidden fixed top-0 left-0 right-0 shadow-xl bg-gradient-to-b from-sky-100/95 via-blue-100/95 to-indigo-100/95 backdrop-blur-xl border-b border-blue-200/60 z-40 pt-16`}
            >
              <div className="px-3 pt-5 pb-6 space-y-2">
                {/* Corrected Mapping: Pass data as props to MobileNavLink */}
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href; // Calculate isActive here
                  return (
                    <MobileNavLink
                        key={item.href}
                        href={item.href}
                        label={item.label} // Pass label as prop
                        icon={item.icon}   // Pass Icon component as prop
                        isActive={isActive} // Pass calculated isActive as prop
                        onClick={() => setIsMenuOpen(false)} // Keep onClick if needed
                    />
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// --- Desktop NavLink Component --- (Keep as is)
const NavLink = ({ href, label, icon: Icon, isActive }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      to={href}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative flex items-center space-x-1.5 rounded-md px-4 py-2 transition-colors duration-200 text-sm z-10 group"
    >
      <AnimatePresence>
          {(isActive || isHovered) && (
              <motion.div
                  layoutId="nav-highlight"
                  className="absolute inset-0 h-full rounded-lg bg-gradient-to-r from-sky-100 via-blue-100/90 to-indigo-100/80 shadow-sm -z-10 border border-white/30"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.15 } }}
                  exit={{ opacity: 0, transition: { duration: 0.15, delay: 0.05 } }}
                  transition={highlightPillTransition}
              />
          )}
      </AnimatePresence>
      <motion.div
          initial={false}
          animate={{ scale: isHovered || isActive ? 1.05 : 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      >
          <Icon className={`h-[18px] w-[18px] transition-colors duration-150 ${isActive ? 'text-blue-600' : isHovered ? 'text-blue-500' : 'text-sky-600 group-hover:text-blue-500'}`} />
      </motion.div>
      <span className={`relative z-10 transition-colors duration-150 ${isActive ? 'font-semibold text-blue-700' : isHovered ? 'text-blue-800 font-medium' : 'text-gray-700 group-hover:text-blue-800 font-medium'}`}>
          {label}
      </span>
    </Link>
  );
};


// --- Mobile NavLink Component (Corrected Definition) ---
// It now receives label and icon as props and handles internal styling
const MobileNavLink = ({ href, label, icon: Icon, isActive, onClick }) => (
  <motion.div variants={mobileMenuItem}> {/* Apply item animation variant here */}
    <Link to={href} onClick={onClick}
        className={`block rounded-lg px-3 py-3 text-base transition-colors duration-200 ${
            isActive ? 'bg-blue-100 shadow-inner' : 'hover:bg-sky-100/60' // Style the link container
        }`}
    >
      {/* Construct the styled children inside MobileNavLink */}
      <span className="flex items-center space-x-3">
          {/* Icon container styled based on isActive */}
          <span className={`p-2 rounded-lg ${isActive ? 'bg-blue-100 shadow-sm' : 'bg-sky-100/70'}`}>
              {/* Icon component styled based on isActive */}
              <Icon className={`h-5 w-5 transition-colors ${isActive ? 'text-blue-600' : 'text-sky-700'}`} />
          </span>
          {/* Label text styled based on isActive */}
          <span className={`transition-colors text-base ${isActive ? 'font-semibold text-blue-700' : 'font-medium text-blue-950'}`}>
              {label}
          </span>
      </span>
    </Link>
  </motion.div>
);

export default Navbar;