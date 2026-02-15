// src/utils/masterPasswordService.ts - Master password management
import { supabase } from './supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';

const SECURE_PASSWORD_PREFIX = 'secure_master_password_';
const STORAGE_KEY = 'stored_credentials';

export interface PasswordChangeResult {
  success: boolean;
  message: string;
}

// Initialize master password hash on first login
export const initializeMasterPassword = async (userId: string, masterPassword: string): Promise<boolean> => {
  try {
    const storedHash = await AsyncStorage.getItem(`master_password_hash_${userId}`);
    
    if (storedHash) {
      console.log('✅ Master password hash already exists');
      return true;
    }

    // Create and store hash for first time
    const hash = CryptoJS.SHA256(masterPassword).toString();
    await AsyncStorage.setItem(`master_password_hash_${userId}`, hash);
    
    console.log('✅ Master password initialized and stored');
    return true;
  } catch (error) {
    console.error('❌ Error initializing master password:', error);
    return false;
  }
};

// Verify current master password
export const verifyCurrentMasterPassword = async (userId: string, currentPassword: string): Promise<boolean> => {
  try {
    // Get stored hash from secure storage
    const storedHash = await AsyncStorage.getItem(`master_password_hash_${userId}`);
    
    if (!storedHash) {
      console.error('⚠️ No stored password hash found - initializing...');
      // Initialize on first use
      await initializeMasterPassword(userId, currentPassword);
      return true;
    }

    // Hash the provided password and compare
    const providedHash = CryptoJS.SHA256(currentPassword).toString();
    const matches = providedHash === storedHash;

    if (matches) {
      console.log('✅ Master password verified');
    } else {
      console.log('❌ Master password verification failed');
      console.log('🔍 Provided hash:', providedHash);
      console.log('🔍 Stored hash:', storedHash);
    }

    return matches;
  } catch (error) {
    console.error('❌ Error verifying master password:', error);
    return false;
  }
};

// Change master password
export const changeMasterPassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<PasswordChangeResult> => {
  try {
    console.log('🔄 Starting master password change process...');
    console.log('👤 UserId:', userId.slice(0, 8) + '...');

    // Verify current password first
    const isValid = await verifyCurrentMasterPassword(userId, currentPassword);
    if (!isValid) {
      console.log('❌ Current password verification failed');
      return {
        success: false,
        message: 'Current password is incorrect',
      };
    }

    console.log('✅ Current password verified successfully');

    // Validate new password strength
    if (newPassword.length < 8) {
      return {
        success: false,
        message: 'New password must be at least 8 characters',
      };
    }

    if (newPassword === currentPassword) {
      return {
        success: false,
        message: 'New password must be different from current password',
      };
    }

    // ✅ CRITICAL FIX: Update Supabase auth password FIRST
    console.log('🔄 Updating Supabase auth password...');
    const { error: authError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (authError) {
      console.error('❌ Failed to update Supabase password:', authError);
      return {
        success: false,
        message: 'Failed to update authentication password: ' + authError.message,
      };
    }
    console.log('✅ Supabase auth password updated successfully');

    // Store new password hash in AsyncStorage
    const oldHash = await AsyncStorage.getItem(`master_password_hash_${userId}`);
    const newHash = CryptoJS.SHA256(newPassword).toString();

    console.log('🔍 OLD HASH:', oldHash?.slice(0, 20) + '...');
    console.log('🔍 NEW HASH:', newHash.slice(0, 20) + '...');
    console.log('🔍 HASH CHANGED?', oldHash !== newHash);

    // Update master password hash
    await AsyncStorage.setItem(`master_password_hash_${userId}`, newHash);
    console.log('✅ New password hash stored in AsyncStorage');

    // Verify it was saved
    const verifyHash = await AsyncStorage.getItem(`master_password_hash_${userId}`);
    console.log('🔍 VERIFIED SAVED HASH:', verifyHash?.slice(0, 20) + '...');
    console.log('✅ HASH MATCHES NEW?', verifyHash === newHash);

    // ✅ CRITICAL: Update stored_credentials with new hash
    const storedCreds = await AsyncStorage.getItem(STORAGE_KEY);
    
    if (storedCreds) {
      const creds = JSON.parse(storedCreds);
      creds.masterPasswordHash = newHash;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
      console.log('✅ Updated stored_credentials with new hash');
      
      // Verify stored_credentials update
      const verifyCreds = await AsyncStorage.getItem(STORAGE_KEY);
      const parsedCreds = JSON.parse(verifyCreds || '{}');
      console.log('🔍 STORED_CREDENTIALS hash:', parsedCreds.masterPasswordHash?.slice(0, 20) + '...');
    } else {
      console.log('⚠️ No stored_credentials found - creating new one');
      // Create it if it doesn't exist
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        userId,
        email: '', // Will be updated on next login
        masterPasswordHash: newHash,
      }));
      console.log('✅ Created new stored_credentials');
    }

    // ✅ UPDATE: Also update SecureStore for biometric unlock
    const secureKey = `${SECURE_PASSWORD_PREFIX}${userId}`;
    await SecureStore.setItemAsync(secureKey, newPassword, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED,
    });
    console.log('✅ New password stored in SecureStore for biometric unlock');

    // Verify SecureStore update
    const verifySecure = await SecureStore.getItemAsync(secureKey);
    console.log('🔍 SecureStore password matches new?', verifySecure === newPassword);

    // Also update in Supabase backup table (optional)
    const { error: backupError } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        master_password_hash: newHash,
        updated_at: new Date().toISOString(),
      });

    if (backupError) {
      console.warn('⚠️ Warning: Could not sync password hash to cloud backup:', backupError);
      // Still return success since local change was made
    } else {
      console.log('✅ Password hash synced to Supabase backup table');
    }

    console.log('🎉 Master password changed successfully!');
    console.log('📋 Summary:');
    console.log('  - Supabase auth password: ✅ Updated');
    console.log('  - master_password_hash_${userId}: ✅ Updated');
    console.log('  - stored_credentials: ✅ Updated');
    console.log('  - SecureStore: ✅ Updated');
    console.log('  - Supabase backup: ' + (backupError ? '⚠️ Failed (non-critical)' : '✅ Synced'));

    return {
      success: true,
      message: 'Master password changed successfully. Please login with your new password.',
    };
  } catch (error: any) {
    console.error('❌ Error changing master password:', error);
    return {
      success: false,
      message: error?.message || 'Failed to change master password',
    };
  }
};

// ✅ NEW: Encrypt data with master password
export const encryptWithMasterPassword = (data: string, masterPassword: string): string => {
  try {
    const encrypted = CryptoJS.AES.encrypt(data, masterPassword).toString();
    return encrypted;
  } catch (error) {
    console.error('❌ Encryption failed:', error);
    throw new Error('Encryption failed');
  }
};

// ✅ NEW: Decrypt data with master password
export const decryptWithMasterPassword = (encryptedData: string, masterPassword: string): string => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, masterPassword);
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedText) {
      throw new Error('Decryption failed - wrong password or corrupted data');
    }
    
    return decryptedText;
  } catch (error) {
    console.error('❌ Decryption failed:', error);
    throw new Error('Decryption failed - wrong password');
  }
};

// Validate password strength
export const validatePasswordStrength = (password: string): {
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 20;
  } else if (password.length >= 6) {
    score += 10;
  } else {
    feedback.push('At least 8 characters recommended');
  }

  if (/[a-z]/.test(password)) {
    score += 20;
  }

  if (/[A-Z]/.test(password)) {
    score += 20;
  }

  if (/[0-9]/.test(password)) {
    score += 20;
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 20;
  }

  if (score < 40) {
    feedback.push('Consider using uppercase, numbers, and special characters');
  }

  return { score: Math.min(score, 100), feedback };
};

export default {
  initializeMasterPassword,
  verifyCurrentMasterPassword,
  changeMasterPassword,
  encryptWithMasterPassword,
  decryptWithMasterPassword,
  validatePasswordStrength,
};