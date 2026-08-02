import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { t } from '../../core/i18n/i18n.engine';

export interface FeatureItem {
  icon: string;
  titleKey: string;
  defaultTitle: string;
  descKey: string;
  defaultDesc: string;
  badge?: string;
}

const FEATURES_LIST: FeatureItem[] = [
  {
    icon: '🏢',
    titleKey: 'features.multiTenant.title',
    defaultTitle: 'Isolated Multi-Tenancy',
    descKey: 'features.multiTenant.desc',
    defaultDesc: 'Complete data isolation per merchant with dynamic subdomain and custom domain resolution.',
    badge: 'CORE ARCHITECTURE',
  },
  {
    icon: '🛒',
    titleKey: 'features.pos.title',
    defaultTitle: 'Omnichannel POS System',
    descKey: 'features.pos.desc',
    defaultDesc: 'Seamlessly sync in-person retail sales with online store stock in real-time.',
  },
  {
    icon: '📦',
    titleKey: 'features.inventory.title',
    defaultTitle: 'Automated Inventory Sync',
    descKey: 'features.inventory.desc',
    defaultDesc: 'Centralized stock management preventing overselling across multi-branch locations.',
  },
  {
    icon: '🎨',
    titleKey: 'features.builder.title',
    defaultTitle: 'Drag-and-Drop Builder',
    descKey: 'features.builder.desc',
    defaultDesc: 'No-code storefront designer with customizable tenant themes and design tokens.',
  },
  {
    icon: '🧾',
    titleKey: 'features.invoicing.title',
    defaultTitle: 'Automated Invoicing & Tax',
    descKey: 'features.invoicing.desc',
    defaultDesc: 'Generate PDF invoices, calculate VAT/Tax rates automatically, and track payments.',
  },
  {
    icon: '📊',
    titleKey: 'features.analytics.title',
    defaultTitle: 'Real-Time SaaS Analytics',
    descKey: 'features.analytics.desc',
    defaultDesc: 'Track MRR, ARR, active merchant churn, and sales breakdown with live metrics.',
    badge: 'ENTERPRISE',
  },
];

export const FeaturesOverview: React.FC = () => {
  return (
    <section id="features" className="ag-features-section">
      <div className="ag-features-container">
        <div className="ag-features-header">
          <span className="ag-badge ag-badge-info" style={{ marginBottom: '0.75rem' }}>
            ENGINEERING EXCELLENCE
          </span>
          <h2 className="ag-features-title">
            {t('features.sectionTitle', {}, 'Everything You Need to Run a Scalable SaaS Platform')}
          </h2>
          <p className="ag-features-subtitle">
            {t(
              'features.sectionSubtitle',
              {},
              'Designed from the ground up to solve complex multi-tenant billing, theme customization, and data separation.'
            )}
          </p>
        </div>

        <div className="ag-features-grid">
          {FEATURES_LIST.map((feature, idx) => (
            <Card key={idx} className="ag-feature-card">
              <CardHeader>
                <div className="ag-feature-icon-row">
                  <span className="ag-feature-icon">{feature.icon}</span>
                  {feature.badge && <span className="ag-badge ag-badge-outline">{feature.badge}</span>}
                </div>
                <CardTitle>{t(feature.titleKey, {}, feature.defaultTitle)}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{t(feature.descKey, {}, feature.defaultDesc)}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
