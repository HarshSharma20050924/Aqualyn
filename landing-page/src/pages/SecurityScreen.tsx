import React from 'react';
import { ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';

export default function SecurityScreen() {
  return (
    <div className="pt-32 pb-24 px-6 md:px-12 max-w-5xl mx-auto min-h-[80vh]">
      <div className="text-center max-w-3xl mx-auto space-y-6 mb-20">
        <span className="text-xs text-primary font-black uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/15">Architecture</span>
        <h1 className="text-4xl md:text-6xl font-black font-headline text-on-surface tracking-tight leading-tight">Trust & Safety</h1>
        <p className="text-on-surface-variant font-medium text-lg md:text-xl leading-relaxed">
          Aqualyn is built to withstand extreme security requirements. Learn how our architecture protects you.
        </p>
        <div className="w-20 h-1.5 liquid-gradient mx-auto rounded-full"></div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-20">
        <div className="bg-surface-container p-10 rounded-3xl border border-outline-variant/10 shadow-lg hover:-translate-y-1 transition-transform">
          <ShieldCheck className="w-12 h-12 text-primary mb-6" />
          <h3 className="text-2xl font-black text-on-surface mb-3">Zero-Knowledge Proofs</h3>
          <p className="text-on-surface-variant font-medium leading-relaxed text-lg">
            Our authentication servers use zero-knowledge protocols. This means we verify your identity without ever actually seeing your password or private key.
          </p>
        </div>

        <div className="bg-surface-container p-10 rounded-3xl border border-outline-variant/10 shadow-lg hover:-translate-y-1 transition-transform">
          <Lock className="w-12 h-12 text-secondary mb-6" />
          <h3 className="text-2xl font-black text-on-surface mb-3">Biometric Enclaves</h3>
          <p className="text-on-surface-variant font-medium leading-relaxed text-lg">
            App locking utilizes your device's native hardware security module (Secure Enclave or Titan M) to ensure chat locks cannot be bypassed by software exploits.
          </p>
        </div>
      </div>

      <div className="bg-surface-container-lowest p-8 md:p-14 rounded-[2.5rem] border border-outline-variant/15 shadow-xl">
        <h2 className="text-3xl md:text-4xl font-black text-on-surface mb-10">Security Checklist</h2>
        <div className="space-y-6">
          {[
            "No cloud databases for message storage",
            "Symmetric AES-256 local database encryption",
            "Screenshot detection and prevention API integration",
            "Anti-tamper protection on application binaries",
            "Open source cryptographic implementations"
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-5 p-5 bg-surface-container rounded-2xl">
              <CheckCircle2 className="w-7 h-7 text-green-500 shrink-0" />
              <span className="text-on-surface font-semibold text-lg">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
