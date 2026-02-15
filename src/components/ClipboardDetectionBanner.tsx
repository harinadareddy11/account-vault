
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';

interface Project {
  id: string;
  name: string;
}

interface DetectedKey {
  key: string;
  type: string;
  service: string;
  category: string;
  confidence: number;
}

interface ClipboardDetectionModalProps {
  userId: string;
  masterPassword: string;
  projects: Project[];
  onSave: (data: {
    key: string;
    service: string;
    category: string;
    projectId?: string;
    projectName?: string;
  }) => void;
}

// Comprehensive API Pattern Detection
const API_KEY_PATTERNS: Array<{
  pattern: RegExp;
  type: string;
  service: string;
  category: string;
  confidence: number;
}> = [
  // AI/ML Services
  { pattern: /^sk-[A-Za-z0-9]{48}$/, type: 'OpenAI API Key', service: 'OpenAI', category: 'AI', confidence: 10 },
  { pattern: /^sk-proj-[A-Za-z0-9-]{48,}$/, type: 'OpenAI Project Key', service: 'OpenAI', category: 'AI', confidence: 10 },
  { pattern: /^AIza[A-Za-z0-9_-]{35}$/, type: 'Google AI API Key', service: 'Google AI Studio', category: 'AI', confidence: 10 },
  { pattern: /^hf_[A-Za-z0-9]{37}$/, type: 'Hugging Face Token', service: 'Hugging Face', category: 'AI', confidence: 10 },
  { pattern: /^r8_[A-Za-z0-9]{39}$/, type: 'Replicate API Token', service: 'Replicate', category: 'AI', confidence: 9 },

  // Git & Code Hosting
  { pattern: /^ghp_[A-Za-z0-9]{36}$/, type: 'GitHub Personal Token', service: 'GitHub', category: 'Work', confidence: 10 },
  { pattern: /^gho_[A-Za-z0-9]{36}$/, type: 'GitHub OAuth Token', service: 'GitHub', category: 'Work', confidence: 10 },
  { pattern: /^github_pat_[A-Za-z0-9_-]{82}$/, type: 'GitHub Fine-grained Token', service: 'GitHub', category: 'Work', confidence: 10 },
  { pattern: /^glpat-[A-Za-z0-9_-]{20}$/, type: 'GitLab Personal Token', service: 'GitLab', category: 'Work', confidence: 10 },

  // Cloud Providers
  { pattern: /^AKIA[0-9A-Z]{16}$/, type: 'AWS Access Key ID', service: 'AWS', category: 'Cloud', confidence: 10 },
  { pattern: /^[A-Za-z0-9/+=]{40}$/, type: 'AWS Secret Access Key', service: 'AWS', category: 'Cloud', confidence: 8 },
  { pattern: /^ya29\.[A-Za-z0-9_-]+$/, type: 'Google OAuth Token', service: 'Google Cloud', category: 'Cloud', confidence: 9 },

  // Payment Processing
  { pattern: /^pk_live_[A-Za-z0-9]{24,}$/, type: 'Stripe Publishable Key', service: 'Stripe', category: 'Finance', confidence: 10 },
  { pattern: /^sk_live_[A-Za-z0-9]{24,}$/, type: 'Stripe Secret Key', service: 'Stripe', category: 'Finance', confidence: 10 },
  { pattern: /^rk_live_[A-Za-z0-9]{24,}$/, type: 'Stripe Restricted Key', service: 'Stripe', category: 'Finance', confidence: 9 },

  // Databases & Backend
  { pattern: /^postgres:\/\/[A-Za-z0-9:@.\-_/]+$/, type: 'PostgreSQL Connection', service: 'PostgreSQL', category: 'Database', confidence: 9 },
  { pattern: /^mongodb(\+srv)?:\/\/[A-Za-z0-9:@.\-_/]+$/, type: 'MongoDB Connection', service: 'MongoDB', category: 'Database', confidence: 9 },
  { pattern: /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, type: 'JWT Token', service: 'Supabase', category: 'Database', confidence: 8 },

  // Deployment & Hosting
  { pattern: /^vercel_[A-Za-z0-9_-]{40,}$/, type: 'Vercel Token', service: 'Vercel', category: 'Cloud', confidence: 9 },
  { pattern: /^netlify_[A-Za-z0-9]{40}$/, type: 'Netlify Token', service: 'Netlify', category: 'Cloud', confidence: 9 },

  // Other Services
  { pattern: /^npm_[A-Za-z0-9]{36}$/, type: 'npm Token', service: 'npm', category: 'Work', confidence: 9 },
  { pattern: /^xoxb-[A-Za-z0-9-]+$/, type: 'Slack Bot Token', service: 'Slack', category: 'Work', confidence: 9 },
  { pattern: /^xoxp-[A-Za-z0-9-]+$/, type: 'Slack User Token', service: 'Slack', category: 'Work', confidence: 9 },

  // Generic patterns
  { pattern: /^[A-Za-z0-9]{32,64}$/, type: 'Generic API Key', service: 'Unknown Service', category: 'Other', confidence: 6 },
];

export default function ClipboardDetectionModal({
  userId,
  masterPassword,
  projects,
  onSave,
}: ClipboardDetectionModalProps) {
  const [detected, setDetected] = useState<DetectedKey | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [lastChecked, setLastChecked] = useState('');
  const [saveMode, setSaveMode] = useState<'service' | 'existing' | 'new'>('service');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [editedService, setEditedService] = useState('');
  const [editedCategory, setEditedCategory] = useState('');
  const [slideAnim] = useState(new Animated.Value(0));

  // Monitor clipboard every 2 seconds
  useEffect(() => {
    const interval = setInterval(checkClipboard, 2000);
    return () => clearInterval(interval);
  }, [lastChecked]);

  const checkClipboard = useCallback(async () => {
    try {
      const text = await Clipboard.getStringAsync();
      
      if (!text || text === lastChecked || text.length < 20) return;
      
      setLastChecked(text);

      // Find best match
      let bestMatch: DetectedKey | null = null;
      let highestConfidence = 0;

      for (const { pattern, type, service, category, confidence } of API_KEY_PATTERNS) {
        if (pattern.test(text.trim()) && confidence > highestConfidence) {
          highestConfidence = confidence;
          bestMatch = { key: text.trim(), type, service, category, confidence };
        }
      }

      if (bestMatch && bestMatch.confidence >= 7) {
        console.log('🔑 API Key detected:', bestMatch.service);
        setDetected(bestMatch);
        setEditedService(bestMatch.service);
        setEditedCategory(bestMatch.category);
        setShowModal(true);
        
        Animated.spring(slideAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      console.error('Clipboard error:', error);
    }
  }, [lastChecked]);

  const handleClose = () => {
    setShowModal(false);
    setSaveMode('service');
    setSelectedProjectId('');
    setNewProjectName('');
    setTimeout(() => setDetected(null), 300);
  };

  const handleSave = () => {
    if (!detected) return;

    if (saveMode === 'service') {
      onSave({
        key: detected.key,
        service: editedService,
        category: editedCategory,
      });
    } else if (saveMode === 'existing' && selectedProjectId) {
      onSave({
        key: detected.key,
        service: editedService,
        category: editedCategory,
        projectId: selectedProjectId,
      });
    } else if (saveMode === 'new' && newProjectName.trim()) {
      onSave({
        key: detected.key,
        service: editedService,
        category: editedCategory,
        projectName: newProjectName.trim(),
      });
    }
    
    handleClose();
  };

  if (!detected) return null;

  return (
    <Modal visible={showModal} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modal,
            {
              opacity: slideAnim,
              transform: [{
                scale: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.iconCircle}>
                <Text style={styles.icon}>🔑</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.title}>API Key Detected</Text>
            <View style={styles.detectedInfo}>
              <Text style={styles.detectedType}>{detected.type}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{detected.confidence}/10</Text>
              </View>
            </View>
            <View style={styles.keyBox}>
              <Text style={styles.keyText} numberOfLines={1}>
                {detected.key.slice(0, 40)}...
              </Text>
            </View>
          </View>

          {/* Mode Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, saveMode === 'service' && styles.tabActive]}
              onPress={() => setSaveMode('service')}
            >
              <Text style={[styles.tabText, saveMode === 'service' && styles.tabTextActive]}>
                Service
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, saveMode === 'existing' && styles.tabActive]}
              onPress={() => setSaveMode('existing')}
            >
              <Text style={[styles.tabText, saveMode === 'existing' && styles.tabTextActive]}>
                Existing
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, saveMode === 'new' && styles.tabActive]}
              onPress={() => setSaveMode('new')}
            >
              <Text style={[styles.tabText, saveMode === 'new' && styles.tabTextActive]}>
                New
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {saveMode === 'service' && (
              <View>
                <Text style={styles.label}>Service Name</Text>
                <TextInput
                  style={styles.input}
                  value={editedService}
                  onChangeText={setEditedService}
                  placeholder="OpenAI API"
                  placeholderTextColor="#555"
                />
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryGrid}>
                  {['AI', 'Cloud', 'Finance', 'Work', 'Database', 'Other'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.chip, editedCategory === cat && styles.chipActive]}
                      onPress={() => setEditedCategory(cat)}
                    >
                      <Text style={[styles.chipText, editedCategory === cat && styles.chipTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {saveMode === 'existing' && (
              <View>
                <Text style={styles.label}>Select Project</Text>
                {projects.length === 0 ? (
                  <View style={styles.empty}>
                    <Text style={styles.emptyIcon}>📁</Text>
                    <Text style={styles.emptyText}>No projects yet</Text>
                  </View>
                ) : (
                  projects.map((project) => (
                    <TouchableOpacity
                      key={project.id}
                      style={[styles.projectItem, selectedProjectId === project.id && styles.projectItemActive]}
                      onPress={() => setSelectedProjectId(project.id)}
                    >
                      <Text style={styles.projectIcon}>🏗️</Text>
                      <Text style={[styles.projectName, selectedProjectId === project.id && styles.projectNameActive]}>
                        {project.name}
                      </Text>
                      {selectedProjectId === project.id && <Text style={styles.check}>✓</Text>}
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            {saveMode === 'new' && (
              <View>
                <Text style={styles.label}>Project Name</Text>
                <TextInput
                  style={styles.input}
                  value={newProjectName}
                  onChangeText={setNewProjectName}
                  placeholder="My SaaS App"
                  placeholderTextColor="#555"
                  autoFocus
                />
                <Text style={styles.hint}>
                  Create a new project to organize related API keys
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveBtn,
                (saveMode === 'service' && !editedService.trim()) ||
                (saveMode === 'existing' && !selectedProjectId) ||
                (saveMode === 'new' && !newProjectName.trim())
                  ? styles.saveBtnDisabled
                  : null
              ]}
              onPress={handleSave}
              disabled={
                (saveMode === 'service' && !editedService.trim()) ||
                (saveMode === 'existing' && !selectedProjectId) ||
                (saveMode === 'new' && !newProjectName.trim())
              }
            >
              <Text style={styles.saveText}>Save to Vault</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: '#0a0a0a', borderRadius: 24, borderWidth: 1, borderColor: '#1a1a1a', maxHeight: '90%' },
  header: { padding: 24, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 28 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
  closeText: { fontSize: 18, color: '#888', fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 12, letterSpacing: -0.5 },
  detectedInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  detectedType: { fontSize: 15, fontWeight: '600', color: '#3b82f6' },
  badge: { backgroundColor: 'rgba(59,130,246,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#3b82f6' },
  keyBox: { backgroundColor: '#000', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#1a1a1a' },
  keyText: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 13, color: '#888' },
  tabs: { flexDirection: 'row', padding: 16, gap: 8, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#0f0f0f', borderWidth: 1, borderColor: '#1a1a1a', alignItems: 'center' },
  tabActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#fff' },
  content: { maxHeight: 400, padding: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#888', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#0f0f0f', borderRadius: 12, padding: 16, fontSize: 16, color: '#fff', borderWidth: 1, borderColor: '#1a1a1a', marginBottom: 16 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#0f0f0f', borderWidth: 1, borderColor: '#1a1a1a' },
  chipActive: { backgroundColor: 'rgba(59,130,246,0.2)', borderColor: '#3b82f6' },
  chipText: { fontSize: 14, fontWeight: '600', color: '#888' },
  chipTextActive: { color: '#3b82f6' },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#888' },
  projectItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, backgroundColor: '#0f0f0f', borderWidth: 1, borderColor: '#1a1a1a', marginBottom: 8 },
  projectItemActive: { backgroundColor: 'rgba(59,130,246,0.1)', borderColor: '#3b82f6' },
  projectIcon: { fontSize: 20, marginRight: 12 },
  projectName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#fff' },
  projectNameActive: { color: '#3b82f6' },
  check: { fontSize: 18, color: '#3b82f6', fontWeight: 'bold' },
  hint: { fontSize: 13, color: '#666', lineHeight: 18 },
  actions: { flexDirection: 'row', padding: 24, gap: 12, borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, backgroundColor: '#0f0f0f', borderWidth: 1, borderColor: '#1a1a1a', alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#888' },
  saveBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, backgroundColor: '#3b82f6', alignItems: 'center', shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  saveBtnDisabled: { opacity: 0.5 },
  saveText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});