import React, { useEffect, useState } from 'react';
import './certificatespage.css';
import Sidebar from '../sidebar/Sidebar';
import ProfileBar from '../profilebar/ProfileBar';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const CertificateImage = ({ src, alt }) => {
  const [imgSrc, setImgSrc] = useState(src);

  const handleError = () => {
    // Fallback to a generic local image if the provided src fails
    if (imgSrc !== "/images/sertif1.png") {
      setImgSrc("/images/sertif1.png");
    }
  };

  return (
    <img src={imgSrc || "/images/sertif1.png"} alt={alt} className="certificate-image" onError={handleError} />
  );
};

const CertificatesPage = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchCertificates = async (currentPage, isInitialLoad = false) => {
    if (!user || !user.sub) {
      setLoading(false);
      setError("User not logged in.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/certificates', {
        params: {
          userId: user.sub,
          page: currentPage,
          limit: 6, // Fetch 6 certificates per page
          sort: '-issuedAt', // Sort by newest first
        },
      });
      const { data, pagination } = response.data;

      setCertificates(prev => isInitialLoad ? data.certificates : [...prev, ...data.certificates]);
      setHasMore(pagination.currentPage < pagination.totalPages);
      setError(null);
    } catch (err) {
      setError("Failed to load certificates. Please try again.");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCertificates([]); // Clear certificates on user change or initial mount
    setPage(1);
    fetchCertificates(1, true); // Fetch first page on mount or user change
  }, [user]);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchCertificates(nextPage, false);
    }
  };

  const formatDateString = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
  };

  if (loading && certificates.length === 0) {
    return (
      <div className="certificates-layout">
        <Sidebar />
        <div className="certificates-main">
          <div className="certificates-container">
            <h2 className="certificates-title">My Certificates</h2>
            <p>Loading certificates...</p>
          </div>
        </div>
        <ProfileBar />
      </div>
    );
  }

  if (error) {
    return (
      <div className="certificates-layout">
        <Sidebar />
        <div className="certificates-main">
          <div className="certificates-container">
            <h2 className="certificates-title">My Certificates</h2>
            <p style={{ color: 'red' }}>Error: {error}</p>
          </div>
        </div>
        <ProfileBar />
      </div>
    );
  }

  return (
    <div className="certificates-layout">
      <Sidebar />
      <div className="certificates-main">
        <div className="certificates-container">
          <h2 className="certificates-title">My Certificates</h2>
          <div className="certificates-grid">
            {certificates.length > 0 ? (
              certificates.map(cert => (
                <div className="certificate-card" key={cert.id}>
                  <CertificateImage src={cert.programThumbnailUrl} alt={cert.title} />
                  <div className="certificate-content">
                    <h3>{cert.title}</h3>
                    <p>Issued: {formatDateString(cert.issuedAt)}</p>
                    {cert.documentUrl && (
                      <a href={cert.documentUrl} target="_blank" rel="noopener noreferrer" className="download-button">
                        Download
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p>No certificates found.</p>
            )}
          </div>
          {!loading && hasMore && (
            <div className="load-more-container">
              <button onClick={handleLoadMore} className="load-more-btn">Load More</button>
            </div>
          )}
        </div>
      </div>
      <ProfileBar />
    </div>
  );
};

export default CertificatesPage;
