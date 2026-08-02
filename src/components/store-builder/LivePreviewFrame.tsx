import React, { useState } from 'react';
import { StorefrontThemeConfig } from '../../types/store-builder.types';

export interface LivePreviewFrameProps {
  theme: StorefrontThemeConfig;
}

export const LivePreviewFrame: React.FC<LivePreviewFrameProps> = ({ theme }) => {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const getViewportWidth = () => {
    switch (device) {
      case 'mobile':
        return '375px';
      case 'tablet':
        return '768px';
      default:
        return '100%';
    }
  };

  return (
    <div
      className="ag-live-preview-frame"
      style={{
        flex: 1,
        backgroundColor: 'var(--muted)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflow: 'hidden',
        height: '100%',
      }}
    >
      {/* Device Viewport Switcher Toolbar */}
      <div
        style={{
          width: '100%',
          backgroundColor: 'var(--card)',
          borderBottom: '1px solid var(--border)',
          padding: '0.625rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
          Live Preview Canvas ({device.toUpperCase()})
        </span>

        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <button
            type="button"
            className={`ag-btn ag-btn-xs ${device === 'desktop' ? 'ag-btn-primary' : 'ag-btn-ghost'}`}
            onClick={() => setDevice('desktop')}
          >
            💻 Desktop
          </button>
          <button
            type="button"
            className={`ag-btn ag-btn-xs ${device === 'tablet' ? 'ag-btn-primary' : 'ag-btn-ghost'}`}
            onClick={() => setDevice('tablet')}
          >
            📱 Tablet
          </button>
          <button
            type="button"
            className={`ag-btn ag-btn-xs ${device === 'mobile' ? 'ag-btn-primary' : 'ag-btn-ghost'}`}
            onClick={() => setDevice('mobile')}
          >
            📲 Mobile
          </button>
        </div>
      </div>

      {/* Simulated Store Canvas Viewport */}
      <div
        style={{
          flex: 1,
          width: getViewportWidth(),
          maxWidth: '100%',
          backgroundColor: theme.backgroundColor,
          color: theme.textColor,
          fontFamily: theme.fontFamily,
          boxShadow: device !== 'desktop' ? 'var(--shadow-md)' : 'none',
          margin: device !== 'desktop' ? '1rem auto' : 0,
          borderRadius: device !== 'desktop' ? 'var(--border-radius)' : 0,
          overflowY: 'auto',
          transition: 'width 0.3s ease',
        }}
      >
        {/* Announcement Bar */}
        {theme.announcements.length > 0 && theme.announcements[0].isActive && (
          <div
            style={{
              backgroundColor: theme.announcements[0].backgroundColor,
              color: theme.announcements[0].textColor,
              padding: '0.5rem 1rem',
              textAlign: 'center',
              fontSize: '0.8125rem',
              fontWeight: 500,
            }}
          >
            {theme.announcements[0].contentText}
          </div>
        )}

        {/* Header */}
        <header
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: theme.headerStyle.sticky ? 'sticky' : 'static',
            top: 0,
            backgroundColor: theme.backgroundColor,
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: theme.primaryColor }}>
            {theme.logoUrl ? <img src={theme.logoUrl} alt={theme.storeName} style={{ height: '2rem' }} /> : theme.storeName}
          </div>

          {theme.headerStyle.showSearch && (
            <input
              type="text"
              placeholder="Search products in Bangladesh..."
              style={{ padding: '0.375rem 0.75rem', borderRadius: 'var(--border-radius)', border: '1px solid var(--border)', width: '12rem', fontSize: '0.8125rem' }}
            />
          )}

          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
            <span>🛍️ Cart (0)</span>
          </div>
        </header>

        {/* Hero Slider Banner */}
        {theme.sliders.length > 0 && (
          <div
            style={{
              position: 'relative',
              height: '18rem',
              backgroundImage: `url(${theme.sliders[0].imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              textAlign: 'center',
              padding: '1.5rem',
            }}
          >
            <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: '1.5rem', borderRadius: 'var(--border-radius)', maxWidth: '28rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem' }}>{theme.sliders[0].title}</h2>
              <p style={{ margin: '0 0 1rem', fontSize: '0.9375rem' }}>{theme.sliders[0].subtitle}</p>
              <button
                type="button"
                style={{
                  backgroundColor: theme.primaryColor,
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.625rem 1.25rem',
                  borderRadius: 'var(--border-radius)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {theme.sliders[0].ctaText}
              </button>
            </div>
          </div>
        )}

        {/* Sample Storefront Product Grid */}
        <section style={{ padding: '2rem 1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Featured Products</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', padding: '0.75rem', backgroundColor: '#ffffff' }}>
                <div style={{ height: '8rem', backgroundColor: '#f1f5f9', borderRadius: '4px', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  📦 Product #{i}
                </div>
                <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.875rem', fontWeight: 600 }}>Gadget Item #{i}</h4>
                <div style={{ fontWeight: 700, color: theme.primaryColor }}>৳{(i * 1250).toLocaleString()} BDT</div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer style={{ padding: '2rem 1.5rem', borderTop: '1px solid var(--border)', backgroundColor: '#0f172a', color: '#94a3b8', fontSize: '0.8125rem', textAlign: 'center' }}>
          <p>{theme.footerStyle.copyrightText}</p>
        </footer>
      </div>
    </div>
  );
};
