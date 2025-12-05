import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './certificatebox.css';

const CertificateThumbnail = ({ src, alt }) => {
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src); // Reset image src if the prop changes
  }, [src]);

  const handleError = () => {
    if (imgSrc !== "/images/sertif1.png") {
      setImgSrc("/images/sertif1.png"); // Fallback to default local image
    }
  };

  return (
    <img src={imgSrc || "/images/sertif1.png"} alt={alt} onError={handleError} />
  );
};

const CertificateBox = ({ certificates, loading, error }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);

  const handleCardClick = (cert) => {
    setSelectedCert(cert);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCert(null);
  };

  if (loading) {
    return (
      <div className="certificate-box">
        <div className="certificate-box-content">
          <h3>My Certificates</h3>
          <p>Loading certificates...</p>
        </div>
        <div className="certificate-box-icon">🎓</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="certificate-box">
        <div className="certificate-box-content">
          <h3>My Certificates</h3>
          <p style={{ color: 'red' }}>Error: {error}</p>
        </div>
        <div className="certificate-box-icon">🎓</div>
      </div>
    );
  }

  return (
    <>
      <div className="certificate-box" onClick={() => navigate('/certificates')}>
        <div className="certificate-box-content">
          <h3>My Certificates</h3>
          <div className="certificate-card-preview-container">
            {certificates.length > 0 ? (
              certificates.map(cert => (
                <div 
                  className="certificate-card-preview" 
                  key={cert.id} 
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent navigating to /certificates
                    handleCardClick(cert);
                  }}
                >
                  <CertificateThumbnail src={cert.programThumbnailUrl} alt={cert.title} />
                  <div className="certificate-card-preview-text">
                    <span>{cert.title}</span>
                  </div>
                </div>
              ))
            ) : (
              <p>No certificates found.</p>
            )}
          </div>
        </div>
        <div className="certificate-box-icon">🎓</div>
      </div>

      {showModal && selectedCert && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box certificate-modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>{selectedCert.title}</h3>
            {selectedCert.documentUrl ? (
              <iframe src={selectedCert.documentUrl} width="100%" height="100%" style={{border: 'none'}} title={selectedCert.title}></iframe>
            ) : (
              <p>No document available for this certificate.</p>
            )}
            <div className="modal-buttons" style={{justifyContent: 'center'}}>
              <button className="close" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CertificateBox;
