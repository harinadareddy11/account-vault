import * as LocalAuthentication from 'expo-local-authentication';

export const isBiometricAvailable = async (): Promise<boolean> => {
  const hardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return hardware && enrolled;
};

export const authenticateBiometric = async (): Promise<boolean> => {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock AccountVault',
      fallbackLabel: 'Use Master Password',
      cancelLabel: 'Cancel',
    });

    return result.success;
  } catch {
    return false;
  }
};
