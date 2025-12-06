import React, { useState, useEffect } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker'; // Added for expiredAt
import id from 'date-fns/locale/id'; // For datepicker locale
import 'react-datepicker/dist/react-datepicker.css'; // Datepicker styles
import './admin.css';
import './modals.css';
import api from '../services/api';
import { ToastContainer, toast } from 'react-toastify'; // Import ToastContainer

registerLocale('id', id);

const AddCertificateModal = ({ onClose, onSave, defaultData }) => {
  const [formData, setFormData] = useState({
    title: '',
    enrollmentId: '',
    expiredAt: null,
  });

  useEffect(() => {
    if (defaultData) {
      setFormData({
        title: defaultData.title || '',
        enrollmentId: defaultData.enrollmentId || '',
        expiredAt: defaultData.expiredAt ? new Date(defaultData.expiredAt) : null,
      });
    } else {
      setFormData({
        title: '',
        enrollmentId: '',
        expiredAt: null,
      });
    }
  }, [defaultData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title: formData.title,
    };

    if (defaultData) { // If updating an existing certificate
      // Only expiredAt can be updated, and only for 'Course' type programs
      if (defaultData.programType === 'Course' && formData.expiredAt) {
        payload.expiredAt = formData.expiredAt.toISOString();
      }
    } else { // If adding a new certificate
      payload.enrollmentId = Number(formData.enrollmentId);
    }

    try {
      if (defaultData) {
        await api.patch(`/certificates/${defaultData.id}`, payload);
        toast.success("Sertifikat berhasil diperbarui.");
      } else {
        await api.post('/certificates', payload);
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
      <div className="modal-box">
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

          {!defaultData && ( // Only show enrollmentId for adding new cert
            <>
              <label>Enrollment ID</label>
              <input
                type="number"
                name="enrollmentId"
                value={formData.enrollmentId}
                onChange={handleChange}
                required
                className="input-text"
              />
            </>
          )}

          {defaultData && ( // Show issuedAt and expiredAt only for update
            <>
              <label>Tanggal Terbit</label>
              <input
                type="text"
                value={defaultData.issuedAt ? new Date(defaultData.issuedAt).toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'}) : 'N/A'}
                className="input-text"
                disabled
              />

              <label>Tanggal Kadaluwarsa</label>
              <DatePicker
                selected={formData.expiredAt}
                onChange={(date) => setFormData((prev) => ({ ...prev, expiredAt: date }))}
                dateFormat="dd MMMM yyyy"
                locale="id"
                placeholderText="Pilih tanggal"
                className="input-text"
                disabled={defaultData.programType !== 'Course'} // Disable if not a Course program
              />
            </>
          )}

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
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default AddCertificateModal;
