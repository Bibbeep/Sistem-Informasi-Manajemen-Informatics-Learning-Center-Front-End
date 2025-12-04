import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FaHome, FaBook, FaComments,
  FaMoneyBill, FaSignOutAlt
} from 'react-icons/fa';
import './sidebar.css';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <img src="/images/logo.png" alt="ILC Logo" className="sidebar-logo-img" />
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-main-links">
          <NavLink to="/dashboard" className="nav-item" activeclassname="active">
            <FaHome /> Dashboard
          </NavLink>
          <NavLink to="/programs" className="nav-item" activeclassname="active">
            <FaBook /> Programs
          </NavLink>
          <NavLink to="/forum" className="nav-item" activeclassname="active">
            <FaComments /> Forum
          </NavLink>
          <NavLink to="/payment" className="nav-item" activeclassname="active">
            <FaMoneyBill /> Payments
          </NavLink>
        </div>
        
        <div className="sidebar-logout">
          <NavLink to="/login" onClick={handleLogout} className="nav-item" activeclassname="active">
            <FaSignOutAlt /> Logout
          </NavLink>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
