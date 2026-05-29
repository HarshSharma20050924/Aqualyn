# components/settings/StorageSettings.tsx

## File Location
`frontend/src/components/settings/StorageSettings.tsx`

## Purpose
See implementation below for details.

## Implementation

```typescript
import React, { useEffect, useState } from 'react';
import { Database, Trash2, Loader2 } from 'lucide-react';
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
    // In a real app, this would clear local IndexedDB or cache
    addToast('Local cache cleared', 'success');
  };

  const totalUsed = usage.total;
  const limit = 15 * 1024 * 1024 * 1024; // 15 GB
  const percent = Math.min(100, (totalUsed / limit) * 100);

  const getPercent = (val: number) => {
    if (totalUsed === 0) return '0%';
    return `${(val / totalUsed) * 100}%`;
  };

  return (
    <section className="space-y-4">
      <h3 className="font-headline font-bold text-lg text-on-surface px-2 flex items-center gap-2">
        <Database className="w-5 h-5 text-slate-500" />
        Storage Usage
      </h3>
      <div className="glass-card rounded-[2rem] p-6 border border-white/40 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-secondary" />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-end mb-4">
              <div>
                <h4 className="font-bold text-2xl text-on-surface">{formatSize(totalUsed)}</h4>
                <p className="text-sm text-on-surface-variant">of 15 GB used</p>
              </div>
              <span className="text-sm font-semibold text-secondary">{percent.toFixed(1)}%</span>
            </div>
            <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden flex">
              <div className="h-full bg-secondary" style={{ width: getPercent(usage.images + usage.videos) }}></div>
              <div className="h-full bg-primary-container" style={{ width: getPercent(usage.documents) }}></div>
              <div className="h-full bg-amber-400" style={{ width: getPercent(usage.audio) }}></div>
            </div>
            <div className="flex flex-wrap gap-4 mt-4 text-xs font-medium text-on-surface-variant">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-secondary"></div> Media ({formatSize(usage.images + usage.videos)})</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary-container"></div> Docs ({formatSize(usage.documents)})</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Audio ({formatSize(usage.audio)})</div>
            </div>

            <button 
              onClick={clearCache}
              className="mt-6 w-full py-3 flex items-center justify-center gap-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear Local Cache
            </button>
          </>
        )}
      </div>
    </section>
  );
}
```
