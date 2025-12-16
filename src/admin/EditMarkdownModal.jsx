import React, { useState, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import api from '../services/api';
import { toast } from 'react-toastify';
import './modals.css';

const EditMarkdownModal = ({ show, onClose, programId, module, onSave }) => {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (module && module.markdownUrl) {
      setLoading(true);
      fetch(module.markdownUrl)
        .then(res => res.text())
        .then(text => {
          setValue(text);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch markdown:", err);
          toast.error("Gagal memuat konten markdown.");
          setLoading(false);
        });
    } else {
      setValue('');
    }
  }, [module]);

  const handleSave = async () => {
    if (!programId || !module) {
      toast.error("Program atau modul tidak valid.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      const markdownBlob = new Blob([value], { type: 'text/markdown' });
      formData.append('text', markdownBlob, 'content.md'); // Key 'text', filename 'content.md'

      await api.put(`/programs/${programId}/modules/${module.id}/texts`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success("Konten markdown berhasil disimpan.");
      onSave(); // This will trigger a refetch in the parent
      onClose();
    } catch (err) {
      console.error("Failed to save markdown:", err);
      toast.error(err.response?.data?.message || "Gagal menyimpan konten markdown.");
    } finally {
      setLoading(false);
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ width: '90%', maxWidth: '800px' }}>
        <h2>Edit Materi Teks</h2>
        {loading && <p>Memuat...</p>}
        <div data-color-mode="light">
          <MDEditor
            value={value}
            onChange={setValue}
            height={400}
          />
        </div>
        <div className="modal-actions">
          <button onClick={handleSave} className="admin-btn add" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
          <button onClick={onClose} className="admin-btn delete" disabled={loading}>
            Batal
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditMarkdownModal;
