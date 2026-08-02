import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { themeStore } from '../../store/theme.store';
import { i18n, t, setLocale, getLocale } from '../../core/i18n/i18n.engine';
import { SupportedLocale } from '../../types/i18n.types';

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentLocaleState, setCurrentLocaleState] = useState<SupportedLocale>(getLocale());
  const [themeModeState, setThemeModeState] = useState(themeStore.getState().mode);

  useEffect(() => {
    const unsubI18n = i18n.subscribe((newLocale) => {
      setCurrentLocaleState(newLocale);
    });

    const unsubTheme = themeStore.subscribe((state) => {
      setThemeModeState(state.mode);
    });

    return () => {
      unsubI18n();
      unsubTheme();
    };
  }, []);

  const handleLanguageToggle = () => {
    const nextLocale: SupportedLocale = currentLocaleState === 'en' ? 'bn' : 'en';
    setLocale(nextLocale);
  };

  const handleThemeToggle = () => {
    const nextTheme = themeModeState === 'dark' ? 'light' : 'dark';
    themeStore.setThemeMode(nextTheme);
  };

  return (
    <nav className="ag-navbar">
      <div className="ag-navbar-container">
        {/* Brand Logo & Title */}
        <a href="/" className="ag-navbar-brand">
          <div className="ag-navbar-logo-icon">⚡</div>
          <span className="ag-navbar-brand-name">{t('common.appName', {}, 'Antigravity Platform')}</span>
        </a>

        {/* Desktop Navigation Links */}
        <div className="ag-navbar-links-desktop">
          <a href="#features" className="ag-navbar-link">
            {t('navigation.features', {}, 'Features')}
          </a>
          <a href="#pricing" className="ag-navbar-link">
            {t('navigation.pricing', {}, 'Pricing')}
          </a>
          <a href="#demo" className="ag-navbar-link">
            {t('navigation.demo', {}, 'Demo')}
          </a>
          <a href="#blog" className="ag-navbar-link">
            {t('navigation.blog', {}, 'Blog')}
          </a>
          <a href="#faq" className="ag-navbar-link">
            {t('navigation.faq', {}, 'FAQ')}
          </a>
        </div>

        {/* Right Utility Actions */}
        <div className="ag-navbar-actions-desktop">
          {/* Language Switcher */}
          <button
            type="button"
            className="ag-btn-ghost ag-btn-sm"
            onClick={handleLanguageToggle}
            title="Switch Language"
            aria-label="Switch Language"
          >
            🌐 {currentLocaleState.toUpperCase()}
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            className="ag-btn-ghost ag-btn-sm"
            onClick={handleThemeToggle}
            title="Toggle Theme"
            aria-label="Toggle Theme"
          >
            {themeModeState === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Auth Actions */}
          <a href="/login">
            <Button variant="ghost" size="sm">
              {t('auth.login', {}, 'Log In')}
            </Button>
          </a>
          <a href="/register">
            <Button variant="primary" size="sm">
              {t('common.getStarted', {}, 'Get Started')}
            </Button>
          </a>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          className="ag-navbar-mobile-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Mobile Navigation"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Responsive Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="ag-navbar-mobile-drawer">
          <a href="#features" className="ag-navbar-mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
            {t('navigation.features', {}, 'Features')}
          </a>
          <a href="#pricing" className="ag-navbar-mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
            {t('navigation.pricing', {}, 'Pricing')}
          </a>
          <a href="#demo" className="ag-navbar-mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
            {t('navigation.demo', {}, 'Demo')}
          </a>
          <a href="#blog" className="ag-navbar-mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
            {t('navigation.blog', {}, 'Blog')}
          </a>
          <a href="#faq" className="ag-navbar-mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
            {t('navigation.faq', {}, 'FAQ')}
          </a>

          <div className="ag-navbar-mobile-divider" />

          <div className="ag-navbar-mobile-controls">
            <button type="button" className="ag-btn ag-btn-outline ag-btn-sm" onClick={handleLanguageToggle}>
              🌐 {currentLocaleState === 'en' ? 'English (en)' : 'বাংলা (bn)'}
            </button>
            <button type="button" className="ag-btn ag-btn-outline ag-btn-sm" onClick={handleThemeToggle}>
              {themeModeState === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>

          <div className="ag-navbar-mobile-auth">
            <a href="/login" style={{ width: '100%' }}>
              <Button variant="outline" size="md" style={{ width: '100%' }}>
                {t('auth.login', {}, 'Log In')}
              </Button>
            </a>
            <a href="/register" style={{ width: '100%' }}>
              <Button variant="primary" size="md" style={{ width: '100%' }}>
                {t('common.getStarted', {}, 'Get Started')}
              </Button>
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};
