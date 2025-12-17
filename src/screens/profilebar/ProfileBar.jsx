import React from 'react';
// import { NavLink } from 'react-router-dom';
import './profilebar.css';
import UserProfile from './components/UserProfile';
import Calendar from './components/Calendar';


const ProfileBar = () => {
  return (
    <div className="profilebar">
      <nav className="profilebar-nav">

        <UserProfile />
        <Calendar />
        
      </nav>
    </div>
  );
};

export default ProfileBar;