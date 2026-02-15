// src/screens/ProjectDetailScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet, Clipboard,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { 
  getProjectById, 
  getProjectServices, 
  deleteProjectService
} from '../utils/projectStorage';
import { autoSyncToCloud } from '../utils/syncService';
import { RootStackParamList } from '../types';
import BrandLogo from '../components/BrandLogo';

// 🔥 TYPES MATCHING YOUR RootStackParamList
type ProjectDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProjectDetail'>;
type ProjectDetailRouteProp = RouteProp<RootStackParamList, 'ProjectDetail'>;

// Props received from App.tsx Render Prop pattern
interface ProjectDetailProps {
  userId: string;
  masterPassword: string;
}

export default function ProjectDetailScreen({ userId: propUserId, masterPassword }: ProjectDetailProps) {
  const navigation = useNavigation<ProjectDetailNavigationProp>();
  const route = useRoute<ProjectDetailRouteProp>();
  
  // projectId comes from the navigation params
const { projectId, userId: routeUserId } = route.params;
const userId = routeUserId || propUserId;
  
  const [project, setProject] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  // UseFocusEffect ensures data reloads when coming back from adding a service
  useFocusEffect(
    useCallback(() => {
      loadProjectData();
    }, [projectId, userId])
  );

const loadProjectData = async () => {
  try {
    setLoading(true);
    const proj = await getProjectById(projectId, userId);

    // 🔥 FIXED: correct parameter order
    const projectServices = await getProjectServices(userId, projectId, masterPassword);

    setProject(proj);
    setServices(projectServices);
  } catch (error) {
    console.error('❌ Error loading project data:', error);
    Alert.alert('Error', 'Failed to load project data');
  } finally {
    setLoading(false);
  }
};


  const togglePassword = (serviceId: string) => {
    setShowPasswords(prev => ({ ...prev, [serviceId]: !prev[serviceId] }));
  };

  const toggleApiKey = (serviceId: string) => {
    setShowApiKeys(prev => ({ ...prev, [serviceId]: !prev[serviceId] }));
  };

  const copyToClipboard = async (text: string, label: string) => {
    if (!text) {
      Alert.alert('Error', 'Nothing to copy');
      return;
    }
    try {
      await Clipboard.setString(text);
      Alert.alert('✅ Copied', `${label} copied to clipboard!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const deleteService = (serviceId: string) => {
    Alert.alert(
      'Delete Service',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProjectService(serviceId, userId);
              await loadProjectData();
              await autoSyncToCloud(userId, masterPassword);
              Alert.alert('✅ Deleted', 'Service removed');
            } catch (error) {
              Alert.alert('❌ Error', 'Failed to delete service');
            }
          }
        }
      ]
    );
  };

  const addService = () => {
    navigation.navigate('AddProjectService', { 
      projectId, 
      masterPassword, 
      userId 
    });
  };

  const getExpiryStatus = (dateString: string) => {
    try {
      const expiryDate = new Date(dateString);
      const today = new Date();
      const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysLeft < 0) return `❌ Expired ${Math.abs(daysLeft)} days ago`;
      if (daysLeft === 0) return '⚠️ Expires today';
      if (daysLeft <= 7) return `🚨 Expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`;
      if (daysLeft <= 30) return `⏰ Expires in ${daysLeft} days`;
      return `✅ Expires in ${Math.floor(daysLeft / 30)} month${Math.floor(daysLeft / 30) > 1 ? 's' : ''}`;
    } catch {
      return 'Date format error';
    }
  };

  if (loading && !project) return <View style={styles.container}><Text style={styles.loading}>Loading secure data...</Text></View>;
  if (!project) return <View style={styles.container}><Text style={styles.error}>Project not found</Text></View>;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.projectIcon}>🏗️</Text>
          <View>
            <Text style={styles.projectTitle}>{project.name}</Text>
            <Text style={styles.projectDate}>Created {new Date(project.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
        <View style={styles.serviceCounter}>
          <Text style={styles.serviceCountText}>{services.length}</Text>
          <Text style={styles.serviceCountLabel}>Services</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {services.length > 0 ? (
          <View style={styles.servicesContainer}>
            {services.map((service: any, index: number) => (
              <View key={service.id} style={styles.serviceCard}>
                <View style={styles.serviceHeader}>
                  <View style={styles.logoContainer}>
                    <BrandLogo serviceName={service.serviceName} size={44} />
                  </View>
                  <View style={styles.serviceTitleRow}>
                    <Text style={styles.serviceNumber}>{index + 1}.</Text>
                    <Text style={styles.serviceName}>{service.serviceName}</Text>
                  </View>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteService(service.id)}>
                    <Text style={styles.deleteBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>

                {service.email && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📧 Email</Text>
                    <View style={styles.credentialField}>
                      <Text style={styles.credentialValue}>{service.email}</Text>
                      <TouchableOpacity onPress={() => copyToClipboard(service.email!, 'Email')} style={styles.copyBtn}>
                        <Text>📋</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {service.decryptedPassword && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🔐 Password</Text>
                    <View style={styles.credentialField}>
                      <Text 
                        style={[
                          styles.credentialValue,
                          !showPasswords[service.id] && styles.maskedText
                        ]}
                        numberOfLines={1}
                      >
                        {showPasswords[service.id] ? service.decryptedPassword : '••••••••••••••••'}
                      </Text>
                      <TouchableOpacity onPress={() => togglePassword(service.id)} style={styles.toggleBtn}>
                        <Text>{showPasswords[service.id] ? '🙈' : '👁️'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => copyToClipboard(service.decryptedPassword!, 'Password')} style={styles.copyBtn}>
                        <Text>📋</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {service.decryptedApiKey && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🔑 API Key</Text>
                    <View style={styles.credentialField}>
                      <Text 
                        style={[
                          styles.credentialValue,
                          !showApiKeys[service.id] && styles.maskedText
                        ]}
                        numberOfLines={1}
                      >
                        {showApiKeys[service.id] ? service.decryptedApiKey : '••••••••••••••••••••'}
                      </Text>
                      <TouchableOpacity onPress={() => toggleApiKey(service.id)} style={styles.toggleBtn}>
                        <Text>{showApiKeys[service.id] ? '🙈' : '👁️'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => copyToClipboard(service.decryptedApiKey!, 'API Key')} style={styles.copyBtn}>
                        <Text>📋</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {service.expiryDate && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📅 Expiry Date</Text>
                    <View style={styles.expiryDateBox}>
                      <Text style={styles.expiryDateValue}>
                        {new Date(service.expiryDate).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </Text>
                      <Text style={styles.expiryDateLabel}>{getExpiryStatus(service.expiryDate)}</Text>
                    </View>
                  </View>
                )}

                {service.notes && (
                  <View style={[styles.section, styles.lastSection]}>
                    <Text style={styles.sectionTitle}>📝 Notes</Text>
                    <Text style={styles.notesText}>{service.notes}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No services yet</Text>
            <Text style={styles.emptySubtext}>Add services to this project</Text>
          </View>
        )}

        <TouchableOpacity style={styles.addServiceButton} onPress={addService}>
          <Text style={styles.addServiceButtonText}>+ Add Service</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 28, color: '#fff' },
  headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 16 },
  projectIcon: { fontSize: 32, marginRight: 12 },
  projectTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  projectDate: { fontSize: 12, color: '#666' },
  serviceCounter: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 50,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  serviceCountText: { fontSize: 18, fontWeight: 'bold', color: '#3b82f6' },
  serviceCountLabel: { fontSize: 10, color: '#666', marginTop: 2 },
  servicesContainer: { paddingHorizontal: 16, paddingTop: 16 },
  serviceCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    gap: 12,
  },
  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  serviceTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  serviceNumber: { fontSize: 16, fontWeight: 'bold', color: '#3b82f6', marginRight: 10 },
  serviceName: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  deleteBtn: { padding: 8, backgroundColor: '#2a2a2a', borderRadius: 8 },
  deleteBtnText: { fontSize: 16 },
  section: { marginBottom: 16 },
  lastSection: { marginBottom: 0 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 10, textTransform: 'uppercase' },
  credentialField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0f0f',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 8,
  },
  credentialValue: { flex: 1, fontSize: 15, color: '#fff', fontFamily: 'monospace' },
  maskedText: { color: '#999', letterSpacing: 3 },
  toggleBtn: { padding: 8 },
  copyBtn: { padding: 8 },
  notesText: { fontSize: 14, color: '#ccc', lineHeight: 20, backgroundColor: '#0f0f0f', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#2a2a2a' },
  expiryDateBox: { backgroundColor: '#0f0f0f', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#2a2a2a' },
  expiryDateValue: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 6 },
  expiryDateLabel: { fontSize: 13, color: '#3b82f6', fontWeight: '500' },
  addServiceButton: { marginHorizontal: 16, marginTop: 8, backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  addServiceButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 80 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  emptySubtext: { color: '#666', fontSize: 14 },
  loading: { flex: 1, color: '#fff', textAlign: 'center', marginTop: 100 },
  error: { color: '#ff4444', textAlign: 'center', marginTop: 100 },
});