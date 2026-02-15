// src/screens/ProjectsScreen.tsx - FULLY FIXED WITH userId
import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getProjects, createProject } from '../utils/projectStorage';
import { RootStackParamList } from '../types';

type ProjectsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProjectsList'>;

interface Props {
  masterPassword: string;
  userId: string;  // 🔥 ADDED: REQUIRED
}

export default function ProjectsScreen({ masterPassword, userId }: Props) {  // 🔥 FIXED: Add userId to props
  const navigation = useNavigation<ProjectsScreenNavigationProp>();
  const route = useRoute<any>();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProjects();
  }, [userId]);  // 🔥 DEPENDENCY: Reload when userId changes

  const loadProjects = async () => {
    try {
      setLoading(true);
      console.log('📥 Loading projects for user:', userId.slice(0,8)+"...");
      const allProjects = await getProjects(userId);  // ✅ NOW WORKS
      console.log('✅ Projects loaded:', allProjects.length, 'projects');
      setProjects(allProjects);
    } catch (error) {
      console.error('❌ Error loading projects:', error);
      Alert.alert('Error', 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

const handleAddProject = () => {
  Alert.prompt(
    'New Project',
    'Enter project name:',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Create',
        onPress: async (name?: string) => {
          if (name?.trim()) {
            try {
              // 🔥 FIXED: Pass BOTH userId AND name
              await createProject(userId, name.trim());  
              await loadProjects();
              Alert.alert('✅ Success', 'Project created!');
            } catch (error) {
              Alert.alert('Error', 'Failed to create project');
            }
          }
        }
      }
    ],
    'plain-text'
  );
};




  const renderProject = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.projectCard}
      onPress={() => {
        console.log('🚀 Opening project:', item.id, item.name);
        navigation.navigate('ProjectDetail', { 
          projectId: item.id, 
          masterPassword,
          userId  // 🔥 PASS userId
        });
      }}
    >
      <Text style={styles.projectName}>{item.name}</Text>
      <Text style={styles.serviceCount}>0 services</Text>
      <Text style={styles.createdDate}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        renderItem={renderProject}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyText}>No projects yet. Create one!</Text>
            <TouchableOpacity style={styles.addProjectButton} onPress={handleAddProject}>
              <Text style={styles.addProjectText}>+ New Project</Text>
            </TouchableOpacity>
          </View>
        }
        ListHeaderComponent={
          <TouchableOpacity 
            style={styles.addProjectButton}
            onPress={handleAddProject}
          >
            <Text style={styles.addProjectText}>+ New Project</Text>
          </TouchableOpacity>
        }
        refreshing={loading}
        onRefresh={loadProjects}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20 },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingTop: 100 
  },
  emptyIcon: { fontSize: 64, marginBottom: 20 },
  addProjectButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  addProjectText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  projectCard: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  projectName: { fontSize: 22, color: '#fff', fontWeight: 'bold', marginBottom: 4 },
  serviceCount: { fontSize: 16, color: '#3b82f6', fontWeight: '600' },
  createdDate: { fontSize: 14, color: '#888', marginTop: 8 },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 32 },
});
