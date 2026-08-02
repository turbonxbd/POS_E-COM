import { CMSContent, CMSSection, UpdateCMSDTO } from '../../../types/platform-admin.types';
import { auditService } from './audit.service';

export interface BlogPostItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  author: string;
  publishedAt: string;
  isPublished: boolean;
}

/**
 * Enterprise Service for Platform Public Website Dynamic CMS & Content Sections.
 */
export class CMSService {
  private static instance: CMSService | null = null;
  private cmsStore: Map<CMSSection, CMSContent> = new Map();
  private blogPostsStore: Map<string, BlogPostItem> = new Map();

  private constructor() {
    this.seedCMSContent();
  }

  public static getInstance(): CMSService {
    if (!CMSService.instance) {
      CMSService.instance = new CMSService();
    }
    return CMSService.instance;
  }

  /**
   * Retrieves CMS content payload for a given section.
   */
  public async getCMSSection(section: CMSSection): Promise<CMSContent | null> {
    return this.cmsStore.get(section) ?? null;
  }

  /**
   * Updates CMS content section payload.
   */
  public async updateCMSSection(section: CMSSection, dto: UpdateCMSDTO, adminId = 'system'): Promise<CMSContent> {
    const existing = await this.getCMSSection(section);
    if (!existing) {
      throw new Error(`CMS section "${section}" not found.`);
    }

    const updated: CMSContent = {
      ...existing,
      title: dto.title ?? existing.title,
      slug: dto.slug ?? existing.slug,
      payload: dto.payload ? { ...existing.payload, ...dto.payload } : existing.payload,
      isPublished: dto.isPublished !== undefined ? dto.isPublished : existing.isPublished,
      updatedAt: new Date().toISOString(),
    };

    this.cmsStore.set(section, updated);

    await auditService.logAdminAction({
      adminId,
      action: 'UPDATE_CMS_SECTION',
      targetResource: `CMS:${section}`,
      details: { title: updated.title, isPublished: updated.isPublished },
    });

    return updated;
  }

  /**
   * Publishes or un-publishes a CMS section.
   */
  public async publishCMSSection(section: CMSSection, isPublished: boolean, adminId = 'system'): Promise<CMSContent> {
    return this.updateCMSSection(section, { isPublished }, adminId);
  }

  // --- Blog Posts Management ---

  public async getBlogPosts(onlyPublished = false): Promise<BlogPostItem[]> {
    const posts = Array.from(this.blogPostsStore.values());
    return onlyPublished ? posts.filter((p) => p.isPublished) : posts;
  }

  public async createBlogPost(post: Omit<BlogPostItem, 'id' | 'publishedAt'>, adminId = 'system'): Promise<BlogPostItem> {
    const id = `post-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newPost: BlogPostItem = {
      ...post,
      id,
      publishedAt: new Date().toISOString(),
    };

    this.blogPostsStore.set(id, newPost);

    await auditService.logAdminAction({
      adminId,
      action: 'CREATE_BLOG_POST',
      targetResource: `BlogPost:${id}`,
      details: { title: newPost.title, slug: newPost.slug },
    });

    return newPost;
  }

  public async deleteBlogPost(id: string, adminId = 'system'): Promise<boolean> {
    const deleted = this.blogPostsStore.delete(id);
    if (deleted) {
      await auditService.logAdminAction({
        adminId,
        action: 'DELETE_BLOG_POST',
        targetResource: `BlogPost:${id}`,
      });
    }
    return deleted;
  }

  private seedCMSContent(): void {
    const initialSections: { section: CMSSection; title: string; payload: Record<string, unknown> }[] = [
      {
        section: 'HERO',
        title: 'Launch Your Multi-Tenant SaaS Platform Effortlessly',
        payload: {
          subtitle: 'The ultimate enterprise-grade eCommerce solution for modern multi-tenant businesses.',
          ctaPrimaryText: 'Start Free 14-Day Trial',
          ctaPrimaryUrl: '/register',
          ctaSecondaryText: 'Schedule Demo',
          ctaSecondaryUrl: '/contact',
          bannerImageUrl: '/images/hero-banner.png',
        },
      },
      {
        section: 'PRICING',
        title: 'Simple, Transparent Pricing Plans',
        payload: {
          subtitle: 'Choose a plan tailored to your business scale with zero hidden fees.',
          currencySymbol: '$',
          billingCycleOptions: ['monthly', 'yearly'],
        },
      },
      {
        section: 'FAQ',
        title: 'Frequently Asked Questions',
        payload: {
          items: [
            { question: 'What is a multi-tenant platform?', answer: 'A multi-tenant architecture allows multiple merchants to share the underlying software foundation while keeping their data completely isolated.' },
            { question: 'Can I use my custom domain?', answer: 'Yes! Professional and Enterprise plans support custom domains.' },
          ],
        },
      },
      {
        section: 'BLOG',
        title: 'Latest News & Growth Strategies',
        payload: {
          featuredPostId: 'post-1',
        },
      },
      {
        section: 'TERMS',
        title: 'Terms of Service',
        payload: {
          content: 'Welcome to Antigravity. By using our services, you agree to these terms...',
          lastUpdated: '2026-01-01',
        },
      },
      {
        section: 'PRIVACY',
        title: 'Privacy Policy',
        payload: {
          content: 'We respect your privacy and protect your multi-tenant data with strict encryption standards...',
          lastUpdated: '2026-01-01',
        },
      },
      {
        section: 'FOOTER',
        title: 'Footer Information',
        payload: {
          companyName: 'Antigravity Technologies Inc.',
          copyrightText: '© 2026 Antigravity. All rights reserved.',
          supportEmail: 'support@antigravity.app',
        },
      },
    ];

    initialSections.forEach((s) => {
      this.cmsStore.set(s.section, {
        id: `cms-${s.section.toLowerCase()}`,
        section: s.section,
        title: s.title,
        slug: s.section.toLowerCase(),
        payload: s.payload,
        isPublished: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
  }
}

export const cmsService = CMSService.getInstance();
