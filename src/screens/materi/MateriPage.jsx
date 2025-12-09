import React, { useEffect, useState } from 'react';
import './materipage.css';
import Sidebar from '../sidebar/Sidebar';
import ProfileBar from '../profilebar/ProfileBar';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusFilter from './components/StatusFilter';

// Mapping gambar berdasarkan tipe (for fallback)
const typeImageMap = {
  Course: "/images/course_thumb.png",
  Workshop: "/images/workshop_thumb.png",
  Seminar: "/images/seminar_thumb.png",
  Competition: "/images/competition_thumb.png"
};

const MateriPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [enrolledPrograms, setEnrolledPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'in progress', 'completed'

  useEffect(() => {
    const fetchEnrolledPrograms = async () => {
      if (!user || !user.sub) {
        setLoading(false);
        setError("User not logged in.");
        return;
      }

      try {
        setLoading(true);

        let statusParams;
        if (statusFilter === 'all') {
          statusParams = ['in progress', 'completed'];
        } else {
          statusParams = [statusFilter];
        }

        const response = await api.get(`/enrollments`, {
          params: {
            userId: user.sub,
            limit: 100, // Fetch a large number of enrolled programs
            status: statusParams,
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
        const enrolled = response.data.data.enrollments;
        setEnrolledPrograms(enrolled);
        setError(null);
      } catch (err) {
        setError("Failed to load enrolled programs. Please try again.");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledPrograms();
  }, [user, statusFilter]); // Refetch when user or statusFilter changes

  const handleNavigateToDetail = (programId) => {
    navigate(`/materi/detail/${programId}`);
  };

  const getProgramImage = (program) => {
    return program && program.programThumbnailUrl ? program.programThumbnailUrl : (typeImageMap[program.programType] || "/images/default.png");
  };

  const renderContent = () => {
    if (loading) {
      return <p style={{ color: 'white' }}>Loading your programs...</p>;
    }

    if (error) {
      return <p style={{ color: 'red' }}>Error: {error}</p>;
    }

    if (enrolledPrograms.length === 0) {
      return <p style={{ color: 'white' }}>Anda belum terdaftar di program manapun.</p>;
    }

    return (
      <div className="materi-grid">
        {enrolledPrograms.map(program => (
          <div className="materi-card" key={program.id} onClick={() => handleNavigateToDetail(program.programId)}>
            <img
              src={getProgramImage(program)}
              alt={program.programTitle}
              className="materi-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = typeImageMap[program.programType] || "/images/default.png";
              }}
            />
            <div className="materi-content">
              <h3>{program.programTitle}</h3>
              <p>Jenis: {program.programType}</p>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar" 
                  style={{ width: `${parseFloat(program.progressPercentage).toFixed(0)}%` }}
                ></div>
              </div>
              <p>Progress: {parseFloat(program.progressPercentage).toFixed(0)}%</p>
              <button className="open-button">
                Continue
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="materi-layout">
      <Sidebar />
      <div className="materi-main">
        <div className="materi-container">
          <h2 className="materi-title">My Learnings</h2>
          <StatusFilter selected={statusFilter} onSelect={setStatusFilter} />
          {renderContent()}
        </div>
      </div>
      <ProfileBar />
    </div>
  );
};

export default MateriPage;