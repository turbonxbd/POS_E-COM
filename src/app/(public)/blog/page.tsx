import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { generatePublicPageMetadata } from '../../../config/seo.config';

export const metadata = generatePublicPageMetadata({
  title: 'Blog & SaaS Growth Strategies',
  description: 'Articles, multi-tenant engineering guides, and eCommerce growth playbooks.',
});

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  author: string;
  readTime: string;
  publishedAt: string;
  coverEmoji: string;
}

const SAMPLE_POSTS: BlogPost[] = [
  {
    id: 'b1',
    slug: 'how-multi-tenancy-scales-ecommerce',
    title: 'Why Multi-Tenant Architecture is Revolutionizing Modern SaaS eCommerce',
    category: 'Engineering',
    excerpt: 'Explore how isolated multi-tenancy reduces infrastructure costs while giving merchants custom domain flexibility.',
    author: 'Antigravity Engineering',
    readTime: '6 min read',
    publishedAt: '2026-07-28',
    coverEmoji: '🏢',
  },
  {
    id: 'b2',
    slug: 'omnichannel-pos-inventory-sync-guide',
    title: 'Eliminating Stockout Disasters: Omnichannel POS & Real-Time Sync Guide',
    category: 'Retail',
    excerpt: 'How physical shops and online storefronts stay in 100% sync using automated WebSocket inventory updates.',
    author: 'Operations Team',
    readTime: '4 min read',
    publishedAt: '2026-07-20',
    coverEmoji: '📦',
  },
  {
    id: 'b3',
    slug: 'bangladesh-courier-cod-automation',
    title: 'Automating Cash on Delivery (COD) & Courier Bookings in Bangladesh',
    category: 'Logistics',
    excerpt: 'Streamline shipping label printing and automated COD payout tracking with Steadfast, Pathao, and RedX.',
    author: 'Growth Specialist',
    readTime: '5 min read',
    publishedAt: '2026-07-15',
    coverEmoji: '🚚',
  },
];

const CATEGORIES = ['All', 'Engineering', 'Retail', 'Logistics', 'Growth'];

export default function BlogIndexPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = SAMPLE_POSTS.filter((post) => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="ag-blog-page" style={{ paddingBottom: '4rem' }}>
      <section className="ag-hero-section" style={{ padding: '3.5rem 1.5rem 2rem' }}>
        <div className="ag-hero-container">
          <span className="ag-badge ag-badge-info" style={{ marginBottom: '0.75rem' }}>
            ANTIGRAVITY JOURNAL
          </span>
          <h1 className="ag-hero-title" style={{ fontSize: '2.75rem' }}>
            Insights, Guides & Growth Strategies
          </h1>
          <p className="ag-hero-subtitle">
            Learn how enterprise brands build, scale, and automate multi-tenant eCommerce operations.
          </p>

          <div style={{ width: '100%', maxWidth: '32rem', marginTop: '1rem' }}>
            <Input
              type="text"
              placeholder="🔍 Search articles by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="ag-page-container">
        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '2.5rem' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`ag-btn ag-btn-sm ${selectedCategory === cat ? 'ag-btn-primary' : 'ag-btn-outline'}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Blog Post Cards Grid */}
        <div className="ag-features-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {filteredPosts.map((post) => (
            <a key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <Card style={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform var(--transition-speed)' }}>
                <div
                  style={{
                    height: '10rem',
                    backgroundColor: 'var(--muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '4rem',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {post.coverEmoji}
                </div>
                <CardHeader>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span className="ag-badge ag-badge-info">{post.category}</span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{post.readTime}</span>
                  </div>
                  <CardTitle style={{ fontSize: '1.25rem', lineHeight: 1.4 }}>{post.title}</CardTitle>
                </CardHeader>
                <CardContent style={{ flex: 1 }}>
                  <CardDescription style={{ fontSize: '0.9375rem', lineHeight: 1.5 }}>{post.excerpt}</CardDescription>
                  <div style={{ marginTop: '1.5rem', fontSize: '0.8125rem', color: 'var(--muted-foreground)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>By {post.author}</span>
                    <span>{post.publishedAt}</span>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
