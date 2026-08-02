import { Inter, Hind_Siliguri } from 'next/font/google';

/**
 * Self-Hosted Font Optimization setup using @next/font to prevent Cumulative Layout Shift (CLS).
 */

export const fontInter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800'],
});

export const fontHindSiliguri = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  display: 'swap',
  variable: '--font-hind-siliguri',
  weight: ['400', '500', '600', '700'],
});
