// src/screens/CategoryDetailScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { categories } from '../data/categories';
import { getAllAccounts } from '../utils/accountStorage';
import { getProjects } from '../utils/projectStorage'; // 🔥 NEW: Required for project counts
import { RootStackParamList, Account } from '../types';
import BrandLogo from '../components/BrandLogo';

type CategoryDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CategoryDetail'>;
type CategoryDetailRouteProp = RouteProp<RootStackParamList, 'CategoryDetail'>;

export default function CategoryDetailScreen() {
  const navigation = useNavigation<CategoryDetailNavigationProp>();
  const route = useRoute<CategoryDetailRouteProp>();
  
  const { categoryId, userId, masterPassword } = route.params;
  
  const [accountCounts, setAccountCounts] = useState<{ [key: string]: number }>({});
  const [projectCount, setProjectCount] = useState(0); // 🔥 Track total projects
  const [refreshing, setRefreshing] = useState(false);

  const category = categories.find(cat => cat.id === categoryId);

  const loadData = async () => {
    try {
      setRefreshing(true);
      
      // 1. If this is the Projects category, load project data
      if (categoryId === 'projects') {
        const projects = await getProjects(userId);
        setProjectCount(projects.length);
      }

      // 2. Load account counts for individual services
      const accounts = await getAllAccounts(userId);
      const counts: { [key: string]: number } = {};
      
      category?.services.forEach(service => {
        counts[service.id] = accounts.filter(
          acc => acc.serviceName.toLowerCase().includes(service.name.toLowerCase())
        ).length;
      });
      
      setAccountCounts(counts);
    } catch (error) {
      console.error('❌ Error loading category data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [categoryId, userId])
  );

  const renderService = ({ item }: { item: { id: string; name: string; logo: string } }) => {
    const count = accountCounts[item.id] || 0;

 const handlePress = () => {
    // 1. If this is the "Projects" category, go to the Projects List
    if (categoryId === 'projects') {
      navigation.navigate('ProjectsList', { 
        userId, 
        masterPassword 
      });
      return;
    }

    // 2. Otherwise, use the standard account logic
    if (count === 0) {
      // No accounts yet - go to Add Screen
      navigation.navigate('AddAccount', {
        prefilledData: {
          serviceName: item.name,
          category: categoryId,
        },
        userId,
        masterPassword,
      });
    } else {
      // Has accounts - go to the details
      navigation.navigate('ServiceDetail', {
        categoryId,
        serviceId: item.id,
        userId,
        masterPassword,
      });
    }
  };

    return (
      <TouchableOpacity
        style={styles.serviceCard}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.serviceLeft}>
          <View style={styles.logoContainer}>
            <BrandLogo serviceName={item.name} size={56} fallbackEmoji={item.logo} />
          </View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{item.name}</Text>
            <Text style={styles.serviceCount}>
              {categoryId === 'projects' 
                ? 'View your developer stacks' 
                : (count === 0 ? 'No accounts yet' : `${count} ${count === 1 ? 'account' : 'accounts'}`)}
            </Text>
          </View>
        </View>

        <Text style={styles.arrow}>→</Text>
      </TouchableOpacity>
    );
  };

  if (!category) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Category not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
          <Text style={styles.headerIcon}>{category.icon}</Text>
          <Text style={styles.headerTitle}>{category.name}</Text>
          <Text style={styles.headerSubtitle}>
            {categoryId === 'projects' 
              ? `${projectCount} active projects` 
              : `${category.services.length} services available`}
          </Text>
        </View>
      </LinearGradient>

      <FlatList
        data={category.services}
        renderItem={renderService}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20 },
  backButton: { width: 40, height: 40, justifyContent: 'center', marginBottom: 10 },
  backText: { fontSize: 28, color: '#fff', fontWeight: 'bold' },
  headerContent: { alignItems: 'center' },
  headerIcon: { fontSize: 64, marginBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  listContent: { padding: 20 },
  serviceCard: {
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
  serviceLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  logoContainer: { marginRight: 16 },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  serviceCount: { fontSize: 14, color: '#888' },
  arrow: { fontSize: 24, color: '#666' },
  errorText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 100 },
});