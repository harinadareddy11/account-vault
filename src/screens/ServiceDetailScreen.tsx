// src/screens/ServiceDetailScreen.tsx - 100% TYPE-SAFE
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { 
  NativeStackNavigationProp 
} from '@react-navigation/native-stack';     // ✅ NavigationProp ONLY
import type { 
  RouteProp 
} from '@react-navigation/native';  
import { LinearGradient } from 'expo-linear-gradient';
import { getAllAccounts } from '../utils/accountStorage';
import { categories } from '../data/categories';
import { RootStackParamList, Account } from '../types';
import BrandLogo from '../components/BrandLogo';

type ServiceDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ServiceDetail'>;
type ServiceDetailRouteProp = RouteProp<RootStackParamList, 'ServiceDetail'>;

export default function ServiceDetailScreen() {
  const navigation = useNavigation<ServiceDetailNavigationProp>();
  const route = useRoute<ServiceDetailRouteProp>();
  const [accounts, setAccounts] = useState<Account[]>([]);

  // 🔥 FIXED: Get ALL required params
  const { categoryId, serviceId, userId, masterPassword } = route.params;  // ✅ masterPassword ADDED
  
  // Validate required params
  if (!userId || !masterPassword) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Session required</Text>
      </View>
    );
  }

  const category = categories.find(cat => cat.id === categoryId);
  const service = category?.services.find(srv => srv.id === serviceId);

  useEffect(() => {
    loadAccounts();
  }, [categoryId, serviceId, userId]); // 🔥 Proper dependencies

  // 🔥 FIXED: Make async + proper filtering
  const loadAccounts = async () => {
    try {
      const allAccounts = await getAllAccounts(userId);  // ✅ Now async
      const serviceName = service?.name?.toLowerCase() || '';
      const filtered = allAccounts.filter(acc => 
        acc.serviceName.toLowerCase().includes(serviceName)
      );
      setAccounts(filtered);
    } catch (error) {
      console.error('❌ Error loading accounts:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#ef4444';
      case 'important': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'critical': return '🔴 Critical';
      case 'important': return '🟡 Important';
      default: return '⚪ Normal';
    }
  };

  // 🔥 FIXED: AccountDetail navigation with ALL params
  const renderAccount = ({ item }: { item: Account }) => (
    <TouchableOpacity
      style={styles.accountCard}
      onPress={() => navigation.navigate('AccountDetail', { 
        accountId: item.id,
        userId,
        masterPassword  // 🔥 REQUIRED by types
      })}
      activeOpacity={0.8}
    >
      <View style={styles.accountHeader}>
        <View style={styles.accountLeft}>
          <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(item.priority) }]} />
          <View style={styles.accountInfo}>
            <Text style={styles.accountEmail}>{item.email}</Text>
            {item.accountId && (
              <Text style={styles.accountId} numberOfLines={1}>
                ID: {item.accountId}
              </Text>
            )}
          </View>
        </View>
        <Text style={styles.arrow}>→</Text>
      </View>

      <View style={styles.accountFooter}>
        <Text style={styles.priorityLabel}>{getPriorityLabel(item.priority)}</Text>
        {item.lastUsed && (
          <Text style={styles.lastUsed}>
            Last used: {new Date(item.lastUsed).toLocaleDateString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  // 🔥 FIXED: AddAccount navigation with ALL params
  const handleAddAccount = () => {
    navigation.navigate('AddAccount', {
      prefilledData: {
        serviceName: service?.name || '',
        category: categoryId,
      },
      userId,
      masterPassword  // 🔥 REQUIRED by types
    });
  };

  if (!category || !service) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Service not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={category.gradient as [string, string]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.logoWrapper}>
            <BrandLogo serviceName={service.name} size={80} fallbackEmoji={service.logo} />
          </View>
          <Text style={styles.serviceTitle}>{service.name}</Text>
          <Text style={styles.accountCount}>
            {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
          </Text>
        </View>
      </LinearGradient>

      {/* Accounts List */}
      {accounts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>No accounts yet</Text>
          <Text style={styles.emptyText}>
            Add your first {service.name} account
          </Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddAccount}>
            <LinearGradient
              colors={category.gradient as [string, string]}
              style={styles.addButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.addButtonText}>+ Add Account</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={accounts}
            renderItem={renderAccount}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
          <TouchableOpacity style={styles.fab} onPress={handleAddAccount}>
            <LinearGradient
              colors={category.gradient as [string, string]}
              style={styles.fabGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.fabText}>+</Text>
            </LinearGradient>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 10,
  },
  backText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerContent: {
    alignItems: 'center',
  },
  logoWrapper: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
  },
  serviceTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  accountCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  listContent: {
    padding: 20,
  },
  accountCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  accountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  accountId: {
    fontSize: 13,
    color: '#888',
  },
  arrow: {
    fontSize: 20,
    color: '#666',
  },
  accountFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityLabel: {
    fontSize: 12,
    color: '#999',
  },
  lastUsed: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    marginBottom: 32,
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: -2,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 100,
  },
});
