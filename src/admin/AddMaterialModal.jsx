import React, { useState, useEffect } from 'react';
import './admin.css';
import './modals.css'; // Import the new modal styles
import api from '../services/api';
import { toast } from 'react-toastify';

const AddMaterialModal = ({ onClose, onSave, defaultData, programId }) => {
  const [formData, setFormData] = useState({
    numberCode: '',
    youtubeUrl: '',
  });

  useEffect(() => {
    if (defaultData) {
      setFormData({
        numberCode: defaultData.numberCode || '',
        youtubeUrl: defaultData.youtubeUrl || '',
      });
    } else {
      setFormData({
        numberCode: '',
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
    if (!formData.numberCode || !formData.youtubeUrl) {
      toast.error('Nomor modul dan link YouTube harus diisi!');
      return;
    }

    const moduleData = {
      numberCode: Number(formData.numberCode),
      youtubeUrl: formData.youtubeUrl,
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
            <label>Nomor Modul</label>
            <input
              type="number"
              name="numberCode"
              min="1"
              value={formData.numberCode}
              onChange={handleChange}
              placeholder="Contoh: 1"
              required
            />
          </div>
          <div className="form-group">
            <label>Link YouTube</label>
            <input
              type="text"
              name="youtubeUrl"
              placeholder="https://youtube.com/..."
              value={formData.youtubeUrl}
              onChange={handleChange}
              required
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
