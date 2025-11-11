import React, { useState } from 'react';
import { Menu, X, ChevronDown, ChevronUp } from 'lucide-react';
import './Navbar.css';

const EXAM_OTT_BASE_URL = 'https://www.examottcc.in';

const PRIMARY_LINKS = [
  { label: 'UPSC', href: `${EXAM_OTT_BASE_URL}/#popular-courses` },
  { label: 'TSPSC', href: `${EXAM_OTT_BASE_URL}/#popular-courses` },
  { label: 'APPSC', href: `${EXAM_OTT_BASE_URL}/#popular-courses` },
  { label: 'Materials', href: `${EXAM_OTT_BASE_URL}/#materials` },
  // Added International and National links to navigate to Home's Current Affairs section
  { label: 'International', href: '/#current-affairs' },
  { label: 'National', href: '/#current-affairs' }
];

const MORE_LINKS = [
  { label: 'Testimonials', href: `${EXAM_OTT_BASE_URL}/#testimonials` },
  { label: 'Why Civic Centre', href: `${EXAM_OTT_BASE_URL}/#why-civic-centre` },
  { label: 'Our Team', href: `${EXAM_OTT_BASE_URL}/#team` }
];

const Navbar = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isDesktopDropdownOpen, setIsDesktopDropdownOpen] = useState(false);
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);

  const closeMobileNav = () => {
    setIsMobileNavOpen(false);
    setIsMobileDropdownOpen(false);
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <a href={`${EXAM_OTT_BASE_URL}/`} className="navbar-brand">
          <img src="/assets/logo.png" alt="ExamOTT logo" />
          <span></span>
        </a>

        <nav className="navbar-menu">
          {PRIMARY_LINKS.map((item) => (
            <a key={item.label} href={item.href} className="navbar-link">
              {item.label}
            </a>
          ))}

          <div className="navbar-dropdown">
            <button
              type="button"
              className="navbar-dropdown-toggle"
              aria-expanded={isDesktopDropdownOpen}
              onClick={() => setIsDesktopDropdownOpen((open) => !open)}
            >
              <span>More</span>
              {isDesktopDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {isDesktopDropdownOpen && (
              <div className="navbar-dropdown-menu">
                {MORE_LINKS.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="navbar-dropdown-link"
                    onClick={() => setIsDesktopDropdownOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="navbar-actions">
          <a href={`${EXAM_OTT_BASE_URL}/dashboard`} className="navbar-button">
            Login
          </a>
        </div>

        <button
          type="button"
          className="navbar-mobile-toggle"
          aria-label="Toggle menu"
          onClick={() => setIsMobileNavOpen((open) => !open)}
        >
          {isMobileNavOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {isMobileNavOpen && (
        <div className="navbar-mobile-menu" onClick={closeMobileNav} role="dialog" aria-modal="true">
          <div
            className="navbar-mobile-panel"
            onClick={(event) => event.stopPropagation()}
            role="menu"
          >
            <div className="navbar-brand">
              <img src="/assets/logo.png" alt="ExamOTT logo" />
              <span>CivicCentre IAS</span>
            </div>

            <div className="navbar-mobile-links">
              {PRIMARY_LINKS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="navbar-mobile-link"
                  onClick={closeMobileNav}
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="navbar-mobile-dropdown">
              <button
                type="button"
                className="navbar-mobile-dropdown-toggle"
                aria-expanded={isMobileDropdownOpen}
                onClick={() => setIsMobileDropdownOpen((open) => !open)}
              >
                <span>More</span>
                {isMobileDropdownOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {isMobileDropdownOpen && (
                <div className="navbar-mobile-submenu">
                  {MORE_LINKS.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      className="navbar-mobile-submenu-link"
                      onClick={closeMobileNav}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <a
              href={`${EXAM_OTT_BASE_URL}/dashboard`}
              className="navbar-mobile-button"
              onClick={closeMobileNav}
            >
              Login
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
