// src/utils/secureStorage.ts
import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';

const MASTER_PASSWORD_HASH_KEY = 'master_password_hash';
const USER_ID_KEY = 'user_id';

// Hash password
const hashPassword = (password: string): string => {
  return CryptoJS.SHA256(password).toString();
};

// Save master password (hashed)
export const saveMasterPassword = async (password: string): Promise<void> => {
  const hash = hashPassword(password);
  await SecureStore.setItemAsync(MASTER_PASSWORD_HASH_KEY, hash);
};

// Verify master password
export const verifyMasterPassword = async (password: string): Promise<boolean> => {
  const storedHash = await SecureStore.getItemAsync(MASTER_PASSWORD_HASH_KEY);
  if (!storedHash) return false;
  const inputHash = hashPassword(password);
  return inputHash === storedHash;
};

// Save user ID
export const saveUserId = async (userId: string): Promise<void> => {
  await SecureStore.setItemAsync(USER_ID_KEY, userId);
};

// Get user ID
export const getUserId = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(USER_ID_KEY);
};

// Check if setup complete
export const isSetupComplete = async (): Promise<boolean> => {
  const hash = await SecureStore.getItemAsync(MASTER_PASSWORD_HASH_KEY);
  const userId = await SecureStore.getItemAsync(USER_ID_KEY);
  return hash !== null && userId !== null;
};

// Clear all stored data (logout)
export const clearStorage = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(MASTER_PASSWORD_HASH_KEY);
  await SecureStore.deleteItemAsync(USER_ID_KEY);
};
