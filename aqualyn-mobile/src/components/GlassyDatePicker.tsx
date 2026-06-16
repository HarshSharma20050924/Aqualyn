import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, NativeSyntheticEvent, NativeScrollEvent, StyleSheet } from 'react-native';
import { Calendar, ChevronDown } from 'lucide-react-native';

interface GlassyDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const ITEM_HEIGHT = 44; 
const VISIBLE_ITEMS = 5; 
const COL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const PADDING = ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2); 

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
  const scrollViewRef = useRef<ScrollView>(null);
  const isMomentumAction = useRef(false);

  const scrollToIndex = useCallback((idx: number, animated = false) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: idx * ITEM_HEIGHT, animated });
    }
  }, []);

  useEffect(() => {
    // Zero timeout safe hook frame execution for native layout mounting calculations
    setTimeout(() => scrollToIndex(selectedIndex, false), 50);
  }, [selectedIndex, scrollToIndex]);

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const yOffset = e.nativeEvent.contentOffset.y;
    const idx = Math.round(yOffset / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    
    scrollToIndex(clamped, true);
    onSelect(clamped);
  };

  return (
    <View style={styles.scrollPickerContainer}>
      {/* Fixed selection highlight plate */}
      <View 
        style={[styles.highlightPlate, { top: PADDING }]}
      />

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={(e) => {
          // Fallback if momentum deceleration isn't triggered completely
          isMomentumAction.current = false;
          setTimeout(() => {
            if (!isMomentumAction.current) handleScrollEnd(e);
          }, 100);
        }}
        onMomentumScrollBegin={() => { isMomentumAction.current = true; }}
        contentContainerStyle={{ paddingTop: PADDING, paddingBottom: PADDING }}
      >
        {items.map((val, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <TouchableOpacity
              key={val}
              activeOpacity={0.7}
              style={{ height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => {
                scrollToIndex(idx, true);
                onSelect(idx);
              }}
            >
              <Text style={isSelected ? styles.selectedText : styles.unselectedText}>
                {labelFn(val)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function GlassyDatePicker({ value, onChange }: GlassyDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const parsedDate = value ? new Date(value + 'T00:00:00') : null;

  const [monthIdx, setMonthIdx] = useState(parsedDate ? parsedDate.getMonth() : 0);
  const [dayIdx, setDayIdx] = useState(parsedDate ? parsedDate.getDate() - 1 : 0);
  const [yearIdx, setYearIdx] = useState(parsedDate ? years.indexOf(parsedDate.getFullYear()) : 0);

  const daysInMonth = new Date(years[yearIdx], monthIdx + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => {
    if (dayIdx >= daysInMonth) {
      setDayIdx(daysInMonth - 1);
    }
  }, [daysInMonth]);

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
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        style={styles.triggerBtn}
        activeOpacity={0.8}
      >
        <View style={styles.triggerBtnLeft}>
          <Calendar size={20} color="#64748b" />
          <Text style={[styles.triggerText, value ? styles.textActive : styles.textInactive]}>
            {displayValue}
          </Text>
        </View>
        <ChevronDown size={20} color="#64748b" />
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="slide" onRequestClose={() => setIsOpen(false)}>
        <View style={styles.modalViewport}>
          {/* Dismiss Barrier Backdrop */}
          <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={() => setIsOpen(false)} />
          
          <View style={styles.modalCard}>
            {/* Column headers */}
            <View style={styles.columnHeadersRow}>
              <Text style={styles.columnHeader}>Month</Text>
              <Text style={styles.columnHeader}>Day</Text>
              <Text style={styles.columnHeader}>Year</Text>
            </View>

            {/* Pickers row layout container matrix */}
            <View style={styles.pickersRow}>
              <ScrollPicker
                items={Array.from({ length: 12 }, (_, i) => i)}
                selectedIndex={monthIdx}
                onSelect={setMonthIdx}
                labelFn={(i) => MONTHS[i].substring(0, 3)}
              />
              <View style={styles.separator} />
              <ScrollPicker
                items={days}
                selectedIndex={dayIdx}
                onSelect={setDayIdx}
                labelFn={(d) => String(d).padStart(2, '0')}
              />
              <View style={styles.separator} />
              <ScrollPicker
                items={years}
                selectedIndex={yearIdx}
                onSelect={setYearIdx}
                labelFn={(y) => String(y)}
              />
            </View>

            {/* Selection Execution Anchor */}
            <TouchableOpacity
              onPress={handleOk}
              style={styles.confirmBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmBtnText}>Confirm Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollPickerContainer: {
    height: COL_HEIGHT,
    position: 'relative',
    flex: 1,
  },
  highlightPlate: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderRadius: 12,
    backgroundColor: 'rgba(8, 145, 178, 0.08)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(8, 145, 178, 0.2)',
  },
  selectedText: {
    color: '#0891b2',
    fontWeight: 'bold',
    fontSize: 16,
  },
  unselectedText: {
    color: 'rgba(100, 116, 139, 0.6)',
    fontSize: 14,
  },
  container: {
    position: 'relative',
    width: '100%',
  },
  triggerBtn: {
    width: '100%',
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  triggerText: {
    fontSize: 14,
  },
  textActive: {
    color: '#0f172a',
    fontWeight: '600',
  },
  textInactive: {
    color: 'rgba(15, 23, 42, 0.4)',
  },
  modalViewport: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 20,
    width: '100%',
  },
  columnHeadersRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  columnHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(100, 116, 139, 0.6)',
  },
  pickersRow: {
    flexDirection: 'row',
    gap: 4,
    paddingBottom: 24,
    paddingTop: 8,
  },
  separator: {
    width: 1,
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    alignSelf: 'stretch',
  },
  confirmBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#0891b2',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0891b2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 16,
  },
});