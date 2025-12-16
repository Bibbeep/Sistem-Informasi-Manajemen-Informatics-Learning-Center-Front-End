import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import YouTube from 'react-youtube';
import MDEditor from '@uiw/react-md-editor';
import Sidebar from '../../sidebar/Sidebar';
import ProfileBar from '../../profilebar/ProfileBar';
import api from '../../../services/api';
import './materidetailpage.css';
import { FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import { ToastContainer, toast } from 'react-toastify';


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
  const [enrollmentStatus, setEnrollmentStatus] = useState(null); // New state for enrollment status
  const [markAsCompleteLoading, setMarkAsCompleteLoading] = useState(false);
  const [certificateForCompletedProgram, setCertificateForCompletedProgram] = useState(null); // New state for certificate
  const [showCertificateModal, setShowCertificateModal] = useState(false); // New state for certificate modal
  const [markdownContents, setMarkdownContents] = useState({}); // State for markdown contents

  const playerRefs = useRef({}); // Ref to hold YouTube player instances
  const [moduleInteractions, setModuleInteractions] = useState({});

  // Cleanup effect to destroy players on unmount
  useEffect(() => {
    return () => {
      Object.values(playerRefs.current).forEach(player => {
        if (player && typeof player.destroy === 'function') {
          player.destroy();
        }
      });
      playerRefs.current = {}; // Clear refs
    };
  }, []);

  useEffect(() => {
    if (!programId) {
      setError("Program ID not found.");
      setLoading(false);
      return;
    }
    if (!user) {
      setError("Please log in to view this page.");
      setLoading(false);
      return;
    }

    const fetchProgramData = async () => {
      try {
        setLoading(true);
        // Fetch program details
        const programRes = await api.get(`/programs/${programId}`);
        const programData = programRes.data.data.program;
        setProgram(programData);

        // Fetch enrollment details for the current user and program
        const enrollmentListRes = await api.get('/enrollments', { params: { programId, userId: user.sub } });
        const enrollmentSummary = enrollmentListRes.data.data.enrollments[0];

        if (enrollmentSummary) {
          setEnrollmentId(enrollmentSummary.id);
          const currentEnrollmentStatus = enrollmentSummary.status.toLowerCase();
          setEnrollmentStatus(currentEnrollmentStatus); // Set enrollment status in lowercase

          console.log("Program Type:", programData.type);
          console.log("Enrollment Status:", currentEnrollmentStatus);

          // If it's a Course, fetch modules and completed modules
          if (programData.type === 'Course') {
            const enrollmentDetailRes = await api.get(`/enrollments/${enrollmentSummary.id}`);
            const enrollmentDetails = enrollmentDetailRes.data.data.enrollment;
            if (enrollmentDetails.completedModules) {
              setCompletedModules(new Set(enrollmentDetails.completedModules.map(m => m.courseModuleId)));
            }
            const modulesRes = await api.get(`/programs/${programId}/modules`);
            const fetchedModules = modulesRes.data.data.modules;
            setModules(fetchedModules);
            
            // Fetch markdown for each module
            fetchedModules.forEach(mod => {
              if (mod.markdownUrl) {
                fetch(mod.markdownUrl)
                  .then(res => res.text())
                  .then(text => setMarkdownContents(prev => ({ ...prev, [mod.id]: text })))
                  .catch(err => console.error(`Failed to fetch markdown for module ${mod.id}`, err));
              }
            });
          }
          
          // Fetch certificate if program is completed, regardless of type
          if (currentEnrollmentStatus === 'completed') {
            console.log("Attempting to fetch certificate for programId:", programId, "userId:", user.sub);
            const certificateRes = await api.get(`/certificates`, {
                params: { programId: programId, userId: user.sub }
            });
            console.log("Certificate API Response:", certificateRes.data);
            if (certificateRes.data.data.certificates.length > 0) {
                setCertificateForCompletedProgram(certificateRes.data.data.certificates[0]);
                console.log("Certificate found and set:", certificateRes.data.data.certificates[0]);
            } else {
                console.log("No certificate found for this program and user.");
            }
          }
        } else {
          throw new Error("You are not enrolled in this program.");
        }
      } catch (err) {
        setError("Failed to load program details. " + (err.message || ""));
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
        toast.error(`Gagal menandai modul selesai. Mohon coba lagi.`);
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

  const handleMarkAsComplete = async () => {
    if (!enrollmentId) {
      toast.error("Tidak dapat menandai selesai: ID Enrollment tidak ditemukan.");
      return;
    }
    setMarkAsCompleteLoading(true);
    try {
      await api.patch(`/enrollments/${enrollmentId}`, { status: 'Completed' });
      setEnrollmentStatus('completed'); // Update local state
      toast.success("Program berhasil ditandai selesai!");
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Gagal menandai program selesai.";
      toast.error(errorMessage);
      console.error("Error marking program as complete:", err);
    } finally {
      setMarkAsCompleteLoading(false);
    }
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
                  onReady={(event) => (playerRefs.current[modul.id] = event.target)}
                  onEnd={() => handleVideoEnd(modul.id)} // Use onEnd directly
                  opts={{ width: '100%', height: '100%' }}
                />
              </div>
            )}
            <div data-color-mode="light" style={{'padding': '15px'}}>
              {markdownContents[modul.id] && (
                <MDEditor.Markdown source={markdownContents[modul.id]} />
              )}
            </div>
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
    if (!program || !program.details || program.type === 'Course') return null;

    const { details } = program;

    let content;
    switch (program.type) {
      case 'Seminar':
        content = (
          <>
            <p><strong>Pembicara:</strong> {details.speakerNames?.join(', ') || 'N/A'}</p>
            <p><strong>Lokasi:</strong> {details.isOnline ? <a href={details.videoConferenceUrl} target="_blank" rel="noopener noreferrer">Online</a> : details.locationAddress || 'N/A'}</p>
          </>
        );
        break;
      case 'Workshop':
        content = (
          <>
            <p><strong>Fasilitator:</strong> {details.facilitatorNames?.join(', ') || 'N/A'}</p>
            <p><strong>Lokasi:</strong> {details.isOnline ? <a href={details.videoConferenceUrl} target="_blank" rel="noopener noreferrer">Online</a> : details.locationAddress || 'N/A'}</p>
          </>
        );
        break;
      case 'Competition':
        content = (
          <>
            <p><strong>Host:</strong> {details.hostName || 'N/A'}</p>
            <p><strong>Total Hadiah:</strong> Rp {details.totalPrize?.toLocaleString('id-ID') || '0'}</p>
            <p><strong>Lokasi:</strong> {details.isOnline ? 'Online' : details.locationAddress || 'N/A'}</p>
            {details.contestRoomUrl && <p><strong>Ruang Lomba:</strong> <a href={details.contestRoomUrl} target="_blank" rel="noopener noreferrer">Link Lomba</a></p>}
          </>
        );
        break;
      default:
        return null;
    }
    return (
      <div className="program-specific-details">
        <h3>Detail {program.type}</h3>
        {content}
      </div>
    );
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
          <h3>Detail Program</h3>
          <p><strong>Jenis Program:</strong> {program?.type}</p>
          <p><strong>Tanggal:</strong> {formatDate(program?.availableDate)}</p>
        </div>
        {renderProgramSpecificDetails()}

        {enrollmentStatus === 'completed' ? (
             <div className="mark-complete-section">
                {certificateForCompletedProgram ? (
                  <button 
                    onClick={() => setShowCertificateModal(true)} 
                    className="mark-complete-button"
                    style={{ backgroundColor: '#3f72af' }} // Use a different color for certificate button
                  >
                    Lihat Sertifikat
                  </button>
                ) : (
                  <p style={{color: '#22c55e', fontWeight: 'bold'}}>Program ini telah selesai! (Sertifikat tidak ditemukan)</p>
                )}
            </div>
        ) : enrollmentStatus === 'unpaid' ? (
             <div className="mark-complete-section">
                <p style={{color: 'orange', fontWeight: 'bold'}}>Program ini belum dibayar. Mohon selesaikan pembayaran.</p>
            </div>
        ) : (program?.type !== 'Course' && enrollmentStatus !== 'completed') && user?.isAdmin && (
            <div className="mark-complete-section">
                <button 
                    onClick={handleMarkAsComplete} 
                    disabled={markAsCompleteLoading} 
                    className="mark-complete-button"
                >
                    {markAsCompleteLoading ? 'Menandai Selesai...' : 'Tandai Selesai'}
                </button>
            </div>
        )}


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
      <ToastContainer position="top-center" autoClose={3000} />

      {/* Certificate Viewer Modal for Completed Non-Course Programs */}
      {showCertificateModal && certificateForCompletedProgram && (
        <div className="modal-overlay" onClick={() => setShowCertificateModal(false)}>
          <div className="modal-box certificate-viewer-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>Detail Sertifikat</h3>
            <div className="certificate-detail-content">
              <p><strong>Judul Sertifikat:</strong> {certificateForCompletedProgram.title}</p>
              <p><strong>Program:</strong> {certificateForCompletedProgram.programTitle} ({certificateForCompletedProgram.programType})</p>
              <p><strong>Credential ID:</strong> {certificateForCompletedProgram.credential}</p>
              <p><strong>Diterbitkan Pada:</strong> {formatDate(certificateForCompletedProgram.issuedAt)}</p>
              {certificateForCompletedProgram.programType === 'Course' && certificateForCompletedProgram.expiredAt && (
                <p><strong>Kedaluwarsa Pada:</strong> {formatDate(certificateForCompletedProgram.expiredAt)}</p>
              )}
            </div>
            
            <div className="modal-actions" style={{justifyContent: 'center', marginTop: '20px'}}>
              {certificateForCompletedProgram.documentUrl && (
                <a href={certificateForCompletedProgram.documentUrl} target="_blank" rel="noopener noreferrer" className="admin-btn add">
                  Lihat Dokumen
                </a>
              )}
              <button className="admin-btn delete" onClick={() => setShowCertificateModal(false)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MateriDetailPage;
