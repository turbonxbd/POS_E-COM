import React from 'react';
import { BannerSliderItem } from '../../types/store-builder.types';
import { Button } from '../ui/Button';

export interface HeroSectionProps {
  sliders?: BannerSliderItem[];
  onCtaClick?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ sliders = [], onCtaClick }) => {
  const activeSlide = sliders.find((s) => s.isActive) || {
    id: 'default-hero',
    title: 'Next-Gen Electronics & Official Bangladesh Storefront',
    subtitle: 'Get up to 20% discount on bKash & Nagad payments. 100% Original Products.',
    imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&auto=format&fit=crop&q=80',
    ctaText: 'Explore Catalog',
  };

  return (
    <div className="w-full bg-slate-900 text-white overflow-hidden">
      {/* Banner Carousel Hero */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 min-h-[360px] md:min-h-[420px] flex items-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={activeSlide.imageUrl}
            alt={activeSlide.title}
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="inline-block px-3 py-1 bg-blue-600/90 text-white font-bold text-xs rounded-full uppercase tracking-wider shadow-sm">
            ⚡ Official Storefront
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {activeSlide.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
            {activeSlide.subtitle}
          </p>
          <div className="pt-2">
            <Button
              type="button"
              variant="primary"
              onClick={onCtaClick}
              className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm px-6 py-3 rounded-xl shadow-lg transition-all active:scale-95"
            >
              {activeSlide.ctaText || 'Shop Collection Now →'}
            </Button>
          </div>
        </div>
      </div>

      {/* Trust Badges Grid */}
      <div className="bg-slate-950 border-t border-slate-800/80 py-4 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="flex items-center justify-center gap-2.5 p-2">
            <span className="text-2xl">🚚</span>
            <div className="text-left">
              <h4 className="font-bold text-xs text-white">Fast BD Shipping</h4>
              <p className="text-[10px] text-slate-400">Inside Dhaka in 24-48 Hours</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2.5 p-2">
            <span className="text-2xl">🛡️</span>
            <div className="text-left">
              <h4 className="font-bold text-xs text-white">100% Genuine</h4>
              <p className="text-[10px] text-slate-400">Official Warranty Guaranteed</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2.5 p-2">
            <span className="text-2xl">💵</span>
            <div className="text-left">
              <h4 className="font-bold text-xs text-white">Cash on Delivery</h4>
              <p className="text-[10px] text-slate-400">Pay when product arrives</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2.5 p-2">
            <span className="text-2xl">🔄</span>
            <div className="text-left">
              <h4 className="font-bold text-xs text-white">7 Days Return</h4>
              <p className="text-[10px] text-slate-400">Easy replacement guarantee</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
