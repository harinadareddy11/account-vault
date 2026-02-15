// src/screens/CategoriesHomeScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Alert, RefreshControl
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { categories } from '../data/categories';
import { getProjects } from '../utils/projectStorage';
import { syncToCloud, syncFromCloud } from '../utils/syncService';
import { RootStackParamList, Project } from '../types';

const { width } = Dimensions.get('window');
// Adjusted margin logic for a more stable grid
const CARD_MARGIN = 10;
const CARD_WIDTH = (width - (20 * 2) - (CARD_MARGIN * 2)) / 2;

type CategoriesHomeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CategoriesHome'>;

interface CategoriesHomeScreenProps {
  userId: string;
  masterPassword: string;
}

export default function CategoriesHomeScreen({ userId, masterPassword }: CategoriesHomeScreenProps) {
  const navigation = useNavigation<CategoriesHomeNavigationProp>();
  const [syncing, setSyncing] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    syncFromCloudData();
    loadProjects();
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [userId])
  );

  const loadProjects = async () => {
    try {
      const allProjects = await getProjects(userId);
      setProjects(allProjects);
    } catch (error) {
      console.error('❌ Error loading projects:', error);
    }
  };

  const syncFromCloudData = async () => {
    try {
      setSyncing(true);
      await syncFromCloud(userId, masterPassword);
    } catch (error) {
      console.error('❌ Cloud sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const success = await syncToCloud(userId, masterPassword);
      setSyncing(false);

      if (success) {
        Alert.alert('✅ Synced!', 'Your data is backed up ☁️');
      } else {
        Alert.alert('❌ Sync failed', 'Could not sync. Try again later.');
      }
    } catch (error) {
      setSyncing(false);
      Alert.alert('❌ Sync error', 'Check your connection');
    }
  };

  const renderCategory = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => {
        if (item.type === 'projects') {
          navigation.navigate('ProjectsList', { userId, masterPassword });
        } else {
          navigation.navigate('CategoryDetail', { 
            categoryId: item.id, 
            userId, 
            masterPassword 
          });
        }
      }}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={item.gradient as [string, string]}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.categoryIcon}>{item.icon}</Text>
        <View>
            <Text style={styles.categoryName}>{item.name}</Text>
            <Text style={styles.serviceCount}>
            {item.type === 'projects' 
                ? `${projects.length} projects` 
                : `${item.services.length} services`
            }
            </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const getCombinedData = () => {
    const projectsCategory = {
      id: 'projects',
      name: 'Projects',
      icon: '🏗️',
      type: 'projects',
      gradient: ['#1e293b', '#0f172a'] as [string, string], // Improved dark gradient
      services: [],
    };
    return [projectsCategory, ...categories];
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back! 👋</Text>
          <Text style={styles.title}>AccountVault</Text>
        </View>
        <TouchableOpacity 
          style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
          onPress={handleSync}
          disabled={syncing}
        >
          <Text style={styles.syncIcon}>{syncing ? '⏳' : '☁️'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={getCombinedData()}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent} // 🔥 FIXED: Bottom padding added here
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={syncing}
            onRefresh={handleSync}
            tintColor="#3b82f6"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    zIndex: 10,
  },
  greeting: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  syncButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#151515',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  syncButtonDisabled: {
    opacity: 0.5,
  },
  syncIcon: {
    fontSize: 20,
  },
  listContent: {
    paddingHorizontal: 15, // Side padding for the grid
    paddingTop: 10,
    paddingBottom: 100, // 🔥 KEY FIX: Extra padding at the bottom so last cards scroll up fully
  },
  categoryCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.1, // Adjusted ratio for better fit
    margin: CARD_MARGIN,
    borderRadius: 24,
    overflow: 'hidden',
    // Minimal shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cardGradient: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
  },
  categoryIcon: {
    fontSize: 36,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },
  serviceCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
    fontWeight: '600',
  },
});