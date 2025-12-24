import React, { useState, useEffect } from 'react';
import './admin.css';
import './modals.css'; // Import the new modal styles
import api from '../services/api';
import { toast } from 'react-toastify';

const AddMaterialModal = ({ onClose, onSave, defaultData, programId }) => {
  const [formData, setFormData] = useState({
    title: '',
    youtubeUrl: '',
  });

  useEffect(() => {
    if (defaultData) {
      setFormData({
        title: defaultData.title || '',
        youtubeUrl: defaultData.youtubeUrl || '',
      });
    } else {
      setFormData({
        title: '',
        youtubeUrl: '',
      });
    }
  }, [defaultData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error('Judul modul harus diisi!');
      return;
    }

    const moduleData = {
      title: formData.title,
      youtubeUrl: formData.youtubeUrl || null, // Send null if empty
    };

    try {
      if (defaultData) {
        await api.patch(`/programs/${programId}/modules/${defaultData.id}`, moduleData);
        toast.success("Modul berhasil diperbarui.");
      } else {
        await api.post(`/programs/${programId}/modules`, moduleData);
        toast.success("Modul berhasil ditambahkan.");
      }
      onSave(); // Refresh the module list
      onClose();
    } catch (err) {
      console.error("Failed to save module:", err);
      toast.error(err.response?.data?.message || "Gagal menyimpan modul.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>{defaultData ? 'Update Modul' : 'Tambah Modul'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Judul Modul</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Contoh: Pengenalan React"
              required
            />
          </div>
          <div className="form-group">
            <label>Link YouTube (Opsional)</label>
            <input
              type="text"
              name="youtubeUrl"
              placeholder="https://youtube.com/..."
              value={formData.youtubeUrl}
              onChange={handleChange}
            />
          </div>

          <div className="modal-actions">
            <button type="submit" className="admin-btn edit">
              {defaultData ? 'Update' : 'Simpan'}
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

export default AddMaterialModal;
