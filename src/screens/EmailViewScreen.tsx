// src/screens/EmailViewScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { getAllAccounts } from '../utils/accountStorage';
import { RootStackParamList, Account } from '../types';
import BrandLogo from '../components/BrandLogo';

type EmailViewNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EmailView'>;
type EmailViewRouteProp = RouteProp<RootStackParamList, 'EmailView'>;

interface EmailGroup {
  email: string;
  accounts: Account[];
  count: number;
}

export default function EmailViewScreen() {
  const navigation = useNavigation<EmailViewNavigationProp>();
  const route = useRoute<EmailViewRouteProp>();
  
  // Safely handle params to prevent crashes
  const params = route.params || {};
  const { userId, masterPassword, email: preselectedEmail = '', autoOpenSelector = false } = params;
  
  const [emailGroups, setEmailGroups] = useState<EmailGroup[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(preselectedEmail || null);
  const [selectedAccounts, setSelectedAccounts] = useState<Account[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Auto-navigate to Selector if requested from Home
  useEffect(() => {
    if (autoOpenSelector && userId) {
      navigation.navigate('EmailSelector', { userId, masterPassword });
      navigation.setParams({ autoOpenSelector: false } as any);
    }
  }, [autoOpenSelector, userId]);

  const loadEmails = async () => {
    if (!userId) return;
    try {
      setRefreshing(true);
      const allAccounts = await getAllAccounts(userId);
      
      const grouped: { [email: string]: Account[] } = {};
      allAccounts.forEach(account => {
        const emailKey = account.email || 'No Email';
        if (!grouped[emailKey]) grouped[emailKey] = [];
        grouped[emailKey].push(account);
      });

      const emailGroupsArray: EmailGroup[] = Object.entries(grouped).map(([email, accounts]) => ({
        email,
        accounts,
        count: accounts.length,
      }));

      emailGroupsArray.sort((a, b) => b.count - a.count);
      setEmailGroups(emailGroupsArray);

      // Handle direct selection if preselectedEmail matches
      if (preselectedEmail && preselectedEmail !== '') {
        const group = emailGroupsArray.find(g => g.email === preselectedEmail);
        if (group) {
          setSelectedEmail(group.email);
          setSelectedAccounts(group.accounts);
        }
      }
    } catch (error) {
      console.error('❌ Error loading emails:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEmails();
    }, [userId, preselectedEmail])
  );

  const handleEmailPress = (emailGroup: EmailGroup) => {
    setSelectedEmail(emailGroup.email);
    setSelectedAccounts(emailGroup.accounts);
  };

  const handleBackToEmails = () => {
    setSelectedEmail(null);
    setSelectedAccounts([]);
  };

  const getCategoryIcon = (category: string): string => {
    const icons: { [key: string]: string } = {
      'Cloud & Dev Tools': '☁️',
      'Coding Profiles': '💻',
      'AI & APIs': '🤖',
      'Subscriptions': '🎬',
      'Education': '🎓',
      'Social Media': '📱',
      'Finance': '💳',
      'Email': '📧',
      'Other': '📁',
    };
    return icons[category] || '📁';
  };

  const renderEmailCard = ({ item }: { item: EmailGroup }) => (
    <TouchableOpacity
      style={styles.emailCard}
      onPress={() => handleEmailPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.emailCardContent}>
        <View style={styles.emailIcon}>
          <Text style={styles.emailIconText}>📧</Text>
        </View>
        <View style={styles.emailInfo}>
          <Text style={styles.emailText} numberOfLines={1}>{item.email}</Text>
          <Text style={styles.accountCount}>{item.count} accounts</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
      </View>
    </TouchableOpacity>
  );

  const renderAccountCard = ({ item }: { item: Account }) => (
    <TouchableOpacity
      style={styles.accountCard}
      onPress={() => navigation.navigate('AccountDetail', { 
        accountId: item.id,
        userId,
        masterPassword
      })}
      activeOpacity={0.7}
    >
      <View style={styles.accountHeader}>
        <BrandLogo serviceName={item.serviceName} size={48} />
        <View style={styles.accountInfo}>
          <Text style={styles.serviceName} numberOfLines={1}>{item.serviceName}</Text>
          <Text style={styles.categoryText}>
            {getCategoryIcon(item.category)} {item.category}
          </Text>
        </View>
        <Text style={styles.arrow}>→</Text>
      </View>
    </TouchableOpacity>
  );

  // Main Category/Email Group List (Selector View)
  if (!selectedEmail) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Emails</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Stats Summary - Accurate Counts */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{emailGroups.length}</Text>
            <Text style={styles.statLabel}>Emails</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {emailGroups.reduce((sum, group) => sum + group.count, 0)}
            </Text>
            <Text style={styles.statLabel}>Total Accounts</Text>
          </View>
        </View>

        <FlatList
          data={emailGroups}
          renderItem={renderEmailCard}
          keyExtractor={(item) => item.email}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadEmails} />}
        />
      </View>
    );
  }

  // Account Detail List for Selected Email
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToEmails} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Emails</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {selectedEmail}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.selectedEmailHeader}>
        <Text style={styles.selectedEmailText} numberOfLines={1}>{selectedEmail}</Text>
        <Text style={styles.selectedEmailCount}>
          {selectedAccounts.length} accounts
        </Text>
      </View>

      <FlatList
        data={selectedAccounts}
        renderItem={renderAccountCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadEmails} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 60, 
    paddingBottom: 20 
  },
  backButton: { padding: 8 },
  backButtonText: { color: '#3b82f6', fontSize: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', flex: 1, textAlign: 'center' },
  statsCard: { 
    flexDirection: 'row', 
    backgroundColor: '#1a1a1a', 
    marginHorizontal: 20, 
    marginBottom: 20, 
    borderRadius: 12, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: '#2a2a2a' 
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 32, fontWeight: 'bold', color: '#3b82f6', marginBottom: 4 },
  statLabel: { fontSize: 14, color: '#888' },
  statDivider: { width: 1, backgroundColor: '#2a2a2a', marginHorizontal: 20 },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  emailCard: { backgroundColor: '#1a1a1a', borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a2a' },
  emailCardContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  emailIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: '#2a2a2a', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  emailIconText: { fontSize: 24 },
  emailInfo: { flex: 1 },
  emailText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  accountCount: { fontSize: 14, color: '#888' },
  arrow: { fontSize: 20, color: '#666' },
  selectedEmailHeader: { 
    backgroundColor: '#1a1a1a', 
    marginHorizontal: 20, 
    marginBottom: 20, 
    padding: 16, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#2a2a2a' 
  },
  selectedEmailText: { fontSize: 16, color: '#fff', fontWeight: 'bold', marginBottom: 4 },
  selectedEmailCount: { fontSize: 14, color: '#3b82f6' },
  accountCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a2a' },
  accountHeader: { flexDirection: 'row', alignItems: 'center' },
  accountInfo: { flex: 1, marginLeft: 12 },
  serviceName: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  categoryText: { fontSize: 14, color: '#888' },
});