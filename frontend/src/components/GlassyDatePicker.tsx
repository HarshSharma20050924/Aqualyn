import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, ChevronDown } from 'lucide-react';

interface GlassyDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const ITEM_HEIGHT = 44; // px per item
const VISIBLE_ITEMS = 5; // items visible in column (center is selected)
const COL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const PADDING = ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2); // 2 items padding top+bottom

function ScrollPicker({
  items,
  selectedIndex,
  onSelect,
  labelFn,
}: {
  items: number[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  labelFn: (val: number) => string;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to selectedIndex without triggering onSelect loop
  const scrollToIndex = useCallback((idx: number, smooth = false) => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: idx * ITEM_HEIGHT, behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  // On mount and when selectedIndex changes externally, scroll to it
  useEffect(() => {
    scrollToIndex(selectedIndex, false);
  }, [selectedIndex, scrollToIndex]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;

    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);

    scrollTimerRef.current = setTimeout(() => {
      const idx = Math.round(el.scrollTop / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(idx, items.length - 1));
      // Snap & notify
      scrollToIndex(clamped, true);
      onSelect(clamped);
    }, 80);
  };

  return (
    <div className="relative flex-1" style={{ height: COL_HEIGHT }}>
      {/* Fixed selection highlight plate */}
      <div
        className="absolute left-0 right-0 pointer-events-none rounded-xl bg-secondary/15 border-y border-secondary/30"
        style={{
          top: PADDING,
          height: ITEM_HEIGHT,
        }}
      />

      {/* Fade top */}
      <div className="absolute top-0 left-0 right-0 pointer-events-none z-10"
        style={{
          height: PADDING,
          background: 'linear-gradient(to bottom, var(--color-surface, #f0f8ff) 20%, transparent 100%)',
          opacity: 0.85
        }}
      />
      {/* Fade bottom */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
        style={{
          height: PADDING,
          background: 'linear-gradient(to top, var(--color-surface, #f0f8ff) 20%, transparent 100%)',
          opacity: 0.85
        }}
      />

      {/* Scrollable list */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll no-scrollbar"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {/* Top padding */}
        <div style={{ height: PADDING }} />

        {items.map((val, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <div
              key={val}
              style={{
                height: ITEM_HEIGHT,
                scrollSnapAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              className={`transition-all cursor-pointer select-none ${
                isSelected
                  ? 'text-secondary font-bold text-base'
                  : 'text-on-surface-variant/60 text-sm'
              }`}
              onClick={() => {
                scrollToIndex(idx, true);
                onSelect(idx);
              }}
            >
              {labelFn(val)}
            </div>
          );
        })}

        {/* Bottom padding */}
        <div style={{ height: PADDING }} />
      </div>
    </div>
  );
}

export default function GlassyDatePicker({ value, onChange }: GlassyDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  // Parse the current value to find indices
  const parsedDate = value ? new Date(value + 'T00:00:00') : null;

  const [monthIdx, setMonthIdx] = useState(parsedDate ? parsedDate.getMonth() : 0);
  const [dayIdx, setDayIdx] = useState(parsedDate ? parsedDate.getDate() - 1 : 0);
  const [yearIdx, setYearIdx] = useState(parsedDate ? years.indexOf(parsedDate.getFullYear()) : 0);

  const daysInMonth = new Date(years[yearIdx], monthIdx + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Clamp dayIdx if month/year changes and day is out of range
  useEffect(() => {
    if (dayIdx >= daysInMonth) {
      setDayIdx(daysInMonth - 1);
    }
  }, [daysInMonth]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOk = () => {
    const year = years[yearIdx];
    const month = String(monthIdx + 1).padStart(2, '0');
    const day = String(dayIdx + 1).padStart(2, '0');
    onChange(`${year}-${month}-${day}`);
    setIsOpen(false);
  };

  const displayValue = parsedDate
    ? `${MONTHS[parsedDate.getMonth()]} ${parsedDate.getDate()}, ${parsedDate.getFullYear()}`
    : 'Select Date of Birth';

  return (
    <div className="relative" ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-14 bg-white/40 border-outline-variant/20 border rounded-2xl pl-12 pr-4 flex items-center justify-between cursor-pointer hover:bg-white/50 transition-all shadow-inner group"
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-hover:text-secondary transition-colors">
          <Calendar className="w-5 h-5" />
        </div>
        <span className={`font-body ${value ? 'text-on-surface' : 'text-on-surface-variant/50'}`}>
          {displayValue}
        </span>
        <ChevronDown className={`w-5 h-5 text-on-surface-variant transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="absolute top-full left-0 w-full mt-2 bg-surface/95 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Column headers */}
            <div className="flex pt-4 pb-1 px-4">
              <div className="flex-1 text-center text-[10px] font-bold tracking-widest uppercase text-on-surface-variant/60">Month</div>
              <div className="flex-1 text-center text-[10px] font-bold tracking-widest uppercase text-on-surface-variant/60">Day</div>
              <div className="flex-1 text-center text-[10px] font-bold tracking-widest uppercase text-on-surface-variant/60">Year</div>
            </div>

            {/* Pickers row */}
            <div className="flex gap-1 px-3 pb-3">
              <ScrollPicker
                items={Array.from({ length: 12 }, (_, i) => i)}
                selectedIndex={monthIdx}
                onSelect={setMonthIdx}
                labelFn={(i) => MONTHS[i].substring(0, 3)}
              />
              <div className="w-px bg-white/20 self-stretch" />
              <ScrollPicker
                items={days}
                selectedIndex={dayIdx}
                onSelect={setDayIdx}
                labelFn={(d) => String(d).padStart(2, '0')}
              />
              <div className="w-px bg-white/20 self-stretch" />
              <ScrollPicker
                items={years}
                selectedIndex={yearIdx}
                onSelect={setYearIdx}
                labelFn={(y) => String(y)}
              />
            </div>

            {/* OK Button */}
            <div className="px-4 pb-4">
              <button
                onClick={handleOk}
                className="w-full py-3 bg-gradient-to-r from-secondary to-primary text-white font-bold rounded-2xl active:scale-95 transition-all hover:opacity-90 shadow-lg shadow-secondary/20"
              >
                OK
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
