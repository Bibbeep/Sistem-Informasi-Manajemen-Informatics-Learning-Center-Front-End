import React, { useState, useEffect } from 'react';
import './admin.css';
import api from '../services/api';
import { toast } from 'react-toastify';

const AddCertificateModal = ({ onClose, onSave, defaultData }) => {
  const [formData, setFormData] = useState({
    title: '',
    enrollmentId: '',
  });

  useEffect(() => {
    if (defaultData) {
      setFormData({
        title: defaultData.title || '',
        enrollmentId: defaultData.enrollmentId || '',
      });
    } else {
      setFormData({
        title: '',
        enrollmentId: '',
      });
    }
  }, [defaultData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const certificateData = {
      title: formData.title,
      enrollmentId: Number(formData.enrollmentId),
    };

    try {
      if (defaultData) {
        await api.patch(`/certificates/${defaultData.id}`, { title: certificateData.title });
        toast.success("Sertifikat berhasil diperbarui.");
      } else {
        await api.post('/certificates', certificateData);
        toast.success("Sertifikat berhasil ditambahkan.");
      }
      onSave();
      onClose();
    } catch (err) {
      console.error("Failed to save certificate:", err);
      toast.error(err.response?.data?.message || "Gagal menyimpan sertifikat.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{defaultData ? 'Update Sertifikat' : 'Tambah Sertifikat Baru'}</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>Nama Sertifikat</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="input-text"
          />

          <label>Enrollment ID</label>
          <input
            type="number"
            name="enrollmentId"
            value={formData.enrollmentId}
            onChange={handleChange}
            required
            className="input-text"
            disabled={!!defaultData} // Disable when editing
          />

          <div className="modal-actions">
            <button type="submit" className="admin-btn add">
              Simpan
            </button>
            <button type="button" className="admin-btn delete" onClick={onClose}>
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCertificateModal;
