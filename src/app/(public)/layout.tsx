import React from 'react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { generatePublicPageMetadata } from '../../config/seo.config';

export const metadata = generatePublicPageMetadata();

export default function MarketingPublicLayout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}
