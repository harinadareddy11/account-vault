// src/utils/onboardingStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'onboardingCompleted';

export const hasCompletedOnboarding = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};

export const setOnboardingCompleted = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  } catch (error) {
    console.error('Error setting onboarding status:', error);
  }
};

export const resetOnboarding = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
  } catch (error) {
    console.error('Error resetting onboarding:', error);
  }
};
