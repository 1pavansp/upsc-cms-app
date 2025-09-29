import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import { Menu, X } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  // For now, most links will go to the homepage as placeholders
  // The Sign In button will go to the admin login
  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/" className="navbar-logo-link">CivicCentre IAS</Link>
        </div>
        <nav className="navbar-menu">
          <Link to="/" className="navbar-link">Home</Link>
          <Link to="/courses" className="navbar-link">Courses</Link>
          <Link to="/faculty" className="navbar-link">Faculty</Link>
          <Link to="/blog" className="navbar-link">Blog</Link>
          <Link to="/contact" className="navbar-link">Contact</Link>
        </nav>
        <div className="navbar-actions">
          <Link to="/admin/login">
            <button className="navbar-button">
              Sign In
            </button>
          </Link>
        </div>
        <div className="navbar-mobile-toggle">
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="navbar-mobile-menu">
          <nav>
            <Link to="/" className="navbar-mobile-link" onClick={() => setIsOpen(false)}>Home</Link>
            <Link to="/courses" className="navbar-mobile-link" onClick={() => setIsOpen(false)}>Courses</Link>
            <Link to="/faculty" className="navbar-mobile-link" onClick={() => setIsOpen(false)}>Faculty</Link>
            <Link to="/blog" className="navbar-mobile-link" onClick={() => setIsOpen(false)}>Blog</Link>
            <Link to="/contact" className="navbar-mobile-link" onClick={() => setIsOpen(false)}>Contact</Link>
            <Link to="/admin/login" onClick={() => setIsOpen(false)}>
              <button className="navbar-mobile-button">
                Sign In
              </button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;