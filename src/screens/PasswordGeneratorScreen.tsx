// src/screens/PasswordGeneratorScreen.tsx - FIXED addAccount(userId, account)
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  Clipboard,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addAccount } from '../utils/accountStorage';
import { syncToCloud, autoSyncToCloud } from '../utils/syncService';

interface PasswordGeneratorScreenProps {
  userId: string;
  masterPassword: string;
}

export default function PasswordGeneratorScreen({
  userId,
  masterPassword,
}: PasswordGeneratorScreenProps) {
  const [serviceName, setServiceName] = useState('');
  const [email, setEmail] = useState('');
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');

  const detectCategory = (service: string): string => {
    const serviceLower = service.toLowerCase();

    if (['netflix', 'spotify', 'youtube', 'disney', 'hulu', 'hbo'].some((s) => serviceLower.includes(s))) {
      return 'entertainment';
    }
    if (['aws', 'azure', 'google cloud', 'firebase', 'vercel', 'netlify'].some((s) => serviceLower.includes(s))) {
      return 'cloud';
    }
    if (['github', 'gitlab', 'bitbucket', 'npm', 'docker'].some((s) => serviceLower.includes(s))) {
      return 'coding';
    }
    if (['paypal', 'stripe', 'coinbase', 'binance'].some((s) => serviceLower.includes(s))) {
      return 'finance';
    }
    if (['instagram', 'twitter', 'facebook', 'linkedin'].some((s) => serviceLower.includes(s))) {
      return 'social';
    }
    if (['google', 'microsoft', 'slack', 'zoom', 'notion'].some((s) => serviceLower.includes(s))) {
      return 'productivity';
    }
    if (['amazon', 'ebay', 'shopify', 'etsy'].some((s) => serviceLower.includes(s))) {
      return 'shopping';
    }

    return 'other';
  };

  const generatePassword = () => {
    let charset = '';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (charset === '') {
      Alert.alert('Error', 'Select at least one character type');
      return;
    }

    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    setGeneratedPassword(password);
  };

  const getStrength = (): { label: string; color: string; percentage: number } => {
    if (!generatedPassword) return { label: '', color: '#666', percentage: 0 };

    let score = 0;
    if (generatedPassword.length >= 12) score++;
    if (generatedPassword.length >= 16) score++;
    if (/[A-Z]/.test(generatedPassword)) score++;
    if (/[a-z]/.test(generatedPassword)) score++;
    if (/[0-9]/.test(generatedPassword)) score++;
    if (/[^A-Za-z0-9]/.test(generatedPassword)) score++;

    if (score <= 2) return { label: 'Weak', color: '#ef4444', percentage: 33 };
    if (score <= 4) return { label: 'Medium', color: '#f59e0b', percentage: 66 };
    return { label: 'Strong', color: '#10b981', percentage: 100 };
  };

  const strength = getStrength();

  const handleCopy = () => {
    if (!generatedPassword) return;
    Clipboard.setString(generatedPassword);
    Alert.alert('✅ Copied', 'Password copied to clipboard');
  };

  const handleSaveAccount = async () => {
    if (!serviceName || !email || !generatedPassword) {
      Alert.alert('Missing Fields', 'Please fill service name, email and generate a password');
      return;
    }

    Alert.alert(
      'Save Account?',
      `Do you want to save this account with the generated password?\n\nService: ${serviceName}\nEmail: ${email}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async () => {
            const category = detectCategory(serviceName);

            const newAccount = {
              serviceName,
              email,
              category,
              password: generatedPassword,
              priority: 'normal' as const,
            };

            try {
              // 🔥 FIXED: addAccount(userId, newAccount) - 2 arguments!
const accountId = addAccount(userId, newAccount, masterPassword);
              await autoSyncToCloud(userId, masterPassword);

              Alert.alert('✅ Success', `Account saved successfully!\nID: ${accountId.slice(0,8)}...`);

              // Reset form
              setServiceName('');
              setEmail('');
              setGeneratedPassword('');
            } catch (error) {
              console.error('Save error:', error);
              Alert.alert('Error', 'Failed to save account');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Password Generator</Text>
          <Text style={styles.subtitle}>Create strong passwords for new accounts</Text>
        </View>

        {/* Service Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Details</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Service Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Netflix, AWS, GitHub"
              placeholderTextColor="#666"
              value={serviceName}
              onChangeText={setServiceName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
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
        </View>

        {/* Password Display */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Generated Password</Text>

          <View style={styles.passwordDisplay}>
            <Text style={styles.passwordText} numberOfLines={2}>
              {generatedPassword || 'Tap Generate to create password'}
            </Text>
            {generatedPassword && (
              <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
                <Text style={styles.copyIcon}>📋</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Strength Indicator */}
          {generatedPassword && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBar}>
                <View
                  style={[
                    styles.strengthFill,
                    { width: `${strength.percentage}%`, backgroundColor: strength.color },
                  ]}
                />
              </View>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>
                {strength.label}
              </Text>
            </View>
          )}
        </View>

        {/* Length Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Password Length: {length}</Text>
          <View style={styles.lengthButtons}>
            {[8, 12, 16, 20, 24].map((len) => (
              <TouchableOpacity
                key={len}
                style={[styles.lengthButton, length === len && styles.lengthButtonActive]}
                onPress={() => setLength(len)}
              >
                <Text
                  style={[styles.lengthButtonText, length === len && styles.lengthButtonTextActive]}
                >
                  {len}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Options</Text>

          <View style={styles.option}>
            <Text style={styles.optionLabel}>Uppercase (A-Z)</Text>
            <Switch
              value={includeUppercase}
              onValueChange={setIncludeUppercase}
              trackColor={{ false: '#333', true: '#3b82f6' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.option}>
            <Text style={styles.optionLabel}>Lowercase (a-z)</Text>
            <Switch
              value={includeLowercase}
              onValueChange={setIncludeLowercase}
              trackColor={{ false: '#333', true: '#3b82f6' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.option}>
            <Text style={styles.optionLabel}>Numbers (0-9)</Text>
            <Switch
              value={includeNumbers}
              onValueChange={setIncludeNumbers}
              trackColor={{ false: '#333', true: '#3b82f6' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.option}>
            <Text style={styles.optionLabel}>Symbols (!@#$%)</Text>
            <Switch
              value={includeSymbols}
              onValueChange={setIncludeSymbols}
              trackColor={{ false: '#333', true: '#3b82f6' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.generateButton} onPress={generatePassword}>
            <Text style={styles.generateButtonText}>🎲 Generate Password</Text>
          </TouchableOpacity>

          {generatedPassword && (
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveAccount}>
              <Text style={styles.saveButtonText}>💾 Save to Vault</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
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
  passwordDisplay: {
    backgroundColor: '#151515',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f1f1f',
    minHeight: 60,
  },
  passwordText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'monospace',
  },
  copyButton: {
    marginLeft: 12,
  },
  copyIcon: {
    fontSize: 20,
  },
  strengthContainer: {
    marginTop: 12,
  },
  strengthBar: {
    height: 8,
    backgroundColor: '#1f1f1f',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 4,
  },
  strengthLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  lengthButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  lengthButton: {
    flex: 1,
    backgroundColor: '#151515',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  lengthButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  lengthButtonText: {
    color: '#888',
    fontWeight: '600',
    fontSize: 14,
  },
  lengthButtonTextActive: {
    color: '#fff',
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#151515',
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  optionLabel: {
    fontSize: 15,
    color: '#fff',
  },
  actions: {
    gap: 12,
    paddingBottom: 40,
  },
  generateButton: {
    backgroundColor: '#151515',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  generateButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
  },
});
