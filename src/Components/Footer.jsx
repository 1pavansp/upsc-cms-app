import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import {
  Apple,
  ChevronDown,
  ChevronUp,
  Facebook as FacebookIcon,
  Globe,
  Instagram as InstagramIcon,
  Play,
  Youtube as YoutubeIcon,
} from 'lucide-react';
import './Footer.css';

const FooterSection = () => {
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection((current) => (current === section ? null : section));
  };

  const handleCompanyPopup = async (title) => {
    await Swal.fire({
      title: `${title} page coming soon`,
      html: `
        <div style="text-align:left;line-height:1.6">
          <strong>CivicCentre IAS</strong><br/>
          Location: Ashok Nagar, Hyderabad<br/>
          Phone: 70134 95019 (Hyd) | 79955 49537 (Vizag)<br/>
          Email: civiccentre.in@gmail.com<br/><br/>
          <em>India's leading institute for UPSC, TSPSC, and APPSC</em>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Okay',
      confirmButtonColor: '#126ED6',
      backdrop: 'rgba(0,0,0,0.4)',
    });
  };

  const sections = [
    {
      title: 'Company',
      items: ['About Us', 'Contact Us', 'Careers', 'Updates'],
      onClick: (item) => handleCompanyPopup(item),
    },
    {
      title: 'Exams',
      items: ['UPSC', 'TGPSC', 'APSC'],
      onClick: (goal) => navigate(`/courses?goal=${goal}`),
    },
    {
      title: 'Popular Courses',
      items: ['Classes', 'Tests', 'Materials', 'Career Guide'],
    },
    {
      title: 'Downloads',
      items: ['PYQs', 'Current Affairs'],
    },
    {
      title: 'Connect With Us',
      items: [
        '70134 95019 (Hyd)',
        '79955 49537 (Vizag)',
        'civiccentre.in@gmail.com',
        'Live Chat',
      ],
      onClick: (value) => {
        if (value === 'Live Chat') {
          Swal.fire('Chat feature coming soon', '', 'info');
        }
      },
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
      href: '#',
      icon: Play,
      lines: ['Get it on', 'Google Play'],
    },
    {
      label: 'App Store',
      href: '#',
      icon: Apple,
      lines: ['Download on the', 'App Store'],
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
                {section.items.map((item) => (
                  <li key={item}>
                    <button
                      type="button"
                      className="footer-link"
                      onClick={() => section.onClick?.(item)}
                    >
                      {item}
                    </button>
                  </li>
                ))}
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
                  {section.items.map((item) => (
                    <li key={item}>
                      <button
                        type="button"
                        className="footer-link"
                        onClick={() => section.onClick?.(item)}
                      >
                        {item}
                      </button>
                    </li>
                  ))}
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
                  href="https://civiccentre.in"
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
            <div className="footer-brand-mark">CivicCentre IAS</div>
            <p className="footer-brand-copy">
              We understand that every student has unique needs and abilities,
              that's why our curriculum is designed to adapt.
            </p>
          </div>
          <div className="footer-app-links">
            {storeBadges.map((badge) => (
              <a
                key={badge.label}
                className="footer-app-button"
                href={badge.href}
              >
                {React.createElement(badge.icon, { size: 18 })}
                <span className="footer-app-text">
                  <span>{badge.lines[0]}</span>
                  <strong>{badge.lines[1]}</strong>
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} CivicCentre IAS. All Rights Reserved.
      </div>
    </footer>
  );
};

export default FooterSection;
