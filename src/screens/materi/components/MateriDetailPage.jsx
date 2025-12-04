import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import YouTube from 'react-youtube';
import Sidebar from '../../sidebar/Sidebar';
import ProfileBar from '../../profilebar/ProfileBar';
import api from '../../../services/api';
import './materidetailpage.css';
import { FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';

const extractYoutubeVideoId = (url) => {
  if (!url) return null;
  const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const options = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  return date.toLocaleDateString('id-ID', options);
};

const MateriDetailPage = () => {
  const { id: programId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [program, setProgram] = useState(null);
  const [modules, setModules] = useState([]);
  const [completedModules, setCompletedModules] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrollmentId, setEnrollmentId] = useState(null);
  const [moduleInteractions, setModuleInteractions] = useState({});

  useEffect(() => {
    if (!programId || !user) {
      setLoading(false);
      return;
    }

    const fetchProgramData = async () => {
      try {
        setLoading(true);
        const programRes = await api.get(`/programs/${programId}`);
        const programData = programRes.data.data.program;
        setProgram(programData);

        if (programData.type === 'Course') {
          const enrollmentRes = await api.get('/enrollments', { params: { programId, userId: user.sub } });
          const enrollment = enrollmentRes.data.data.enrollments[0];

          if (enrollment) {
            setEnrollmentId(enrollment.id);
            const enrollmentDetailRes = await api.get(`/enrollments/${enrollment.id}`);
            const enrollmentDetails = enrollmentDetailRes.data.data.enrollment;
            if (enrollmentDetails.completedModules) {
              setCompletedModules(new Set(enrollmentDetails.completedModules.map(m => m.courseModuleId)));
            }

            const modulesRes = await api.get(`/programs/${programId}/modules`);
            setModules(modulesRes.data.data.modules);
          } else {
            setError("You are not enrolled in this course.");
          }
        }
      } catch (err) {
        setError("Failed to load program details.");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgramData();
  }, [programId, user]);

  const checkAndCompleteModule = async (moduleId, isVideo, isMaterial) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module || !enrollmentId || completedModules.has(moduleId)) return;
    
    // Use the latest interaction state directly
    const interaction = moduleInteractions[moduleId] || {};
    const videoWatched = isVideo || interaction.videoWatched;
    const materialClicked = isMaterial || interaction.materialClicked;

    const videoConditionMet = !module.youtubeUrl || videoWatched;
    const materialConditionMet = !module.materialUrl || materialClicked;

    if (videoConditionMet && materialConditionMet) {
      try {
        await api.post(`/enrollments/${enrollmentId}/completed-modules`, { courseModuleId: moduleId });
        setCompletedModules(prev => new Set(prev).add(moduleId));
      } catch (err) {
        console.error(`Failed to mark module ${moduleId} as complete.`, err);
      }
    }
  };

  const handleVideoEnd = (moduleId) => {
    setModuleInteractions(prev => ({...prev, [moduleId]: { ...prev[moduleId], videoWatched: true }}));
    checkAndCompleteModule(moduleId, true, false);
  };

  const handleMaterialClick = (moduleId) => {
    setModuleInteractions(prev => ({...prev, [moduleId]: { ...prev[moduleId], materialClicked: true }}));
    checkAndCompleteModule(moduleId, false, true);
  };

  const renderModuleContent = () => {
    if (modules.length === 0) return <p style={{ color: "#ccc" }}>Belum ada modul untuk program ini.</p>;

    return modules.map((modul) => {
      const isCompleted = completedModules.has(modul.id);
      const videoId = extractYoutubeVideoId(modul.youtubeUrl);

      return (
        <details key={modul.id} className="modul-dropdown">
          <summary>
            {`Modul ${modul.numberCode}: ${modul.title || 'Module Details'}`}
            {isCompleted && <FaCheckCircle className="completed-icon" />}
          </summary>
          <div className="modul-content">
            {videoId && (
              <div className="youtube-embed">
                <YouTube
                  videoId={videoId}
                  onEnd={() => handleVideoEnd(modul.id)}
                  opts={{ width: '100%', height: '100%' }}
                />
              </div>
            )}
            {modul.materialUrl && (
              <div className="material-link">
                <a href={modul.materialUrl} target="_blank" rel="noopener noreferrer" onClick={() => handleMaterialClick(modul.id)}>
                  Download Materi
                </a>
              </div>
            )}
          </div>
        </details>
      );
    });
  };
  
  const renderProgramSpecificDetails = () => {
    if (!program || !program.details) return null;
    const { details } = program;
    switch (program.type) {
      case 'Seminar':
        return (
          <div className="program-specific-details">
            <p><strong>Pembicara:</strong> {details.speakerNames?.join(', ') || 'N/A'}</p>
            <p><strong>Lokasi:</strong> {details.isOnline ? <a href={details.videoConferenceUrl} target="_blank" rel="noopener noreferrer">Online</a> : details.locationAddress || 'N/A'}</p>
          </div>
        );
      case 'Workshop':
        return (
          <div className="program-specific-details">
            <p><strong>Fasilitator:</strong> {details.facilitatorNames?.join(', ') || 'N/A'}</p>
            <p><strong>Lokasi:</strong> {details.isOnline ? <a href={details.videoConferenceUrl} target="_blank" rel="noopener noreferrer">Online</a> : details.locationAddress || 'N/A'}</p>
          </div>
        );
      case 'Competition':
        return (
          <div className="program-specific-details">
            <p><strong>Host:</strong> {details.hostName || 'N/A'}</p>
            <p><strong>Total Hadiah:</strong> Rp {details.totalPrize?.toLocaleString('id-ID') || '0'}</p>
            <p><strong>Lokasi:</strong> {details.isOnline ? 'Online' : details.locationAddress || 'N/A'}</p>
            {details.contestRoomUrl && <p><strong>Ruang Lomba:</strong> <a href={details.contestRoomUrl} target="_blank" rel="noopener noreferrer">Link Lomba</a></p>}
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="materi-detail-layout">
      <Sidebar />
      <div className="materi-detail-main">
        <div className="materi-header">
          <h2 className="materi-detail-title">{program?.title || 'Loading Program...'}</h2>
          <button className="back-button" onClick={() => navigate(-1)}>Back</button>
        </div>
        <div className="program-meta-details">
          <p><strong>Jenis Program:</strong> {program?.type}</p>
          <p><strong>Tanggal:</strong> {formatDate(program?.availableDate)}</p>
          {renderProgramSpecificDetails()}
        </div>
        <div className="materi-detail-modules">
          {loading ? (
            <p style={{ color: "#ccc" }}>Loading modules...</p>
          ) : error ? (
            <p style={{ color: "red" }}>{error}</p>
          ) : program?.type === 'Course' ? (
            renderModuleContent()
          ) : (
            <p style={{ color: "#ccc" }}>Program ini tidak memiliki modul materi.</p>
          )}
        </div>
      </div>
      <ProfileBar />
    </div>
  );
};

export default MateriDetailPage;