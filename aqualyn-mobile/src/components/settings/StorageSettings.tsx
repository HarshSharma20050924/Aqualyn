import BubbleLoader from '../../components/ui/BubbleLoader';
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Database, Trash2 } from 'lucide-react-native';
import { apiFetch } from '../../utils/fetcher';
import { ENDPOINTS } from '../../config/api';
import { useAppContext } from '../../context/AppContext';

export default function StorageSettings() {
  const { addToast } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState({
    images: 0,
    videos: 0,
    audio: 0,
    documents: 0,
    total: 0
  });

  const fetchUsage = async () => {
    try {
      const res = await apiFetch(ENDPOINTS.STORAGE_USAGE);
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch (e) {
      console.error('Failed to fetch storage usage', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const clearCache = () => {
    addToast('Local cache cleared', 'success');
  };

  const totalUsed = usage.total;
  const limit = 15 * 1024 * 1024 * 1024; // 15 GB
  const percent = Math.min(100, (totalUsed / limit) * 100);

  const getPercent = (val: number) => {
    if (totalUsed === 0) return 0;
    return (val / totalUsed) * 100;
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Database size={20} color="#64748b" />
        <Text style={styles.titleText}>Storage Usage</Text>
      </View>

      <View style={styles.card}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <BubbleLoader size={48} />
          </View>
        ) : (
          <>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.usageText}>{formatSize(totalUsed)}</Text>
                <Text style={styles.usageSubtitle}>of 15 GB used</Text>
              </View>
              <Text style={styles.percentText}>{percent.toFixed(1)}%</Text>
            </View>

            {/* Custom Horizontal Stack Progress Bar */}
            <View style={styles.progressBar}>
              <View style={[styles.progressSegment, styles.bgSecondary, { width: `${getPercent(usage.images + usage.videos)}%` }]} />
              <View style={[styles.progressSegment, styles.bgPrimaryContainer, { width: `${getPercent(usage.documents)}%` }]} />
              <View style={[styles.progressSegment, styles.bgAmber, { width: `${getPercent(usage.audio)}%` }]} />
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.bullet, styles.bgSecondary]} />
                <Text style={styles.legendText}>Media ({formatSize(usage.images + usage.videos)})</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.bullet, styles.bgPrimaryContainer]} />
                <Text style={styles.legendText}>Docs ({formatSize(usage.documents)})</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.bullet, styles.bgAmber]} />
                <Text style={styles.legendText}>Audio ({formatSize(usage.audio)})</Text>
              </View>
            </View>

            <TouchableOpacity 
              onPress={clearCache}
              style={styles.clearButton}
              activeOpacity={0.7}
            >
              <Trash2 size={16} color="#ef4444" />
              <Text style={styles.clearButtonText}>Clear Local Cache</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 32,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  usageText: {
    fontWeight: 'bold',
    fontSize: 24,
    color: '#0f172a',
  },
  usageSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  percentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0284C7',
  },
  progressBar: {
    width: '100%',
    height: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  progressSegment: {
    height: '100%',
  },
  bgSecondary: {
    backgroundColor: '#0284C7',
  },
  bgPrimaryContainer: {
    backgroundColor: '#bae6fd',
  },
  bgAmber: {
    backgroundColor: '#fbbf24',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 16,
    rowGap: 8,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  clearButton: {
    marginTop: 24,
    width: '100%',
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: 12,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ef4444',
  },
});