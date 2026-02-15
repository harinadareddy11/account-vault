// src/screens/SettingsScreen.tsx - WITH DEBUG LOGS
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../utils/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as notificationService from '../utils/notificationService';
import * as exportService from '../utils/exportService';
import * as masterPasswordService from '../utils/masterPasswordService';
import { getDatabase } from '../utils/database';
import * as biometricService from '../utils/biometricService';

interface SettingsScreenProps {
  userId: string;
  masterPassword: string;
}

const APP_VERSION = '1.0.0';

export default function SettingsScreen({ userId, masterPassword }: SettingsScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [apiExpiryEnabled, setApiExpiryEnabled] = useState(true);
  const [apiExpiryDays, setApiExpiryDays] = useState(10);
  const [autoLockEnabled, setAutoLockEnabled] = useState(false);
  const [autoLockMinutes, setAutoLockMinutes] = useState(15);
  const [accountStats, setAccountStats] = useState({
    accounts: 0,
    projects: 0,
    services: 0
  });
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    notifications: true,
    security: false,
    data: false,
    about: false,
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const dayOptions = [5, 10, 20];
  const autoLockOptions = [5, 10, 15, 30];

  useEffect(() => {
    console.log('⚙️ SettingsScreen mounted for userId:', userId.slice(0, 8) + '...');
    loadSettings();
    loadStats();
    getUserEmail();
  }, []);

  const loadSettings = () => {
    try {
      console.log('📖 Loading settings from database...');
      const prefs = notificationService.getNotificationPreferences(userId);
      
      if (prefs) {
        console.log('✅ Preferences loaded:', {
          apiExpiryNotifications: prefs.apiExpiryNotifications,
          apiExpiryDaysBefore: prefs.apiExpiryDaysBefore,
          autoLockEnabled: prefs.autoLockEnabled,
          autoLockMinutes: prefs.autoLockMinutes,
          biometricEnabled: prefs.biometricEnabled,
        });

        setApiExpiryEnabled(prefs.apiExpiryNotifications === 1);
        setApiExpiryDays(prefs.apiExpiryDaysBefore);
        setAutoLockEnabled(prefs.autoLockEnabled === 1);
        setAutoLockMinutes(prefs.autoLockMinutes);
        setBiometricEnabled(prefs.biometricEnabled === 1);
      } else {
        console.log('⚠️ No preferences found for user');
      }
    } catch (error) {
      console.error('❌ Error loading settings:', error);
    }
  };

  const handleUpdateBiometric = async (enabled: boolean) => {
    console.log('🔐 Biometric toggle changed to:', enabled);

    const available = await biometricService.isBiometricAvailable();
    console.log('📱 Biometric availability check:', available);

    if (!available && enabled) {
      console.log('❌ Biometric not available - showing alert');
      Alert.alert('Biometric not setup', 'Please setup Face ID or Fingerprint in your device settings');
      return;
    }

    console.log('💾 Updating biometric state...');
    setBiometricEnabled(enabled);

    console.log('🔧 Saving biometric preference to database:', enabled ? 1 : 0);
    const success = notificationService.updateNotificationPreferences(userId, {
      biometricEnabled: enabled ? 1 : 0,
    });

    if (success) {
      console.log('✅ Biometric preference saved successfully');
      
      // Verify it was saved
      const prefs = notificationService.getNotificationPreferences(userId);
      console.log('🔍 Verification - DB value:', prefs?.biometricEnabled);
      
      if (prefs?.biometricEnabled === (enabled ? 1 : 0)) {
        console.log('✅ VERIFIED: Preference matches what we set');
      } else {
        console.log('❌ MISMATCH: Preference does not match!');
      }
    } else {
      console.log('❌ Failed to save biometric preference');
    }
  };

  const loadStats = () => {
    try {
      console.log('📊 Loading stats for userId:', userId.slice(0, 8) + '...');
      const db = getDatabase();
      
      // ✅ FIX: Filter by userId
      const accounts = db.getFirstSync(
        'SELECT COUNT(*) as count FROM accounts WHERE userId = ?',
        [userId]
      ) as any;
      const projects = db.getFirstSync(
        'SELECT COUNT(*) as count FROM projects WHERE userId = ?',
        [userId]
      ) as any;
      const services = db.getFirstSync(
        'SELECT COUNT(*) as count FROM project_services WHERE userId = ?',
        [userId]
      ) as any;

      console.log('📈 Stats loaded:', {
        accounts: accounts?.count || 0,
        projects: projects?.count || 0,
        services: services?.count || 0,
      });

      setAccountStats({
        accounts: accounts?.count || 0,
        projects: projects?.count || 0,
        services: services?.count || 0,
      });
    } catch (error) {
      console.error('❌ Error loading stats:', error);
    }
  };

  const getUserEmail = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        console.log('📧 User email loaded:', user.email);
        setCurrentUserEmail(user.email);
      }
    } catch (error) {
      console.error('❌ Error getting user email:', error);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleUpdateApiExpiryNotifications = (enabled: boolean) => {
    setApiExpiryEnabled(enabled);
    notificationService.updateNotificationPreferences(userId, {
      apiExpiryNotifications: enabled ? 1 : 0,
    });
  };

  const handleUpdateApiExpiryDays = (days: number) => {
    setApiExpiryDays(days);
    notificationService.updateNotificationPreferences(userId, {
      apiExpiryDaysBefore: days,
    });
  };

  const handleUpdateAutoLock = (enabled: boolean) => {
    setAutoLockEnabled(enabled);
    notificationService.updateNotificationPreferences(userId, {
      autoLockEnabled: enabled ? 1 : 0,
    });
  };

  const handleUpdateAutoLockMinutes = (minutes: number) => {
    setAutoLockMinutes(minutes);
    notificationService.updateNotificationPreferences(userId, {
      autoLockMinutes: minutes,
    });
  };

  const handleChangeMasterPassword = async () => {
    if (!currentPasswordInput || !newPasswordInput || !confirmPasswordInput) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const result = await masterPasswordService.changeMasterPassword(
        userId,
        currentPasswordInput,
        newPasswordInput
      );

      if (result.success) {
        Alert.alert('✅ Success', 'Master password changed successfully');
        setShowPasswordModal(false);
        setCurrentPasswordInput('');
        setNewPasswordInput('');
        setConfirmPasswordInput('');
      } else {
        Alert.alert('❌ Error', result.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('❌ ERROR:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    Alert.alert('Test Notification', 'Checking for expiring credentials...', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Test',
        onPress: async () => {
          setIsLoading(true);
          try {
            await notificationService.sendExpiryNotifications(userId);
            Alert.alert('Success', 'Notification check completed.');
          } catch (error) {
            Alert.alert('Error', 'Failed to test notifications');
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  const handleExportJSON = async () => {
    Alert.alert('Export as JSON', 'Export your vault data as JSON?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Export',
        onPress: async () => {
          setIsLoading(true);
          try {
            await exportService.exportAsJSON(userId);
            Alert.alert('Success', 'Data exported as JSON. Share securely.');
          } catch (error) {
            Alert.alert('Error', 'Failed to export as JSON');
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  const handleExportPDF = async () => {
    Alert.alert('Export as PDF', 'Export your vault data as formatted PDF?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Export',
        onPress: async () => {
          setIsLoading(true);
          try {
            await exportService.exportAsPDF(userId);
            Alert.alert('Success', 'Data exported as PDF. Share securely.');
          } catch (error) {
            Alert.alert('Error', 'Failed to export as PDF');
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setIsLoading(true);
          try {
            await supabase.auth.signOut();
            await AsyncStorage.removeItem('stored_credentials');
          } catch (error) {
            Alert.alert('Error', 'Logout failed');
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  const SectionHeader = ({
    title,
    icon,
    section
  }: {
    title: string;
    icon: string;
    section: keyof typeof expandedSections
  }) => (
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={() => toggleSection(section)}
    >
      <View style={styles.sectionHeaderLeft}>
        <Text style={styles.sectionIcon}>{icon}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Text style={styles.sectionArrow}>
        {expandedSections[section] ? '▼' : '▶'}
      </Text>
    </TouchableOpacity>
  );

  const SettingItem = ({
    label,
    description,
    children
  }: {
    label: string;
    description?: string;
    children: React.ReactNode
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLabel}>
        <Text style={styles.settingName}>{label}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <View style={styles.settingControl}>{children}</View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>⚙️ Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your vault preferences</Text>
        </View>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196f3" />
          </View>
        )}

        {/* NOTIFICATIONS SECTION */}
        <View style={styles.section}>
          <SectionHeader title="Notifications" icon="🔔" section="notifications" />
          {expandedSections.notifications && (
            <View style={styles.sectionContent}>
              <SettingItem
                label="API Expiry Alerts"
                description="Get notified before credentials expire"
              >
                <Switch
                  value={apiExpiryEnabled}
                  onValueChange={handleUpdateApiExpiryNotifications}
                  trackColor={{ false: '#2a2a2a', true: '#2196f3' }}
                  thumbColor={apiExpiryEnabled ? '#fff' : '#666'}
                />
              </SettingItem>

              {apiExpiryEnabled && (
                <>
                  <SettingItem label="Alert Days Before" description="How many days before expiry">
                    <View style={styles.optionsRow}>
                      {dayOptions.map(day => (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.optionButton,
                            apiExpiryDays === day && styles.optionButtonActive,
                          ]}
                          onPress={() => handleUpdateApiExpiryDays(day)}
                        >
                          <Text
                            style={[
                              styles.optionButtonText,
                              apiExpiryDays === day && styles.optionButtonTextActive,
                            ]}
                          >
                            {day}d
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </SettingItem>

                  <TouchableOpacity style={styles.actionButton} onPress={handleTestNotification}>
                    <Text style={styles.actionButtonText}>Test Notification</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>

        {/* SECURITY SECTION */}
        <View style={styles.section}>
          <SectionHeader title="Security" icon="🔐" section="security" />
          {expandedSections.security && (
            <View style={styles.sectionContent}>
              {/* Biometric - Moved to top for better UX */}
              <SettingItem 
                label="Biometric Unlock"
                description="Use Face ID or Fingerprint to unlock"
              >
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleUpdateBiometric}
                  trackColor={{ false: '#2a2a2a', true: '#2196f3' }}
                  thumbColor={biometricEnabled ? '#fff' : '#666'}
                />
              </SettingItem>

              <SettingItem label="Auto-Lock" description="Lock app after inactivity">
                <Switch
                  value={autoLockEnabled}
                  onValueChange={handleUpdateAutoLock}
                  trackColor={{ false: '#2a2a2a', true: '#2196f3' }}
                  thumbColor={autoLockEnabled ? '#fff' : '#666'}
                />
              </SettingItem>

              {autoLockEnabled && (
                <SettingItem label="Lock After" description="Minutes of inactivity">
                  <View style={styles.optionsRow}>
                    {autoLockOptions.map(minutes => (
                      <TouchableOpacity
                        key={minutes}
                        style={[
                          styles.optionButton,
                          autoLockMinutes === minutes && styles.optionButtonActive,
                        ]}
                        onPress={() => handleUpdateAutoLockMinutes(minutes)}
                      >
                        <Text
                          style={[
                            styles.optionButtonText,
                            autoLockMinutes === minutes && styles.optionButtonTextActive,
                          ]}
                        >
                          {minutes}m
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </SettingItem>
              )}

              <View style={styles.infoBox}>
                <Text style={styles.infoBoxTitle}>🔑 Master Password</Text>
                <Text style={styles.infoBoxText}>••••••••</Text>
              </View>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowPasswordModal(true)}
              >
                <Text style={styles.actionButtonText}>🔐 Change Master Password</Text>
              </TouchableOpacity>

              <View style={styles.infoBox}>
                <Text style={styles.infoBoxTitle}>🛡️ Encryption</Text>
                <Text style={styles.infoBoxText}>AES-256 (Military-grade)</Text>
              </View>
            </View>
          )}
        </View>

        {/* DATA EXPORT SECTION */}
        <View style={styles.section}>
          <SectionHeader title="Data & Export" icon="💾" section="data" />
          {expandedSections.data && (
            <View style={styles.sectionContent}>
              <TouchableOpacity style={styles.exportButton} onPress={handleExportJSON}>
                <Text style={styles.exportButtonText}>📄 JSON</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.exportButton} onPress={handleExportPDF}>
                <Text style={styles.exportButtonText}>📋 PDF Report</Text>
              </TouchableOpacity>

              <View style={styles.dataStats}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{accountStats.accounts}</Text>
                  <Text style={styles.statLabel}>Accounts</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{accountStats.projects}</Text>
                  <Text style={styles.statLabel}>Projects</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{accountStats.services}</Text>
                  <Text style={styles.statLabel}>API Keys</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* ABOUT SECTION */}
        <View style={styles.section}>
          <SectionHeader title="About" icon="ℹ️" section="about" />
          {expandedSections.about && (
            <View style={styles.sectionContent}>
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxTitle}>📧 Account</Text>
                <Text style={styles.infoBoxText}>{currentUserEmail || 'Loading...'}</Text>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoBoxTitle}>📱 App Version</Text>
                <Text style={styles.infoBoxText}>v{APP_VERSION}</Text>
              </View>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#3a1a1a', borderColor: '#ff4444' }]}
                onPress={handleLogout}
                disabled={isLoading}
              >
                <Text style={[styles.actionButtonText, { color: '#ff4444' }]}>
                  {isLoading ? 'Logging Out...' : '🚪 Logout'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>AccountVault</Text>
          <Text style={styles.footerSubtext}>Your secure credentials manager</Text>
        </View>

        {/* Master Password Change Modal */}
        <Modal
          visible={showPasswordModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPasswordModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>🔐 Change Master Password</Text>

              <Text style={styles.modalLabel}>Current Password</Text>
              <TextInput
                style={styles.modalInput}
                secureTextEntry
                value={currentPasswordInput}
                onChangeText={setCurrentPasswordInput}
                placeholder="Enter current password"
                placeholderTextColor="#666"
              />

              <Text style={styles.modalLabel}>New Password</Text>
              <TextInput
                style={styles.modalInput}
                secureTextEntry
                value={newPasswordInput}
                onChangeText={setNewPasswordInput}
                placeholder="Enter new password"
                placeholderTextColor="#666"
              />

              <Text style={styles.modalLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.modalInput}
                secureTextEntry
                value={confirmPasswordInput}
                onChangeText={setConfirmPasswordInput}
                placeholder="Confirm new password"
                placeholderTextColor="#666"
              />

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    setShowPasswordModal(false);
                    setCurrentPasswordInput('');
                    setNewPasswordInput('');
                    setConfirmPasswordInput('');
                  }}
                  disabled={isLoading}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#1a3a5a', borderColor: '#2196f3' }]}
                  onPress={handleChangeMasterPassword}
                  disabled={isLoading}
                >
                  <Text style={[styles.modalButtonText, { color: '#2196f3' }]}>
                    {isLoading ? 'Changing...' : 'Change Password'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
  },
  section: {
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: '#0f0f0f',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1a1a1a',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  sectionArrow: {
    fontSize: 12,
    color: '#666',
  },
  sectionContent: {
    padding: 16,
    gap: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    flex: 1,
  },
  settingName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
  },
  settingControl: {
    alignItems: 'flex-end',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  optionButtonActive: {
    backgroundColor: '#2196f3',
    borderColor: '#2196f3',
  },
  optionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888',
  },
  optionButtonTextActive: {
    color: '#fff',
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#1a3a5a',
    borderWidth: 1,
    borderColor: '#2196f3',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196f3',
  },
  exportButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#0d1f2d',
    borderWidth: 1,
    borderColor: '#2196f3',
    alignItems: 'center',
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196f3',
  },
  infoBox: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderLeftWidth: 3,
    borderLeftColor: '#2196f3',
  },
  infoBoxTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2196f3',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoBoxText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  dataStats: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196f3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2196f3',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: '#0f0f0f',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    marginBottom: 16,
    fontWeight: '500',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
});

