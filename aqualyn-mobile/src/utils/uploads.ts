import { apiFetch } from './fetcher';

export interface RativeNativeFileParam {
  uri: string;
  name?: string;
  type?: string;
}

/**
 * Uploads a file from a device URI to the backend and returns the cloud target string.
 */
export const uploadFile = async (file: RativeNativeFileParam): Promise<string> => {
  const formData = new FormData();

  // Extract metadata directly from the device asset path if undefined
  const uriParts = file.uri.split('/');
  const fileName = file.name || uriParts[uriParts.length - 1] || 'upload.jpg';
  
  let fileType = file.type;
  if (!fileType) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    fileType = ext === 'mp4' ? 'video/mp4' : 'image/jpeg';
  }

  // React Native's FormData expects a specific shape for files instead of standard Web Blobs/Files
  formData.append('file', {
    uri: file.uri,
    name: fileName,
    type: fileType,
  } as any);

  const res = await apiFetch('/api/upload', {
    method: 'POST',
    body: formData,
    headers: {
      // Allow the engine to inject bound multi-part borders automatically
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Upload failed');
  }

  const data = await res.json();
  return data.url;
};