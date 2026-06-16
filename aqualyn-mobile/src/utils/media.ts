/**
 * media.ts
 * Cross platform binary transform wrappers optimized for Native mobile devices.
 */

/**
 * Converts local sandbox resource targets safely into clean transport base64 strings.
 */
export const fileToBase64 = async (uri: string): Promise<string> => {
  try {
    let FileSystem: any;
    try {
      FileSystem = require('expo-file-system');
    } catch {
      // Core configuration package layout if fallback is preferred
    }

    if (FileSystem && FileSystem.readAsStringAsync) {
      return await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }

    // Bare React Native tracking variant fallback layout
    const RNFS = require('react-native-fs');
    if (RNFS && RNFS.readFile) {
      return await RNFS.readFile(uri, 'base64');
    }
    
    throw new Error('No compatible filesystem helper module detected.');
  } catch (err) {
    console.error('[Media Utility] Failed binary conversion:', err);
    throw err;
  }
};

/**
 * Stand-in utility placeholder mapping object structure parameters matching standard data vectors.
 */
export const dataURLtoFile = (dataurl: string, filename: string): { uri: string; name: string; type: string } => {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  
  return {
    uri: dataurl, // Pass direct reference data payload upstream safely
    name: filename,
    type: mime,
  };
};