// src/screens/AddAccountScreen.tsx - 100% PRODUCTION READY
import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, 
  Alert, Platform, Modal 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { v4 as uuidv4 } from 'uuid';
import { encryptData } from '../utils/encryption';
import { addAccount } from '../utils/accountStorage';
import { autoSyncToCloud } from '../utils/syncService';
import BrandLogo from '../components/BrandLogo';
import { RootStackParamList } from '../types';

type AddAccountNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddAccount'>;
type AddAccountRouteProp = RouteProp<RootStackParamList, 'AddAccount'>;

const CATEGORIES = [
  'Cloud & Dev Tools',
  'Coding Profiles',
  'AI & APIs',
  'Subscriptions',
  'Education',
  'Social Media',
  'Finance',
  'Email',
  'Other',
] as const;
type Category = string;

export default function AddAccountScreen() {
  const navigation = useNavigation<AddAccountNavigationProp>();
  const route = useRoute<AddAccountRouteProp>();
  
  // ✅ ALL PARAMS FROM ROUTE - FULL TYPE SAFETY
  const { userId, masterPassword, prefilledData } = route.params;

  const [serviceName, setServiceName] = useState(prefilledData?.serviceName || '');
const [category, setCategory] = useState<Category>(prefilledData?.category || 'Other');  const [email, setEmail] = useState(prefilledData?.email || '');
  const [accountId, setAccountId] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState(prefilledData?.apiKey || '');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<'critical' | 'important' | 'normal'>('normal');
  
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSave = async () => {
    if (!serviceName.trim()) {
      Alert.alert('Error', 'Service name is required');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    const accountData = {
      id: uuidv4(),  // ✅ Generate ID
      serviceName: serviceName.trim(),
      email: email.trim(),
      category,
      accountId: accountId.trim() || undefined,
      password: password ? encryptData(password, masterPassword) : undefined,
      apiKey: apiKey ? encryptData(apiKey, masterPassword) : undefined,
      notes: notes.trim() || undefined,
      priority
    };

    try {
      await addAccount(userId, accountData, masterPassword);  // ✅ Pass userId
      await autoSyncToCloud(userId, masterPassword);
      Alert.alert('Success', 'Account saved successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('❌ Save error:', error);
      Alert.alert('Error', 'Failed to save account');
    }
  };

  const selectCategory = (cat: Category) => {
    setCategory(cat);
    setCategoryModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Account</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          disabled={!serviceName.trim() || !email.trim()}
          style={[
            styles.headerButton,
            (!serviceName.trim() || !email.trim()) && styles.headerButtonDisabled
          ]}
        >
          <Text style={[
            styles.saveButton,
            (!serviceName.trim() || !email.trim()) && styles.saveButtonDisabled
          ]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Service Preview */}
        {serviceName && (
          <View style={styles.previewCard}>
            <BrandLogo serviceName={serviceName} size={64} />
            <Text style={styles.previewText}>{serviceName}</Text>
          </View>
        )}

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          {/* Service Name */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Service Name</Text>
              <Text style={styles.required}>* Required</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="e.g., AWS Console, Firebase"
              placeholderTextColor="#666"
              value={serviceName}
              onChangeText={setServiceName}
              returnKeyType="next"
            />
          </View>

          {/* Category Dropdown */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Category</Text>
              <Text style={styles.required}>* Required</Text>
            </View>
            <TouchableOpacity
              style={styles.dropdownContainer}
              activeOpacity={0.7}
              onPress={() => setCategoryModalVisible(true)}
            >
              <Text style={styles.dropdownText}>{category}</Text>
              <View style={styles.dropdownIcon}>
                <Text style={styles.dropdownArrow}>▼</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.required}>* Required</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>

          {/* Account ID */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Account ID</Text>
              <Text style={styles.optional}>Optional</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Username or Account ID"
              placeholderTextColor="#666"
              value={accountId}
              onChangeText={setAccountId}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Credentials */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Credentials</Text>
          
          {/* Password with Toggle */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Password</Text>
              <Text style={styles.optional}>Optional</Text>
            </View>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Enter password"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="next"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.eyeIcon}>
                  {showPassword ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* API Key with Toggle */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>API Key</Text>
              <Text style={styles.optional}>Optional</Text>
            </View>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Enter API key"
                placeholderTextColor="#666"
                value={apiKey}
                onChangeText={setApiKey}
                secureTextEntry={!showApiKey}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowApiKey(!showApiKey)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.eyeIcon}>
                  {showApiKey ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Additional Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Info</Text>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Priority</Text>
              <Text style={styles.optional}>Optional</Text>
            </View>
            <View style={styles.priorityButtons}>
              {(['normal', 'important', 'critical'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityButton,
                    priority === p && styles.priorityButtonActive,
                  ]}
                  onPress={() => setPriority(p)}
                >
                  <Text style={[
                    styles.priorityButtonText,
                    priority === p && styles.priorityButtonTextActive,
                  ]}>
                    {p === 'critical' && '🔴'}
                    {p === 'important' && '🟡'}
                    {p === 'normal' && '🟢'}
                    {' '}
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Notes</Text>
              <Text style={styles.optional}>Optional</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Additional notes about this account..."
              placeholderTextColor="#666"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setCategoryModalVisible(false)}
        >
          <View style={styles.categoryModal}>
            <Text style={styles.modalTitle}>Select Category</Text>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.modalItem,
                  category === cat && styles.modalItemActive
                ]}
                onPress={() => selectCategory(cat)}
              >
                <Text style={[
                  styles.modalItemText,
                  category === cat && styles.modalItemTextActive
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerButton: {
    padding: 8,
  },
  cancelButton: {
    color: '#888',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  saveButton: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  previewCard: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginTop: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  previewText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  inputGroup: {
    marginBottom: 24,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '500',
  },
  required: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '500',
  },
  optional: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  // ✅ NEW SHOW/HIDE STYLES
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    marginRight: 12,
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 20,
    color: '#888',
  },
  dropdownContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 56,
  },
  dropdownText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  dropdownIcon: {
    paddingLeft: 8,
  },
  dropdownArrow: {
    color: '#888',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // ✅ MODAL STYLES - NO OVERLAP!
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  categoryModal: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  modalItemActive: {
    backgroundColor: '#3b82f6',
  },
  modalItemText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  modalItemTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  priorityButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#60a5fa',
  },
  priorityButtonText: {
    color: '#888',
    fontSize: 15,
    fontWeight: '500',
  },
  priorityButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  // 🔥 ADD THESE TWO:
  headerButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonDisabled: {
    color: '#666',
  },
});

