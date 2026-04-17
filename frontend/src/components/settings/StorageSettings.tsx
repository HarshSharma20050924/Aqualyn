import React from 'react';
import { Database } from 'lucide-react';

export default function StorageSettings() {
  return (
    <section className="space-y-4">
      <h3 className="font-headline font-bold text-lg text-on-surface px-2 flex items-center gap-2">
        <Database className="w-5 h-5 text-slate-500" />
        Storage Usage
      </h3>
      <div className="glass-card rounded-[2rem] p-6 border border-white/40 shadow-sm">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h4 className="font-bold text-2xl text-on-surface">4.2 GB</h4>
            <p className="text-sm text-on-surface-variant">of 15 GB used</p>
          </div>
          <span className="text-sm font-semibold text-secondary">28%</span>
        </div>
        <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden flex">
          <div className="h-full bg-secondary w-[15%]"></div>
          <div className="h-full bg-primary-container w-[8%]"></div>
          <div className="h-full bg-amber-400 w-[5%]"></div>
        </div>
        <div className="flex gap-4 mt-4 text-xs font-medium text-on-surface-variant">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-secondary"></div> Media</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary-container"></div> Docs</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Audio</div>
        </div>
      </div>
    </section>
  );
}
