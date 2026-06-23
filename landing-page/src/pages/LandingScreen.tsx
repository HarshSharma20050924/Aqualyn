import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Waves, 
  PlayCircle, 
  ShieldCheck, 
  Droplets, 
  RefreshCcw, 
  Lock, 
  ShieldAlert, 
  ChevronRight, 
  ChevronLeft, 
  Download, 
  Menu, 
  X, 
  MessageSquare, 
  Users, 
  Clock,
  Info,
  Linkedin,
  Facebook,
  Instagram,
  Globe
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Link } from 'react-router-dom';

export default function LandingScreen({ onBack }: { onBack: () => void }) {
  const { addToast } = useAppContext();
  
  // FAQ state
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);

  // APK Phone Mockup interactive states
  const [mockupTab, setMockupTab] = useState<'chats' | 'contacts' | 'settings'>('chats');
  const [messages, setMessages] = useState([
    { text: "Hey! Did you check out the new Aqualyn update? It feels so smooth.", isMe: false, sender: "Sarah Jenkins", time: "10:12 AM" },
    { text: "Yeah! It's super fast. Plus, messages delete automatically after reading. 💫", isMe: true, sender: "Me", time: "10:13 AM" },
    { text: "Exactly! And the best part is that everything is stored directly on your phone.", isMe: false, sender: "Sarah Jenkins", time: "10:13 AM" }
  ]);
  const [inputText, setInputText] = useState("");
  const [searchContact, setSearchContact] = useState("");

  const mockContacts = [
    { name: "Sarah Jenkins", role: "Co-worker", status: "Online", initials: "SJ", color: "bg-primary/20 text-primary" },
    { name: "Alex Carter", role: "Designer", status: "Offline", initials: "AC", color: "bg-neutral-200 text-neutral-700" },
    { name: "Clara Moss", role: "Engineer", status: "Online", initials: "CM", color: "bg-purple-100 text-purple-700" },
    { name: "Marcus Vance", role: "Product Manager", status: "Away", initials: "MV", color: "bg-amber-100 text-amber-700" }
  ];

  // Current APK screenshot gallery slide
  const [currentSlide, setCurrentSlide] = useState(0);
  const screenshotSlides = [
    {
      title: "Organized Chats",
      subtitle: "Find conversations instantly",
      desc: "Our chat list keeps your most active and unread conversations right at your fingertips.",
      badge: "CHATS",
      phoneTheme: "from-cyan-900 to-slate-900",
      type: "image",
      image: "/Aqualyn Screens/chatlist.png"
    },
    {
      title: "Real-time Messaging",
      subtitle: "Fluid and dynamic bubbles",
      desc: "Send messages, images, and videos in a beautiful, responsive layout that breathes.",
      badge: "ROOMS",
      phoneTheme: "from-slate-900 to-teal-950",
      type: "image",
      image: "/Aqualyn Screens/conversationRoom.png"
    },
    {
      title: "Global Connect",
      subtitle: "Reach out to the network",
      desc: "Search contacts globally while maintaining absolute privacy and security.",
      badge: "SEARCH",
      phoneTheme: "from-emerald-950 to-neutral-900",
      type: "image",
      image: "/Aqualyn Screens/GlobalSearch.png"
    },
    {
      title: "Social Feed",
      subtitle: "Stories & updates",
      desc: "Share your moments exclusively with your verified contacts in an ephemeral feed.",
      badge: "STORIES",
      phoneTheme: "from-rose-950 to-neutral-900",
      type: "image",
      image: "/Aqualyn Screens/feed.png"
    }
  ];

  const handleDownloadAPK = () => {
    window.open("https://github.com/HarshSharma20050924/Aqualyn/releases/latest", "_blank");
    if (addToast) {
      addToast("Directing to Github release catalog for the latest production APK.", "info");
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    const newMsg = {
      text: inputText,
      isMe: true,
      sender: "Me",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, newMsg]);
    const originalText = inputText;
    setInputText("");

    setTimeout(() => {
      let reply = "Your messages are stored strictly on this phone.";
      if (originalText.toLowerCase().includes("vibe") || originalText.toLowerCase().includes("design")) {
        reply = "Designed to be neat, readable, and comfortable for long-term use.";
      } else if (originalText.toLowerCase().includes("hello") || originalText.toLowerCase().includes("hi")) {
        reply = "Hello! Try checking the 'Settings' tab to see how local locks work.";
      }
      
      setMessages(prev => [...prev, {
        text: reply,
        isMe: false,
        sender: "Sarah Jenkins",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1000);
  };

  const filteredContacts = mockContacts.filter(c => 
    c.name.toLowerCase().includes(searchContact.toLowerCase())
  );

  return (
    <div className="w-full relative">
        
        {/* HERO SECTION - GENTLE GRADIENTS AND TEXT PAIRINGS */}
        <section className="relative px-6 md:px-12 py-16 lg:py-24 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-8 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black tracking-widest uppercase">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Aqualyn v2.4 Build
              </div>

              <h2 className="text-5xl lg:text-7xl font-headline font-black tracking-[-0.03em] leading-[1.08] text-on-surface">
                Communication as <br/>
                <span className="bg-gradient-to-br from-primary to-[#006668] bg-clip-text text-transparent">Clear as Water.</span>
              </h2>

              <p className="text-xl text-on-surface-variant max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
                Simple, fast, and completely secure chatting. Have high-contrast conversations, delete messages automatically, and keep your history entirely saved on your own phone without central cloud backups.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button 
                  onClick={handleDownloadAPK} 
                  className="w-full sm:w-auto liquid-gradient hover:shadow-[0_20px_40px_-10px_rgba(0,87,189,0.3)] hover:scale-[1.02] active:scale-95 text-white px-8 py-4 rounded-full font-headline font-black text-lg shadow-lg border-0 cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5 text-white" />
                  Download APK
                </button>
                <button 
                  onClick={onBack} 
                  className="w-full sm:w-auto bg-surface-container-low hover:bg-surface-container text-primary px-8 py-4 rounded-full font-headline font-bold text-lg flex items-center justify-center gap-2 border border-outline-variant/15 active:scale-95 transition-all cursor-pointer"
                >
                  <PlayCircle className="w-6 h-6 text-primary" />
                  Try Web Demo
                </button>
              </div>

              <div className="pt-6 border-t border-outline-variant/15 grid grid-cols-3 gap-6 text-center lg:text-left max-w-md mx-auto lg:mx-0">
                <div>
                  <h4 className="text-xl font-bold font-headline text-on-surface">100%</h4>
                  <p className="text-xs text-on-surface-variant uppercase font-mono tracking-wider">Device Stored</p>
                </div>
                <div>
                  <h4 className="text-xl font-bold font-headline text-on-surface">Zero</h4>
                  <p className="text-xs text-on-surface-variant uppercase font-mono tracking-wider">Cloud Copies</p>
                </div>
                <div>
                  <h4 className="text-xl font-bold font-headline text-on-surface">Private</h4>
                  <p className="text-xs text-on-surface-variant uppercase font-mono tracking-wider">No Data Selling</p>
                </div>
              </div>
            </motion.div>

            {/* HERO PHONE LIVE DEVICE GRAPHIC WITH FLOATING BADGES */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className="relative flex justify-center mt-6 lg:mt-0"
            >
              <div className="relative w-full max-w-[360px] aspect-[9/19] glass-panel rounded-[3rem] p-4 shadow-2xl border border-white/60">
                
                {/* Mobile Camera notch */}
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-30 flex items-center justify-center">
                  <div className="w-12 h-1 bg-neutral-800 rounded-full" />
                </div>

                <div className="w-full h-full rounded-[2.5rem] bg-gradient-to-br from-cyan-950 to-[#00595b] shadow-inner relative overflow-hidden flex flex-col p-4 pt-10">
                  
                  {/* Simulated App Head */}
                  <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center p-1 shadow-sm">
                        <img src="/Aqualyn Screens/aqualyn.png" alt="Logo" className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <div className="text-white text-xs font-bold leading-tight">Sarah Jenkins</div>
                        <div className="text-secondary-fixed text-[10px] font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                          Online • Secure Chat
                        </div>
                      </div>
                    </div>
                    <Lock className="w-4.5 h-4.5 text-secondary-fixed" />
                  </div>
                  
                  {/* Chat message threads inside mockup */}
                  <div className="flex-1 space-y-3.5 overflow-hidden">
                    <div className="w-[85%] p-3 bg-white/10 backdrop-blur-md rounded-2xl rounded-tl-sm text-white text-xs shadow-sm border border-white/10 leading-relaxed font-semibold">
                      Hey! Did you check out the new Aqualyn update? It feels so smooth.
                    </div>
                    <div className="w-[85%] p-3 bg-white/20 backdrop-blur-md rounded-2xl rounded-tr-sm text-white text-xs self-end ml-auto shadow-sm border border-white/20 leading-relaxed font-semibold">
                      Yeah! It's super fast. Plus, messages delete automatically after reading. 💫
                    </div>
                    <div className="w-[85%] p-3 bg-white/10 backdrop-blur-md rounded-2xl rounded-tl-sm text-white text-xs shadow-sm border border-white/10 leading-relaxed font-semibold">
                      Exactly! And the best part is that everything is stored directly on your phone.
                    </div>
                  </div>
                  
                  {/* Message Input line */}
                  <div className="mt-auto h-11 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center px-4 justify-between">
                    <span className="text-white/60 text-xs">Type a message...</span>
                    <div className="w-6 h-6 rounded-full bg-secondary shadow-lg flex items-center justify-center text-white text-xs font-bold">✓</div>
                  </div>

                </div>

                <div className="absolute inset-0 bg-gradient-to-tr from-white/15 to-transparent pointer-events-none rounded-[3rem]"></div>
              </div>

              {/* Secure verification floating layout */}
              <div className="absolute -bottom-4 -right-4 glass-panel p-4 rounded-2xl shadow-xl hidden md:block border border-outline-variant/15">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center p-2 text-on-secondary-fixed shrink-0">
                    <ShieldCheck className="w-full h-full" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider">Device Level</p>
                    <p className="text-sm font-black text-on-surface">Secure & Confidential</p>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </section>

        {/* SECTION: EVOLVED INTEGRATED FEATURES */}
        <section id="features" className="py-24 px-6 md:px-12 bg-surface-container-low/50">
          <div className="max-w-7xl mx-auto">
            
            <div className="text-center mb-16 space-y-4 max-w-xl mx-auto">
              <h3 className="text-3xl md:text-5xl font-headline font-black text-on-surface tracking-tight">
                Privacy Protection
              </h3>
              <p className="text-on-surface-variant text-sm sm:text-base font-semibold">
                An ecosystem designed to feel clean, quick, and comfortable. No log files left on third-party servers.
              </p>
              <div className="w-20 h-1.5 liquid-gradient mx-auto rounded-full"></div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              
              {/* Feature 1 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="glass-panel p-8 rounded-3xl group hover:bg-surface-container-lowest transition-all hover:-translate-y-2 border border-outline-variant/15 flex flex-col justify-between"
              >
                <div>
                  <div className="w-16 h-16 rounded-2xl liquid-gradient flex items-center justify-center mb-6 shadow-lg shadow-primary/20 p-4 shrink-0 text-white">
                    <ShieldCheck className="w-full h-full" />
                  </div>
                  <h4 className="text-xl font-headline font-black text-on-surface mb-3">Keep Chats Local</h4>
                  <p className="text-on-surface-variant text-sm leading-relaxed font-semibold">
                    We keep your chat files saved directly on your device storage without using central servers or recording data patterns.
                  </p>
                </div>
                <div className="pt-6 mt-4 border-t border-outline-variant/10 text-xs font-bold text-primary font-mono uppercase">
                  Device stored logs
                </div>
              </motion.div>

              {/* Feature 2 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="glass-panel p-8 rounded-3xl group hover:bg-surface-container-lowest transition-all hover:-translate-y-2 border border-outline-variant/15 flex flex-col justify-between"
              >
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-secondary-fixed flex items-center justify-center mb-6 shadow-lg shadow-secondary-fixed/30 p-4 shrink-0 text-on-secondary-fixed">
                    <Droplets className="w-full h-full" />
                  </div>
                  <h4 className="text-xl font-headline font-black text-on-surface mb-3">Clean Layout</h4>
                  <p className="text-on-surface-variant text-sm leading-relaxed font-semibold">
                    Enjoy a user friendly spacing and responsive interface designed to maximize reading comfort and focus.
                  </p>
                </div>
                <div className="pt-6 mt-4 border-t border-outline-variant/10 text-xs font-bold text-on-secondary-fixed font-mono uppercase">
                  Simple user styling
                </div>
              </motion.div>

              {/* Feature 3 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="glass-panel p-8 rounded-3xl group hover:bg-surface-container-lowest transition-all hover:-translate-y-2 border border-outline-variant/15 flex flex-col justify-between"
              >
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center mb-6 shadow-lg shadow-primary-container/30 p-4 shrink-0 text-white">
                    <RefreshCcw className="w-full h-full" />
                  </div>
                  <h4 className="text-xl font-headline font-black text-on-surface mb-3">No Server Backups</h4>
                  <p className="text-on-surface-variant text-sm leading-relaxed font-semibold">
                    We do not keep messages saved on computers we rent, allowing you to converse safely and cleanly offline.
                  </p>
                </div>
                <div className="pt-6 mt-4 border-t border-outline-variant/10 text-xs font-bold text-on-primary-container font-mono uppercase">
                  Zero server archiving
                </div>
              </motion.div>

            </div>

          </div>
        </section>

        {/* SECTION: PRISM CAROUSEL - WALKTHROUGH SCREENSHOTS OF APK */}
        <section id="screenshots" className="py-24 px-6 md:px-12 bg-surface text-center border-t border-outline-variant/15 relative">
          <div className="max-w-7xl mx-auto space-y-12">
            
            <div className="max-w-2xl mx-auto space-y-4">
              <span className="text-xs text-primary font-black uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/15">Fluid Design</span>
              <h2 className="text-3xl md:text-5xl font-black font-headline text-on-surface tracking-tight leading-none">
                Beautifully Crafted Interface
              </h2>
              <p className="text-on-surface-variant text-sm sm:text-base font-semibold">
                Take a closer look at the stunning, liquid-inspired design elements and ultra-clean layouts that make Aqualyn incredibly fast and effortless to use.
              </p>
              <div className="w-20 h-1.5 liquid-gradient mx-auto rounded-full"></div>
            </div>

            {/* Presentation slider framing */}
            <div className="grid lg:grid-cols-12 gap-8 items-center bg-surface-container-lowest border border-outline-variant/15 p-6 md:p-12 rounded-[2.5rem] text-left shadow-md">
              
              <div className="lg:col-span-5 space-y-6">
                <span className="inline-block px-3 py-1.5 rounded-full bg-secondary-fixed/30 text-on-secondary-fixed font-mono text-[9px] font-black uppercase">
                  {screenshotSlides[currentSlide].badge}
                </span>

                <h3 className="text-3xl font-headline font-black text-on-surface leading-tight">
                  {screenshotSlides[currentSlide].title}
                </h3>
                <h4 className="text-sm font-bold text-primary">
                  {screenshotSlides[currentSlide].subtitle}
                </h4>

                <p className="text-on-surface-variant text-sm leading-relaxed font-semibold">
                  {screenshotSlides[currentSlide].desc}
                </p>

                {/* Left/Right Slides controls */}
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setCurrentSlide(prev => prev === 0 ? screenshotSlides.length - 1 : prev - 1)}
                    className="p-3 bg-surface hover:bg-surface-container text-on-surface font-semibold rounded-full border border-outline-variant/15 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setCurrentSlide(prev => (prev + 1) % screenshotSlides.length)}
                    className="p-3 bg-surface hover:bg-surface-container text-on-surface font-semibold rounded-full border border-outline-variant/15 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Direct index selectors */}
                <div className="flex gap-2.5 pt-2">
                  {screenshotSlides.map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-2 rounded-full transition-all border-none ${currentSlide === idx ? 'w-8 bg-primary' : 'w-2 bg-outline-variant hover:bg-outline'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Graphic presentation showcasing high fidelity mockup pages */}
              <div className="lg:col-span-7 flex justify-center relative animate-fade-in">
                 {screenshotSlides[currentSlide].type === 'image' && (
                    <img 
                      src={screenshotSlides[currentSlide].image} 
                      alt="App Screen" 
                      className="w-full max-w-[320px] object-contain drop-shadow-2xl rounded-[2.5rem]" 
                    />
                 )}
              </div>

            </div>

          </div>
        </section>

        {/* SECTION: STAINLESS SECURITY AND PRIVACY GUARANTEES */}
        <section className="py-24 px-6 md:px-12 bg-surface">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            
            <div className="space-y-8">
              <span className="text-xs text-primary font-black uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/15">Security & Privacy</span>
              
              <h3 className="text-3xl md:text-5xl font-headline font-black text-on-surface tracking-tight leading-tight">
                Your private life remains truly yours.
              </h3>

              <p className="text-on-surface-variant text-base font-semibold leading-relaxed">
                Most messengers backup your entire chat history secretly to third-party database servers, risking data leaks. Aqualyn binds your communication storage lines exclusively to your physical phone's sandboxed partition. When you clean or delete a message, it is gone forever.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary-fixed/40 flex items-center justify-center text-on-secondary-fixed shrink-0 font-bold p-2">
                    <ShieldCheck className="w-full h-full" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-on-surface text-base">Direct Local Storage</h5>
                    <p className="text-on-surface-variant text-sm mt-0.5 font-semibold">Your conversations are stored strictly inside the device's private sandbox, completely safe from internet databases.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary-fixed/40 flex items-center justify-center text-on-secondary-fixed shrink-0 font-bold p-2">
                    <Lock className="w-full h-full" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-on-surface text-base">Secure Biometrics Options</h5>
                    <p className="text-on-surface-variant text-sm mt-0.5 font-semibold">Keep separate locks using your fingerprint biometric sensor so no one can access your conversations physically.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* SIMPLE DETAIL CARDS */}
            <div className="relative flex justify-center">
              <div className="glass-panel p-8 rounded-[2.5rem] border border-outline-variant/15 w-full max-w-md shadow-lg space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-outline-variant/10">
                  <h4 className="font-headline font-black text-on-surface uppercase text-xs tracking-wider">Device Privacy Status</h4>
                  <span className="text-[10px] bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded-full uppercase">SECURE</span>
                </div>

                <div className="space-y-3">
                  <div className="bg-surface-container-low p-3 rounded-xl flex items-center justify-between">
                    <span className="font-medium text-xs text-on-surface">Data Leak Prevention:</span>
                    <span className="text-xs text-green-600 font-bold uppercase">Active</span>
                  </div>

                  <div className="bg-surface-container-low p-3 rounded-xl flex items-center justify-between">
                    <span className="font-medium text-xs text-on-surface">Cloud Server Backups:</span>
                    <span className="text-xs text-neutral-600 font-bold uppercase">None</span>
                  </div>

                  <div className="bg-surface-container-low p-3 rounded-xl flex items-center justify-between">
                    <span className="font-medium text-xs text-on-surface">Privacy Level:</span>
                    <span className="text-xs text-primary font-bold uppercase">High</span>
                  </div>
                </div>

                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-3">
                  <Info className="w-5 h-5 text-primary shrink-0" />
                  <p className="text-[11px] text-on-primary-container leading-relaxed font-semibold">
                    Aqualyn APK has been designed around complete user control. We never collect or report any telemetry or user identity logs. Talk with peace of mind.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION: ACCORDION SPECIFIC FAQ SECTION */}
        <section id="faq" className="py-24 px-6 md:px-12 bg-surface-container-low/50">
          <div className="max-w-4xl mx-auto space-y-12">
            
            <div className="text-center max-w-xl mx-auto space-y-4">
              <span className="text-xs text-primary font-black uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/15">Common Queries</span>
              <h2 className="text-3xl md:text-5xl font-headline font-black text-on-surface tracking-tight leading-none">
                Frequently Answered Questions
              </h2>
              <p className="text-on-surface-variant text-sm font-semibold">
                Understand how Aqualyn keeps conversations confidential, simple, and reliable.
              </p>
              <div className="w-20 h-1.5 liquid-gradient mx-auto rounded-full"></div>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: "How does Aqualyn protect my messages compared to typical apps?",
                  a: "Typical apps backup your entire chat history secretly to commercial database servers. Aqualyn generates encryption files purely locally on your device storage partition. Deleting messages removes them completely off your phone hardware immediately."
                },
                {
                  q: "What is the screenshot detection?",
                  a: "When another participant attempts to take a screenshot within a chat view, real-time warning indicators flag the capture immediately and notify you, allowing you to protect your private threads."
                },
                {
                  q: "Can I move my chat history to a new device?",
                  a: "Yes. You can export secure localized backup archives from your old device and load them directly onto your new phone wirelessly, keeping your files safe from intermediate database servers."
                },
                {
                  q: "Is Aqualyn audited and open?",
                  a: "Yes. Aqualyn is built strictly upon audited open cryptographic libraries. No secret code or tracking scripts are added, ensuring complete transparency."
                }
              ].map((faq, idx) => (
                <div 
                  key={idx} 
                  className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 overflow-hidden transition-all"
                >
                  <button 
                    onClick={() => setActiveFAQ(activeFAQ === idx ? null : idx)}
                    className="w-full text-left px-6 py-5 font-headline font-black text-on-surface hover:text-primary transition-colors flex justify-between items-center border-none bg-transparent cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className="text-lg text-primary">{activeFAQ === idx ? '−' : '+'}</span>
                  </button>

                  <AnimatePresence>
                    {activeFAQ === idx && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 pt-1 text-on-surface-variant text-sm leading-relaxed font-semibold">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* FINAL DOWNLOADS AND ACTIONS CALL-TO-ACTION */}
        <section id="download-center" className="py-24 px-6 md:px-12 bg-surface text-center">
          <div className="max-w-4xl mx-auto glass-panel p-10 md:p-16 rounded-[3rem] shadow-2xl relative overflow-hidden border border-outline-variant/15 bg-surface-container-lowest">
            
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-container/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary-fixed/20 rounded-full blur-3xl"></div>
            
            <h3 className="text-3xl md:text-5xl font-headline font-black text-on-surface mb-6 leading-tight">
              Ready to try? <br/>Download Aqualyn today.
            </h3>
            
            <p className="text-on-surface-variant text-base md:text-lg mb-10 max-w-xl mx-auto font-medium">
              Join thousands of people who have simplified their digital communication and enjoy complete piece of mind.
            </p>

            <div className="flex flex-wrap justify-center gap-4 relative z-10 pb-4">
              <button 
                onClick={handleDownloadAPK} 
                className="bg-primary hover:bg-neutral-800 text-white px-8 py-4.5 rounded-2xl font-black flex items-center gap-3 shadow-xl transition-all hover:scale-105 border-none cursor-pointer"
              >
                <Download className="w-6 h-6 text-white" />
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold opacity-60 leading-none">Get the app</p>
                  <p className="text-lg leading-tight font-headline">Download APK</p>
                </div>
              </button>
            </div>

          </div>
        </section>
    </div>
  );
}
