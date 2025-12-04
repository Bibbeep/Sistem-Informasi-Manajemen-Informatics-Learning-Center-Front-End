import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../sidebar/Sidebar';
import ProfileBar from '../../profilebar/ProfileBar';
import api from '../../../services/api';
import './materidetailpage.css';

const extractYoutubeVideoId = (url) => {
  if (!url) return null;
  const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const getYoutubeEmbedUrl = (url) => {
  const videoId = extractYoutubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const options = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  return date.toLocaleDateString('id-ID', options);
};

const MateriDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setError("Program ID not found.");
      setLoading(false);
      return;
    }

    const fetchProgramDetails = async () => {
      try {
        setLoading(true);
        const programRes = await api.get(`/programs/${id}`);
        const programData = programRes.data.data.program;
        setProgram(programData);

        if (programData.type === 'Course') {
          const modulesRes = await api.get(`/programs/${id}/modules`);
          setModules(modulesRes.data.data.modules);
        }
      } catch (err) {
        setError("Failed to load program details.");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgramDetails();
  }, [id]);

  const renderModuleContent = () => {
    if (modules.length === 0) {
      return <p style={{ color: "#ccc" }}>Belum ada modul untuk program ini.</p>;
    }
    return modules.map((modul) => (
      <details key={modul.id} className="modul-dropdown">
        <summary>{`Modul ${modul.numberCode}: ${modul.title || 'Module Details'}`}</summary>
        <div className="modul-content">
          {modul.youtubeUrl && getYoutubeEmbedUrl(modul.youtubeUrl) && (
            <div className="youtube-embed">
              <iframe
                width="100%"
                height="315"
                src={getYoutubeEmbedUrl(modul.youtubeUrl)}
                title="YouTube Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          )}
          {modul.materialUrl && (
            <div className="material-link">
              <a href={modul.materialUrl} target="_blank" rel="noopener noreferrer">
                Download Materi
              </a>
            </div>
          )}
        </div>
      </details>
    ));
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
          <h2 className="materi-detail-title">
            {program?.title || 'Loading Program...'}
          </h2>
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