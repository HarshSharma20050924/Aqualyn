import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Monitor, Smartphone, Plus, Trash2, ShieldCheck, Camera as CameraIcon, X } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAppContext } from '../context/AppContext';
import BubbleLoader from '../components/ui/BubbleLoader';
import { apiFetch } from '../utils/fetcher';
import { ENDPOINTS } from '../config/api';

interface LinkedDevicesScreenProps {
  onBack: () => void;
  onNavigate?: (screen: string) => void;
}

export default function LinkedDevicesScreen({ onBack }: LinkedDevicesScreenProps) {
  const insets = useSafeAreaInsets();
  const { addToast } = useAppContext();
  
  const [sessions, setSessions] = useState([
    { id: '1', os: 'Windows 11', browser: 'Chrome', active: true, time: 'Active now', location: 'New York, US' },
    { id: '2', os: 'MacOS Sonoma', browser: 'Safari', active: false, time: 'Last active 2 hours ago', location: 'New York, US' },
  ]);
  const [isScanning, setIsScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const handleScan = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        addToast('Camera permission is required to scan QR code', 'error');
        return;
      }
    }
    setIsScanning(true);
  };

  const handleBarCodeScanned = async ({ type, data }: any) => {
    setIsScanning(false);
    
    try {
      let qrToken = data;
      // If the QR code contains a full URL, extract the token
      if (data.includes('token=')) {
        qrToken = new URL(data).searchParams.get('token') || data;
      } else if (data.includes('/qr/')) {
        const parts = data.split('/');
        qrToken = parts[parts.length - 1];
      } else if (data.includes('qr-login/')) {
        const parts = data.split('qr-login/');
        qrToken = parts[parts.length - 1];
      }

      const res = await apiFetch(ENDPOINTS.AUTH_QR_LINK, {
        method: 'POST',
        body: JSON.stringify({ qrToken })
      });
      
      if (res.ok) {
        addToast('Device linked successfully!', 'success');
        setSessions(prev => [
          { id: Date.now().toString(), os: 'Unknown OS', browser: 'Aqualyn Web', active: true, time: 'Active now', location: 'Current Location' },
          ...prev.map(s => ({ ...s, active: false }))
        ]);
      } else {
        const err = await res.json().catch(() => ({}));
        addToast(err.message || err.error || 'Failed to link device. Invalid or expired QR code.', 'error');
      }
    } catch (e: any) {
      addToast(e.message || 'Error linking device', 'error');
    }
  };

  const removeSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    addToast('Device disconnected', 'info');
  };

  return (
    <View style={styles.container}>
      <Animated.View   style={[styles.header, { paddingTop: insets.top, height: 64 + insets.top }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Linked Devices</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.heroSection}>
          <View style={styles.heroIconBox}>
            <Monitor size={36} color="#0057bd" />
            <View style={styles.heroBadge}>
              <Smartphone size={16} color="#fff" />
            </View>
          </View>
          <Text style={styles.heroTitle}>Use Aqualyn on Web</Text>
          <Text style={styles.heroSubtitle}>Scan the QR code on your computer to securely link your device and sync your messages.</Text>
          
          <TouchableOpacity onPress={handleScan} style={styles.linkButton}>
            <CameraIcon size={20} color="#fff" />
            <Text style={styles.linkButtonText}>Link a Device</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sessionsContainer}>
          <View style={styles.sessionHeaderRow}>
            <Text style={styles.sectionTitle}>Active Sessions</Text>
            <ShieldCheck size={16} color="#10b981" />
          </View>

          {sessions.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No linked devices</Text>
            </View>
          ) : (
            <View style={styles.sessionsList}>
              {sessions.map(session => (
                <View key={session.id} style={styles.sessionCard}>
                  <View style={styles.sessionIconBox}>
                    {session.os.includes('Mac') || session.os.includes('Windows') ? (
                      <Monitor size={22} color="#475569" />
                    ) : (
                      <Smartphone size={22} color="#475569" />
                    )}
                  </View>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionOs}>{session.os} • {session.browser}</Text>
                    <View style={styles.sessionMetaRow}>
                      {session.active && <View style={styles.activeDot} />}
                      <Text style={[styles.sessionTime, session.active && styles.activeTime]}>
                        {session.time}
                      </Text>
                    </View>
                    <Text style={styles.sessionLocation}>{session.location}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeSession(session.id)} style={styles.removeBtn}>
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* QR Scanner Modal Overlay */}
      {isScanning && (
        <Animated.View   style={StyleSheet.absoluteFill}>
          <View style={styles.scannerOverlay}>
            <View style={[styles.scannerHeader, { paddingTop: insets.top }]}>
              <TouchableOpacity onPress={() => setIsScanning(false)} style={styles.scannerCloseBtn}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.scannerTitle}>Scan QR Code</Text>
              <View style={{ width: 40 }} />
            </View>

            <CameraView
              style={styles.cameraView}
              facing="back"
              onBarcodeScanned={handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
            >
              <View style={styles.scanTargetBox}>
                <View style={[styles.corner, styles.tl]} />
                <View style={[styles.corner, styles.tr]} />
                <View style={[styles.corner, styles.bl]} />
                <View style={[styles.corner, styles.br]} />
              </View>
            </CameraView>

            <View style={styles.scannerFooter}>
              <Text style={styles.scannerHelperText}>Point your camera at the QR code on your computer screen to log in.</Text>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    zIndex: 10,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  content: { padding: 20 },
  heroSection: { alignItems: 'center', backgroundColor: '#fff', padding: 32, borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 },
  heroIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0,87,189,0.06)', justifyContent: 'center', alignItems: 'center', marginBottom: 20, position: 'relative' },
  heroBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#10b981', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 8, textAlign: 'center' },
  heroSubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 16 },
  linkButton: { width: '100%', height: 48, backgroundColor: '#0057bd', borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, shadowColor: '#0057bd', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  linkButtonText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  sessionsContainer: { marginTop: 32 },
  sessionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },
  emptyBox: { padding: 24, alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  emptyText: { fontSize: 14, color: '#94a3b8', fontWeight: '500' },
  sessionsList: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  sessionCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  sessionIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  sessionInfo: { flex: 1, marginLeft: 14 },
  sessionOs: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  sessionMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
  sessionTime: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  activeTime: { color: '#10b981', fontWeight: '600' },
  sessionLocation: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  removeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(239,68,68,0.06)', justifyContent: 'center', alignItems: 'center' },
  scannerOverlay: { flex: 1, backgroundColor: '#000' },
  scannerHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 64, backgroundColor: 'rgba(0,0,0,0.6)' },
  scannerCloseBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  scannerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  cameraView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanTargetBox: { width: 260, height: 260, position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#fff', borderWidth: 4 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 20 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 20 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 20 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 20 },
  scannerFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.8)', padding: 32, alignItems: 'center' },
  scannerHelperText: { fontSize: 15, color: '#fff', textAlign: 'center', lineHeight: 22, fontWeight: '500' },
});
