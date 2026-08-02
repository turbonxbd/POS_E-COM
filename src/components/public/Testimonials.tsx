import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { t } from '../../core/i18n/i18n.engine';

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
  quoteKey: string;
  defaultQuote: string;
  metric: string;
}

const TESTIMONIALS: TestimonialItem[] = [
  {
    id: 't1',
    name: 'Rahim Ahmed',
    role: 'Founder & CEO',
    company: 'TechStore BD',
    avatar: '👨‍💼',
    rating: 5,
    quoteKey: 'testimonials.quote1',
    defaultQuote:
      'Antigravity allowed us to launch 50+ retail franchisee storefronts in a single afternoon. The multi-tenant architecture and subdomains work seamlessly!',
    metric: '300% Revenue Growth',
  },
  {
    id: 't2',
    name: 'Nusrat Jahan',
    role: 'Head of Operations',
    company: 'Fashion Hub',
    avatar: '👩‍💼',
    rating: 5,
    quoteKey: 'testimonials.quote2',
    defaultQuote:
      'The real-time inventory sync between our physical POS machines and online stores saved us hundreds of hours of manual reconciliation every week.',
    metric: '100% Stock Accuracy',
  },
  {
    id: 't3',
    name: 'Tanvir Hossain',
    role: 'Managing Director',
    company: 'Gadget Express',
    avatar: '👨‍💻',
    rating: 5,
    quoteKey: 'testimonials.quote3',
    defaultQuote:
      'Custom branding and dynamic CSS theme variables allowed us to give every tenant a completely custom look while maintaining a single codebase.',
    metric: '50K+ Monthly Orders',
  },
];

export const Testimonials: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const current = TESTIMONIALS[activeIndex];

  return (
    <section className="ag-testimonials-section">
      <div className="ag-testimonials-container">
        <div className="ag-testimonials-header">
          <span className="ag-badge ag-badge-success" style={{ marginBottom: '0.75rem' }}>
            MERCHANT SUCCESS
          </span>
          <h2 className="ag-testimonials-title">
            {t('testimonials.sectionTitle', {}, 'Trusted by Thousands of High-Growth Brands')}
          </h2>
        </div>

        {/* Active Testimonial Card Display */}
        <Card className="ag-testimonial-active-card">
          <CardContent>
            <div className="ag-testimonial-stars">{'★'.repeat(current.rating)}</div>
            <p className="ag-testimonial-quote">"{t(current.quoteKey, {}, current.defaultQuote)}"</p>

            <div className="ag-testimonial-footer">
              <div className="ag-testimonial-user">
                <div className="ag-testimonial-avatar">{current.avatar}</div>
                <div className="ag-testimonial-meta">
                  <span className="ag-testimonial-name">{current.name}</span>
                  <span className="ag-testimonial-role">
                    {current.role}, <strong>{current.company}</strong>
                  </span>
                </div>
              </div>
              <div className="ag-testimonial-metric-badge">
                <span>📈 {current.metric}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Carousel Controls */}
        <div className="ag-testimonial-controls">
          <button type="button" className="ag-btn ag-btn-outline ag-btn-sm" onClick={prevTestimonial}>
            ← Previous
          </button>

          <div className="ag-testimonial-dots">
            {TESTIMONIALS.map((_, idx) => (
              <span
                key={idx}
                className={`ag-testimonial-dot ${idx === activeIndex ? 'active' : ''}`}
                onClick={() => setActiveIndex(idx)}
              />
            ))}
          </div>

          <button type="button" className="ag-btn ag-btn-outline ag-btn-sm" onClick={nextTestimonial}>
            Next →
          </button>
        </div>
      </div>
    </section>
  );
};
