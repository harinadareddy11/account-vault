// src/screens/AddProjectScreen.tsx - FIXED COMPLETE
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, 
  Platform, Modal 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { createProject, addProjectService } from '../utils/projectStorage';
import { autoSyncToCloud } from '../utils/syncService';
import BrandLogo from '../components/BrandLogo';
import { v4 as uuidv4 } from 'uuid';
import { RootStackParamList } from '../types';

type AddProjectNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddProject'>;
type AddProjectRouteProp = RouteProp<RootStackParamList, 'AddProject'>;

interface Service {
  id: string;
  serviceName: string;
  email: string;
  password: string;
  apiKey: string;
  expiryDate: Date | null;
  notes: string;
}

export default function AddProjectScreen() {
  const navigation = useNavigation<AddProjectNavigationProp>();
  const route = useRoute<AddProjectRouteProp>();
  
  const { masterPassword, userId } = route.params;

  const [projectName, setProjectName] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  const [serviceName, setServiceName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const resetServiceForm = () => {
    setServiceName('');
    setEmail('');
    setPassword('');
    setApiKey('');
    setExpiryDate(null);
    setNotes('');
    setShowPassword(false);
    setShowApiKey(false);
    setEditingServiceId(null);
  };

  const handleAddService = () => {
    if (!serviceName.trim()) {
      Alert.alert('Error', 'Service name is required');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    const newService: Service = {
      id: editingServiceId || uuidv4(),
      serviceName: serviceName.trim(),
      email: email.trim(),
      password: password.trim(),
      apiKey: apiKey.trim(),
      expiryDate,
      notes: notes.trim(),
    };

    if (editingServiceId) {
      setServices(services.map(s => s.id === editingServiceId ? newService : s));
      Alert.alert('Success', 'Service updated');
    } else {
      setServices([...services, newService]);
      Alert.alert('Success', 'Service added');
    }

    resetServiceForm();
    setShowServiceForm(false);
  };

  const handleEditService = (service: Service) => {
    setServiceName(service.serviceName);
    setEmail(service.email);
    setPassword(service.password);
    setApiKey(service.apiKey);
    setExpiryDate(service.expiryDate);
    setNotes(service.notes);
    setEditingServiceId(service.id);
    setShowServiceForm(true);
  };

  const handleDeleteService = (serviceId: string) => {
    Alert.alert(
      'Delete Service?', 
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => setServices(services.filter(s => s.id !== serviceId)) }
      ]
    );
  };

  const handleSaveProject = async () => {
    if (!projectName.trim()) {
      Alert.alert('Error', 'Project name is required');
      return;
    }
    if (services.length === 0) {
      Alert.alert('Error', 'Add at least one service to the project');
      return;
    }

    try {
      const projectId = await createProject(userId, projectName.trim());

      for (const service of services) {
        // 🔥 FIX: DO NOT encrypt here — storage layer already encrypts
        const serviceData = {
          serviceName: service.serviceName,
          email: service.email,
          password: service.password,      // raw
          apiKey: service.apiKey,          // raw
          expiryDate: service.expiryDate?.toISOString() || '',
          notes: service.notes,
        };

        await addProjectService(userId, projectId, serviceData, masterPassword);
      }

      await autoSyncToCloud(userId, masterPassword);

      Alert.alert('Success', 'Project and services created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('❌ Error saving project:', error);
      Alert.alert('Error', 'Failed to save project');
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Select expiry date';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Project</Text>
        <TouchableOpacity 
          onPress={handleSaveProject}
          disabled={!projectName.trim() || services.length === 0}
        >
          <Text style={[
            styles.saveButton,
            (!projectName.trim() || services.length === 0) && styles.saveButtonDisabled
          ]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Project Name Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Details</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Project Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., E-commerce Project, Mobile App"
              placeholderTextColor="#666"
              value={projectName}
              onChangeText={setProjectName}
            />
          </View>
        </View>

        {/* Services List */}
        <View style={styles.section}>
          <View style={styles.servicesHeader}>
            <Text style={styles.sectionTitle}>Services ({services.length})</Text>
            <TouchableOpacity
              style={styles.addServiceButton}
              onPress={() => {
                resetServiceForm();
                setShowServiceForm(true);
              }}
            >
              <Text style={styles.addServiceText}>+ Add Service</Text>
            </TouchableOpacity>
          </View>

          {services.map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <BrandLogo serviceName={service.serviceName} size={40} />
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.serviceName}</Text>
                  <Text style={styles.serviceEmail}>{service.email}</Text>
                </View>
              </View>

              <View style={styles.serviceActions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => handleEditService(service)}
                >
                  <Text>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteService(service.id)}
                >
                  <Text>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {services.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No services added yet</Text>
              <Text style={styles.emptySubtext}>Add at least one service to create the project</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Service Form Modal */}
      <Modal
        visible={showServiceForm}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          resetServiceForm();
          setShowServiceForm(false);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                resetServiceForm();
                setShowServiceForm(false);
              }}
            >
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingServiceId ? 'Edit Service' : 'Add Service'}</Text>
            <TouchableOpacity 
              onPress={handleAddService}
              disabled={!serviceName.trim() || !email.trim()}
            >
              <Text style={[
                styles.modalSaveButton,
                (!serviceName.trim() || !email.trim()) && styles.modalSaveButtonDisabled
              ]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Service Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., AWS Console, Gmail, PayPal"
                placeholderTextColor="#666"
                value={serviceName}
                onChangeText={setServiceName}
              />
              {serviceName && (
                <View style={styles.logoPreview}>
                  <BrandLogo serviceName={serviceName} size={32} />
                  <Text style={styles.logoText}>{serviceName}</Text>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordFieldContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter password"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButtonInline}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>API Key</Text>
              <View style={styles.passwordFieldContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter API key (optional)"
                  placeholderTextColor="#666"
                  value={apiKey}
                  onChangeText={setApiKey}
                  autoCapitalize="none"
                  secureTextEntry={!showApiKey}
                />
                <TouchableOpacity
                  style={styles.eyeButtonInline}
                  onPress={() => setShowApiKey(!showApiKey)}
                >
                  <Text style={styles.eyeIcon}>{showApiKey ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>API Expiry Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[styles.dateText, !expiryDate && styles.placeholder]}>
                  📅 {formatDate(expiryDate)}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={expiryDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setExpiryDate(selectedDate);
                    }
                  }}
                />
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g., For production only, backup API key in vault..."
                placeholderTextColor="#666"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

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
  cancelButton: {
    color: '#888',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  saveButton: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    color: '#666',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 14,
    paddingRight: 45,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  servicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addServiceButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addServiceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  serviceCard: {
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
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceInfo: {
    marginLeft: 12,
    flex: 1,
  },
  serviceName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  serviceEmail: {
    color: '#888',
    fontSize: 12,
  },
  serviceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    padding: 8,
  },
  deleteBtn: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingTop: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  modalCancelButton: {
    color: '#888',
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalSaveButton: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSaveButtonDisabled: {
    color: '#666',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  logoPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  logoText: {
    color: '#fff',
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  passwordFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  eyeButtonInline: {
    position: 'absolute',
    right: 14,
    padding: 8,
    zIndex: 10,
  },
  eyeIcon: {
    fontSize: 18,
  },
  dateButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  dateText: {
    color: '#fff',
    fontSize: 16,
  },
  placeholder: {
    color: '#666',
  },
});