import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import './forum.css'; // For general forum styles
import '../../admin/modals.css'; // For modal styles

const AddDiscussionModal = ({ onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [mainContent, setMainContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!title.trim() || !mainContent.trim()) {
      toast.error('Judul dan konten diskusi tidak boleh kosong!');
      setIsSubmitting(false);
      return;
    }

    try {
      await api.post('/discussions', { title, mainContent });
      toast.success('Diskusi berhasil dibuat!');
      onSave(); // Trigger a refresh of the discussion list
      onClose();
    } catch (err) {
      console.error('Failed to create discussion:', err);
      toast.error(err.response?.data?.message || 'Gagal membuat diskusi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>Buat Diskusi Baru</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <label htmlFor="title">Judul Diskusi</label>
          <input
            type="text"
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Masukkan judul diskusi"
            required
            disabled={isSubmitting}
          />

          <label htmlFor="mainContent">Konten Diskusi</label>
          <textarea
            id="mainContent"
            name="mainContent"
            value={mainContent}
            onChange={(e) => setMainContent(e.target.value)}
            placeholder="Tulis konten diskusi utama..."
            rows="8"
            required
            disabled={isSubmitting}
          ></textarea>

          <div className="modal-actions">
            <button type="submit" className="admin-btn add" disabled={isSubmitting}>
              {isSubmitting ? 'Membuat...' : 'Buat Diskusi'}
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
    </div>
  );
};

export default AddDiscussionModal;
