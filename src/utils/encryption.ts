// src/utils/encryption.ts
import 'react-native-get-random-values';
import CryptoJS from 'crypto-js';

// Encrypt data - handles both objects (sync) and strings (passwords)
export const encryptData = (data: any, masterPassword: string): string => {
  // If it's an object (for sync operations), stringify it
  // If it's already a string (password/API key), use as-is
  const stringData = typeof data === 'string' ? data : JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(stringData, masterPassword).toString();
  return encrypted;
};

// Decrypt data - tries to parse as JSON for sync, returns plain text for passwords
export const decryptData = (encryptedData: string, masterPassword: string): any => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, masterPassword);
    const plainText = decrypted.toString(CryptoJS.enc.Utf8);
    
    // Handle undefined or empty
    if (!plainText || plainText === undefined) return '';
    
    // Only try to parse as JSON if it looks like JSON (starts with { or [)
    // This prevents numbers like "123456" from being parsed as numbers
    if ((plainText.trim().startsWith('{') || plainText.trim().startsWith('['))) {
      try {
        return JSON.parse(plainText);
      } catch (e) {
        // If JSON parsing fails, return as plain text (password/API key)
        return plainText;
      }
    } else {
      // Not JSON format, return as plain text (password/API key)
      return plainText;
    }
  } catch (error) {
    console.error('Decryption failed:', error);
    return '';
  }
};

// Hash password for local verification
export const hashPassword = (password: string): string => {
  return CryptoJS.SHA256(password).toString();
};
