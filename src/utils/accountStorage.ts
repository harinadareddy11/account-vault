// src/utils/accountStorage.ts - FIXED WITH userId ISOLATION + ENCRYPTION
import { getDatabase, isDatabaseReady } from './database';
import { Account } from '../types';
import { encryptData } from './encryption';

// Safe database getter
const getDB = () => {
  if (!isDatabaseReady()) {
    throw new Error('Database not ready');
  }
  return getDatabase();
};

// 🔥 ALL QUERIES NOW REQUIRE userId
export const getAllAccounts = (userId: string): Account[] => {
  try {
    const db = getDB();
    return db.getAllSync<Account>(
      'SELECT * FROM accounts WHERE userId = ? ORDER BY createdAt DESC',
      [userId]
    ) || [];
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return [];
  }
};

export const getAccountsByCategory = (userId: string, category: string): Account[] => {
  try {
    const db = getDB();
    return db.getAllSync<Account>(
      'SELECT * FROM accounts WHERE userId = ? AND category = ? ORDER BY createdAt DESC',
      [userId, category]
    ) || [];
  } catch (error) {
    console.error('Error fetching accounts by category:', error);
    return [];
  }
};

export const getAccountsByEmail = (userId: string, email: string): Account[] => {
  try {
    const db = getDB();
    return db.getAllSync<Account>(
      'SELECT * FROM accounts WHERE userId = ? AND email = ? ORDER BY createdAt DESC',
      [userId, email]
    ) || [];
  } catch (error) {
    console.error('Error fetching accounts by email:', error);
    return [];
  }
};

export const searchAccounts = (userId: string, query: string): Account[] => {
  try {
    const db = getDB();
    const q = `%${query}%`;
    return db.getAllSync<Account>(
      'SELECT * FROM accounts WHERE userId = ? AND (serviceName LIKE ? OR email LIKE ? OR notes LIKE ?) ORDER BY createdAt DESC',
      [userId, q, q, q]
    ) || [];
  } catch (error) {
    console.error('Error searching accounts:', error);
    return [];
  }
};

// 🔥 FIXED: Add new account WITH encryption
export const addAccount = (
  userId: string,
  account: {
    serviceName: string;
    email: string;
    category: string;
    accountId?: string;
    password?: string;
    apiKey?: string;
    notes?: string;
    priority: 'normal' | 'important' | 'critical';
  },
  masterPassword: string   // 🔥 REQUIRED
): string => {
  try {
    const db = getDB();
    const id = `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const encryptedPassword = account.password
      ? encryptData(account.password, masterPassword)
      : null;

    const encryptedApiKey = account.apiKey
      ? encryptData(account.apiKey, masterPassword)
      : null;

    db.runSync(
      `INSERT INTO accounts 
      (id, userId, serviceName, email, category, accountId, password, apiKey, notes, priority, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        account.serviceName,
        account.email,
        account.category,
        account.accountId || null,
        encryptedPassword,
        encryptedApiKey,
        account.notes || null,
        account.priority,
        now,
        now,
      ]
    );

    console.log(`✅ Account saved securely for user ${userId}:`, account.serviceName);
    return id;
  } catch (error) {
    console.error('❌ Error adding account:', error);
    throw error;
  }
};

export const getAccountById = (userId: string, id: string): Account | null => {
  try {
    const db = getDB();
    return db.getFirstSync<Account>(
      'SELECT * FROM accounts WHERE userId = ? AND id = ?',
      [userId, id]
    ) || null;
  } catch (error) {
    console.error('Error fetching account:', error);
    return null;
  }
};

export const deleteAccount = (userId: string, id: string): boolean => {
  try {
    const db = getDB();
    db.runSync('DELETE FROM accounts WHERE userId = ? AND id = ?', [userId, id]);
    return true;
  } catch (error) {
    console.error('❌ Error deleting account:', error);
    return false;
  }
};

export const updateAccount = (
  userId: string,
  id: string,
  updates: Partial<Account>,
  masterPassword: string
): boolean => {
  try {
    const db = getDB();
    const now = Date.now();

    const encryptedPassword = updates.password
      ? encryptData(updates.password, masterPassword)
      : null;

    const encryptedApiKey = updates.apiKey
      ? encryptData(updates.apiKey, masterPassword)
      : null;

    db.runSync(
      `UPDATE accounts SET 
        serviceName = ?, email = ?, category = ?, accountId = ?, 
        password = ?, apiKey = ?, notes = ?, priority = ?, updatedAt = ?
       WHERE userId = ? AND id = ?`,
      [
        updates.serviceName || '',
        updates.email || '',
        updates.category || '',
        updates.accountId || null,
        encryptedPassword,
        encryptedApiKey,
        updates.notes || null,
        updates.priority || 'normal',
        now,
        userId,
        id,
      ]
    );

    return true;
  } catch (error) {
    console.error('❌ Error updating account:', error);
    return false;
  }
};

export const getUniqueEmails = (userId: string) => {
  try {
    const db = getDB();
    return db.getAllSync<{ email: string; count: number }>(
      'SELECT email, COUNT(*) as count FROM accounts WHERE userId = ? GROUP BY email ORDER BY count DESC',
      [userId]
    ) || [];
  } catch {
    return [];
  }
};

export const getStatistics = (userId: string) => {
  try {
    const db = getDB();
    return {
      totalAccounts:
        db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM accounts WHERE userId = ?', [userId])?.count || 0,
      criticalAccounts:
        db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM accounts WHERE userId = ? AND priority = "critical"', [userId])?.count || 0,
      accountsWithAPIKeys:
        db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM accounts WHERE userId = ? AND apiKey IS NOT NULL AND apiKey != ""', [userId])?.count || 0,
    };
  } catch {
    return null;
  }
};
