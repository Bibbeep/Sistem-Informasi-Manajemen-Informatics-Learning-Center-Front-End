import React, { useState, useEffect } from 'react';
import './admin.css';
import api from '../services/api';
import { toast, ToastContainer } from 'react-toastify'; // Import ToastContainer
import './modals.css';

const AddForumModal = ({ onClose, onSave, defaultData }) => {
  const [formData, setFormData] = useState({
    title: '',
    mainContent: '', // Renamed from content
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (defaultData) {
      setFormData({
        title: defaultData.title || '',
        mainContent: defaultData.mainContent || '', // Renamed from content
      });
    } else {
      setFormData({
        title: '',
        mainContent: '',
      });
    }
  }, [defaultData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const discussionData = {
      title: formData.title,
      mainContent: formData.mainContent, // Always include mainContent
    };

    try {
      if (defaultData) {
        // For update, only send changed fields
        const changedData = {};
        if (formData.title !== defaultData.title) changedData.title = formData.title;
        if (formData.mainContent !== defaultData.mainContent) changedData.mainContent = formData.mainContent;

        if (Object.keys(changedData).length > 0) {
          await api.patch(`/discussions/${defaultData.id}`, changedData);
          toast.success("Forum berhasil diperbarui.");
        } else {
          toast.info("Tidak ada perubahan untuk disimpan.");
        }
      } else {
        await api.post('/discussions', discussionData);
        toast.success("Forum berhasil ditambahkan.");
      }
      onSave(); // Refresh the list
      onClose();
    } catch (err) {
      console.error("Failed to save forum:", err);
      toast.error(err.response?.data?.message || "Gagal menyimpan forum.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>{defaultData ? 'Edit Forum' : 'Tambah Forum Baru'}</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>Judul Forum</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="input-text"
          />

          <label>Konten Forum</label>
          <textarea
            name="mainContent" // Renamed from content
            value={formData.mainContent}
            onChange={handleChange}
            placeholder="Tulis konten forum..."
            required
            className="form-textarea scroll-hidden"
            rows="5"
          />

          <div className="modal-actions">
            <button type="submit" className="admin-btn add" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button
              type="button"
              className="admin-btn delete"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </button>
          </div>
        </form>
      </div>
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default AddForumModal;
