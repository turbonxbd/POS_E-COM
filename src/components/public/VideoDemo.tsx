import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { t } from '../../core/i18n/i18n.engine';

export const VideoDemo: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section id="demo" className="ag-video-demo-section">
      <div className="ag-video-demo-container">
        <div className="ag-video-demo-header">
          <h2 className="ag-video-demo-title">
            {t('videoDemo.title', {}, 'See How Antigravity Powers High-Growth Merchants')}
          </h2>
          <p className="ag-video-demo-subtitle">
            {t(
              'videoDemo.subtitle',
              {},
              'Watch a 2-minute quick walkthrough of our multi-tenant dashboard, domain management, and automated provisioning.'
            )}
          </p>
        </div>

        {/* Video Thumbnail Banner with Play Trigger */}
        <div className="ag-video-banner" onClick={() => setIsModalOpen(true)} role="button" tabIndex={0}>
          <div className="ag-video-overlay">
            <div className="ag-video-play-btn">
              <span className="ag-play-icon">▶</span>
            </div>
            <span className="ag-video-banner-text">Watch Product Walkthrough (2:15)</span>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('videoDemo.modalTitle', {}, 'Antigravity Platform Overview')}
      >
        <div className="ag-video-embed-container" style={{ aspectRatio: '16/9', backgroundColor: '#000' }}>
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1"
            title="Antigravity Product Walkthrough"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ border: 'none' }}
          />
        </div>
      </Modal>
    </section>
  );
};
