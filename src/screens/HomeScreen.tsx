// src/screens/HomeScreen.tsx - PERFECTLY TYPE-SAFE
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Alert, Modal,
  RefreshControl,  // 🔥 FIX 1: ADDED
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';  // 🔥 FIX 2: useFocusEffect
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getAllAccounts } from '../utils/accountStorage';
import { syncFromCloud } from '../utils/syncService';
import { isDatabaseReady, initDatabase } from '../utils/database';
import { RootStackParamList, Account } from '../types';
import BrandLogo from '../components/BrandLogo';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  userId: string;
  masterPassword: string;
}

export default function HomeScreen({ userId, masterPassword }: HomeScreenProps) {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  useEffect(() => {
    const checkDb = async () => {
      if (isDatabaseReady()) {
        console.log('✅ Database ready');
        setIsDbReady(true);
      } else {
        console.log('⚠️ Initializing database...');
        const success = await initDatabase();
        if (success) {
          setIsDbReady(true);
        } else {
          Alert.alert('Error', 'Database initialization failed');
        }
      }
    };
    setTimeout(checkDb, 100);
  }, []);

  useFocusEffect(  // ✅ NOW WORKS
    useCallback(() => {
      if (isDbReady) loadAccounts();
    }, [isDbReady, userId])
  );

  const loadAccounts = async () => {
    try {
      const allAccounts = await getAllAccounts(userId);
      console.log(`📊 Loaded ${allAccounts.length} accounts for user ${userId.slice(0,8)}`);
      setAccounts(allAccounts);
      setFilteredAccounts(allAccounts);
    } catch (error) {
      console.error('❌ Error loading accounts:', error);
      Alert.alert('Error', 'Failed to load accounts');
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredAccounts(accounts);
    } else {
      const filtered = accounts.filter(
        (account) =>
          account.serviceName.toLowerCase().includes(query.toLowerCase()) ||
          account.email?.toLowerCase().includes(query.toLowerCase()) ||
          account.category.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredAccounts(filtered);
    }
  };

  const handleCloudSync = async () => {
    setRefreshing(true);
    try {
      console.log('☁️ Syncing for user:', userId.slice(0,8));
      const cloudData = await syncFromCloud(userId, masterPassword);
      await loadAccounts();
      
      if (cloudData === null) {
        Alert.alert('ℹ️ No Cloud Data', 'Using local data');
      } else {
        Alert.alert('✅ Synced', `Downloaded ${cloudData.length} accounts`);
      }
    } catch (error) {
      console.error('❌ Sync error:', error);
      Alert.alert('❌ Sync Failed', 'Check your internet connection');
    } finally {
      setRefreshing(false);  // 🔥 FIX 4: CORRECTED
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#ef4444';
      case 'important': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const renderAccount = ({ item }: { item: Account }) => (
    <TouchableOpacity
      style={styles.accountCard}
      onPress={() => {
        console.log('🔍 Opening account:', item.id);
        navigation.navigate('AccountDetail', { 
          accountId: item.id, 
          userId, 
          masterPassword 
        });
      }}
      activeOpacity={0.8}
    >
      <View style={styles.accountLeft}>
        <BrandLogo serviceName={item.serviceName} size={48} />
        <View style={styles.accountInfo}>
          <Text style={styles.serviceName} numberOfLines={1}>{item.serviceName}</Text>
          <Text style={styles.accountEmail} numberOfLines={1}>{item.email}</Text>
        </View>
      </View>
      <View style={styles.accountRight}>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.priorityText}>{item.priority}</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
      </View>
    </TouchableOpacity>
  );

  if (!isDbReady) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingIcon}>⏳</Text>
          <Text style={styles.loadingText}>Initializing secure storage...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Accounts</Text>
          <Text style={styles.subtitle}>Securely stored services</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('EmailSelector', { userId, masterPassword })}
            activeOpacity={0.7}
          >
            <Text style={styles.iconButtonText}>📧</Text>
            <Text style={styles.iconLabel}>Emails</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleCloudSync}
            activeOpacity={0.7}
          >
            <Text style={styles.iconButtonText}>☁️</Text>
            <Text style={styles.iconLabel}>Cloud</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search accounts..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{accounts.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {accounts.filter(a => a.priority === 'critical').length}
          </Text>
          <Text style={styles.statLabel}>Critical</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {new Set(accounts.map(a => a.email).filter(Boolean)).size}
          </Text>
          <Text style={styles.statLabel}>Emails</Text>
        </View>
      </View>

      <FlatList  // ✅ RefreshControl NOW WORKS
        data={filteredAccounts}
        renderItem={renderAccount}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleCloudSync}
            tintColor="#3b82f6"
            colors={['#3b82f6']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No matches found' : 'No accounts yet'}
            </Text>
            <Text style={styles.emptySubtext}>  {/* ✅ FIX 3: NOW WORKS */}
              {searchQuery ? '' : 'Tap + to add your first service'}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddMenu(true)}
        activeOpacity={0.9}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={showAddMenu} transparent animationType="fade" onRequestClose={() => setShowAddMenu(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowAddMenu(false);
                navigation.navigate('AddAccount', { userId, masterPassword });
              }}
            >
              <Text style={styles.menuIcon}>➕</Text>
              <View>
                <Text style={styles.menuTitle}>Add Service</Text>
                <Text style={styles.menuDesc}>Individual accounts</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowAddMenu(false);
                navigation.navigate('AddProject', { userId, masterPassword });
              }}
            >
              <Text style={styles.menuIcon}>🏗️</Text>
              <View>
                <Text style={styles.menuTitle}>Add Project</Text>
                <Text style={styles.menuDesc}>Organized services</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemCancel]}
              onPress={() => setShowAddMenu(false)}
            >
              <Text style={styles.menuTitleCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconButtonText: {
    fontSize: 20,
  },
  iconLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 14,
  },
  clearIcon: {
    fontSize: 18,
    color: '#666',
    paddingHorizontal: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  accountCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  accountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  accountInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  accountEmail: {
    fontSize: 14,
    color: '#888',
  },
  accountRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  arrow: {
    fontSize: 20,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  emptySubtext: {  // 🔥 FIX 3: ADDED
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 100,  // 🔥 CHANGED: Moved up from 30 to 100 for better visibility
    right: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: -2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  menuIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  menuDesc: {
    fontSize: 13,
    color: '#888',
  },
  menuItemCancel: {
    borderBottomWidth: 0,
    justifyContent: 'center',
    marginTop: 12,
  },
  menuTitleCancel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
});