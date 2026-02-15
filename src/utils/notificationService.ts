// src/utils/notificationService.ts - Notification checking and management
import { getDatabase } from './database';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationPreferences {
  id: string;
  userId: string;
  apiExpiryNotifications: number; // 0 or 1 (boolean)
  apiExpiryDaysBefore: number; // 5, 10, 20, or custom
  autoLockEnabled: number;
  autoLockMinutes: number;
  biometricEnabled: number;
  theme: string;
  createdAt: number;
  updatedAt: number;
}

export interface ExpiringService {
  id: string;
  serviceName: string;
  email?: string;
  apiKey?: string;
  expiryDate: string;
  daysUntilExpiry: number;
  type: 'project_service'; // Can be expanded for accounts too
}

// Get or create notification preferences for a user
export const getNotificationPreferences = (userId: string): NotificationPreferences | null => {
  try {
    const db = getDatabase();
    const result = db.getFirstSync(
      'SELECT * FROM notification_preferences WHERE userId = ?',
      [userId]
    ) as NotificationPreferences | undefined;

    if (!result) {
      // Create default preferences for new user
      createDefaultNotificationPreferences(userId);
      return getNotificationPreferences(userId);
    }

    return result || null;
  } catch (error) {
    console.error('❌ Error getting notification preferences:', error);
    return null;
  }
};

// Create default notification preferences
export const createDefaultNotificationPreferences = (userId: string): boolean => {
  try {
    const db = getDatabase();
    const id = `pref_${userId}_${Date.now()}`;
    const now = Date.now();

    db.runSync(
      `INSERT INTO notification_preferences 
       (id, userId, apiExpiryNotifications, apiExpiryDaysBefore, autoLockEnabled, 
        autoLockMinutes, biometricEnabled, theme, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, 1, 10, 0, 15, 0, 'dark', now, now]
    );

    console.log('✅ Default notification preferences created for user:', userId);
    return true;
  } catch (error) {
    console.error('❌ Error creating default notification preferences:', error);
    return false;
  }
};

// Update notification preferences
export const updateNotificationPreferences = (
  userId: string,
  updates: Partial<Omit<NotificationPreferences, 'id' | 'userId' | 'createdAt'>>
): boolean => {
  try {
    const db = getDatabase();
    const now = Date.now();

    const setClause = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = [...Object.values(updates), now, userId];

    db.runSync(
      `UPDATE notification_preferences 
       SET ${setClause}, updatedAt = ? 
       WHERE userId = ?`,
      values
    );

    console.log('✅ Notification preferences updated for user:', userId);
    return true;
  } catch (error) {
    console.error('❌ Error updating notification preferences:', error);
    return false;
  }
};

// Calculate days until expiry
const calculateDaysUntilExpiry = (expiryDateStr: string): number => {
  try {
    const expiryDate = new Date(expiryDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);

    const timeDiff = expiryDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return daysDiff;
  } catch (error) {
    console.error('❌ Error calculating days until expiry:', error);
    return -1;
  }
};

// Get all expiring services that should trigger notifications
// Get all expiring services that should trigger notifications
export const getExpiringServices = (userId: string): ExpiringService[] => {
  try {
    const db = getDatabase();
    const prefs = getNotificationPreferences(userId);

    if (!prefs || !prefs.apiExpiryNotifications) {
      console.log('ℹ️ Notifications disabled for user:', userId);
      return [];
    }

    // ✅ FIX: Add userId filter
    const services = db.getAllSync(
      `SELECT id, serviceName, email, apiKey, expiryDate 
       FROM project_services 
       WHERE userId = ? AND expiryDate IS NOT NULL AND expiryDate != ''`,
      [userId]
    ) as Array<{
      id: string;
      serviceName: string;
      email?: string;
      apiKey?: string;
      expiryDate: string;
    }>;

    const expiringServices: ExpiringService[] = services
      .map(service => ({
        id: service.id,
        serviceName: service.serviceName,
        email: service.email,
        apiKey: service.apiKey,
        expiryDate: service.expiryDate,
        daysUntilExpiry: calculateDaysUntilExpiry(service.expiryDate),
        type: 'project_service' as const,
      }))
      .filter(service => {
        const daysUntil = service.daysUntilExpiry;
        // Show services expiring within the notification window
        return daysUntil >= 0 && daysUntil <= prefs.apiExpiryDaysBefore;
      })
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

    console.log(`📬 Found ${expiringServices.length} expiring services for notification`);
    return expiringServices;
  } catch (error) {
    console.error('❌ Error getting expiring services:', error);
    return [];
  }
};
// Get summary of expiring services
export const getExpirySummary = (userId: string): {
  expiring5Days: number;
  expiring10Days: number;
  expiring20Days: number;
  allExpiring: number;
} => {
  try {
    const db = getDatabase();

    // ✅ FIX: Add userId filter
    const expiringServices = db.getAllSync(
      `SELECT id, expiryDate FROM project_services 
       WHERE userId = ? AND expiryDate IS NOT NULL AND expiryDate != ''`,
      [userId]
    ) as Array<{ id: string; expiryDate: string }>;

    const summary = {
      expiring5Days: 0,
      expiring10Days: 0,
      expiring20Days: 0,
      allExpiring: 0,
    };

    expiringServices.forEach(service => {
      const daysUntil = calculateDaysUntilExpiry(service.expiryDate);
      if (daysUntil >= 0) {
        summary.allExpiring++;
        if (daysUntil <= 5) summary.expiring5Days++;
        if (daysUntil <= 10) summary.expiring10Days++;
        if (daysUntil <= 20) summary.expiring20Days++;
      }
    });

    return summary;
  } catch (error) {
    console.error('❌ Error getting expiry summary:', error);
    return { expiring5Days: 0, expiring10Days: 0, expiring20Days: 0, allExpiring: 0 };
  }
};

// Send notification for expiring services
export const sendExpiryNotifications = async (userId: string): Promise<boolean> => {
  try {
    // Request notification permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('ℹ️ Notification permissions not granted');
      return false;
    }

    const expiringServices = getExpiringServices(userId);

    if (expiringServices.length === 0) {
      console.log('ℹ️ No services expiring soon');
      return true;
    }

    // Group notifications by urgency
    const expiring1Week = expiringServices.filter(s => s.daysUntilExpiry <= 7);
    const expiring2Weeks = expiringServices.filter(
      s => s.daysUntilExpiry > 7 && s.daysUntilExpiry <= 14
    );

    // Send urgent notification if services expire within 7 days
    if (expiring1Week.length > 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔴 API Credentials Expiring Soon!',
          body: `${expiring1Week.length} API key(s) expiring within 7 days. Tap to review.`,
          data: { type: 'api_expiry', count: expiring1Week.length },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1 },
      });
      console.log('📬 Urgent expiry notification sent');
    }

    // Send warning notification for 2 weeks window
    if (expiring2Weeks.length > 0 && expiring1Week.length === 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Upcoming API Expirations',
          body: `${expiring2Weeks.length} API key(s) will expire soon.`,
          data: { type: 'api_expiry_warning', count: expiring2Weeks.length },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1 },
      });
      console.log('📬 Warning expiry notification sent');
    }

    // Store last notification check time
    const lastCheckKey = `last_notification_check_${userId}`;
    await AsyncStorage.setItem(lastCheckKey, String(Date.now()));

    return true;
  } catch (error) {
    console.error('❌ Error sending notifications:', error);
    return false;
  }
};

// Check if we should check for notifications (rate limiting)
export const shouldCheckNotifications = async (userId: string): Promise<boolean> => {
  try {
    const lastCheckKey = `last_notification_check_${userId}`;
    const lastCheck = await AsyncStorage.getItem(lastCheckKey);

    if (!lastCheck) {
      return true; // First time
    }

    const lastCheckTime = parseInt(lastCheck);
    const now = Date.now();
    const hoursSinceLastCheck = (now - lastCheckTime) / (1000 * 60 * 60);

    // Check at most once per hour
    return hoursSinceLastCheck >= 1;
  } catch (error) {
    console.error('❌ Error checking notification rate limit:', error);
    return true; // Allow check on error
  }
};

// Main function to check and send notifications (called from app startup)
export const checkAndSendNotifications = async (userId: string): Promise<void> => {
  try {
    const shouldCheck = await shouldCheckNotifications(userId);

    if (!shouldCheck) {
      console.log('ℹ️ Skipping notification check (rate limited)');
      return;
    }

    const success = await sendExpiryNotifications(userId);
    if (success) {
      console.log('✅ Notification check completed successfully');
    }
  } catch (error) {
    console.error('❌ Error in checkAndSendNotifications:', error);
  }
};

export default {
  getNotificationPreferences,
  createDefaultNotificationPreferences,
  updateNotificationPreferences,
  getExpiringServices,
  getExpirySummary,
  sendExpiryNotifications,
  shouldCheckNotifications,
  checkAndSendNotifications,
};
