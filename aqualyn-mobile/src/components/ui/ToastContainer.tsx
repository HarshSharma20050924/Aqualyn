import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import ContactAvatar from './ContactAvatar';

export default function ToastContainer() {
  const insets = useSafeAreaInsets();
  const { toasts = [], removeToast } = useAppContext() || {};

  if (toasts.length === 0) return null;

  return (
    <View
      style={[styles.container, { top: insets.top + 12 }]}
      pointerEvents="box-none"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        let themeBg = 'rgba(59, 130, 246, 0.06)';
        let themeBorder = 'rgba(59, 130, 246, 0.15)';
        let themeColor = '#2563eb';

        if (isSuccess) {
          themeBg = 'rgba(16, 185, 129, 0.06)';
          themeBorder = 'rgba(16, 185, 129, 0.15)';
          themeColor = '#059669';
        } else if (isError) {
          themeBg = 'rgba(239, 68, 68, 0.06)';
          themeBorder = 'rgba(239, 68, 68, 0.15)';
          themeColor = '#dc2626';
        }

        return (
          <View
            key={toast.id}
            style={[styles.card, { backgroundColor: themeBg, borderColor: themeBorder }]}
          >
            {toast.avatar ? (
              <ContactAvatar name={toast.title} src={toast.avatar} style={styles.avatar} />
            ) : (
              <View style={styles.iconBox}>
                {isSuccess && <CheckCircle2 size={18} color={themeColor} />}
                {isError && <AlertCircle size={18} color={themeColor} />}
                {!isSuccess && !isError && <Info size={18} color={themeColor} />}
              </View>
            )}

            <View style={styles.textCol}>
              {toast.title && (
                <Text style={[styles.title, { color: themeColor }]} numberOfLines={1}>
                  {toast.title}
                </Text>
              )}
              <Text style={styles.message} numberOfLines={2}>
                {toast.message}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => removeToast?.(toast.id)}
              style={styles.closeBtn}
              activeOpacity={0.6}
            >
              <X size={14} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 9999,
    gap: 8,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: '#ffffff',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  avatar: { width: 36, height: 36, borderRadius: 18, resizeMode: 'cover', marginRight: 10 },
  iconBox: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  textCol: { flex: 1, marginRight: 8, gap: 1 },
  title: { fontSize: 13, fontWeight: '700', letterSpacing: -0.1 },
  message: { fontSize: 13, fontWeight: '600', color: '#334155', lineHeight: 17 },
  closeBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(15,23,42,0.03)', justifyContent: 'center', alignItems: 'center' },
});