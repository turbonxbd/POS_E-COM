import React, { useEffect, useState } from 'react';
import { themeStore } from '../../store/theme.store';
import { tenantStore } from '../../store/tenant.store';
import { authStore } from '../../store/auth.store';
import { i18n } from '../../core/i18n/i18n.engine';

export interface RootLayoutWrapperProps {
  children: React.ReactNode;
}

export const RootLayoutWrapper: React.FC<RootLayoutWrapperProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 1. Initialize Theme Mode & Tenant Dynamic Theme
    const currentThemeState = themeStore.getState();
    themeStore.setThemeMode(currentThemeState.mode);

    const activeTenant = tenantStore.getState().currentTenant;
    if (activeTenant?.theme) {
      themeStore.applyTenantBranding(activeTenant.theme);
    }

    // 2. Initialize Language Engine
    const currentLocale = i18n.getLocale();
    i18n.setLocale(currentLocale);

    // Mark platform foundation initialized
    setIsInitialized(true);

    // Subscribe to store updates
    const unsubTheme = themeStore.subscribe((state) => {
      if (state.customBranding) {
        themeStore.applyTenantBranding(state.customBranding);
      }
    });

    const unsubTenant = tenantStore.subscribe((state) => {
      if (state.currentTenant?.theme) {
        themeStore.applyTenantBranding(state.currentTenant.theme);
      }
    });

    return () => {
      unsubTheme();
      unsubTenant();
    };
  }, []);

  if (!isInitialized) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: 'var(--background, #090d16)',
          color: 'var(--foreground, #f8fafc)',
          fontFamily: 'sans-serif',
        }}
      >
        <span>Loading platform...</span>
      </div>
    );
  }

  return <div className="ag-root-layout">{children}</div>;
};
