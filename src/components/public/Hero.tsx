import React from 'react';
import { Button } from '../ui/Button';
import { t } from '../../core/i18n/i18n.engine';

export interface HeroProps {
  onDemoClick?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onDemoClick }) => {
  return (
    <section className="ag-hero-section">
      <div className="ag-hero-container">
        {/* Top Announcement Pill */}
        <div className="ag-hero-badge">
          <span className="ag-badge ag-badge-info">🚀 NEW v2.5 RELEASE</span>
          <span className="ag-hero-badge-text">
            {t('hero.announcement', {}, 'AI-Powered Multi-Tenant Storefronts is now live!')}
          </span>
        </div>

        {/* Main Headline & Sub-headline */}
        <h1 className="ag-hero-title">
          {t('hero.title', {}, 'Scale Your Enterprise eCommerce with Multi-Tenant Architecture')}
        </h1>
        <p className="ag-hero-subtitle">
          {t(
            'hero.subtitle',
            {},
            'Launch, manage, and scale thousands of independent merchant storefronts from a single unified platform. Built for high-volume retail and SaaS operators.'
          )}
        </p>

        {/* Dual CTA Buttons */}
        <div className="ag-hero-ctas">
          <a href="/register">
            <Button variant="primary" size="lg">
              {t('hero.ctaPrimary', {}, 'Start 14-Day Free Trial')}
            </Button>
          </a>
          <Button variant="outline" size="lg" onClick={onDemoClick}>
            ▶ {t('hero.ctaSecondary', {}, 'Watch 2-Min Demo')}
          </Button>
        </div>

        {/* Trust Logos / Micro Copy */}
        <div className="ag-hero-trust">
          <span>✓ {t('hero.trustNoCard', {}, 'No credit card required')}</span>
          <span>✓ {t('hero.trustSetup', {}, 'Setup in under 5 minutes')}</span>
          <span>✓ {t('hero.trustCancel', {}, 'Cancel anytime')}</span>
        </div>

        {/* SaaS Dashboard Preview / Mockup Frame */}
        <div className="ag-hero-mockup-container">
          <div className="ag-hero-mockup-header">
            <div className="ag-mockup-dot ag-dot-red" />
            <div className="ag-mockup-dot ag-dot-yellow" />
            <div className="ag-mockup-dot ag-dot-green" />
            <div className="ag-mockup-url">https://admin.antigravity.app/dashboard</div>
          </div>
          <div className="ag-hero-mockup-body">
            <div className="ag-mockup-sidebar">
              <div className="ag-mockup-item active">📊 Dashboard</div>
              <div className="ag-mockup-item">🛍️ Merchants (1,240)</div>
              <div className="ag-mockup-item">💳 Revenue ($148K)</div>
              <div className="ag-mockup-item">⚙️ Settings</div>
            </div>
            <div className="ag-mockup-content">
              <div className="ag-mockup-grid">
                <div className="ag-mockup-card">
                  <span className="ag-mockup-card-label">Monthly Revenue</span>
                  <span className="ag-mockup-card-val">$148,920.00</span>
                  <span className="ag-mockup-card-sub">+18.4% MoM</span>
                </div>
                <div className="ag-mockup-card">
                  <span className="ag-mockup-card-label">Active Merchants</span>
                  <span className="ag-mockup-card-val">1,248 Stores</span>
                  <span className="ag-mockup-card-sub">+42 new this week</span>
                </div>
                <div className="ag-mockup-card">
                  <span className="ag-mockup-card-label">System Health</span>
                  <span className="ag-mockup-card-val">99.99% Uptime</span>
                  <span className="ag-mockup-card-sub">All systems optimal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
