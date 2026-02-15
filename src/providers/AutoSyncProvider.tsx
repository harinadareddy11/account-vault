import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { autoSyncToCloud } from '../utils/syncService';
import { AppState } from 'react-native';

interface SyncState {
  lastSync: number;
  status: 'idle' | 'syncing' | 'synced' | 'error';
  pendingChanges: number; // TODO: Connect to actual storage
}

interface AutoSyncContextType {
  syncState: SyncState;
  triggerAutoSync: () => Promise<void>;
  isSyncing: boolean;
  markPendingChange: () => void;  // ✅ ADDED
}


const AutoSyncContext = createContext<AutoSyncContextType | null>(null);

export const AutoSyncProvider: React.FC<{
  children: React.ReactNode;
  userId: string;
  masterPassword: string;
}> = ({ children, userId, masterPassword }) => {
  const [syncState, setSyncState] = useState<SyncState>({
    lastSync: 0,
    status: 'idle',
    pendingChanges: 0,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false); // 🔥 NEW

  const triggerAutoSync = useCallback(async (force = false) => {
    // 🔥 ONLY SYNC IF PENDING CHANGES OR FORCED
    if (!hasPendingChanges && !force) return;

    setSyncState(prev => ({ ...prev, status: 'syncing' }));
    setIsSyncing(true);
    
    try {
      await autoSyncToCloud(userId, masterPassword);
      setSyncState({
        lastSync: Date.now(),
        status: 'synced',
        pendingChanges: 0,
      });
      setHasPendingChanges(false);
    } catch (error) {
      console.error('❌ Sync failed:', error);
      setSyncState(prev => ({ ...prev, status: 'error' }));
    } finally {
      setIsSyncing(false);
    }
  }, [userId, masterPassword, hasPendingChanges]);

  // 🔥 FIXED: 15-MINUTE INTERVAL (not 3s!)
  useEffect(() => {
    const interval = setInterval(() => {
      triggerAutoSync(false);
    }, 15 * 60 * 1000); // 15 minutes

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && hasPendingChanges) {
        // Sync on foreground ONLY if changes exist
        triggerAutoSync(true);
      }
    });

    return () => {
      clearInterval(interval);
      subscription?.remove();
    };
  }, [triggerAutoSync, hasPendingChanges]);

  // 🔥 EXPOSE FOR OTHER COMPONENTS
  const markPendingChange = useCallback(() => {
    setHasPendingChanges(true);
    setSyncState(prev => ({ ...prev, pendingChanges: prev.pendingChanges + 1 }));
  }, []);

  return (
    <AutoSyncContext.Provider value={{ 
      syncState, 
      triggerAutoSync: (force?: boolean) => triggerAutoSync(force || false),
      isSyncing,
      markPendingChange // 🔥 NEW: Call when accounts change
    }}>
      {children}
    </AutoSyncContext.Provider>
  );
};

export const useAutoSync = () => {
  const context = useContext(AutoSyncContext);
  if (!context) {
    throw new Error('useAutoSync must be used within AutoSyncProvider');
  }
  return context;
};
