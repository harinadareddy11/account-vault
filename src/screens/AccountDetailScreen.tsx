// src/screens/AccountDetailScreen.tsx - PRODUCTION READY
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, 
  Clipboard, TextInput, Platform 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { getAccountById, deleteAccount, updateAccount } from '../utils/accountStorage';
import { autoSyncToCloud } from '../utils/syncService';
import { decryptData, encryptData } from '../utils/encryption';
import { RootStackParamList, Account } from '../types';
import BrandLogo from '../components/BrandLogo';

type AccountDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AccountDetail'>;
type AccountDetailRouteProp = RouteProp<RootStackParamList, 'AccountDetail'>;

export default function AccountDetailScreen() {
  const navigation = useNavigation<AccountDetailNavigationProp>();
  const route = useRoute<AccountDetailRouteProp>();
  
  // 🔥 ALL FROM ROUTE.PARAMS
  const { userId, masterPassword, accountId } = route.params;

  const [account, setAccount] = useState<Account | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit states
  const [editEmail, setEditEmail] = useState('');
  const [editAccountId, setEditAccountId] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editApiKey, setEditApiKey] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editPriority, setEditPriority] = useState<'normal' | 'important' | 'critical'>('normal');

  // ✅ COMPUTED - Decrypted values
  const decryptedPassword = account?.password ? decryptData(account.password, masterPassword) : '';
  const decryptedApiKey = account?.apiKey ? decryptData(account.apiKey, masterPassword) : '';

  useEffect(() => {
    loadAccount();
  }, [accountId, userId, masterPassword]);

  const loadAccount = () => {
    if (!accountId) {
      Alert.alert('Error', 'No account ID provided');
      navigation.goBack();
      return;
    }

    const acc = getAccountById(userId, accountId);
    if (acc) {
      setAccount(acc);
      setEditEmail(acc.email);
      setEditAccountId(acc.accountId || '');
      setEditPassword(''); // Clear on load, decrypted shown separately
      setEditApiKey('');
      setEditNotes(acc.notes || '');
      setEditPriority(acc.priority);
    } else {
      Alert.alert('Error', 'Account not found');
      navigation.goBack();
    }
  };

  // 🔥 ✅ PRIORITY COLOR FUNCTION - MISSING PIECE!
  const getPriorityColor = (priority: 'normal' | 'important' | 'critical'): string => {
    switch (priority) {
      case 'critical': return '#ef4444';  // Red
      case 'important': return '#f59e0b'; // Yellow/Orange
      default: return '#6b7280';         // Gray
    }
  };

  const handleCopy = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('✅ Copied', `${label} copied to clipboard`);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (account) {
      setEditEmail(account.email);
      setEditAccountId(account.accountId || '');
      setEditPassword('');
      setEditApiKey('');
      setEditNotes(account.notes || '');
      setEditPriority(account.priority);
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!account || !accountId) return;

    if (!editEmail.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    const updatedAccount: Account = {
      ...account,
      email: editEmail.trim(),
      accountId: editAccountId.trim() || undefined,
      password: editPassword.trim() ? encryptData(editPassword.trim(), masterPassword) : account.password,
      apiKey: editApiKey.trim() ? encryptData(editApiKey.trim(), masterPassword) : account.apiKey,
      notes: editNotes.trim() || undefined,
      priority: editPriority,
      updatedAt: Date.now(),
    };

    try {
updateAccount(userId, account.id, updatedAccount, masterPassword);
      await autoSyncToCloud(userId, masterPassword);
      
      setAccount(updatedAccount);
      setIsEditing(false);
      Alert.alert('✅ Saved', 'Account updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save changes');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (account) {
              deleteAccount(userId, account.id);
              await autoSyncToCloud(userId, masterPassword);
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  if (!account) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          {isEditing ? (
            <>
              <TouchableOpacity style={styles.iconButton} onPress={handleCancelEdit}>
                <Text style={styles.iconButtonText}>✕</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.iconButton, styles.saveButton]} 
                onPress={handleSave}
                disabled={!editEmail.trim()}
              >
                <Text style={styles.iconButtonText}>✓</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.iconButton} onPress={handleEdit}>
                <Text style={styles.iconButtonText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconButton, styles.deleteButton]} onPress={handleDelete}>
                <Text style={styles.iconButtonText}>🗑️</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Service Header */}
        <View style={styles.serviceHeader}>
          <BrandLogo serviceName={account.serviceName} size={64} />
          <Text style={styles.serviceName}>{account.serviceName}</Text>
          <View style={[
            styles.priorityBadge, 
            { backgroundColor: getPriorityColor(isEditing ? editPriority : account.priority) }
          ]}>
            <Text style={styles.priorityText}>
              {(isEditing ? editPriority : account.priority).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Account Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          {/* Email */}
          <View style={styles.fieldCard}>
            <View style={styles.fieldHeader}>
              <Text style={styles.fieldLabel}>Email</Text>
              {!isEditing && (
                <TouchableOpacity onPress={() => handleCopy(account.email, 'Email')}>
                  <Text style={styles.copyIcon}>📋</Text>
                </TouchableOpacity>
              )}
            </View>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="your@email.com"
                placeholderTextColor="#666"
              />
            ) : (
              <Text style={styles.fieldValue}>{account.email}</Text>
            )}
          </View>

          {/* Account ID */}
          {(isEditing || account.accountId) && (
            <View style={styles.fieldCard}>
              <View style={styles.fieldHeader}>
                <Text style={styles.fieldLabel}>Account ID</Text>
                {!isEditing && account.accountId && (
                  <TouchableOpacity onPress={() => handleCopy(account.accountId!, 'Account ID')}>
                    <Text style={styles.copyIcon}>📋</Text>
                  </TouchableOpacity>
                )}
              </View>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={editAccountId}
                  onChangeText={setEditAccountId}
                  placeholder="Username or Account ID"
                  placeholderTextColor="#666"
                />
              ) : (
                <Text style={styles.fieldValue}>{account.accountId}</Text>
              )}
            </View>
          )}

          {/* Password */}
          {(isEditing || account.password) && (
            <View style={styles.fieldCard}>
              <View style={styles.fieldHeader}>
                <Text style={styles.fieldLabel}>Password</Text>
                {!isEditing && account.password && (
                  <View style={styles.fieldActions}>
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleCopy(decryptedPassword, 'Password')}>
                      <Text style={styles.copyIcon}>📋</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              {isEditing ? (
                <View style={styles.passwordRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={editPassword}
                    onChangeText={setEditPassword}
                    secureTextEntry={!showPassword}
                    placeholder="Enter password"
                    placeholderTextColor="#666"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.fieldValue}>
                  {showPassword ? decryptedPassword : '••••••••••••'}
                </Text>
              )}
            </View>
          )}

          {/* API Key */}
          {(isEditing || account.apiKey) && (
            <View style={styles.fieldCard}>
              <View style={styles.fieldHeader}>
                <Text style={styles.fieldLabel}>API Key</Text>
                {!isEditing && account.apiKey && (
                  <View style={styles.fieldActions}>
                    <TouchableOpacity onPress={() => setShowApiKey(!showApiKey)}>
                      <Text style={styles.eyeIcon}>{showApiKey ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleCopy(decryptedApiKey, 'API Key')}>
                      <Text style={styles.copyIcon}>📋</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              {isEditing ? (
                <View style={styles.passwordRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={editApiKey}
                    onChangeText={setEditApiKey}
                    secureTextEntry={!showApiKey}
                    placeholder="sk-..."
                    placeholderTextColor="#666"
                  />
                  <TouchableOpacity onPress={() => setShowApiKey(!showApiKey)}>
                    <Text style={styles.eyeIcon}>{showApiKey ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={[styles.fieldValue, styles.apiKeyText]}>
                  {showApiKey ? decryptedApiKey : '••••••••••••••••••••••••'}
                </Text>
              )}
            </View>
          )}

          {/* Priority - Edit Mode Only */}
          {isEditing && (
            <View style={styles.fieldCard}>
              <Text style={styles.fieldLabel}>Priority Level</Text>
              <View style={styles.priorityButtons}>
                {(['normal', 'important', 'critical'] as const).map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityButton, 
                      editPriority === priority && styles.priorityButtonActive
                    ]}
                    onPress={() => setEditPriority(priority)}
                  >
                    <Text style={styles.priorityButtonIcon}>
                      {priority === 'critical' ? '🔴' : 
                       priority === 'important' ? '🟡' : '🟢'}
                    </Text>
                    <Text style={[
                      styles.priorityButtonText, 
                      editPriority === priority && styles.priorityButtonTextActive
                    ]}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Category - View Only */}
          {!isEditing && (
            <View style={styles.fieldCard}>
              <Text style={styles.fieldLabel}>Category</Text>
              <Text style={styles.fieldValue}>
                {account.category.charAt(0).toUpperCase() + account.category.slice(1)}
              </Text>
            </View>
          )}

          {/* Notes */}
          {(isEditing || account.notes) && (
            <View style={styles.fieldCard}>
              <Text style={styles.fieldLabel}>Notes</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  value={editNotes}
                  onChangeText={setEditNotes}
                  multiline
                  numberOfLines={4}
                  placeholder="Add notes..."
                  placeholderTextColor="#666"
                />
              ) : (
                <Text style={styles.fieldValue}>{account.notes}</Text>
              )}
            </View>
          )}
        </View>

        {/* Metadata */}
        {!isEditing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Metadata</Text>
            <View style={styles.metadataCard}>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Created</Text>
                <Text style={styles.metadataValue}>
                  {new Date(account.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Last Updated</Text>
                <Text style={styles.metadataValue}>
                  {new Date(account.updatedAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        )}
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
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  deleteButton: {
    borderColor: '#ef4444',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  iconButtonText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  serviceHeader: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
    gap: 12,
  },
  serviceName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  priorityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  fieldCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldActions: {
    flexDirection: 'row',
    gap: 12,
  },
  copyIcon: {
    fontSize: 18,
  },
  eyeIcon: {
    fontSize: 18,
    paddingHorizontal: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  apiKeyText: {
    fontFamily: 'monospace',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  priorityButton: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  priorityButtonActive: {
    backgroundColor: '#2a2a2a',
    borderColor: '#3b82f6',
  },
  priorityButtonIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  priorityButtonText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
  },
  priorityButtonTextActive: {
    color: '#fff',
  },
  metadataCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  metadataLabel: {
    fontSize: 14,
    color: '#888',
  },
  metadataValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 100,
  },
});
