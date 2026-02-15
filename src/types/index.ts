// src/types/index.ts
export interface Account {
  id: string;
  userId: string;
  serviceName: string;
  email: string;
  category: string;
  accountId?: string;
  password?: string;
  apiKey?: string;
  notes?: string;
  priority: 'normal' | 'important' | 'critical';
  createdAt: number;
  updatedAt: number;
  lastUsed?: number;
  
  projectName?: string;  
  projectId?: string;    
  environment?: 'dev' | 'staging' | 'production';
  apiExpiryDate?: string;
  projectNotes?: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectService {
  id: string;
  projectId: string;
  userId: string;
  serviceName: string;
  email?: string;
  password?: string;
  apiKey?: string;
  expiryDate?: string;
  notes?: string;
  createdAt: number;
}

export type RootStackParamList = {
  MasterLock: undefined;
  MainTabs: undefined;
  
  Home: { userId: string; masterPassword: string };
  CategoriesHome: { userId: string; masterPassword: string };
  CategoryDetail: { categoryId: string; userId: string; masterPassword: string };
  ServiceDetail: { categoryId: string; serviceId: string; userId: string; masterPassword: string };
  
  AddAccount: {
    prefilledData?: {
      serviceName?: string;
      apiKey?: string;
      category?: string;
      email?: string;
      projectName?: string;
      projectId?: string;
    };
    userId: string;
    masterPassword: string;
  };
  AccountDetail: { 
    accountId: string; 
    userId: string; 
    masterPassword: string;
  };
  
  ProjectsList: { userId: string; masterPassword: string };
  ProjectDetail: { 
    projectId: string; 
    userId: string; 
    masterPassword: string; 
  };
  AddProject: { userId: string; masterPassword: string };
  AddProjectService: { 
    projectId: string; 
    userId: string; 
    masterPassword: string; 
  };
  EditProjectService: { 
    serviceId: string; 
    projectId: string; 
    userId: string; 
    masterPassword: string; 
  };
  
  EmailSelector: { 
    userId: string; 
    masterPassword: string;
  };
  EmailView: { 
    email?: string; 
    userId: string; 
    masterPassword: string;
    // 🔥 FIXED: Added autoOpenSelector to allow the jump from Home to Selector
    autoOpenSelector?: boolean; 
  };
  PasswordGenerator: { 
    userId: string; 
    masterPassword: string; 
  };
};

export type TabParamList = {
  HomeTab: { userId: string; masterPassword: string };
  CategoriesTab: { userId: string; masterPassword: string };
  GeneratorTab: { userId: string; masterPassword: string };
  SettingsTab: { userId: string; masterPassword: string };
  ProjectsTab: { userId: string; masterPassword: string };
};

export interface ProjectSummary {
  projectName: string;
  totalAccounts: number;
  environments: {
    dev: number;
    staging: number;
    production: number;
  };
  expiringSoon: number;
  expired: number;
}

export interface ExpiryAlert {
  accountId: string;
  serviceName: string;
  projectName: string;
  apiExpiryDate: string;
  daysRemaining: number;
}

export type Environment = 'dev' | 'staging' | 'production';
export type LegacyAccount = Account;