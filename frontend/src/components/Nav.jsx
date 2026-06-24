import React, { useEffect, useRef, useState } from 'react';
import { useLocation, NavLink, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import './Nav.css';

export default function Nav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHomePage = location.pathname === '/';
  const headerClass = `top-header ${(isScrolled || !isHomePage) ? 'scrolled' : ''}`;

  return (
    <>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className={headerClass}>
        
        <nav className="nav-left-links">
          <NavLink to="/" className="nav-item">Home</NavLink>
          <NavLink to="/planner" className="nav-item">Planner</NavLink>
          <NavLink to="/my-itineraries" className="nav-item">Itineraries</NavLink>
        </nav>

        <div className="brand-center" onClick={() => navigate("/")}>
          TRIPSYNC
        </div>

        <div className="nav-right">
          <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 12H20M4 6H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

      </div>
    </>
  );
}