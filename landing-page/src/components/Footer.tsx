import React from 'react';
import { Link } from 'react-router-dom';
import { Linkedin, Facebook, Instagram, Github, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full pt-16 pb-8 px-6 md:px-12 bg-[#1c1e21] text-white font-body">
      <div className="max-w-7xl mx-auto">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Column 1: Socials */}
          <div className="flex flex-col gap-5">
            <a href="https://www.linkedin.com/in/harsh-sharma-44476339b/" className="flex items-center gap-3 text-sm font-semibold hover:text-primary transition-colors text-white/90">
              <Linkedin className="w-5 h-5" /> LinkedIn
            </a>
            <a href="https://github.com/HarshSharma20050924/" className="flex items-center gap-3 text-sm font-semibold hover:text-primary transition-colors text-white/90">
              <Github className="w-5 h-5" /> GitHub
            </a>
            <a href="https://www.instagram.com/aqualyn2026?igsh=MThvOWd5bm9udHY1aA==" className="flex items-center gap-3 text-sm font-semibold hover:text-primary transition-colors text-white/90">
              <Instagram className="w-5 h-5" /> Instagram
            </a>
          </div>

          {/* Column 2: Privacy & Terms */}
          <div className="flex flex-col gap-4">
            <Link to="/privacy" className="text-sm font-semibold text-white/90 hover:text-primary hover:underline transition-all">Privacy</Link>
            <Link to="/security" className="text-sm font-semibold text-white/90 hover:text-primary hover:underline transition-all">Trust & Safety</Link>
            <Link to="/privacy" className="text-sm font-semibold text-white/90 hover:text-primary hover:underline transition-all">Data Policy</Link>
            <Link to="/privacy" className="text-sm font-semibold text-white/90 hover:text-primary hover:underline transition-all">Privacy Protections</Link>
          </div>

          {/* Column 3: Resources */}
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-bold mb-1">Resources</h4>
            <a href="/#faq" className="text-sm font-semibold text-white/90 hover:text-primary hover:underline transition-all">FAQ</a>
            <a href="/#screenshots" className="text-sm font-semibold text-white/90 hover:text-primary hover:underline transition-all">Success Stories</a>
            <Link to="/contribution" className="text-sm font-semibold text-white/90 hover:text-primary hover:underline transition-all">Resource Library</Link>
            <Link to="/security" className="text-sm font-semibold text-white/90 hover:text-primary hover:underline transition-all">Compliance Center</Link>
          </div>
          
          {/* Column 4: Brand */}
          <div className="flex flex-col items-start lg:items-end gap-4 lg:text-right">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-white rounded-full p-1.5 shadow-lg flex items-center justify-center">
        <img src="/Aqualyn Screens/aqualyn.png" alt="Aqualyn" className="w-full h-full object-contain" />
      </div>
      <span className="font-headline font-black text-white text-2xl tracking-tight">Aqualyn</span>
    </div>
    <p className="text-sm text-white/60 font-semibold max-w-[200px]">
      The future of local-first communication. Secure, fluid, and isolated.
    </p>
  </div>
</div>

{/* Bottom Bar */}
<div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10 text-xs font-semibold text-white/60 gap-4">
  <p>© {new Date().getFullYear()} Aqualyn Communications</p>
  <button className="flex items-center gap-1.5 hover:text-white transition-colors bg-transparent border-none cursor-pointer text-white/60 font-bold uppercase tracking-wider">
    EN <Globe className="w-4 h-4" />
  </button>
</div>

</div>
</footer>
);
}