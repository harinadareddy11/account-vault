// src/screens/ProjectsListScreen.tsx - 100% TYPE-SAFE
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getProjects, deleteProject } from '../utils/projectStorage';
import { autoSyncToCloud } from '../utils/syncService';
import { RootStackParamList, Project } from '../types';

type ProjectsListNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProjectsList'>;

interface ProjectsListScreenProps {
  userId: string;
  masterPassword: string;
}

export default function ProjectsListScreen({ userId, masterPassword }: ProjectsListScreenProps) {
  const navigation = useNavigation<ProjectsListNavigationProp>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [userId])  // 🔥 DEPENDENCY: userId
  );

  const loadProjects = async () => {
    try {
      const allProjects = await getProjects(userId);  // 🔥 FIXED: Pass userId
      console.log(`📊 Loaded ${allProjects.length} projects`);
      setProjects(allProjects);
    } catch (error) {
      console.error('❌ Error loading projects:', error);
      Alert.alert('Error', 'Failed to load projects');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  };

  const handleDeleteProject = (projectId: string, projectName: string) => {
    Alert.alert(
      '⚠️ Delete Project',
      `Delete "${projectName}" and all its services? This cannot be undone.`,
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProject(projectId, userId);  // 🔥 FIXED: Pass userId
              await loadProjects();
              
              // Auto-sync to cloud
              await autoSyncToCloud(userId, masterPassword);
              
              Alert.alert('✅ Deleted', 'Project removed successfully');
            } catch (error) {
              Alert.alert('❌ Error', 'Failed to delete project');
            }
          }
        }
      ]
    );
  };

  const renderProject = ({ item }: { item: Project }) => (  // 🔥 FIXED: Type Project
    <TouchableOpacity
      style={styles.projectCard}
      onPress={() => {
        console.log('🔍 Opening project:', item.id, item.name);
        navigation.navigate('ProjectDetail', {  // 🔥 FIXED: Proper typing
          projectId: item.id,
          masterPassword,
          userId,  // 🔥 REQUIRED by your types
        });
      }}
      onLongPress={() => handleDeleteProject(item.id, item.name)}
      activeOpacity={0.8}
    >
      <View style={styles.projectHeader}>
        <View style={styles.projectIconContainer}>
          <Text style={styles.projectIcon}>🏗️</Text>
        </View>
        <View style={styles.projectInfo}>
          <Text style={styles.projectName}>{item.name}</Text>
          <Text style={styles.projectDate}>
            Created {new Date(item.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>
      </View>
      <Text style={styles.arrow}>→</Text>
    </TouchableOpacity>
  );

  const handleAddProject = () => {
    navigation.navigate('AddProject', { userId,masterPassword  });  // 🔥 FIXED: Pass userId
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Projects</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddProject}
        >
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Projects List */}
      <FlatList
        data={projects}
        renderItem={renderProject}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl  // ✅ ALREADY PERFECT
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3b82f6"
            colors={['#3b82f6']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No projects yet</Text>
            <Text style={styles.emptySubtext}>Create your first project to organize your accounts</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleAddProject}
            >
              <Text style={styles.emptyButtonText}>Create Project</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

// Styles unchanged - already perfect ✅
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  backButton: {
    color: '#888',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  projectCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  projectIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1a2a3a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#2a3a4a',
  },
  projectIcon: {
    fontSize: 28,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  projectDate: {
    color: '#888',
    fontSize: 12,
  },
  arrow: {
    color: '#666',
    fontSize: 18,
    marginLeft: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
