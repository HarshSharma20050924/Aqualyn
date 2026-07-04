import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Platform
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  Layout
} from 'react-native-reanimated';
import { Droplet, X, ChevronDown, Save, Check } from 'lucide-react-native';

interface LynPanelProps {
  onClose: () => void;
  aiEnabled: boolean;
  aiSuggestionsEnabled: boolean;
  personality: string;
  customPersonality: string;
  friendMode: boolean;
  responseRate: number;
  onSave: (settings: {
    aiEnabled: boolean;
    aiSuggestionsEnabled: boolean;
    personality: string;
    customPersonality: string;
    friendMode: boolean;
    responseRate: number;
  }) => void;
  onDiscoverChannels?: () => void;
}

const PERSONALITY_PRESETS = [
  { id: 'friendly',     label: 'Friendly',     desc: 'Warm & casual' },
  { id: 'professional', label: 'Professional', desc: 'Formal' },
  { id: 'witty',        label: 'Witty',        desc: 'Playful' },
  { id: 'empathetic',   label: 'Empathetic',   desc: 'Caring' },
  { id: 'concise',      label: 'Concise',      desc: 'Brief' },
  { id: 'creative',     label: 'Creative',     desc: 'Expressive' },
];

export default function LynPanel({
  onClose,
  aiEnabled,
  aiSuggestionsEnabled,
  personality,
  customPersonality,
  friendMode,
  responseRate,
  onSave,
  onDiscoverChannels,
}: LynPanelProps) {
  const [draftEnabled, setDraftEnabled] = useState(aiEnabled);
  const [draftSuggestions, setDraftSuggestions] = useState(aiSuggestionsEnabled);
  const [draftPersonality, setDraftPersonality] = useState(personality);
  const [draftCustom, setDraftCustom] = useState(customPersonality);
  const [draftFriendMode, setDraftFriendMode] = useState(friendMode);
  const [draftResponseRate, setDraftResponseRate] = useState(responseRate);
  const [showPersonality, setShowPersonality] = useState(false);
  const [saved, setSaved] = useState(false);

  const isDirty =
    draftEnabled !== aiEnabled ||
    draftSuggestions !== aiSuggestionsEnabled ||
    draftPersonality !== personality ||
    draftCustom !== customPersonality ||
    draftFriendMode !== friendMode ||
    draftResponseRate !== responseRate;

  const handleSave = () => {
    onSave({
      aiEnabled: draftEnabled,
      aiSuggestionsEnabled: draftSuggestions,
      personality: draftPersonality,
      customPersonality: draftCustom,
      friendMode: draftFriendMode,
      responseRate: draftResponseRate,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const currentToneLabel = draftCustom.trim()
    ? `Custom: "${draftCustom.slice(0, 28)}${draftCustom.length > 28 ? '…' : ''}"`
    : PERSONALITY_PRESETS.find((p) => p.id === draftPersonality)?.label ?? 'Friendly';

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={styles.panelContainer}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerTitleContainer}>
          <View style={styles.iconBox}>
            <Droplet size={14} color="#0057bd" />
          </View>
          <Text style={styles.headerTitleTxt}>LYN AI SETTINGS</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!isDirty && !saved}
            style={[
              styles.saveBtn,
              saved ? styles.saveBtnSaved : isDirty ? styles.saveBtnActive : styles.saveBtnDisabled
            ]}
          >
            {saved ? <Check size={12} color="#22c55e" /> : <Save size={12} color={isDirty ? '#fff' : '#94a3b8'} />}
            <Text style={[styles.saveBtnTxt, saved ? styles.saveTxtSaved : isDirty ? styles.saveTxtActive : styles.saveTxtDisabled]}>
              {saved ? 'Saved' : 'Save'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={18} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mainBlock}>
        {/* Toggle AI Features */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleTextCol}>
            <Text style={styles.toggleTitle}>AI Features</Text>
            <Text style={styles.toggleSubtitle}>
              {draftEnabled ? 'Lyn is active in this chat' : 'Simple chat mode — no AI'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setDraftEnabled(!draftEnabled)}
            style={[styles.switchTrack, draftEnabled ? styles.switchTrackOn : styles.switchTrackOff]}
          >
            <Animated.View style={[styles.switchThumb, { transform: [{ translateX: draftEnabled ? 20 : 2 }] }]} />
          </TouchableOpacity>
        </View>

        {/* Smart Suggestions & Friend Mode */}
        {draftEnabled && (
          <Animated.View entering={FadeIn} layout={Layout.springify()}>
            <View style={styles.divider} />
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextCol}>
                <Text style={styles.toggleTitle}>Smart Suggestions</Text>
                <Text style={styles.toggleSubtitle}>Quick reply chips and @lyn prompts</Text>
              </View>
              <TouchableOpacity
                onPress={() => setDraftSuggestions(!draftSuggestions)}
                style={[styles.switchTrack, draftSuggestions ? styles.switchTrackOn : styles.switchTrackOff]}
              >
                <Animated.View style={[styles.switchThumb, { transform: [{ translateX: draftSuggestions ? 20 : 2 }] }]} />
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />

            <View style={styles.toggleRow}>
              <View style={styles.toggleTextCol}>
                <Text style={styles.toggleTitle}>Lyn as a Friend</Text>
                <Text style={styles.toggleSubtitle}>Lyn will respond naturally, even if not mentioned</Text>
              </View>
              <TouchableOpacity
                onPress={() => setDraftFriendMode(!draftFriendMode)}
                style={[styles.switchTrack, draftFriendMode ? styles.switchTrackOn : styles.switchTrackOff]}
              >
                <Animated.View style={[styles.switchThumb, { transform: [{ translateX: draftFriendMode ? 20 : 2 }] }]} />
              </TouchableOpacity>
            </View>

            {draftFriendMode && (
              <Animated.View entering={FadeIn} style={styles.responseRateContainer}>
                <View style={styles.responseRateHeader}>
                  <Text style={styles.responseRateTitle}>RESPONSE RATE</Text>
                  <Text style={styles.responseRateValue}>{draftResponseRate}%</Text>
                </View>
                <View style={styles.rateButtons}>
                  {[0, 50, 100].map((rate) => (
                    <TouchableOpacity
                      key={rate}
                      onPress={() => setDraftResponseRate(rate)}
                      style={[styles.rateBtn, draftResponseRate === rate && styles.rateBtnActive]}
                    >
                      <Text style={[styles.rateBtnTxt, draftResponseRate === rate && styles.rateBtnTxtActive]}>
                        {rate === 0 ? 'Low' : rate === 50 ? 'Medium' : 'High'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.responseRateSubtitle}>
                  {draftResponseRate === 100 ? 'Lyn will reply to every message.' : draftResponseRate >= 50 ? 'Lyn will reply often.' : 'Lyn will only chime in occasionally.'}
                </Text>
              </Animated.View>
            )}
          </Animated.View>
        )}
      </View>

      {draftEnabled && (
        <Animated.View entering={FadeIn} layout={Layout.springify()} style={[styles.mainBlock, { marginTop: 12 }]}>
          <TouchableOpacity onPress={() => setShowPersonality(!showPersonality)} style={styles.personalityHeader}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleTitle}>Response Tone</Text>
              <Text style={styles.toggleSubtitle}>{currentToneLabel}</Text>
            </View>
            <Animated.View style={{ transform: [{ rotate: showPersonality ? '180deg' : '0deg' }] }}>
              <ChevronDown size={18} color="#64748b" />
            </Animated.View>
          </TouchableOpacity>

          {showPersonality && (
            <Animated.View entering={FadeIn} layout={Layout.springify()} style={styles.personalityBody}>
              <View style={styles.presetGrid}>
                {PERSONALITY_PRESETS.map((p) => {
                  const isActive = draftPersonality === p.id && !draftCustom;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => { setDraftPersonality(p.id); setDraftCustom(''); }}
                      style={[styles.presetCard, isActive && styles.presetCardActive]}
                    >
                      <Text style={[styles.presetLabel, isActive && styles.presetLabelActive]}>{p.label}</Text>
                      <Text style={[styles.presetDesc, isActive && styles.presetDescActive]}>{p.desc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.customToneLabel}>OR DESCRIBE YOUR OWN TONE</Text>
              <TextInput
                style={styles.customToneInput}
                value={draftCustom}
                onChangeText={setDraftCustom}
                placeholder="e.g. sarcastic but kind, casual Gen-Z..."
                placeholderTextColor="#94a3b8"
              />
              {draftCustom.trim().length > 0 && (
                <Text style={styles.customToneNotice}>✦ Custom tone — click Save to apply.</Text>
              )}
            </Animated.View>
          )}
        </Animated.View>
      )}

      {onDiscoverChannels && (
        <TouchableOpacity style={styles.discoverBtn} onPress={onDiscoverChannels}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Droplet size={14} color="#0057bd" />
              <Text style={styles.discoverBtnTitle}>Find Related Channels</Text>
            </View>
            <Text style={styles.discoverBtnDesc}>Extract topics from this chat and discover communities with similar vibes.</Text>
          </View>
          <View style={styles.discoverBtnIconCircle}>
            <ChevronDown size={16} color="#0057bd" style={{ transform: [{ rotate: '-90deg' }] }} />
          </View>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panelContainer: {
    backgroundColor: 'rgba(248, 250, 252, 0.95)',
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(0,87,189,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleTxt: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#64748b',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  saveBtnActive: {
    backgroundColor: '#0057bd',
    borderColor: '#0057bd',
  },
  saveBtnDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  saveBtnSaved: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  saveBtnTxt: {
    fontSize: 11,
    fontWeight: '700',
  },
  saveTxtActive: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  saveTxtDisabled: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  saveTxtSaved: {
    fontSize: 11,
    fontWeight: '700',
    color: '#22c55e',
  },
  closeBtn: {
    padding: 4,
  },
  mainBlock: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  toggleTextCol: {
    flex: 1,
    paddingRight: 16,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  toggleSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  switchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  switchTrackOn: {
    backgroundColor: '#0057bd',
  },
  switchTrackOff: {
    backgroundColor: '#e2e8f0',
  },
  switchThumb: {
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  responseRateContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  responseRateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  responseRateTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },
  responseRateValue: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0057bd',
  },
  rateButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  rateBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  rateBtnActive: {
    backgroundColor: 'rgba(0,87,189,0.1)',
    borderColor: 'rgba(0,87,189,0.3)',
    borderWidth: 1,
  },
  rateBtnTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  rateBtnTxtActive: {
    color: '#0057bd',
  },
  responseRateSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 8,
  },
  personalityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  personalityBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  presetCard: {
    width: '31%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  presetCardActive: {
    backgroundColor: 'rgba(0,87,189,0.1)',
    borderColor: 'rgba(0,87,189,0.3)',
  },
  presetLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  presetLabelActive: {
    color: '#0057bd',
  },
  presetDesc: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 2,
    textAlign: 'center',
  },
  presetDescActive: {
    color: 'rgba(0,87,189,0.7)',
  },
  customToneLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  customToneInput: {
    height: 40,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0f172a',
  },
  customToneNotice: {
    fontSize: 10,
    color: '#0057bd',
    fontWeight: '500',
    marginTop: 6,
  },
  discoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,87,189,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0,87,189,0.1)',
    borderRadius: 16,
    padding: 12,
    marginTop: 16,
  },
  discoverBtnTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0057bd',
  },
  discoverBtnDesc: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
  },
  discoverBtnIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,87,189,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  }
});
