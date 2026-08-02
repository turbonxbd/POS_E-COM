import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';

export default function BlogDetailPage({ params }: { params: { slug: string } }) {
  const formattedTitle = params.slug
    ? params.slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Article Details';

  return (
    <div className="ag-blog-detail-page" style={{ paddingBottom: '5rem' }}>
      <section className="ag-hero-section" style={{ padding: '3.5rem 1.5rem 2rem' }}>
        <div className="ag-hero-container" style={{ maxWidth: '48rem' }}>
          <span className="ag-badge ag-badge-info" style={{ marginBottom: '0.75rem' }}>
            ENGINEERING & ARCHITECTURE
          </span>
          <h1 className="ag-hero-title" style={{ fontSize: '2.5rem' }}>{formattedTitle}</h1>
          <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--muted-foreground)', fontSize: '0.875rem', marginTop: '1rem' }}>
            <span>✍️ By Antigravity Engineering Team</span>
            <span>📅 Published on July 28, 2026</span>
            <span>⏱️ 6 min read</span>
          </div>
        </div>
      </section>

      <section className="ag-page-container" style={{ maxWidth: '52rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '2rem' }}>
          {/* Left Column: Table of Contents */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Card style={{ position: 'sticky', top: '5rem' }}>
              <CardHeader style={{ padding: '1rem' }}>
                <CardTitle style={{ fontSize: '0.9375rem' }}>Table of Contents</CardTitle>
              </CardHeader>
              <CardContent style={{ padding: '0 1rem 1rem' }}>
                <ul className="ag-footer-links" style={{ fontSize: '0.8125rem', gap: '0.5rem' }}>
                  <li><a href="#section-1">1. Introduction</a></li>
                  <li><a href="#section-2">2. Multi-Tenancy Benefits</a></li>
                  <li><a href="#section-3">3. Database Isolation</a></li>
                  <li><a href="#section-4">4. Conclusion</a></li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Article Rich Content */}
          <div>
            <Card style={{ padding: '2rem' }}>
              <article style={{ lineHeight: 1.8, fontSize: '1.0625rem', color: 'var(--foreground)' }}>
                <h2 id="section-1" style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 0 }}>
                  1. Introduction to SaaS Multi-Tenancy
                </h2>
                <p>
                  As modern eCommerce merchants scale from single retail outlets to nationwide franchises, traditional single-tenant server deployments create massive operational overhead and cost friction. Multi-tenant architecture resolves this by allowing thousands of independent stores to run on a shared system core.
                </p>

                <h2 id="section-2" style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '2rem' }}>
                  2. Core Benefits for Modern Brands
                </h2>
                <p>
                  By abstracting tenant routing via hostnames, subdomains, and HTTP headers, operators gain unified analytics, instant feature deployment, and zero-downtime maintenance.
                </p>

                <ul style={{ paddingLeft: '1.25rem' }}>
                  <li>Instant onboarding and automated store provisioning.</li>
                  <li>Dynamic runtime theme customization per tenant.</li>
                  <li>Centralized compliance, security audits, and automated backups.</li>
                </ul>

                <h2 id="section-3" style={{ fontSize: '1.5rem', fontWeight 700, marginTop: '2rem' }}>
                  3. Database Isolation Models
                </h2>
                <p>
                  Whether using schema-per-tenant, database-per-tenant, or discriminator column row-level security, selecting the right isolation pattern guarantees high query throughput and privacy compliance.
                </p>

                <h2 id="section-4" style={{ fontSize: '1.5rem', fontWeight 700, marginTop: '2rem' }}>
                  4. Conclusion
                </h2>
                <p>
                  Antigravity provides out-of-the-box infrastructure for multi-tenancy, POS integration, and logistics automation, enabling SaaS founders to focus on customer acquisition.
                </p>
              </article>

              {/* Author Box & Social Share */}
              <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ fontSize: '0.9375rem' }}>Share this article:</strong>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <Button variant="outline" size="sm">Twitter</Button>
                    <Button variant="outline" size="sm">LinkedIn</Button>
                    <Button variant="outline" size="sm">Facebook</Button>
                  </div>
                </div>
                <a href="/blog">
                  <Button variant="ghost" size="sm">← Back to All Articles</Button>
                </a>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
