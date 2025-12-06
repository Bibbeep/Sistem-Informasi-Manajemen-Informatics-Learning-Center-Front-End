import React, { useState, useEffect } from 'react';
import './admin.css';
import api from '../services/api';
import { toast, ToastContainer } from 'react-toastify'; // Import ToastContainer
import './modals.css';

const AddForumModal = ({ onClose, onSave, defaultData }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    programType: 'Course', // Default type
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (defaultData) {
      setFormData({
        title: defaultData.title || '',
        content: defaultData.content || '',
        programType: defaultData.programType || 'Course',
      });
    } else {
      setFormData({
        title: '',
        content: '',
        programType: 'Course',
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
    };

    if (defaultData) {
      discussionData.content = formData.content;
      discussionData.programType = formData.programType;
    }

    try {
      if (defaultData) {
        await api.patch(`/discussions/${defaultData.id}`, discussionData);
        toast.success("Forum berhasil diperbarui.");
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

          {defaultData && (
            <>
              <label>Konten Forum</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Tulis konten forum..."
                required
                className="form-textarea scroll-hidden"
                rows="5"
                disabled={!!defaultData} // Disable in update mode
              />

              <label>Tipe Program</label>
              <select name="programType" value={formData.programType} onChange={handleChange} className="admin-select" disabled={!!defaultData}>
                <option value="Course">Course</option>
                <option value="Seminar">Seminar</option>
                <option value="Competition">Competition</option>
                <option value="Workshop">Workshop</option>
              </select>
            </>
          )}

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
