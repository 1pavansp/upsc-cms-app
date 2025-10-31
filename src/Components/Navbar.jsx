import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronDown, ChevronUp } from 'lucide-react';
import './Navbar.css';

const PRIMARY_LINKS = [
  { label: 'UPSC', href: '#courses' },
  { label: 'TSPSC', href: '#courses' },
  { label: 'APPSC', href: '#courses' },
  { label: 'Materials', href: '#materials' },
  { label: 'Scholarship Tests', href: '#batches' },
  { label: 'ExamOTT', href: '#courses' }
];

const MORE_LINKS = [
  { label: 'Action', href: '#action3' },
  { label: 'Another action', href: '#action4' },
  { label: 'Something else here', href: '#action5' }
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
        <Link to="/" className="navbar-brand">
          <img src="/assets/logo.svg" alt="ExamOTT logo" />
          <span></span>
        </Link>

        <nav
          className="navbar-menu"
          onMouseEnter={() => setIsDesktopDropdownOpen(true)}
          onMouseLeave={() => setIsDesktopDropdownOpen(false)}
        >
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
          <Link to="/admin/login">
            <button type="button" className="navbar-button">
              Login
            </button>
          </Link>
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
              <img src="/assets/logo.svg" alt="ExamOTT logo" />
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

            <Link to="/admin/login" onClick={closeMobileNav}>
              <button type="button" className="navbar-mobile-button">
                Login
              </button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
