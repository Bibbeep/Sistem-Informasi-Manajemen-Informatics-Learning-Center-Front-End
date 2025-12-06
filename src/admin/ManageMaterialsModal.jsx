import React, { useState, useEffect, useCallback } from 'react';
import './admin.css';
import api from '../services/api';
import { toast } from 'react-toastify';

const ManageMaterialsModal = ({ onClose, programId, moduleId }) => {
  const [materialUrl, setMaterialUrl] = useState(null); // Changed from materials array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/programs/${programId}/modules/${moduleId}`);
      setMaterialUrl(response.data.data.module.materialUrl || null); // Set single URL
    } catch (err) {
      console.error('Failed to fetch materials:', err);
      setError('Gagal memuat materi.');
      toast.error('Gagal memuat materi.');
    } finally {
      setLoading(false);
    }
  }, [programId, moduleId]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Pilih file untuk diunggah.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('material', file);

    try {
      await api.put(`/programs/${programId}/modules/${moduleId}/materials`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success("Materi berhasil diunggah.");
      fetchMaterials(); // Refresh list
      setFile(null); // Reset file input
    } catch (err) {
      console.error("Failed to upload material:", err);
      toast.error("Gagal mengunggah materi.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Kelola Materi Modul</h2>
        <div className="materials-list">
          {loading ? (
            <p>Memuat materi...</p>
          ) : error ? (
            <p style={{ color: 'red' }}>{error}</p>
          ) : materialUrl ? (
            <div className="material-item">
              <a href={materialUrl} target="_blank" rel="noreferrer">Lihat Materi Saat Ini</a>
            </div>
          ) : (
            <p>Belum ada materi untuk modul ini.</p>
          )}
        </div>

        <div className="upload-section">
          <h3>Unggah atau Ganti Materi</h3>
          <input type="file" onChange={handleFileChange} />
          <button className="admin-btn add upload-btn" onClick={handleUpload} disabled={uploading}>
            {uploading ? 'Mengunggah...' : 'Unggah'}
          </button>
        </div>

        <div className="modal-actions">
          <button type="button" className="admin-btn delete" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageMaterialsModal;
