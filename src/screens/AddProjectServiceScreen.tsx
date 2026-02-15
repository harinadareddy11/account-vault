// src/screens/AddProjectServiceScreen.tsx - FIXED COMPLETE
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';  
import { addProjectService } from '../utils/projectStorage';
import { autoSyncToCloud } from '../utils/syncService';
import { RootStackParamList } from '../types';
import BrandLogo from '../components/BrandLogo';
import { useAuth } from '../../App';

type AddProjectServiceNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddProjectService'>;
type AddProjectServiceRouteProp = RouteProp<RootStackParamList, 'AddProjectService'>;

export default function AddProjectServiceScreen() {
  const navigation = useNavigation<AddProjectServiceNavigationProp>();
  const route = useRoute<AddProjectServiceRouteProp>();
  
const { projectId } = route.params;
const { userId, masterPassword } = useAuth();   // get from context

  const [serviceName, setServiceName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSave = async () => {
    if (!serviceName.trim()) {
      Alert.alert('Error', 'Service name required');
      return;
    }

    try {
      setLoading(true);
      const serviceData = {
        serviceName: serviceName.trim(),
        email: email.trim(),
        password: password.trim(),
        apiKey: apiKey.trim(),
        expiryDate: expiryDate?.toISOString() || '',
        notes: notes.trim()
      };
      
      // 🔥 FIXED: userId FIRST, projectId SECOND
      await addProjectService(userId, projectId, serviceData, masterPassword);
      
      // Auto-sync to cloud
      await autoSyncToCloud(userId, masterPassword);
      
      Alert.alert('✅ Success', `${serviceName} added to project!`);
      navigation.goBack();
    } catch (error) {
      console.error('❌ Save error:', error);
      Alert.alert('Error', 'Failed to save service');
    } finally {
      setLoading(false);
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Service</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          disabled={loading || !serviceName.trim()}
        >
          <Text style={[
            styles.saveButton, 
            (loading || !serviceName.trim()) && styles.saveButtonDisabled
          ]}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Service Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Service Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., AWS Console, Gmail, PayPal"
            placeholderTextColor="#666"
            value={serviceName}
            onChangeText={setServiceName}
            autoFocus
          />
          {serviceName && (
            <View style={styles.logoPreview}>
              <BrandLogo serviceName={serviceName} size={32} />
              <Text style={styles.logoText}>{serviceName}</Text>
            </View>
          )}
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email (optional)</Text>
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

        {/* Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password (optional)</Text>
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

        {/* API Key */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>API Key (optional)</Text>
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

        {/* Expiry Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>API Expiry Date (optional)</Text>
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

        {/* Notes */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes (optional)</Text>
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
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
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
    flex: 1,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingRight: 14,
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