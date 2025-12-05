import React, { useState, useEffect } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import id from 'date-fns/locale/id';
import 'react-datepicker/dist/react-datepicker.css';
import './admin.css';
import api from '../services/api';
import { toast } from 'react-toastify';

registerLocale('id', id);

const AddProgramModal = ({ onClose, onSave, defaultData }) => {
  const [formData, setFormData] = useState({
    title: '',
    availableDate: null,
    type: 'Course',
    priceIdr: '',
  });
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (defaultData) {
      setFormData({
        title: defaultData.title || '',
        availableDate: defaultData.availableDate ? new Date(defaultData.availableDate) : null,
        type: defaultData.type || 'Course',
        priceIdr: defaultData.priceIdr || '',
      });
      setDescription(defaultData.description || '');
    } else {
      setFormData({
        title: '',
        availableDate: null,
        type: 'Course',
        priceIdr: '',
      });
      setDescription('');
    }
  }, [defaultData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const programData = {
      title: formData.title,
      description: description,
      availableDate: formData.availableDate ? formData.availableDate.toISOString() : null,
      type: formData.type,
      priceIdr: Number(formData.priceIdr),
    };

    try {
      if (defaultData) {
        await api.patch(`/programs/${defaultData.id}`, programData);
        toast.success("Program berhasil diperbarui.");
      } else {
        await api.post('/programs', programData);
        toast.success("Program berhasil ditambahkan.");
      }
      onSave();
      onClose();
    } catch (err) {
      console.error("Failed to save program:", err);
      toast.error(err.response?.data?.message || "Gagal menyimpan program.");
    }
  };

  return (
    <div className="modal-overlay scroll-hidden">
      <div className="modal-content scroll-hidden">
        <h2>{defaultData ? 'Update Program' : 'Tambah Program'}</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <input
            type="text"
            name="title"
            placeholder="Judul Program"
            value={formData.title}
            onChange={handleChange}
            required
          />
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Deskripsi Program
            </label>
            <textarea
              id="description"
              className="form-textarea scroll-hidden w-full p-2 border border-gray-300 rounded resize-none h-20"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Masukkan deskripsi singkat program..."
              required
            />
          </div>
          <label>Tanggal Program</label>
          <DatePicker
            selected={formData.availableDate}
            onChange={(date) => setFormData((prev) => ({ ...prev, availableDate: date }))}
            dateFormat="dd MMMM yyyy"
            locale="id"
            placeholderText="Pilih tanggal"
            required
          />
          <select name="type" value={formData.type} onChange={handleChange}>
            <option value="Course">Course</option>
            <option value="Seminar">Seminar</option>
            <option value="Competition">Competition</option>
            <option value="Workshop">Workshop</option>
          </select>
          <input
            type="number"
            name="priceIdr"
            placeholder="Harga Program (Rp)"
            value={formData.priceIdr}
            onChange={handleChange}
            required
            min="0"
            step="1"
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

export default AddProgramModal;
