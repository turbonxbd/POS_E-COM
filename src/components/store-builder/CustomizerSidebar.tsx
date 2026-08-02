import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { StorefrontThemeConfig, StoreFontFamilyType } from '../../types/store-builder.types';

export interface CustomizerSidebarProps {
  theme: StorefrontThemeConfig;
  onThemeChange: (updated: StorefrontThemeConfig) => void;
  onGeneratePolicies?: () => void;
}

export const CustomizerSidebar: React.FC<CustomizerSidebarProps> = ({
  theme,
  onThemeChange,
  onGeneratePolicies,
}) => {
  const [activeTab, setActiveTab] = useState<string>('branding');

  const tabs = [
    { id: 'branding', label: '🎨 Branding & Logo', icon: '🎨' },
    { id: 'colors', label: '🌈 Colors & Typography', icon: '🌈' },
    { id: 'headerFooter', label: '🧭 Header & Footer', icon: '🧭' },
    { id: 'banners', label: '🖼️ Banners & Sliders', icon: '🖼️' },
    { id: 'promotions', label: '📢 Announcement & Popup', icon: '📢' },
    { id: 'pages', label: '📄 Pages & Policies', icon: '📄' },
    { id: 'domain', label: '🌐 Custom Domain', icon: '🌐' },
  ];

  return (
    <div
      className="ag-customizer-sidebar"
      style={{
        width: '24rem',
        backgroundColor: 'var(--card)',
        borderRight: '1px solid var(--border)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Storefront Customizer</h3>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
          Customize your store design in real-time
        </p>
      </div>

      <div style={{ padding: '0.75rem' }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <div key={tab.id} style={{ marginBottom: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setActiveTab(isActive ? '' : tab.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--border-radius)',
                  border: '1px solid var(--border)',
                  backgroundColor: isActive ? 'var(--muted)' : 'transparent',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: 'var(--foreground)',
                }}
              >
                <span>{tab.label}</span>
                <span>{isActive ? '▲' : '▼'}</span>
              </button>

              {isActive && (
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 var(--border-radius) var(--border-radius)' }}>
                  {/* TAB 1: BRANDING */}
                  {tab.id === 'branding' && (
                    <>
                      <Input
                        label="Store Name"
                        value={theme.storeName}
                        onChange={(e) => onThemeChange({ ...theme, storeName: e.target.value })}
                      />
                      <Input
                        label="Logo Image URL"
                        placeholder="https://..."
                        value={theme.logoUrl || ''}
                        onChange={(e) => onThemeChange({ ...theme, logoUrl: e.target.value })}
                      />
                      <Input
                        label="Favicon Icon URL"
                        placeholder="https://..."
                        value={theme.faviconUrl || ''}
                        onChange={(e) => onThemeChange({ ...theme, faviconUrl: e.target.value })}
                      />
                    </>
                  )}

                  {/* TAB 2: COLORS & TYPOGRAPHY */}
                  {tab.id === 'colors' && (
                    <>
                      <div>
                        <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>
                          Primary Brand Color
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <input
                            type="color"
                            value={theme.primaryColor}
                            onChange={(e) => onThemeChange({ ...theme, primaryColor: e.target.value })}
                            style={{ border: 'none', width: '2.5rem', height: '2.5rem', cursor: 'pointer', borderRadius: '4px' }}
                          />
                          <Input
                            value={theme.primaryColor}
                            onChange={(e) => onThemeChange({ ...theme, primaryColor: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>
                          Secondary Accent Color
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <input
                            type="color"
                            value={theme.secondaryColor}
                            onChange={(e) => onThemeChange({ ...theme, secondaryColor: e.target.value })}
                            style={{ border: 'none', width: '2.5rem', height: '2.5rem', cursor: 'pointer', borderRadius: '4px' }}
                          />
                          <Input
                            value={theme.secondaryColor}
                            onChange={(e) => onThemeChange({ ...theme, secondaryColor: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>
                          Typography Font Family
                        </label>
                        <select
                          className="ag-input"
                          value={theme.fontFamily}
                          onChange={(e) => onThemeChange({ ...theme, fontFamily: e.target.value as StoreFontFamilyType })}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--border-radius)' }}
                        >
                          <option value="Inter">Inter (Clean Modern)</option>
                          <option value="Roboto">Roboto (Classic Sans)</option>
                          <option value="Poppins">Poppins (Geometric Trendy)</option>
                          <option value="Hind Siliguri">Hind Siliguri (Bangla Optimized)</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* TAB 3: HEADER & FOOTER */}
                  {tab.id === 'headerFooter' && (
                    <>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={theme.headerStyle.sticky}
                          onChange={(e) =>
                            onThemeChange({
                              ...theme,
                              headerStyle: { ...theme.headerStyle, sticky: e.target.checked },
                            })
                          }
                        />
                        Enable Sticky Header on Scroll
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={theme.headerStyle.showSearch}
                          onChange={(e) =>
                            onThemeChange({
                              ...theme,
                              headerStyle: { ...theme.headerStyle, showSearch: e.target.checked },
                            })
                          }
                        />
                        Show Header Search Bar
                      </label>

                      <Input
                        label="Footer Copyright Text"
                        value={theme.footerStyle.copyrightText}
                        onChange={(e) =>
                          onThemeChange({
                            ...theme,
                            footerStyle: { ...theme.footerStyle, copyrightText: e.target.value },
                          })
                        }
                      />
                    </>
                  )}

                  {/* TAB 4: BANNERS & SLIDERS */}
                  {tab.id === 'banners' && (
                    <>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', margin: 0 }}>
                        Hero Sliders ({theme.sliders.length} active)
                      </p>
                      {theme.sliders.map((s, idx) => (
                        <div key={s.id} style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '4px' }}>
                          <Input
                            label={`Slide #${idx + 1} Title`}
                            value={s.title}
                            onChange={(e) => {
                              const updatedSliders = [...theme.sliders];
                              updatedSliders[idx].title = e.target.value;
                              onThemeChange({ ...theme, sliders: updatedSliders });
                            }}
                          />
                        </div>
                      ))}
                    </>
                  )}

                  {/* TAB 5: ANNOUNCEMENT & POPUP */}
                  {tab.id === 'promotions' && (
                    <>
                      {theme.announcements.length > 0 && (
                        <Input
                          label="Top Announcement Bar Text"
                          value={theme.announcements[0].contentText}
                          onChange={(e) => {
                            const updated = [...theme.announcements];
                            updated[0].contentText = e.target.value;
                            onThemeChange({ ...theme, announcements: updated });
                          }}
                        />
                      )}
                    </>
                  )}

                  {/* TAB 6: PAGES & POLICIES */}
                  {tab.id === 'pages' && (
                    <>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', margin: 0 }}>
                        Auto-generate standard Bangladesh e-commerce legal policies.
                      </p>
                      <Button variant="outline" size="sm" onClick={onGeneratePolicies} style={{ width: '100%' }}>
                        ✨ Auto-Generate Policy Pages
                      </Button>
                    </>
                  )}

                  {/* TAB 7: CUSTOM DOMAIN */}
                  {tab.id === 'domain' && (
                    <>
                      <Input label="Custom Domain Name" placeholder="myfashionstore.com" />
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                        Point CNAME to: <strong>cname.antigravity.bd</strong>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
