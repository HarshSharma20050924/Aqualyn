import React, { useState } from 'react';
import { HelpCircle, Search, MessageSquare, Key, ShieldAlert, Bug, ChevronDown, ChevronUp, Mail, ExternalLink } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: 'general' | 'security' | 'troubleshooting';
}

export default function HelpScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'general' | 'security' | 'troubleshooting'>('all');

  const faqs: FAQItem[] = [
    {
      category: 'general',
      question: "Is Aqualyn completely free and open source?",
      answer: "Yes. Aqualyn is proudly open-source and built with complete transparency. There are no premium paywalls, no advertising trackers, and our complete source code repository can be audited publicly on GitHub."
    },
    {
      category: 'security',
      question: "Where are my secret chat keys and data stored?",
      answer: "Aqualyn operates under a local-first architecture. All cryptographic handshakes, conversation profiles, and message logs exist inside a sandboxed partition directly on your physical hardware storage. We run no database clusters to copy or archive your personal interactions."
    },
    {
      category: 'troubleshooting',
      question: "Why am I failing to receive immediate inbound push notifications?",
      answer: "Because Aqualyn does not hold or monitor active permanent sockets on a centralized server for security, background delivery relies on our distributed queue tasks or local device wake handles. Ensure battery optimization exceptions are granted for the application."
    },
    {
      category: 'security',
      question: "Can I retrieve my conversations if I lose my phone?",
      answer: "No. Because your keys are explicitly tied to your device enclave module, our systems possess absolutely zero fallback vectors to restore historical message trees. If you wipe application storage or destroy your device, data is permanently unrecoverable."
    },
    {
      category: 'troubleshooting',
      question: "How do I securely pair a secondary desk console or device?",
      answer: "Navigate onto your application profile settings control frame, select 'Link Secondary Console', and point your device camera window directly onto the ephemeral encrypted handshake QR vector exposed on your screen layout target."
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="pt-32 pb-24 px-6 md:px-12 max-w-5xl mx-auto min-h-[80vh]">
      
      {/* Header Accent Branding */}
      <div className="text-center max-w-3xl mx-auto space-y-6 mb-16">
        <span className="text-xs text-primary font-black uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/15">
          Knowledge Base
        </span>
        <h1 className="text-4xl md:text-6xl font-black font-headline text-on-surface tracking-tight leading-tight">
          Help & Center Hub
        </h1>
        <p className="text-on-surface-variant font-medium text-lg md:text-xl leading-relaxed">
          Search system documentation, discover localized architecture guides, or submit troubleshooting reports instantly.
        </p>
        <div className="w-20 h-1.5 liquid-gradient mx-auto rounded-full"></div>
      </div>

      {/* Glassmorphic Search Bar Inputs */}
      <div className="relative max-w-2xl mx-auto mb-12">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 w-5 h-5" />
        <input
          type="text"
          placeholder="Search for quick solutions (e.g., encryption keys, synchronization status)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-surface-container-lowest border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:border-primary/40 transition-colors shadow-xl"
        />
      </div>

      {/* Category Toggle Anchors */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {(['all', 'general', 'security', 'troubleshooting'] as const).map((category) => (
          <button
            key={category}
            onClick={() => { setActiveCategory(category); setActiveFAQ(null); }}
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border cursor-pointer ${
              activeCategory === category
                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105'
                : 'bg-surface-container/40 text-on-surface-variant border-white/5 hover:bg-surface-container/80'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Grid Quick Info Panels */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        <div className="bg-surface-container/30 p-6 rounded-2xl border border-outline-variant/10 shadow-md">
          <Key className="w-8 h-8 text-primary mb-4" />
          <h3 className="text-lg font-bold text-on-surface mb-2">Cryptographic Setup</h3>
          <p className="text-on-surface-variant text-sm font-medium leading-relaxed">
            Learn how end-to-end multi-ratchet protocols secure your device's identity handshakes natively.
          </p>
        </div>
        <div className="bg-surface-container/30 p-6 rounded-2xl border border-outline-variant/10 shadow-md">
          <MessageSquare className="w-8 h-8 text-secondary mb-4" />
          <h3 className="text-lg font-bold text-on-surface mb-2">Local Databases</h3>
          <p className="text-on-surface-variant text-sm font-medium leading-relaxed">
            Understand how localized SQLite/SQLCipher nodes encrypt database tables under AES-256 blocks.
          </p>
        </div>
        <div className="bg-surface-container/30 p-6 rounded-2xl border border-outline-variant/10 shadow-md">
          <ShieldAlert className="w-8 h-8 text-primary mb-4" />
          <h3 className="text-lg font-bold text-on-surface mb-2">Security Audits</h3>
          <p className="text-on-surface-variant text-sm font-medium leading-relaxed">
            Review detailed guidelines detailing system memory isolation and leak validation routines.
          </p>
        </div>
      </div>

      {/* Accordion FAQ Area */}
      <div className="bg-surface-container-lowest/80 rounded-[2.5rem] p-6 md:p-10 border border-outline-variant/15 shadow-xl mb-16">
        <h2 className="text-2xl md:text-3xl font-black text-on-surface mb-8 font-headline">Frequently Asked Questions</h2>
        
        {filteredFaqs.length === 0 ? (
          <p className="text-on-surface-variant font-medium text-center py-8">
            No support documents matching your specific inquiry were encountered.
          </p>
        ) : (
          <div className="space-y-4">
            {filteredFaqs.map((faq, index) => {
              const isOpen = activeFAQ === index;
              return (
                <div 
                  key={index} 
                  className="border-b border-white/5 last:border-0 pb-4 last:pb-0"
                >
                  <button
                    onClick={() => setActiveFAQ(isOpen ? null : index)}
                    className="w-full flex items-center justify-between text-left py-3 text-on-surface font-bold text-base md:text-lg hover:text-primary transition-colors cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? <ChevronUp className="w-5 h-5 shrink-0 ml-4 text-primary" /> : <ChevronDown className="w-5 h-5 shrink-0 ml-4 text-on-surface-variant" />}
                  </button>
                  
                  {isOpen && (
                    <div className="text-on-surface-variant font-medium text-sm md:text-base leading-relaxed pt-2 pb-4 animate-fade-in">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Support Submission Callout Footer Banner */}
      <div className="bg-primary/10 p-8 rounded-3xl border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5 text-center md:text-left flex-col md:flex-row">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
            <Bug className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h4 className="text-on-surface font-bold text-lg m-0">Still encountering system friction?</h4>
            <p className="m-0 text-sm text-on-surface-variant font-medium mt-1">
              Submit granular system logs or request technical service support channels safely.
            </p>
          </div>
        </div>
        <a 
          href="mailto:support@amoghchakra.com"
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all hover:scale-105 no-underline shadow-lg shadow-primary/20 cursor-pointer"
        >
          <Mail className="w-4 h-4" />
          Contact Support
        </a>
      </div>

    </div>
  );
}