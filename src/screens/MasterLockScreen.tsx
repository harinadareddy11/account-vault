// src/screens/MasterLockScreen.tsx - COMPLETE FILE WITH DEBUG LOGS
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../utils/supabaseClient';
import * as masterPasswordService from '../utils/masterPasswordService';
import { initUserDatabase } from '../utils/database';
import * as biometricService from '../utils/biometricService';
import * as notificationService from '../utils/notificationService';

interface MasterLockScreenProps {
  onUnlock: (userId: string, masterPassword: string) => void;
}

const STORAGE_KEY = 'stored_credentials';
const SECURE_PASSWORD_PREFIX = 'secure_master_password_';

export default function MasterLockScreen({ onUnlock }: MasterLockScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);
  const [storedEmail, setStoredEmail] = useState<string | null>(null);
  const [storedUserId, setStoredUserId] = useState<string | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [attemptingBiometric, setAttemptingBiometric] = useState(false);

  useEffect(() => {
    console.log('🔵 MasterLockScreen mounted');
    loadStoredCredentials();
  }, []);

  // 🔥 AUTO-TRIGGER BIOMETRIC ON MOUNT
  useEffect(() => {
    console.log('🎯 Auto-biometric check triggered:', {
      biometricEnabled,
      storedUserId: storedUserId?.slice(0, 8) + '...',
      storedEmail,
      attemptingBiometric,
    });

    if (!biometricEnabled || !storedUserId || !storedEmail || attemptingBiometric) {
      console.log('❌ Skipping auto-biometric - conditions not met');
      return;
    }

    const attemptBiometric = async () => {
      console.log('🚀 Attempting auto-biometric unlock...');
      setAttemptingBiometric(true);
      await new Promise(resolve => setTimeout(resolve, 600)); // UI delay
      await handleBiometricUnlock();
      setAttemptingBiometric(false);
    };

    attemptBiometric();
  }, [biometricEnabled, storedUserId]);
const loadStoredCredentials = async () => {
  try {
    console.log('📂 Loading stored credentials from AsyncStorage...');
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    
    // ✅ ADD THIS
    console.log('🔍 Raw stored value:', stored);
    console.log('🔍 Storage key used:', STORAGE_KEY);
    
    if (!stored) {
      console.log('⚠️ No stored credentials found');
      return;
    }

    const parsed = JSON.parse(stored);
    
    // ✅ ADD THIS
    console.log('🔍 Parsed credentials:', {
      userId: parsed.userId,
      email: parsed.email,
      hasHash: !!parsed.masterPasswordHash
    });
    
    console.log('👤 Stored credentials found for userId:', parsed.userId?.slice(0, 8) + '...');
    
    setStoredEmail(parsed.email);
    setEmail(parsed.email);
    setStoredUserId(parsed.userId);
    
    // ✅ ADD THIS
    console.log('✅ State set - storedUserId:', parsed.userId?.slice(0, 8) + '...');

    // Check if biometric hardware is available
    const supported = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    
    console.log('📱 Biometric hardware check:', { supported, enrolled });

    if (supported && enrolled && parsed.userId) {
      console.log('🔍 Loading notification preferences for user:', parsed.userId.slice(0, 8) + '...');
      
      // Load user's biometric preference from database
      const prefs = await notificationService.getNotificationPreferences(parsed.userId);
      
      console.log('📖 Loaded preferences:', {
        found: !!prefs,
        biometricEnabled: prefs?.biometricEnabled,
        apiExpiryNotifications: prefs?.apiExpiryNotifications,
        autoLockEnabled: prefs?.autoLockEnabled,
      });
      
      if (prefs && prefs.biometricEnabled === 1) {
        console.log('✅ Biometric auto-unlock ENABLED in preferences!');
        setBiometricEnabled(true);
        setShowBiometric(true);
      } else {
        console.log('⚠️ Biometric NOT enabled in preferences (value:', prefs?.biometricEnabled, ')');
        setBiometricEnabled(false);
        setShowBiometric(false);
      }
    } else {
      console.log('❌ Biometric not available:', { supported, enrolled, hasUserId: !!parsed.userId });
    }
  } catch (e) {
    console.error('❌ Error loading credentials:', e);
  }
};

  // 🔐 BIOMETRIC UNLOCK WITH SECURE STORAGE
  const handleBiometricUnlock = async () => {
    if (!storedUserId) {
      console.log('❌ No stored userId - cannot unlock');
      Alert.alert('Setup Required', 'Please login with password first');
      return;
    }

    try {
      console.log('👆 Requesting biometric authentication...');
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock AccountVault',
        fallbackLabel: 'Use password',
        disableDeviceFallback: false,
      });

      console.log('🔐 Biometric authentication result:', result.success);

      if (!result.success) {
        console.log('❌ Biometric authentication failed or cancelled');
        return;
      }

      console.log('✅ Biometric authentication SUCCESS!');

      // ✅ Retrieve securely stored master password
      const secureKey = `${SECURE_PASSWORD_PREFIX}${storedUserId}`;
      console.log('🔑 Retrieving master password from SecureStore...');
      
      const storedMasterPassword = await SecureStore.getItemAsync(secureKey);

      if (!storedMasterPassword) {
        console.log('❌ Master password not found in SecureStore');
        Alert.alert(
          'Setup Required',
          'Master password not found in secure storage. Please login with password to enable biometric unlock.',
          [{ text: 'OK' }]
        );
        return;
      }

      console.log('✅ Master password retrieved from SecureStore');

      // Verify the stored password is still valid
      console.log('🔍 Verifying master password hash...');
      const isValid = await masterPasswordService.verifyCurrentMasterPassword(
        storedUserId,
        storedMasterPassword
      );

      console.log('🔐 Master password verification result:', isValid);

      if (!isValid) {
        console.log('❌ Stored master password is INVALID (hash mismatch)');
        Alert.alert(
          'Password Changed',
          'Your master password has been changed. Please login with your new password.',
          [{ text: 'OK' }]
        );
        // Clean up invalid stored password
        await SecureStore.deleteItemAsync(secureKey);
        return;
      }

      console.log('✅ Master password verification SUCCESS!');

      // 🔥 Initialize user database before unlock
      console.log('🗄️ Initializing user database...');
      await initUserDatabase(storedUserId);
      console.log(`✅ User ${storedUserId.slice(0, 8)}... vault ready!`);

      // 🎉 SUCCESS - Unlock the app
      console.log('🎉 BIOMETRIC UNLOCK COMPLETE - Calling onUnlock()');
      onUnlock(storedUserId, storedMasterPassword);
    } catch (e: any) {
      console.error('❌ Biometric unlock error:', e);
      Alert.alert('Unlock Failed', 'Please try again or use your password');
    }
  };

  const handleAuth = async () => {
    if (!email || !masterPassword) {
      Alert.alert('Missing details', 'Please fill all fields');
      return;
    }

    if (isSignUp && masterPassword !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match');
      return;
    }

    if (masterPassword.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        console.log('🆕 Creating new account...');
        // 🚀 NEW ACCOUNT
        const { data, error } = await supabase.auth.signUp({
          email,
          password: masterPassword,
        });

        if (error) throw error;

        const userId = data.user?.id;
        if (!userId) throw new Error('Failed to create user');

        console.log('✅ Supabase account created:', userId.slice(0, 8) + '...');

        // ✅ Store HASH for credential verification
        const masterPasswordHash = CryptoJS.SHA256(masterPassword).toString();
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            userId,
            email,
            masterPasswordHash,
          })
        );

        console.log('💾 Credentials stored in AsyncStorage');

        // ✅ Store encrypted master password in secure storage
        const secureKey = `${SECURE_PASSWORD_PREFIX}${userId}`;
        await SecureStore.setItemAsync(secureKey, masterPassword, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED,
        });

        console.log('🔒 Master password stored in SecureStore');

        await masterPasswordService.initializeMasterPassword(userId, masterPassword);

        // 🔥 Initialize user-specific database
        await initUserDatabase(userId);
        console.log(`✅ New user ${userId.slice(0, 8)}... vault initialized!`);

        Alert.alert('✅ Success', 'Account created! You can now login.', [
          { text: 'OK', onPress: () => setIsSignUp(false) },
        ]);
      } else {
        console.log('🔐 Logging in...');
        // 🔐 LOGIN - Verify both Supabase + Master Password
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: masterPassword,
        });

        if (error) {
          console.log('❌ Supabase login failed:', error.message);
          Alert.alert('Login failed', error.message);
          return;
        }

        const userId = data.user?.id;
        if (!userId) {
          Alert.alert('Error', 'User ID not found');
          return;
        }

        console.log('✅ Supabase login successful:', userId.slice(0, 8) + '...');

        // ✅ VERIFY MASTER PASSWORD HASH
        console.log('🔍 Verifying master password...');
        const isValidMasterPassword = await masterPasswordService.verifyCurrentMasterPassword(
          userId,
          masterPassword
        );

        if (!isValidMasterPassword) {
          console.log('❌ Master password verification FAILED');
          Alert.alert(
            '❌ Invalid Master Password',
            'Master password does not match your vault. Use the password set in Settings.'
          );
          return;
        }

        console.log('✅ Master password verification SUCCESS');

        // ✅ Update stored hash to match current password
        const masterPasswordHash = CryptoJS.SHA256(masterPassword).toString();
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            userId,
            email,
            masterPasswordHash,
          })
        );

        console.log('💾 Updated credentials in AsyncStorage');

        // ✅ Store master password securely for biometric unlock
        const secureKey = `${SECURE_PASSWORD_PREFIX}${userId}`;
        await SecureStore.setItemAsync(secureKey, masterPassword, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED,
        });

        console.log('🔒 Master password updated in SecureStore');

        // 🔥 CRITICAL: Initialize user-specific database BEFORE unlock
        await initUserDatabase(userId);
        console.log(`✅ User ${userId.slice(0, 8)}... vault ready!`);

        console.log('🎉 LOGIN COMPLETE - Calling onUnlock()');
        onUnlock(userId, masterPassword);
      }
    } catch (e: any) {
      console.error('❌ Auth error:', e);
      Alert.alert('Authentication failed', e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logo}>🔐</Text>
          </View>
          <Text style={styles.title}>AccountVault</Text>
          <Text style={styles.subtitle}>
            {isSignUp ? 'Create your secure vault' : 'Welcome back'}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {showBiometric && !isSignUp && (
            <>
              <TouchableOpacity
                onPress={handleBiometricUnlock}
                style={styles.biometric}
                disabled={attemptingBiometric}
              >
                <Text style={styles.biometricIcon}>
                  {attemptingBiometric ? '⏳' : '👆'}
                </Text>
                <Text style={styles.biometricText}>
                  {attemptingBiometric ? 'Authenticating...' : 'Unlock with Biometrics'}
                </Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>
            </>
          )}

          <Input
            label="Email"
            value={email}
            onChange={setEmail}
            editable={!storedEmail || isSignUp}
            placeholder="your@email.com"
          />

          <PasswordInput
            label="Master Password"
            value={masterPassword}
            onChange={setMasterPassword}
            helperText={
              isSignUp
                ? 'This password encrypts your vault. Choose wisely - it cannot be recovered.'
                : undefined
            }
          />

          {isSignUp && (
            <PasswordInput
              label="Confirm Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
          )}

          {loading ? (
            <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 20 }} />
          ) : (
            <TouchableOpacity onPress={handleAuth} style={styles.button}>
              <Text style={styles.buttonText}>
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => setIsSignUp(!isSignUp)}
            style={styles.switch}
          >
            <Text style={styles.switchText}>
              {isSignUp ? 'Already have an account? Sign In' : 'New here? Create an account'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.footer}>🔒 Secured with end-to-end encryption</Text>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

interface InputProps {
  label: string;
  value: string;
  onChange: (text: string) => void;
  editable?: boolean;
  placeholder?: string;
}

function Input({ label, value, onChange, editable = true, placeholder = '' }: InputProps) {
  return (
    <View style={styles.inputBlock}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor="#555"
        autoCapitalize="none"
        keyboardType="email-address"
      />
    </View>
  );
}

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (text: string) => void;
  helperText?: string;
}

function PasswordInput({ label, value, onChange, helperText }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.inputBlock}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordWrapper}>
        <TextInput
          style={styles.passwordInput}
          value={value}
          onChangeText={onChange}
          secureTextEntry={!visible}
          placeholder="••••••••"
          placeholderTextColor="#555"
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setVisible(!visible)} style={styles.eyeButton}>
          <Text style={styles.eyeIcon}>{visible ? '👁️' : '👁️‍🗨️'}</Text>
        </TouchableOpacity>
      </View>
      {helperText && <Text style={styles.helperText}>{helperText}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0a' },
  container: { flexGrow: 1, padding: 24 },
  header: { alignItems: 'center', marginTop: 24, marginBottom: 32 },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#151515',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  logo: { fontSize: 36 },
  title: { fontSize: 28, color: '#fff', fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#888', fontSize: 15 },
  form: { flexGrow: 1 },
  biometric: {
    backgroundColor: '#151515',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  biometricIcon: { fontSize: 20, marginRight: 8 },
  biometricText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#1f1f1f' },
  dividerText: { paddingHorizontal: 12, fontSize: 13, color: '#666' },
  inputBlock: { marginBottom: 18 },
  label: {
    color: '#888',
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#151515',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151515',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  passwordInput: { flex: 1, color: '#fff', fontSize: 16, paddingVertical: 16 },
  eyeButton: { paddingLeft: 12 },
  eyeIcon: { fontSize: 20 },
  helperText: { marginTop: 6, fontSize: 12, color: '#777', lineHeight: 16 },
  button: {
    backgroundColor: '#3b82f6',
    padding: 18,
    borderRadius: 12,
    marginTop: 12,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  switch: { marginTop: 20, alignItems: 'center' },
  switchText: { color: '#3b82f6', fontWeight: '600', fontSize: 15 },
  footer: {
    textAlign: 'center',
    color: '#666',
    marginTop: 24,
    marginBottom: Platform.OS === 'android' ? 12 : 0,
    fontSize: 12,
  },
});