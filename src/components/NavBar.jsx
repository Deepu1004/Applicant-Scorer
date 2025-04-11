import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutGrid, // Changed Home icon
    FileScan,
    Upload,
    Files,
    Menu,
    X
} from 'lucide-react';
import logo from '/logo2.png'; // Assuming logo import is correct

// --- Animation Variants (remain the same) ---
const navbarEntry = { hidden: { y: -60, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 } }, };
const mobileMenuContainer = { hidden: { opacity: 0, transition: { duration: 0.2, ease: "easeOut", when: "afterChildren" } }, visible: { opacity: 1, transition: { duration: 0.2, ease: "easeIn", when: "beforeChildren", staggerChildren: 0.05 } }, };
const mobileMenuItem = { hidden: { opacity: 0, x: -15 }, visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 200, damping: 25 } }, };

// --- Noise Texture Component (remains the same) ---
const NoiseOverlay = () => (
    <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
);

// --- Main Navbar Component ---
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredPath, setHoveredPath] = useState(null);
  const location = useLocation();

  const navItems = [
    { href: '/', label: 'Home', icon: LayoutGrid },
    { href: '/scan', label: 'Scan Resume', icon: FileScan },
    { href: '/job-creation', label: 'Generate JD', icon: Upload },
    { href: '/bulk-upload', label: 'Bulk Upload', icon: Files },
  ];

  return (
    <motion.nav
        variants={navbarEntry}
        initial="hidden"
        animate="visible"
        // Light Blue Theme: Subtle gradient, adjusted blur/opacity
        className="fixed top-0 left-0 right-0 bg-gradient-to-r from-sky-50/85 via-blue-50/85 to-indigo-50/85 backdrop-blur-lg text-blue-900 shadow-sm z-50 border-b border-blue-200/40"
    >
      <NoiseOverlay />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Adjusted text color */}
          <Link to="/" className="flex items-center space-x-2 group cursor-pointer flex-shrink-0 -ml-1">
          <motion.div
              whileHover={{ scale: 1.05, rotate: -5 }}
              transition={{ type: 'spring', stiffness: 350, damping: 15 }}
              // Define size, add overflow-hidden, keep rounding, remove padding
              className="h-9 w-9 rounded-lg bg-white/50 shadow-sm border border-slate-200/30 overflow-hidden flex-shrink-0" // Added explicit size, overflow-hidden, flex-shrink-0, removed p-1.5
            >
              <img
                src={logo}
                className="w-full h-full object-cover" 
                alt="Applicant Scorer Logo"
              />
            </motion.div>
            {/* Adjusted text color for better contrast */}
            <span className="font-bold text-xl tracking-tight text-blue-900">
              Applicant<span className="text-blue-600">Scorer</span>
            </span>
          </Link>

          {/* Desktop Navigation - Light Blue Theme */}
          <div
            className="hidden md:flex items-center space-x-2 relative" // Slightly reduced space-x
            onMouseLeave={() => setHoveredPath(null)}
          >
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.href}
                  href={item.href}
                  isActive={isActive}
                  isHovered={hoveredPath === item.href}
                  onMouseEnter={() => setHoveredPath(item.href)}
                >
                  <motion.div
                    whileHover={{ scale: 1}}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  >
                    {/* Updated icon colors */}
                    <item.icon className={`h-[18px] w-[18px] transition-colors duration-200 ${isActive ? 'text-blue-600' : 'text-blue-400 group-hover:text-blue-600'}`} />
                  </motion.div>
                  {/* Updated text colors */}
                  <span className={`relative z-10 transition-colors duration-200 text-sm ${isActive ? 'font-medium text-blue-700' : 'text-blue-900/80 group-hover:text-blue-900'}`}>
                    {item.label}
                  </span>
                   {(isActive || hoveredPath === item.href) && (
                       <motion.div
                            layoutId="nav-underline-desktop"
                            // Updated underline color
                            className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 250, damping: 25, mass: 0.5 }}
                        />
                    )}
                </NavLink>
              );
            })}
             <AnimatePresence>
                {hoveredPath && (
                    <motion.div
                        layoutId="nav-hover-bg-desktop"
                        // Updated hover background
                        className="absolute inset-0 h-full rounded-md bg-blue-100/50 -z-10"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                     />
                 )}
             </AnimatePresence>
          </div>

          {/* Mobile menu button - Adjusted colors */}
          <div className="md:hidden">
            <motion.button  whileHover={{ scale: 1.1 }} onClick={() => setIsMenuOpen(!isMenuOpen)} className="inline-flex items-center justify-center p-1.5 rounded-lg bg-blue-100/60 hover:bg-blue-200/50 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:ring-offset-1" aria-label="Toggle menu">
                <AnimatePresence initial={false} mode="wait"><motion.div key={isMenuOpen ? 'close' : 'open'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>{isMenuOpen ? <X className="h-6 w-6 text-blue-700" /> : <Menu className="h-6 w-6 text-blue-700" />}</motion.div></AnimatePresence>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation - Light Blue Theme */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div key="mobile-menu" variants={mobileMenuContainer} initial="hidden" animate="visible" exit="hidden"
            // Updated background for mobile menu
            className={`md:hidden absolute top-full left-0 right-0 shadow-xl bg-gradient-to-b from-sky-50/95 via-blue-50/95 to-indigo-50/95 backdrop-blur-lg border-t border-blue-200/50`}
          >
            <div className="px-3 pt-3 pb-4 space-y-1">
              {navItems.map((item, index) => {
                const isActive = location.pathname === item.href;
                return (
                 <React.Fragment key={item.href}>
                    <MobileNavLink
                        href={item.href}
                        isActive={isActive}
                        onClick={() => setIsMenuOpen(false)}
                    >
                        <motion.span variants={mobileMenuItem} className="flex items-center space-x-3">
                            {/* Updated mobile icon container & colors */}
                            <span className={`p-1.5 rounded-md ${isActive ? 'bg-blue-100' : 'bg-blue-50/70'}`}>
                                <item.icon className={`h-5 w-5 transition-colors ${isActive ? 'text-blue-600' : 'text-blue-500'}`} />
                            </span>
                            {/* Updated mobile text colors */}
                            <span className={`transition-colors ${isActive ? 'font-semibold text-blue-700' : 'font-medium text-blue-900'}`}>
                                {item.label}
                            </span>
                        </motion.span>
                    </MobileNavLink>
                    {/* Updated divider color */}
                    {index < navItems.length - 1 && (
                        <motion.div variants={mobileMenuItem} className="h-px bg-blue-200/60 mx-3 my-1"></motion.div>
                    )}
                 </React.Fragment>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

// Desktop NavLink Component - Adjusted padding
const NavLink = ({ href, children, isActive, isHovered, onMouseEnter }) => {
  return (
    <Link
      to={href}
      onMouseEnter={onMouseEnter}
      // Adjusted padding
      className="relative flex items-center space-x-1.5 rounded-md px-3 py-2.5 transition-colors duration-200 text-sm z-10 group"
    >
      {children}
    </Link>
  );
};


// Mobile NavLink Component - Updated active/hover backgrounds
const MobileNavLink = ({ href, children, isActive, onClick }) => (
  <Link to={href} onClick={onClick}
      // Updated mobile link backgrounds
      className={`block rounded-lg px-3 py-2.5 text-base transition-colors duration-200 ${
          isActive ? 'bg-blue-100/70' : 'hover:bg-blue-100/50'
      }`}
  >
    {children}
  </Link>
);

export default Navbar;