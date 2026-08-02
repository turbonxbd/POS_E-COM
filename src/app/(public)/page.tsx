import React from 'react';
import { Hero, VideoDemo, FeaturesOverview, Testimonials } from '../../components/public';

export default function MarketingHomePage() {
  return (
    <div className="ag-marketing-page">
      <Hero />
      <VideoDemo />
      <FeaturesOverview />
      <Testimonials />
    </div>
  );
}
