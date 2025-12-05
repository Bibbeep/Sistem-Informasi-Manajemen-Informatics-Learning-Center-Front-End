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
          params: { userId: user.sub, limit: 100, sort: '-updatedAt', status: 'all' }, // Fetch top 5 recently updated
        });
        const allEnrolled = response.data.data.enrollments;
        const filteredEnrolled = allEnrolled.filter(enrollment => 
          enrollment.status.toLowerCase() === 'in progress' || enrollment.status.toLowerCase() === 'completed'
        );
        setEnrolledPrograms(filteredEnrolled);
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
      <div className="cards-container">
        {enrolledPrograms.map(program => (
          <div
            key={program.id}
            className="card"
            onClick={() => handleCardClick(program.programId)}
            style={{ cursor: 'pointer' }}
          >
            <h3>{program.programTitle}</h3>
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
