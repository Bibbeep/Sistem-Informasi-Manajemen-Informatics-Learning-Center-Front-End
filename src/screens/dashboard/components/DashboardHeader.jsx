import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './dashboardheader.css';

const DashboardHeader = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('User');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserName(user.name || 'User');
    }
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/programs?q=${encodeURIComponent(keyword)}`);
    }
  };

  return (
    <div className="dashboard-header">
      <div className="greeting">
        <h2>Hi, {userName}</h2>
        <p>Welcome back! Get ready for today’s course</p>
      </div>
      <div className="search-bar-only">
        <form onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Search for course here"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <button type="submit"><i className="fa fa-search"></i></button>
        </form>
      </div>
    </div>
  );
};

DashboardHeader.defaultProps = {}; // Remove unused defaultProps

export default DashboardHeader;

