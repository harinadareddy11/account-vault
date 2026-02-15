// src/screens/EmailSelectorScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getAllAccounts } from '../utils/accountStorage';
import { RootStackParamList, Account } from '../types';

type EmailSelectorNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EmailSelector'>;

interface EmailGroup {
  email: string;
  count: number;
}

export default function EmailSelectorScreen({ userId, masterPassword }: { userId: string, masterPassword: string }) {
  const navigation = useNavigation<EmailSelectorNavigationProp>();
  const [emailGroups, setEmailGroups] = useState<EmailGroup[]>([]);
  const [totalServices, setTotalServices] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadEmailStats = async () => {
    try {
      setRefreshing(true);
      const allAccounts = await getAllAccounts(userId);
      setTotalServices(allAccounts.length);

      // Grouping logic to get unique emails and their service counts
      const grouped: { [email: string]: number } = {};
      allAccounts.forEach(account => {
        const email = account.email || 'No Email';
        grouped[email] = (grouped[email] || 0) + 1;
      });

      const emailGroupsArray: EmailGroup[] = Object.entries(grouped).map(([email, count]) => ({
        email,
        count,
      }));

      // Sort by count descending (matches your image style)
      emailGroupsArray.sort((a, b) => b.count - a.count);
      setEmailGroups(emailGroupsArray);
    } catch (error) {
      console.error('❌ Error loading selector stats:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEmailStats();
    }, [userId])
  );

  const renderEmailItem = ({ item }: { item: EmailGroup }) => (
    <TouchableOpacity
      style={styles.emailCard}
      onPress={() => {
        // Navigate back to EmailView with the selected email
        navigation.navigate('EmailView', { 
          email: item.email, 
          userId, 
          masterPassword,
          autoOpenSelector: false // Prevent loop
        });
      }}
    >
      <View style={styles.emailCardContent}>
        <View style={styles.emailIconContainer}>
          <Text style={styles.emailIcon}>📧</Text>
        </View>
        <View style={styles.emailInfo}>
          <Text style={styles.emailText} numberOfLines={1}>{item.email}</Text>
          <Text style={styles.countText}>{item.count} accounts</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Emails</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* 🔥 THE STATS SECTION (Matches your screenshot) */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{emailGroups.length}</Text>
          <Text style={styles.statLabel}>Emails</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalServices}</Text>
          <Text style={styles.statLabel}>Total Accounts</Text>
        </View>
      </View>

      <FlatList
        data={emailGroups}
        renderItem={renderEmailItem}
        keyExtractor={(item) => item.email}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadEmailStats} tintColor="#3b82f6" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  backButton: { padding: 8 },
  backText: { color: '#3b82f6', fontSize: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', flex: 1, textAlign: 'center' },
  
  // 🔥 STATS BOX STYLING
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 36, fontWeight: 'bold', color: '#3b82f6', marginBottom: 4 },
  statLabel: { fontSize: 14, color: '#888' },
  statDivider: { width: 1, backgroundColor: '#2a2a2a', marginHorizontal: 10 },

  listContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  emailCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  emailCardContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  emailIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  emailIcon: { fontSize: 24 },
  emailInfo: { flex: 1 },
  emailText: { fontSize: 17, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  countText: { fontSize: 14, color: '#888' },
  arrow: { fontSize: 18, color: '#444' },
});