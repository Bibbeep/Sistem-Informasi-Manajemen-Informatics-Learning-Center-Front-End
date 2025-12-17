import React, { useEffect, useState } from 'react';
import './coursecards.css';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const CourseCards = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [enrolledPrograms, setEnrolledPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEnrolledPrograms = async () => {
      if (!user || !user.sub) {
        setLoading(false);
        setError("User not logged in.");
        return;
      }

      try {
        const response = await api.get('/enrollments', {
          params: { 
            userId: user.sub, 
            limit: 4, 
            sort: '-updatedAt', 
            status: ['in progress', 'completed'] 
          },
          paramsSerializer: params => {
            const parts = [];
            for (const key in params) {
              const value = params[key];
              if (Array.isArray(value)) {
                for (const v of value) {
                  parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
                }
              } else {
                parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
              }
            }
            return parts.join('&');
          }
        });
        setEnrolledPrograms(response.data.data.enrollments);
        setError(null);
      } catch (err) {
        setError("Failed to load enrolled programs.");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledPrograms();
  }, [user]);

  const handleCardClick = (programId) => {
    navigate(`/materi/detail/${programId}`);
  };

  if (loading) {
    return <div className="course-cards"><p>Loading enrolled programs...</p></div>;
  }

  if (error) {
    return <div className="course-cards"><p style={{ color: 'red' }}>Error: {error}</p></div>;
  }

  if (enrolledPrograms.length === 0) {
    return <div className="course-cards"><p>Tidak ada materi terbaru.</p></div>;
  }

  return (
    <div className="course-cards">
      <div className="course-cards-header">
        <h3>My Learnings</h3>
        <button className="see-more-btn" onClick={() => navigate('/materi')}>See More</button>
      </div>
      <div className="cards-container">
        {enrolledPrograms.map(program => (
          <div
            key={program.id}
            className="card"
            onClick={() => handleCardClick(program.programId)}
            style={{ cursor: 'pointer' }}
          >
            <h4>{program.programTitle}</h4>
            <div className="progress-bar-container">
              <div
                className="progress-fill"
                style={{ width: `${parseFloat(program.progressPercentage).toFixed(0)}%` }}
              ></div>
            </div>
            <p>{parseFloat(program.progressPercentage).toFixed(0)}%</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseCards;
