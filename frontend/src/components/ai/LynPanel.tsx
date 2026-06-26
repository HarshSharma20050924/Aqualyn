import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Droplet, X, ChevronDown, Save, Check } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface LynPanelProps {
  onClose: () => void;
  aiEnabled: boolean;
  aiSuggestionsEnabled: boolean;
  personality: string;
  customPersonality: string;
  onSave: (settings: {
    aiEnabled: boolean;
    aiSuggestionsEnabled: boolean;
    personality: string;
    customPersonality: string;
  }) => void;
  onDiscoverChannels?: () => void;
}

const PERSONALITY_PRESETS = [
  { id: 'friendly',     label: 'Friendly',     desc: 'Warm and casual' },
  { id: 'professional', label: 'Professional', desc: 'Formal and precise' },
  { id: 'witty',        label: 'Witty',        desc: 'Clever and playful' },
  { id: 'empathetic',   label: 'Empathetic',   desc: 'Caring and supportive' },
  { id: 'concise',      label: 'Concise',      desc: 'Brief, one to two sentences' },
  { id: 'creative',     label: 'Creative',     desc: 'Expressive and unique' },
];

// ── Component ──────────────────────────────────────────────────────────────────
export default function LynPanel({
  onClose,
  aiEnabled,
  aiSuggestionsEnabled,
  personality,
  customPersonality,
  onSave,
  onDiscoverChannels,
}: LynPanelProps) {
  // Local draft state — nothing is persisted until Save is clicked
  const [draftEnabled, setDraftEnabled] = useState(aiEnabled);
  const [draftSuggestions, setDraftSuggestions] = useState(aiSuggestionsEnabled);
  const [draftPersonality, setDraftPersonality] = useState(personality);
  const [draftCustom, setDraftCustom] = useState(customPersonality);
  const [showPersonality, setShowPersonality] = useState(false);
  const [saved, setSaved] = useState(false);

  const isDirty =
    draftEnabled !== aiEnabled ||
    draftSuggestions !== aiSuggestionsEnabled ||
    draftPersonality !== personality ||
    draftCustom !== customPersonality;

  const handleSave = () => {
    onSave({
      aiEnabled: draftEnabled,
      aiSuggestionsEnabled: draftSuggestions,
      personality: draftPersonality,
      customPersonality: draftCustom,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <motion.div
      key="lyn-settings-panel"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.22, ease: 'easeInOut' }}
      className="overflow-hidden border-t border-white/15"
    >
      <div className="bg-slate-50/70 dark:bg-surface/90 backdrop-blur-xl px-5 py-4 space-y-3">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-6 h-6 shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary-fixed to-primary-container rounded-md rotate-12 opacity-30" />
              <div className="relative w-full h-full glass-card rounded-md flex items-center justify-center">
                <Droplet className="w-3.5 h-3.5 text-secondary fill-secondary" />
              </div>
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant">
              Lyn AI Settings
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Save Button */}
            <motion.button
              onClick={handleSave}
              disabled={!isDirty && !saved}
              animate={saved ? { scale: [1, 1.1, 1] } : {}}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 ${
                saved
                  ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                  : isDirty
                  ? 'bg-secondary text-white shadow-md shadow-secondary/30 active:scale-95'
                  : 'bg-surface-container-high text-on-surface-variant opacity-50 cursor-not-allowed'
              }`}
            >
              {saved ? (
                <><Check className="w-3 h-3" /> Saved</>
              ) : (
                <><Save className="w-3 h-3" /> Save</>
              )}
            </motion.button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Toggle: Enable/Disable ALL AI ───────────────────────────────── */}
        <div className="glass-card rounded-2xl border border-outline-variant/20 divide-y divide-outline-variant/10">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-xs font-bold text-on-surface font-headline">AI Features</p>
              <p className="text-[10px] text-on-surface-variant mt-0.5">
                {draftEnabled ? 'Lyn is active in this chat' : 'Simple chat mode — no AI'}
              </p>
            </div>
            <button
              onClick={() => setDraftEnabled(e => !e)}
              className={`w-11 h-6 rounded-full relative transition-colors duration-200 flex items-center shrink-0 ${
                draftEnabled ? 'bg-secondary' : 'bg-surface-container-highest'
              }`}
            >
              <motion.div
                animate={{ x: draftEnabled ? 20 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="w-5 h-5 bg-white rounded-full shadow-sm absolute"
              />
            </button>
          </div>

          <AnimatePresence>
            {draftEnabled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                {/* Smart reply suggestions toggle */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-xs font-bold text-on-surface font-headline">Smart Suggestions</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">
                      Quick reply chips and @lyn prompts
                    </p>
                  </div>
                  <button
                    onClick={() => setDraftSuggestions(s => !s)}
                    className={`w-11 h-6 rounded-full relative transition-colors duration-200 flex items-center shrink-0 ${
                      draftSuggestions ? 'bg-secondary' : 'bg-surface-container-highest'
                    }`}
                  >
                    <motion.div
                      animate={{ x: draftSuggestions ? 20 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      className="w-5 h-5 bg-white rounded-full shadow-sm absolute"
                    />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Personality / Tone ──────────────────────────────────────────── */}
        <AnimatePresence>
          {draftEnabled && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="glass-card rounded-2xl border border-outline-variant/20 overflow-hidden"
            >
              <button
                onClick={() => setShowPersonality(p => !p)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/20 transition-colors"
              >
                <div>
                  <p className="text-xs font-bold text-on-surface font-headline text-left">Response Tone</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5 text-left">
                    {draftCustom.trim()
                      ? `Custom: "${draftCustom.slice(0, 28)}${draftCustom.length > 28 ? '…' : ''}"`
                      : PERSONALITY_PRESETS.find(p => p.id === draftPersonality)?.label ?? 'Friendly'}
                  </p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-on-surface-variant transition-transform duration-200 shrink-0 ${
                    showPersonality ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {showPersonality && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3">
                      {/* Preset grid */}
                      <div className="grid grid-cols-3 gap-1.5">
                        {PERSONALITY_PRESETS.map(p => (
                          <button
                            key={p.id}
                            onClick={() => { setDraftPersonality(p.id); setDraftCustom(''); }}
                            className={`py-2 px-2 rounded-xl text-center transition-all border text-[11px] font-bold leading-tight ${
                              draftPersonality === p.id && !draftCustom
                                ? 'bg-secondary/10 border-secondary/40 text-secondary'
                                : 'bg-surface-container border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high'
                            }`}
                          >
                            {p.label}
                            <span className={`block text-[9px] font-medium mt-0.5 ${
                              draftPersonality === p.id && !draftCustom
                                ? 'text-secondary/70'
                                : 'text-on-surface-variant/60'
                            }`}>{p.desc}</span>
                          </button>
                        ))}
                      </div>

                      {/* Custom tone input */}
                      <div>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                          Or describe your own tone
                        </p>
                        <input
                          type="text"
                          value={draftCustom}
                          onChange={e => setDraftCustom(e.target.value)}
                          placeholder="e.g. sarcastic but kind, like a mentor, casual Gen-Z..."
                          className="w-full h-9 px-3 rounded-xl bg-surface-container border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary text-xs text-on-surface placeholder:text-on-surface-variant/50 transition-all"
                        />
                        {draftCustom.trim() && (
                          <p className="text-[10px] text-secondary mt-1 font-medium">
                            ✦ Custom tone — click Save to apply.
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* ── AI Discoverability ──────────────────────────────────────────── */}
        {onDiscoverChannels && (
          <div className="pt-2">
            <button
              onClick={onDiscoverChannels}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-secondary/10 to-primary/5 hover:from-secondary/20 hover:to-primary/10 border border-secondary/20 transition-all group"
            >
              <div className="text-left">
                <h4 className="text-xs font-bold text-secondary flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5 fill-secondary" />
                  Find Related Channels
                </h4>
                <p className="text-[10px] text-on-surface-variant mt-0.5 leading-relaxed pr-4">
                  Extract topics from this chat and discover communities with similar vibes.
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <ChevronDown className="w-4 h-4 text-secondary -rotate-90" />
              </div>
            </button>
          </div>
        )}

      </div>
    </motion.div>
  );
}
