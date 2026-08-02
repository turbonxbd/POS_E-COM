import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { t } from '../../core/i18n/i18n.engine';

export const Footer: React.FC = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim().length > 0) {
      setIsSubscribed(true);
      setNewsletterEmail('');
    }
  };

  return (
    <footer className="ag-footer">
      <div className="ag-footer-container">
        {/* Column 1: Brand Info & Newsletter */}
        <div className="ag-footer-col-brand">
          <div className="ag-navbar-brand" style={{ marginBottom: '1rem' }}>
            <div className="ag-navbar-logo-icon">⚡</div>
            <span className="ag-navbar-brand-name">{t('common.appName', {}, 'Antigravity Platform')}</span>
          </div>
          <p className="ag-footer-brand-desc">
            {t(
              'footer.description',
              {},
              'Next-generation enterprise-grade multi-tenant web application framework empowering modern SaaS businesses.'
            )}
          </p>

          <form onSubmit={handleNewsletterSubmit} className="ag-footer-newsletter">
            <span className="ag-footer-newsletter-label">
              {t('footer.subscribeTitle', {}, 'Subscribe to product updates')}
            </span>
            {isSubscribed ? (
              <p className="ag-footer-subscribed-msg">
                ✓ {t('footer.subscribedSuccess', {}, 'Thank you for subscribing!')}
              </p>
            ) : (
              <div className="ag-footer-newsletter-form">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                />
                <Button type="submit" variant="primary" size="md">
                  {t('footer.subscribeBtn', {}, 'Subscribe')}
                </Button>
              </div>
            )}
          </form>
        </div>

        {/* Column 2: Quick Links */}
        <div className="ag-footer-col">
          <h4 className="ag-footer-col-title">{t('footer.product', {}, 'Product')}</h4>
          <ul className="ag-footer-links">
            <li>
              <a href="#features">{t('navigation.features', {}, 'Features')}</a>
            </li>
            <li>
              <a href="#pricing">{t('navigation.pricing', {}, 'Pricing')}</a>
            </li>
            <li>
              <a href="#demo">{t('navigation.demo', {}, 'Demo')}</a>
            </li>
            <li>
              <a href="#roadmap">{t('footer.roadmap', {}, 'Product Roadmap')}</a>
            </li>
          </ul>
        </div>

        {/* Column 3: Resources */}
        <div className="ag-footer-col">
          <h4 className="ag-footer-col-title">{t('footer.resources', {}, 'Resources')}</h4>
          <ul className="ag-footer-links">
            <li>
              <a href="#blog">{t('navigation.blog', {}, 'Blog')}</a>
            </li>
            <li>
              <a href="#faq">{t('navigation.faq', {}, 'FAQ')}</a>
            </li>
            <li>
              <a href="#docs">{t('footer.documentation', {}, 'Documentation')}</a>
            </li>
            <li>
              <a href="#support">{t('footer.support', {}, 'Support Center')}</a>
            </li>
          </ul>
        </div>

        {/* Column 4: Legal & Social */}
        <div className="ag-footer-col">
          <h4 className="ag-footer-col-title">{t('footer.legal', {}, 'Legal')}</h4>
          <ul className="ag-footer-links">
            <li>
              <a href="#terms">{t('footer.terms', {}, 'Terms of Service')}</a>
            </li>
            <li>
              <a href="#privacy">{t('footer.privacy', {}, 'Privacy Policy')}</a>
            </li>
            <li>
              <a href="#cookies">{t('footer.cookies', {}, 'Cookie Settings')}</a>
            </li>
          </ul>

          <div className="ag-footer-social">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
              Facebook
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter">
              Twitter
            </a>
            <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub">
              GitHub
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="ag-footer-bottom">
        <p className="ag-footer-copyright">
          © {new Date().getFullYear()} Antigravity Platform. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
