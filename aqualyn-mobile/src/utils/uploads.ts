import { apiFetch } from './fetcher';
import { ENDPOINTS } from '../config/api';

/**
 * Uploads a file to the backend and returns the public URL.
 * This is 100% free as it use your own server storage.
 */
export const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiFetch('/api/upload', {
    method: 'POST',
    // Do NOT set Content-Type header; browser will set it with boundary automatically for FormData
    body: formData as any,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Upload failed');
  }

  const data = await res.json();
  return data.url;
};
