import React from 'react';
import './statusfilter.css';

const StatusFilter = ({ selected, onSelect }) => {
  const filters = ['all', 'in progress', 'completed'];

  return (
    <div className="status-filter-container">
      {filters.map(filter => (
        <button
          key={filter}
          className={`status-filter-button ${selected === filter ? 'active' : ''}`}
          onClick={() => onSelect(filter)}
        >
          {filter.charAt(0).toUpperCase() + filter.slice(1)}
        </button>
      ))}
    </div>
  );
};

export default StatusFilter;
