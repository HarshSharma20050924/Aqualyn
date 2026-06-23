import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const onBack = () => { window.location.href = "https://aqualyn.vercel.app"; };

  return (
    <>
      {/* FIXED HEADER NAVBAR */}
      <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-4 md:px-12 bg-surface-container-lowest/75 backdrop-blur-[20px] shadow-[0_32px_64px_-15px_rgba(0,87,189,0.06)] border-b border-outline-variant/10">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 flex items-center justify-center">
            <img src="/Aqualyn Screens/aqualyn.png" alt="Aqualyn Logo" className="w-full h-full object-contain drop-shadow-md" />
          </div>
          <Link to="/" className="no-underline">
            <h1 className="text-2xl font-headline font-black tracking-tighter text-on-surface leading-none">Aqualyn</h1>
            <span className="text-[10px] font-semibold text-secondary font-mono tracking-widest uppercase">Messaging App</span>
          </Link>
        </div>

        {/* Desktop Navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-on-surface-variant">
          <Link className="hover:text-primary transition-colors tracking-wide" to="/">Home</Link>
          <a className="hover:text-primary transition-colors tracking-wide" href="/#features">Features</a>
          <a className="hover:text-primary transition-colors tracking-wide" href="/#screenshots">Gallery</a>
          <Link className="hover:text-primary transition-colors tracking-wide" to="/security">Security</Link>
          <Link className="hover:text-primary transition-colors tracking-wide" to="/privacy">Privacy</Link>
          <Link className="hover:text-primary transition-colors tracking-wide" to="/contribution">Open Source</Link>
        </nav>

        <div className="flex items-center gap-3">
          {/* Main Web App Entry */}
          <button 
            onClick={onBack} 
            className="liquid-gradient text-white px-6 py-2.5 rounded-full font-headline font-semibold text-sm shadow-lg hover:scale-95 transition-all active:scale-90 relative overflow-hidden group border-0 cursor-pointer hidden sm:block"
          >
            <span className="relative z-10 font-bold flex items-center gap-1.5 justify-center">
              Launch Web App
            </span>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>

          {/* Mobile menu trigger */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors border-0 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* MOBILE DROP-DOWN MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-0 w-full bg-surface-container-lowest z-40 p-6 flex flex-col gap-4 text-center border-b border-outline-variant/15 shadow-xl md:hidden"
          >
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="py-2.5 font-bold text-on-surface hover:text-primary">Home</Link>
            <a href="/#features" onClick={() => setMobileMenuOpen(false)} className="py-2.5 font-bold text-on-surface hover:text-primary">Features</a>
            <a href="/#screenshots" onClick={() => setMobileMenuOpen(false)} className="py-2.5 font-bold text-on-surface hover:text-primary">Gallery</a>
            <Link to="/security" onClick={() => setMobileMenuOpen(false)} className="py-2.5 font-bold text-on-surface hover:text-primary">Security</Link>
            <Link to="/privacy" onClick={() => setMobileMenuOpen(false)} className="py-2.5 font-bold text-on-surface hover:text-primary">Privacy</Link>
            <Link to="/contribution" onClick={() => setMobileMenuOpen(false)} className="py-2.5 font-bold text-on-surface hover:text-primary">Open Source</Link>
            <button 
              onClick={() => { onBack(); setMobileMenuOpen(false); }}
              className="mt-2 w-full py-3.5 liquid-gradient rounded-xl font-bold font-headline text-white border-0 shadow-lg cursor-pointer"
            >
              Open Web App Live
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
