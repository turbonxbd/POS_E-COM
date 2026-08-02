import { TranslationDictionary } from '../../../types/i18n.types';

export const en: TranslationDictionary = {
  common: {
    appName: 'Antigravity Platform',
    welcome: 'Welcome back',
    welcomeUser: 'Welcome back, {name}!',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    search: 'Search',
    actions: 'Actions',
    status: 'Status',
    success: 'Success',
    error: 'An error occurred',
  },
  auth: {
    login: 'Log In',
    logout: 'Log Out',
    email: 'Email Address',
    password: 'Password',
    forgotPassword: 'Forgot Password?',
    sessionExpired: 'Your session has expired. Please log in again.',
  },
  tenant: {
    organization: 'Organization',
    selectTenant: 'Select Tenant',
    currentTenant: 'Current Tenant: {tenantName}',
    domain: 'Domain',
    statusActive: 'Active',
    statusInactive: 'Inactive',
    statusSuspended: 'Suspended',
  },
  theme: {
    mode: 'Theme Mode',
    light: 'Light Mode',
    dark: 'Dark Mode',
    system: 'System Default',
    customBranding: 'Custom Branding',
  },
  language: {
    selectLanguage: 'Select Language',
    english: 'English',
    bengali: 'Bengali',
  },
  errors: {
    notFound: 'The requested resource was not found.',
    unauthorized: 'You are not authorized to perform this action.',
    serverError: 'Internal server error. Please try again later.',
  },
};

export default en;
