import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("token");

  const handleAuthAction = () => {
    if (isLoggedIn) {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      navigate("/login");
    } else {
      navigate("/login");
    }
    onClose();
  };

  return (
    <>
      <div 
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`} 
        onClick={onClose}
      />
      
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-title">Menu</span>
          <div className="sidebar-auth-group">
            <button className="sidebar-login-btn" onClick={handleAuthAction}>
              {isLoggedIn ? "Log out" : "Log in"}
            </button>
            {!isLoggedIn && (
              <button className="sidebar-member-btn" onClick={() => { navigate("/login"); onClose(); }}>
                Be a member
              </button>
            )}
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="sidebar-content">
          <p className="sidebar-label">Explore</p>
          <nav className="sidebar-nav">
            <NavLink to="/" className="sidebar-link" onClick={onClose}>Home</NavLink>
            <NavLink to="/planner" className="sidebar-link" onClick={onClose}>Planner</NavLink>
            <NavLink to="/profile" className="sidebar-link" onClick={onClose}>Profile</NavLink>
          </nav>

          <div className="sidebar-secondary-nav">
            <div className="nav-column">
              <span className="nav-column-title">Features</span>
              <NavLink to="/flights" onClick={onClose}>Flights</NavLink>
              <NavLink to="/hotels" onClick={onClose}>Hotels</NavLink>
              <NavLink to="/weather" onClick={onClose}>Weather</NavLink>
            </div>
            <div className="nav-column">
              <span className="nav-column-title">Company</span>
              <a href="#">Blog</a>
              <a href="#">About us</a>
              <a href="#">Careers</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
