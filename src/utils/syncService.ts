import { supabase } from './supabaseClient';
import { encryptData, decryptData } from './encryption';
import { getAllAccounts } from './accountStorage';
import { getProjects, getProjectServices } from './projectStorage';
import { getDatabase, initUserDatabase } from './database';
import { Account } from '../types';

/* =========================
   UPLOAD TO CLOUD
========================= */

export const syncToCloud = async (userId: string, masterPassword: string): Promise<boolean> => {
  try {
    const accounts = getAllAccounts(userId);
    const projects = await getProjects(userId);

    const projectsData = [];
    for (const project of projects) {
      // 🔥 FIXED ORDER: userId, projectId, masterPassword
      const services = await getProjectServices(userId, project.id, masterPassword);
      projectsData.push({ ...project, services });
    }

    const syncData = {
      accounts,
      projects: projectsData,
      syncedAt: new Date().toISOString(),
    };

    const encryptedData = encryptData(syncData, masterPassword);

    const { data: existing, error: fetchError } = await supabase
      .from('encrypted_accounts')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    if (existing) {
      const { error } = await supabase
        .from('encrypted_accounts')
        .update({
          encrypted_data: encryptedData,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('encrypted_accounts')
        .insert({
          user_id: userId,
          encrypted_data: encryptedData,
        });

      if (error) throw error;
    }

    console.log(`☁️ Synced ${projects.length} projects for ${userId.slice(0, 8)}...`);
    return true;
  } catch (error) {
    console.error('❌ Sync failed:', error);
    return false;
  }
};

/* =========================
   DOWNLOAD FROM CLOUD
========================= */

export const syncFromCloud = async (userId: string, masterPassword: string): Promise<Account[] | null> => {
  try {
    const { data, error } = await supabase
      .from('encrypted_accounts')
      .select('encrypted_data')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') return null;
    if (!data?.encrypted_data) return null;

    const decryptedData = decryptData(data.encrypted_data, masterPassword);
    if (!decryptedData) return null;

    const db = getDatabase();

    const accounts = decryptedData.accounts || [];
    const projects = decryptedData.projects || [];

    // 🔥 Clear only this user's data
    db.runSync('DELETE FROM accounts WHERE userId = ?', [userId]);
    db.runSync('DELETE FROM projects WHERE userId = ?', [userId]);
    db.runSync('DELETE FROM project_services WHERE userId = ?', [userId]);

    // Restore accounts
    for (const acc of accounts) {
      db.runSync(
        `INSERT OR REPLACE INTO accounts 
        (id, userId, serviceName, email, category, accountId, password, apiKey, notes, priority, createdAt, updatedAt, lastUsed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          acc.id, userId, acc.serviceName, acc.email, acc.category,
          acc.accountId, acc.password, acc.apiKey, acc.notes,
          acc.priority || 'normal', acc.createdAt, acc.updatedAt, acc.lastUsed
        ]
      );
    }

    // Restore projects
    for (const project of projects) {
      db.runSync(
        `INSERT OR REPLACE INTO projects (id, userId, name, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?)`,
        [project.id, userId, project.name, project.createdAt, project.updatedAt]
      );

      for (const service of project.services || []) {
        db.runSync(
          `INSERT OR REPLACE INTO project_services
           (id, projectId, userId, serviceName, email, password, apiKey, expiryDate, notes, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            service.id, project.id, userId, service.serviceName,
            service.email, service.password, service.apiKey,
            service.expiryDate, service.notes, service.createdAt
          ]
        );
      }
    }

    await initUserDatabase(userId);
    console.log(`⬇️ Restored ${projects.length} projects for ${userId.slice(0, 8)}`);
    return accounts;
  } catch (error) {
    console.error('❌ Download failed:', error);
    return null;
  }
};

/* =========================
   AUTO SYNC
========================= */

export const autoSyncToCloud = async (userId: string, masterPassword: string): Promise<void> => {
  try {
    const accounts = getAllAccounts(userId);
    const projects = await getProjects(userId);

    const projectsData = [];
    for (const project of projects) {
      // 🔥 FIXED ORDER
      const services = await getProjectServices(userId, project.id, masterPassword);
      projectsData.push({ ...project, services });
    }

    const encryptedData = encryptData({ accounts, projects: projectsData }, masterPassword);

    const { data } = await supabase
      .from('encrypted_accounts')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      await supabase
        .from('encrypted_accounts')
        .update({ encrypted_data: encryptedData, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
    } else {
      await supabase
        .from('encrypted_accounts')
        .insert({ user_id: userId, encrypted_data: encryptedData });
    }

    console.log(`🔄 Auto-synced ${projects.length} projects`);
  } catch (error) {
    console.error('⚠️ Auto-sync failed:', error);
  }
};
