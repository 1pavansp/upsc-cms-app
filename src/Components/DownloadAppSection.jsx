import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './DownloadAppSection.css';

const MotionImg = motion.img;
const MotionDiv = motion.div;

const DownloadAppSection = () => {
  const [showIosModal, setShowIosModal] = useState(false);
  return (
    <>
      <section className="content-management-section download-app-section">
      <div className="download-app-section-inner">
        <div className="download-app-mobile">
          <div className="download-app-mobile-glow" />

          <div className="download-app-mobile-qr">
            <div className="download-app-qr-card">
              <img
                src="/assets/QR.svg"
                alt="CivicCentre IAS QR Code"
                loading="lazy"
                decoding="async"
              />
            </div>
            <h3>
              Scan the QR code to <br />
              <a
                href="https://play.google.com/store/apps/details?id=com.civiccentreias"
                className="download-app-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download our app
              </a>
            </h3>
          </div>

          <div className="download-app-store-buttons">
            <a
              href="https://play.google.com/store/apps/details?id=com.civiccentreias"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/assets/google-play-badge.svg"
                alt="Get it on Google Play"
                loading="lazy"
                decoding="async"
              />
            </a>
            <button
              type="button"
              className="download-app-store-button"
              onClick={(e) => {
                e.preventDefault();
                setShowIosModal(true);
              }}
            >
              <img
                src="/assets/app-store-badge.svg"
                alt="Download on the App Store"
                loading="lazy"
                decoding="async"
              />
            </button>
          </div>

          <div className="download-app-mobile-phones">
            <MotionImg
              src="/assets/phone-left.svg"
              alt=""
              aria-hidden="true"
              className="download-app-phone download-app-phone-left"
              loading="lazy"
              decoding="async"
              whileHover={{ rotate: 0, y: -5, scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 150, damping: 12 }}
            />
            <MotionImg
              src="/assets/phone-right.svg"
              alt=""
              aria-hidden="true"
              className="download-app-phone download-app-phone-right"
              loading="lazy"
              decoding="async"
              whileHover={{ rotate: 0, y: -5, scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 150, damping: 12 }}
            />
          </div>
        </div>

        <div className="download-app-desktop">
          <MotionDiv
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="download-app-desktop-copy"
          >
            <h2>
              Download the <br />
              <span>Civic</span>
              Centre IAS App Today
            </h2>

            <p>
              Scan the QR code below or search for{' '}
              <strong>"CivicCentreIAS"</strong> on your favourite app store to get
              started.
            </p>

            <div className="download-app-desktop-cta">
              <div className="download-app-qr-card">
                <img
                  src="/assets/QR.svg"
                  alt="CivicCentre IAS QR Code"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="download-app-store-buttons download-app-store-buttons-vertical">
                <a
                  href="https://play.google.com/store/apps/details?id=com.civiccentreias"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="/assets/google-play-badge.svg"
                    alt="Get it on Google Play"
                    loading="lazy"
                    decoding="async"
                  />
                </a>
                <button
                  type="button"
                  className="download-app-store-button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowIosModal(true);
                  }}
                >
                  <img
                    src="/assets/app-store-badge.svg"
                    alt="Download on the App Store"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              </div>
            </div>
          </MotionDiv>

          <MotionDiv
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="download-app-desktop-visual"
          >
            <div className="download-app-desktop-phones">
              <MotionImg
                src="/assets/phone-right.svg"
                alt=""
                aria-hidden="true"
                className="download-app-phone desktop-phone-left"
                loading="lazy"
                decoding="async"
                whileHover={{ rotate: 10, y: -10, scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              />
              <MotionImg
                src="/assets/phone-left.svg"
                alt=""
                aria-hidden="true"
                className="download-app-phone desktop-phone-right"
                loading="lazy"
                decoding="async"
                whileHover={{ rotate: -10, y: -10, scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              />
            </div>
          </MotionDiv>
        </div>
      </div>
      </section>

      {showIosModal && (
        <div className="coming-soon-modal" role="dialog" aria-modal="true">
          <div className="coming-soon-backdrop" onClick={() => setShowIosModal(false)} />
          <div className="coming-soon-dialog">
            <button type="button" className="coming-soon-close" onClick={() => setShowIosModal(false)} aria-label="Close">&times;</button>
            <h3>App Coming Soon</h3>
            <p>iOS version of the app is coming soon. We'll notify you when it's available.</p>
            <div className="coming-soon-actions">
              <button type="button" className="btn-glass" onClick={() => setShowIosModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DownloadAppSection;
