import React from 'react';
import { motion } from 'motion/react';
import { Waves, PlayCircle, ShieldCheck, Droplets, RefreshCcw, File, Apple, ArrowRight } from 'lucide-react';

export default function App() {
  const onBack = () => {
    window.location.href = "https://aqualyn.vercel.app";
  };

  const handleDownloadAPK = () => {
    // Connect with GitHub release link
    window.open("https://github.com/HarshSharma20050924/Aqualyn/releases/latest", "_blank");
  };

  return (
    <div className="min-h-screen bg-surface font-body text-on-background selection:bg-secondary-container selection:text-on-secondary-container overflow-y-auto overflow-x-hidden">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-4 md:px-12 bg-surface-container-lowest/70 backdrop-blur-[20px] shadow-[0_32px_64px_-15px_rgba(0,87,189,0.06)]">
        <div className="flex items-center gap-2">
          <Waves className="text-primary w-8 h-8 stroke-[2.5]" />
          <h1 className="text-2xl font-headline font-bold tracking-tighter text-on-surface">Aqualyn</h1>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <a className="text-primary border-b-2 border-secondary pb-1 font-medium" href="#">Home</a>
          <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Features</a>
          <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Security</a>
          <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Enterprise</a>
        </nav>
        <button onClick={onBack} className="liquid-gradient text-white px-6 py-2.5 rounded-full font-headline font-semibold text-sm shadow-lg hover:scale-95 transition-transform active:scale-90 relative overflow-hidden group">
          <span className="relative z-10">Web App</span>
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute top-0 left-0 w-full h-px bg-white/20"></div>
        </button>
      </header>

      <main className="pt-24">
        {/* Hero Section */}
        <section className="relative px-6 md:px-12 py-16 lg:py-24 overflow-hidden">
          <div className="absolute top-0 right-0 -z-10 w-full h-full opacity-20 pointer-events-none">
            <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-secondary-fixed blur-[120px]"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-primary-container blur-[100px]"></div>
          </div>
          
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-8 text-center lg:text-left"
            >
              <h2 className="text-5xl lg:text-7xl font-headline font-extrabold tracking-[-0.03em] leading-[1.1] text-on-surface">
                Communication as <span className="bg-gradient-to-br from-[#0057bd] to-[#006668] bg-clip-text text-transparent">Clear as Water.</span>
              </h2>
              <p className="text-xl text-on-surface-variant max-w-xl mx-auto lg:mx-0 font-medium">
                Experience the next generation of professional messaging. Fluid, secure, and designed for deep focus.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button onClick={handleDownloadAPK} className="w-full sm:w-auto liquid-gradient text-white px-8 py-4 rounded-full font-headline font-bold text-lg shadow-[0_20px_40px_-10px_rgba(0,87,189,0.3)] hover:scale-[0.98] transition-transform">
                  Download APK
                </button>
                <button onClick={onBack} className="w-full sm:w-auto glass-panel px-8 py-4 rounded-full font-headline font-bold text-lg text-primary flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors border border-outline-variant/15">
                  <PlayCircle className="w-6 h-6" />
                  Try Web Demo
                </button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className="relative flex justify-center"
            >
              <div className="relative w-full max-w-[400px] aspect-[9/19.5] glass-panel rounded-[3rem] p-4 shadow-2xl overflow-hidden border border-white/50">
                <div className="w-full h-full rounded-[2.5rem] bg-gradient-to-br from-cyan-900 to-[#006668] shadow-inner relative overflow-hidden flex flex-col p-4">
                  {/* Chat Mockup Inside Phone */}
                  <div className="flex items-center gap-3 mb-6 mt-6">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center"><Waves className="w-6 h-6 text-white" /></div>
                    <div>
                      <div className="text-white font-bold leading-tight">Sarah Jenkins</div>
                      <div className="text-cyan-200 text-xs">Online</div>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="w-[85%] p-3 bg-white/10 backdrop-blur-md rounded-2xl rounded-tl-sm text-white text-sm shadow-sm border border-white/10">
                      Hey! Did you check out the new Aqualyn update?
                    </div>
                    <div className="w-[85%] p-3 bg-white/20 backdrop-blur-md rounded-2xl rounded-tr-sm text-white text-sm self-end ml-auto shadow-sm border border-white/20">
                      Yes! The new design is stunning. Crystal clear calls too. ✨
                    </div>
                    <div className="w-[85%] p-3 bg-white/10 backdrop-blur-md rounded-2xl rounded-tl-sm text-white text-sm shadow-sm border border-white/10">
                      I know right? And the global translation is insane!
                    </div>
                  </div>
                  
                  <div className="mt-auto h-12 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center px-4">
                    <div className="w-4 h-4 rounded-full bg-white/30 mr-2"></div>
                    <div className="text-white/50 text-sm">Type a message...</div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none rounded-[3rem]"></div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -bottom-6 -right-6 glass-panel p-4 rounded-2xl shadow-xl hidden md:block border border-outline-variant/15">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center">
                    <ShieldCheck className="text-[#004748] w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Security</p>
                    <p className="text-sm font-semibold text-on-surface">End-to-End Fluidity</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-6 md:px-12 bg-surface-container-low/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h3 className="text-3xl md:text-4xl font-headline font-extrabold text-on-surface tracking-tight">Evolved Messaging</h3>
              <div className="w-20 h-1.5 liquid-gradient mx-auto rounded-full"></div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="glass-panel p-8 rounded-3xl group hover:bg-surface-container-lowest transition-all duration-500 hover:-translate-y-2 border border-outline-variant/15"
              >
                <div className="w-16 h-16 rounded-2xl liquid-gradient flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
                  <ShieldCheck className="text-white w-8 h-8" />
                </div>
                <h4 className="text-xl font-headline font-bold text-on-surface mb-3">Liquid Security</h4>
                <p className="text-on-surface-variant leading-relaxed font-medium">
                  Our proprietary encryption layer flows seamlessly through your conversations, ensuring privacy without sacrificing speed.
                </p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="glass-panel p-8 rounded-3xl group hover:bg-surface-container-lowest transition-all duration-500 hover:-translate-y-2 border border-outline-variant/15"
              >
                <div className="w-16 h-16 rounded-2xl bg-secondary-fixed flex items-center justify-center mb-6 shadow-lg shadow-secondary-fixed/30">
                  <Droplets className="text-[#004748] w-8 h-8" />
                </div>
                <h4 className="text-xl font-headline font-bold text-on-surface mb-3">Crystal Clarity</h4>
                <p className="text-on-surface-variant leading-relaxed font-medium">
                  A minimalist interface that breathes. Designed for professionals who need to navigate complex projects with visual ease.
                </p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="glass-panel p-8 rounded-3xl group hover:bg-surface-container-lowest transition-all duration-500 hover:-translate-y-2 border border-outline-variant/15"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center mb-6 shadow-lg shadow-primary-container/30">
                  <RefreshCcw className="text-white w-8 h-8" />
                </div>
                <h4 className="text-xl font-headline font-bold text-on-surface mb-3">Fluid Sync</h4>
                <p className="text-on-surface-variant leading-relaxed font-medium">
                  Move from mobile to desktop like water through a pipe. Instant, lossless synchronization across all your professional gear.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* App Showcase */}
        <section className="py-24 px-6 md:px-12 bg-surface">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative flex justify-center">
              {/* Overlapping Mobile Mockups */}
              <div className="relative w-[280px] h-[580px] z-10 translate-x-12 translate-y-8 glass-panel rounded-[3rem] p-3 shadow-2xl border border-white/60">
                <div className="w-full h-full rounded-[2.5rem] bg-gradient-to-br from-surface to-surface-container flex flex-col overflow-hidden">
                   {/* Profile Mockup */}
                   <div className="h-48 bg-primary/10 relative">
                     <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-white p-1 shadow-lg">
                       <img src="https://i.pravatar.cc/150?img=68" alt="Profile" className="w-full h-full rounded-full object-cover" />
                     </div>
                   </div>
                   <div className="pt-14 px-6 text-center mb-6">
                     <div className="font-bold text-lg text-on-surface">Alex Carter</div>
                     <div className="text-sm text-on-surface-variant">Design Lead</div>
                   </div>
                   <div className="px-4 space-y-3 flex-1 overflow-hidden">
                     {[1,2,3,4].map(i => (
                       <div key={i} className="h-12 bg-white rounded-xl shadow-sm flex items-center px-4 gap-3">
                         <div className="w-6 h-6 rounded-md bg-primary/10"></div>
                         <div className="h-3 w-24 bg-surface-container rounded-full"></div>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
              <div className="absolute w-[280px] h-[580px] -translate-x-12 -translate-y-8 glass-panel rounded-[3rem] p-3 shadow-xl opacity-90 border border-white/40">
                <div className="w-full h-full rounded-[2.5rem] bg-white flex flex-col overflow-hidden pt-10">
                  {/* Chat List Mockup */}
                  <div className="px-6 mb-6">
                    <div className="font-bold text-2xl mb-4">Chats</div>
                    <div className="h-10 bg-surface rounded-full"></div>
                  </div>
                  <div className="px-4 space-y-4">
                    {[1,2,3,4,5].map((i, idx) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-surface-container shrink-0 overflow-hidden">
                          <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <div className="h-3 w-1/2 bg-surface-dim rounded-full mb-2"></div>
                          <div className="h-2 w-3/4 bg-surface-container rounded-full"></div>
                        </div>
                        {idx === 0 && <div className="w-3 h-3 bg-secondary-fixed rounded-full shadow-[0_0_8px_cyan]"></div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2 space-y-8">
              <h3 className="text-4xl md:text-5xl font-headline font-extrabold text-on-surface tracking-tight leading-tight">
                The <span className="bg-gradient-to-br from-[#0057bd] to-[#006668] bg-clip-text text-transparent">Liquid Professional</span>
              </h3>
              <p className="text-xl text-on-surface-variant font-medium leading-relaxed">
                Aqualyn isn't just an app; it's a calibrated environment. We've removed the noise of modern messengers to create a space where depth of thought meets speed of communication.
              </p>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#005b5d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <div>
                    <h5 className="font-bold text-on-surface">Asymmetric Workflows</h5>
                    <p className="text-on-surface-variant text-sm">Organize threads and tasks in a way that feels natural, not forced.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#005b5d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <div>
                    <h5 className="font-bold text-on-surface">Refracted Focus</h5>
                    <p className="text-on-surface-variant text-sm">Smart notifications that gently ripple instead of jarring you from your flow.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="py-24 px-6 md:px-12 bg-[#0057bd] text-white text-center">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-secondary-fixed opacity-50 text-6xl font-serif">"</div>
            <blockquote className="text-3xl md:text-4xl font-headline font-bold leading-tight tracking-tight">
              Aqualyn has transformed how our design team communicates. It's the first messenger that feels like a professional tool rather than a distraction.
            </blockquote>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full border-4 border-secondary-fixed p-1">
                <img src="https://i.pravatar.cc/150?img=47" alt="Sarah Jenkins" className="w-full h-full object-cover rounded-full" />
              </div>
              <div>
                <p className="font-bold text-lg">Sarah Jenkins</p>
                <p className="text-secondary-fixed font-medium text-sm">Creative Director at Flow Studio</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-6 md:px-12 bg-surface text-center">
          <div className="max-w-3xl mx-auto glass-panel p-12 rounded-[3rem] shadow-2xl relative overflow-hidden border border-outline-variant/15">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-container/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary-fixed/20 rounded-full blur-3xl"></div>
            <h3 className="text-3xl md:text-5xl font-headline font-extrabold text-on-surface mb-6 leading-tight">
              Ready to dive in? <br/>Download Aqualyn today.
            </h3>
            <p className="text-on-surface-variant text-lg mb-10 font-medium">
              Join 50,000+ professionals who have already simplified their digital life.
            </p>
            <div className="flex flex-wrap justify-center gap-4 relative z-10">
              <button onClick={handleDownloadAPK} className="bg-on-surface text-surface px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:scale-105 transition-transform shadow-xl">
                <Apple className="w-8 h-8" />
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold opacity-60 leading-none">Download on the</p>
                  <p className="text-lg leading-tight">App Store</p>
                </div>
              </button>
              <button onClick={handleDownloadAPK} className="bg-on-surface text-surface px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:scale-105 transition-transform shadow-xl">
                <PlayCircle className="w-8 h-8" />
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold opacity-60 leading-none">Get it on</p>
                  <p className="text-lg leading-tight">Google Play</p>
                </div>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-8 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-outline-variant/15 bg-surface-container">
        <div className="flex flex-col items-center md:items-start gap-4">
          <div className="flex items-center gap-2">
            <Waves className="text-primary w-6 h-6 stroke-[2.5]" />
            <span className="font-headline font-extrabold text-primary text-xl">Aqualyn</span>
          </div>
          <p className="font-body text-sm tracking-normal text-on-surface-variant">© {new Date().getFullYear()} Aqualyn. Fluidly Secure.</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-8">
          <a className="text-on-surface-variant text-sm font-medium hover:text-secondary transition-colors duration-300" href="#">Features</a>
          <a className="text-on-surface-variant text-sm font-medium hover:text-secondary transition-colors duration-300" href="#">Privacy</a>
          <a className="text-on-surface-variant text-sm font-medium hover:text-secondary transition-colors duration-300" href="#">Security</a>
          <a className="text-on-surface-variant text-sm font-medium hover:text-secondary transition-colors duration-300" href="#">Download</a>
        </div>
      </footer>
    </div>
  );
}
