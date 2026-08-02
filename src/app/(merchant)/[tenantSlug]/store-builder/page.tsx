import React, { useState, useEffect } from 'react';
import { CustomizerSidebar, LivePreviewFrame } from '../../../../components/store-builder';
import { StorefrontThemeConfig, DEFAULT_STOREFRONT_THEME } from '../../../../types/store-builder.types';
import { Button } from '../../../../components/ui/Button';

export default function StoreBuilderPage({ params }: { params: { tenantSlug: string } }) {
  const [theme, setTheme] = useState<StorefrontThemeConfig>(DEFAULT_STOREFRONT_THEME);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  useEffect(() => {
    async function loadThemeConfig() {
      try {
        const res = await fetch('/api/merchant/store-builder/theme');
        const data = await res.json();
        if (data.success && data.data) {
          setTheme(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch theme:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadThemeConfig();
  }, []);

  const handleSaveAndPublish = async () => {
    setIsSaving(true);
    setSaveSuccessMessage('');

    try {
      const res = await fetch('/api/merchant/store-builder/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branding: { storeName: theme.storeName, logoUrl: theme.logoUrl, faviconUrl: theme.faviconUrl },
          colorsAndFonts: {
            primaryColor: theme.primaryColor,
            secondaryColor: theme.secondaryColor,
            backgroundColor: theme.backgroundColor,
            textColor: theme.textColor,
            fontFamily: theme.fontFamily,
          },
          headerStyle: theme.headerStyle,
          footerStyle: theme.footerStyle,
        }),
      });

      const data = await res.json();
      setIsSaving(false);

      if (data.success) {
        setSaveSuccessMessage('🎉 Theme settings saved & published to live storefront!');
        setTimeout(() => setSaveSuccessMessage(''), 4000);
      }
    } catch {
      setIsSaving(false);
      alert('Failed to save storefront theme changes.');
    }
  };

  const handleGeneratePolicies = async () => {
    try {
      const res = await fetch('/api/merchant/store-builder/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'GENERATE_POLICIES', storeName: theme.storeName }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Standard Bangladesh e-commerce policy pages (Privacy, Terms, Return, Shipping) generated!');
      }
    } catch {
      alert('Failed to generate policy pages.');
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
        Loading Store Builder Customizer Engine...
      </div>
    );
  }

  return (
    <div
      className="ag-store-builder-shell"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
      }}
    >
      {/* Top Header Bar */}
      <header
        style={{
          height: '3.5rem',
          backgroundColor: 'var(--card)',
          borderBottom: '1px solid var(--border)',
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.25rem' }}>✨</span>
          <div>
            <strong style={{ fontSize: '1rem' }}>Live Storefront Customizer</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginLeft: '0.5rem' }}>
              ({params.tenantSlug}.antigravity.bd)
            </span>
          </div>
        </div>

        {saveSuccessMessage && (
          <span style={{ fontSize: '0.8125rem', color: '#10b981', fontWeight: 600 }}>
            {saveSuccessMessage}
          </span>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/${params.tenantSlug}/dashboard`, '_blank')}
          >
            ↗ Preview Live Store
          </Button>
          <Button variant="primary" size="sm" isLoading={isSaving} onClick={handleSaveAndPublish}>
            Save & Publish Changes
          </Button>
        </div>
      </header>

      {/* Main Split Screen Area: Sidebar Controls (Left) & Live Preview Canvas (Right) */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <CustomizerSidebar
          theme={theme}
          onThemeChange={(updated) => setTheme(updated)}
          onGeneratePolicies={handleGeneratePolicies}
        />

        <LivePreviewFrame theme={theme} />
      </div>
    </div>
  );
}
