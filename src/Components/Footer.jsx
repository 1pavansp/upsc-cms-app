import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  Youtube as YoutubeIcon,
} from 'lucide-react';
import './Footer.css';

const EXTERNAL_BASE_URL = 'https://www.examottcc.in';

const FooterSection = () => {
  const [openSection, setOpenSection] = useState(null);
  const [showIosModal, setShowIosModal] = useState(false);

  const toggleSection = (section) => {
    setOpenSection((current) => (current === section ? null : section));
  };

  const sections = [
    {
      title: 'Company',
      items: [
        { label: 'About Us', href: `${EXTERNAL_BASE_URL}/#why-civic-centre` },
        { label: 'Contact Us', href: `${EXTERNAL_BASE_URL}/#cta` },
        { label: 'Careers', href: `${EXTERNAL_BASE_URL}/#team` },
        { label: 'Updates', href: `${EXTERNAL_BASE_URL}/#announce` },
      ],
    },
    {
      title: 'Exams',
      items: [
        { label: 'UPSC', href: `${EXTERNAL_BASE_URL}/#popular-courses` },
        { label: 'TSPSC', href: `${EXTERNAL_BASE_URL}/#popular-courses` },
        { label: 'APPSC', href: `${EXTERNAL_BASE_URL}/#popular-courses` },
      ],
    },
    {
      title: 'Popular Courses',
      items: [
        { label: 'Classes', href: `${EXTERNAL_BASE_URL}/#popular-courses` },
        { label: 'Tests', href: `${EXTERNAL_BASE_URL}/#popular-courses` },
        { label: 'Materials', href: `${EXTERNAL_BASE_URL}/#materials` },
        { label: 'Career Guide', href: `${EXTERNAL_BASE_URL}/#cta` },
      ],
    },
    {
      title: 'Downloads',
      items: [
        { label: 'PYQs', href: `${EXTERNAL_BASE_URL}/#free-library` },
        { label: 'Current Affairs', href: `${EXTERNAL_BASE_URL}/#free-library` },
      ],
    },
    {
      title: 'Connect With Us',
      items: [
        { label: '70134 95019 (Hyd)', href: 'tel:7013495019' },
        { label: '79955 49537 (Vizag)', href: 'tel:7995549537' },
        { label: 'civiccentre.in@gmail.com', href: 'mailto:civiccentre.in@gmail.com' },
        { label: 'Live Chat', href: `${EXTERNAL_BASE_URL}/#cta` },
      ],
    },
  ];

  const socialLinks = [
    {
      label: 'Facebook',
      href: 'https://facebook.com/civiccentre.in',
      icon: FacebookIcon,
    },
    {
      label: 'Instagram',
      href: 'https://www.instagram.com/civiccentre_ias_academy',
      icon: InstagramIcon,
    },
    {
      label: 'Youtube',
      href: 'https://youtube.com/@civiccentreiasacademy',
      icon: YoutubeIcon,
    },
  ];

  const storeBadges = [
    {
      label: 'Google Play',
      // Updated to point to the provided ExamOTT app id
      href: 'https://play.google.com/store/apps/details?id=com.examott.app&pcampaignid=web_share',
      imageSrc: '/assets/google-play-badge.svg',
      imageAlt: 'Get it on Google Play',
    },
    {
      label: 'App Store',
      // iOS app not yet available — we'll show a coming soon message on click
      href: '#',
      imageSrc: '/assets/app-store-badge.svg',
      imageAlt: 'Download on the App Store',
    },
  ];

  return (
    <footer className="footer-section">
      <div className="footer-inner">
        <div className="footer-desktop-grid">
          {sections.map((section) => (
            <div key={section.title} className="footer-desktop-column">
              <h3 className="footer-heading">{section.title}</h3>
              <ul className="footer-list">
                {section.items.map((item) => {
                  const isExternal = item.href.startsWith('http');
                  return (
                    <li key={item.label}>
                      <a
                        className="footer-link"
                        href={item.href}
                        {...(isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
                      >
                        {item.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-accordion">
          {sections.map((section) => (
            <div key={section.title} className="footer-accordion-item">
              <button
                type="button"
                className="footer-accordion-button"
                onClick={() => toggleSection(section.title)}
              >
                <span>{section.title}</span>
                {openSection === section.title ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </button>
              {openSection === section.title && (
                <ul className="footer-accordion-list">
                  {section.items.map((item) => {
                    const isExternal = item.href.startsWith('http');
                    return (
                      <li key={item.label}>
                        <a
                          className="footer-link"
                          href={item.href}
                          {...(isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
                        >
                          {item.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="footer-lower-grid">
          <div className="footer-lower-column">
            <h4 className="footer-subheading">Quick Links</h4>
            <ul className="footer-list">
              <li>
                <a
                  className="footer-link"
                  href={`${EXTERNAL_BASE_URL}/`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Website
                </a>
              </li>
              <li>
                <a
                  className="footer-link"
                  href="https://t.me/civiccentredotin"
                  target="_blank"
                  rel="noreferrer"
                >
                  Telegram
                </a>
              </li>
              <li>
                <a
                  className="footer-link"
                  href="https://youtube.civiccentre.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  Youtube
                </a>
              </li>
              <li>
                <a
                  className="footer-link"
                  href="https://store.civiccentre.in"
                  target="_blank"
                  rel="noreferrer"
                >
                  Store
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-lower-column">
            <p className="footer-subheading">Let's Get Social</p>
            <div className="footer-social-links">
              {socialLinks.map((socialLink) => (
                <a
                  key={socialLink.label}
                  href={socialLink.href}
                  target="_blank"
                  rel="noreferrer"
                  className="footer-social-anchor"
                  aria-label={socialLink.label}
                >
                  {React.createElement(socialLink.icon, { size: 18 })}
                </a>
              ))}
            </div>
          </div>

          <div className="footer-lower-column">
            <h4 className="footer-subheading">Our Centers</h4>
            <p className="footer-center-heading">
              1. Ashok Nagar - Hyderabad
            </p>
            <p className="footer-center-copy">
              Groups Bhavan, Ground Floor, Ashok Nagar Cross Roads, Hyderabad,
              Telangana 500020
            </p>
            <p className="footer-center-copy">
              Indus Bhavan, Ashok Nagar Cross Roads, Hyderabad, Telangana
              500020
            </p>
            <p className="footer-center-heading footer-center-heading--spaced">
              2. Vizag
            </p>
            <p className="footer-center-copy">
              VUDA Complex, Ground Floor, MVP Main Rd, Sector 7, MVP Colony,
              Visakhapatnam, Andhra Pradesh 530017
            </p>
          </div>
        </div>

        <div className="footer-divider" />

        <div className="footer-brand-block">
          <div className="footer-brand">
            <img
              src="/assets/logo.png"
              alt="CivicCentre IAS logo"
              className="footer-brand-logo"
              loading="lazy"
              decoding="async"
            />
            <p className="footer-brand-copy">
              We understand that every student has unique needs and abilities,
              that's why our curriculum is designed to adapt.
            </p>
          </div>
          <div className="footer-app-links">
            {storeBadges.map((badge) => (
              badge.label === 'App Store' ? (
                <button
                  key={badge.label}
                  type="button"
                  className="footer-app-button"
                  onClick={() => setShowIosModal(true)}
                >
                  <img
                    src={badge.imageSrc}
                    alt={badge.imageAlt}
                    className="footer-app-badge"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ) : (
                <a
                  key={badge.label}
                  className="footer-app-button"
                  href={badge.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    src={badge.imageSrc}
                    alt={badge.imageAlt}
                    className="footer-app-badge"
                    loading="lazy"
                    decoding="async"
                  />
                </a>
              )
            ))}
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} CivicCentre IAS. All Rights Reserved.
      </div>
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
    </footer>
  );
};

export default FooterSection;
