import React, { useEffect, useState } from 'react';
import './dashboardheader.css';

const DashboardHeader = ({ searchKeyword, onSearchChange, onSearchSubmit }) => {
  const [userName, setUserName] = useState('User');

  useEffect(() => {
    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserName(user.name || 'User');
    }
  }, []);

  return (
    <div className="dashboard-header">
      <div className="greeting">
        <h2>Hi, {userName}</h2>
        <p>Welcome back! Get ready for today’s course</p>
      </div>
      <div className="search-bar-only">
        <form onSubmit={onSearchSubmit}>
          <input
            type="text"
            placeholder="Search for course here"
            value={searchKeyword}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <button type="submit"><i className="fa fa-search"></i></button>
        </form>
      </div>
    </div>
  );
};

DashboardHeader.defaultProps = {
  searchKeyword: '',
  onSearchChange: () => {},
  onSearchSubmit: () => {},
};

export default DashboardHeader;
