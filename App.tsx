// App.tsx - FULLY UPDATED WITH ALL FIXES
import 'react-native-get-random-values';
import React, { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Alert } from 'react-native';

// 🔥 UTILS & SERVICES
import { initDatabase } from './src/utils/database';
import { hasCompletedOnboarding } from './src/utils/onboardingStorage';
import { supabase } from './src/utils/supabaseClient';
import * as notificationService from './src/utils/notificationService';

// 🔥 SCREEN IMPORTS
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import MasterLockScreen from './src/screens/MasterLockScreen';
import TabNavigator from './src/navigation/TabNavigator';
import CategoryDetailScreen from './src/screens/CategoryDetailScreen';
import ServiceDetailScreen from './src/screens/ServiceDetailScreen';
import AddAccountScreen from './src/screens/AddAccountScreen';
import AccountDetailScreen from './src/screens/AccountDetailScreen';
import EmailViewScreen from './src/screens/EmailViewScreen';
import EmailSelectorScreen from './src/screens/EmailSelectorScreen';
import ProjectsListScreen from './src/screens/ProjectsListScreen';
import AddProjectScreen from './src/screens/AddProjectScreen';
import ProjectDetailScreen from './src/screens/ProjectDetailScreen';
import AddProjectServiceScreen from './src/screens/AddProjectServiceScreen';
import { AutoSyncProvider } from './src/providers/AutoSyncProvider';

// 🔥 AUTH CONTEXT
interface AuthContextType {
  userId: string;
  masterPassword: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider: React.FC<{ children: ReactNode; userId: string; masterPassword: string; }> = ({
  children,
  userId,
  masterPassword,
}) => (
  <AuthContext.Provider value={{ userId, masterPassword }}>
    {children}
  </AuthContext.Provider>
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [masterPassword, setMasterPassword] = useState<string | null>(null);

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      console.log('🚀 Starting app initialization...');
      const dbInitialized = await initDatabase();

      if (!dbInitialized) {
        Alert.alert('Error', 'Failed to initialize database.');
        setIsLoading(false);
        return;
      }

      const onboardingDone = await hasCompletedOnboarding();
      if (!onboardingDone) {
        setShowOnboarding(true);
        setIsLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('❌ App init error:', error);
      setIsLoading(false);
    }
  };

  const handleUnlock = (userIdFromAuth: string, masterPass: string) => {
    setUserId(userIdFromAuth);
    setMasterPassword(masterPass);
    setIsAuthenticated(true);
    notificationService.checkAndSendNotifications(userIdFromAuth).catch(console.error);
  };

  if (isLoading) {
    return <SplashScreen onFinish={() => setIsLoading(false)} />;
  }

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer>
        {showOnboarding ? (
          <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
        ) : !isAuthenticated ? (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MasterLock">
              {(props) => <MasterLockScreen {...props} onUnlock={handleUnlock} />}
            </Stack.Screen>
          </Stack.Navigator>
        ) : userId && masterPassword ? (
          <AuthProvider userId={userId} masterPassword={masterPassword}>
            <AutoSyncProvider userId={userId} masterPassword={masterPassword}>
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                
                <Stack.Screen name="MainTabs">
                  {(props: any) => <TabNavigator {...props} userId={userId} masterPassword={masterPassword} />}
                </Stack.Screen>

                <Stack.Screen name="EmailView">
                  {(props: any) => <EmailViewScreen {...props} userId={userId} masterPassword={masterPassword} />}
                </Stack.Screen>

                <Stack.Screen name="EmailSelector">
                  {(props: any) => <EmailSelectorScreen {...props} userId={userId} masterPassword={masterPassword} />}
                </Stack.Screen>

                <Stack.Screen name="AccountDetail">
                  {(props: any) => <AccountDetailScreen {...props} userId={userId} masterPassword={masterPassword} />}
                </Stack.Screen>

                <Stack.Screen name="AddAccount">
                  {(props: any) => <AddAccountScreen {...props} userId={userId} masterPassword={masterPassword} />}
                </Stack.Screen>

                <Stack.Screen name="ProjectsList">
                  {(props: any) => <ProjectsListScreen {...props} userId={userId} masterPassword={masterPassword} />}
                </Stack.Screen>
                
                <Stack.Screen name="AddProject">
                  {(props: any) => (
                    <AddProjectScreen 
                      {...props}
                      userId={userId} 
                      masterPassword={masterPassword} 
                    />
                  )}
                </Stack.Screen>
                
                {/* 🔥 FIXED: Properly spread props to pass route.params.projectId */}
                <Stack.Screen name="ProjectDetail">
                  {(props: any) => (
                    <ProjectDetailScreen 
                      {...props}
                      userId={userId} 
                      masterPassword={masterPassword} 
                    />
                  )}
                </Stack.Screen>
                
                <Stack.Screen name="AddProjectService">
                  {(props: any) => <AddProjectServiceScreen {...props} userId={userId} masterPassword={masterPassword} />}
                </Stack.Screen>

                <Stack.Screen name="CategoryDetail" component={CategoryDetailScreen} />
                <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
                
              </Stack.Navigator>
            </AutoSyncProvider>
          </AuthProvider>
        ) : null}
      </NavigationContainer>
    </>
  );
}