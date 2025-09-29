// src/components/Footer.jsx

import React from 'react';
import { Facebook, Twitter, Instagram } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <h3>CivicCentre IAS</h3>
          <p>
            Your trusted partner in the journey to becoming a civil servant.
          </p>
        </div>
        <div>
          <h4>Quick Links</h4>
          <ul>
            <li><a href="#" className="footer-link">About Us</a></li>
            <li><a href="#" className="footer-link">Courses</a></li>
            <li><a href="#" className="footer-link">Contact</a></li>
            <li><a href="#" className="footer-link">Privacy Policy</a></li>
          </ul>
        </div>
        <div>
          <h4>Contact Us</h4>
          <p>123, UPSC Lane, New Delhi</p>
          <p>contact@civiccentre.com</p>
        </div>
        <div>
          <h4>Follow Us</h4>
          <div className="footer-social">
            <a href="#" className="footer-social-link"><Facebook size={24} /></a>
            <a href="#" className="footer-social-link"><Twitter size={24} /></a>
            <a href="#" className="footer-social-link"><Instagram size={24} /></a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} CivicCentre IAS. All Rights Reserved.
      </div>
    </footer>
  );
};

export default Footer;
