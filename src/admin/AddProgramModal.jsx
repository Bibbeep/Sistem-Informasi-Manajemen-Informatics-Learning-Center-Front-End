import React, { useState, useEffect } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import id from 'date-fns/locale/id';
import 'react-datepicker/dist/react-datepicker.css';
import './admin.css';
import './modals.css'; // Import the new modal styles
import api from '../services/api';
import { toast } from 'react-toastify';

registerLocale('id', id);

const AddProgramModal = ({ onClose, onSave, defaultData }) => {
  const [formData, setFormData] = useState({
    title: '',
    availableDate: null,
    type: 'Course',
    priceIdr: '',
    isOnline: true,
    videoConferenceUrl: '',
    locationAddress: '',
    contestRoomUrl: '',
    speakerNames: '', // Storing as comma-separated string
    facilitatorNames: '', // Storing as comma-separated string
    hostName: '',
    totalPrize: '',
  });
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (defaultData) {
      setFormData({
        title: defaultData.title || '',
        availableDate: defaultData.availableDate ? new Date(defaultData.availableDate) : null,
        type: defaultData.type || 'Course',
        priceIdr: defaultData.priceIdr || '',
        isOnline: defaultData.isOnline !== undefined ? defaultData.isOnline : true,
        videoConferenceUrl: defaultData.videoConferenceUrl || '',
        locationAddress: defaultData.locationAddress || '',
        contestRoomUrl: defaultData.contestRoomUrl || '',
        speakerNames: Array.isArray(defaultData.speakerNames) ? defaultData.speakerNames.join(', ') : '',
        facilitatorNames: Array.isArray(defaultData.facilitatorNames) ? defaultData.facilitatorNames.join(', ') : '',
        hostName: defaultData.hostName || '',
        totalPrize: defaultData.totalPrize || '',
      });
      setDescription(defaultData.description || '');
    } else {
      // Reset form to default values for a new program
      setFormData({
        title: '',
        availableDate: null,
        type: 'Course',
        priceIdr: '',
        isOnline: true,
        videoConferenceUrl: '',
        locationAddress: '',
        contestRoomUrl: '',
        speakerNames: '',
        facilitatorNames: '',
        hostName: '',
        totalPrize: '',
      });
      setDescription('');
    }
  }, [defaultData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value === 'true' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const programData = {
      title: formData.title,
      description: description,
      availableDate: formData.availableDate ? formData.availableDate.toISOString() : null,
      type: formData.type,
      priceIdr: Number(formData.priceIdr),
    };

    // Add type-specific fields to the payload
    if (formData.type === 'Seminar') {
      programData.isOnline = formData.isOnline;
      if(formData.isOnline) programData.videoConferenceUrl = formData.videoConferenceUrl;
      else programData.locationAddress = formData.locationAddress;
      programData.speakerNames = formData.speakerNames.split(',').map(s => s.trim()).filter(s => s);
    } else if (formData.type === 'Workshop') {
      programData.isOnline = formData.isOnline;
      if(formData.isOnline) programData.videoConferenceUrl = formData.videoConferenceUrl;
      else programData.locationAddress = formData.locationAddress;
      programData.facilitatorNames = formData.facilitatorNames.split(',').map(s => s.trim()).filter(s => s);
    } else if (formData.type === 'Competition') {
      programData.isOnline = formData.isOnline;
      if(formData.isOnline) programData.videoConferenceUrl = formData.videoConferenceUrl;
      else programData.locationAddress = formData.locationAddress;
      programData.contestRoomUrl = formData.contestRoomUrl;
      programData.hostName = formData.hostName;
      programData.totalPrize = Number(formData.totalPrize);
    }

    try {
      if (defaultData) {
        await api.patch(`/programs/${defaultData.id}`, programData);
        toast.success("Program berhasil diperbarui.");
      } else {
        await api.post('/programs', programData);
        toast.success("Program berhasil ditambahkan.");
      }
      onSave();
      onClose(); // Only close on success
    } catch (err) {
      console.error("Failed to save program:", err);
      let errorMessage = "Gagal menyimpan program. Silakan coba lagi.";
      if (err.response && err.response.data && err.response.data.errors) {
        errorMessage = err.response.data.errors.map(e => e.message).join('; ');
      } else if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay scroll-hidden">
      <div className="modal-box">
        <h2>{defaultData ? 'Update Program' : 'Tambah Program'}</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <input type="text" name="title" placeholder="Judul Program" value={formData.title} onChange={handleChange} required />
          <div className="form-group">
            <label htmlFor="description" className="form-label">Deskripsi Program</label>
            <textarea id="description" className="form-textarea scroll-hidden w-full p-2 border border-gray-300 rounded resize-none h-20" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Masukkan deskripsi singkat program..." required />
          </div>
          <label>Tanggal Program</label>
          <DatePicker selected={formData.availableDate} onChange={(date) => setFormData((prev) => ({ ...prev, availableDate: date }))} dateFormat="dd MMMM yyyy" locale="id" placeholderText="Pilih tanggal" required />
          <select name="type" value={formData.type} onChange={handleChange}>
            <option value="Course">Course</option>
            <option value="Seminar">Seminar</option>
            <option value="Competition">Competition</option>
            <option value="Workshop">Workshop</option>
          </select>
          <input type="number" name="priceIdr" placeholder="Harga Program (Rp)" value={formData.priceIdr} onChange={handleChange} required min="0" step="1" />

          {formData.type !== 'Course' && (
            <>
              <div className="form-group">
                <label>Tipe Pelaksanaan:</label>
                <div className="radio-group">
                  <label className={formData.isOnline ? 'checked' : ''}><input type="radio" name="isOnline" value="true" checked={formData.isOnline === true} onChange={handleRadioChange} /> Online</label>
                  <label className={!formData.isOnline ? 'checked' : ''}><input type="radio" name="isOnline" value="false" checked={formData.isOnline === false} onChange={handleRadioChange} /> Offline</label>
                </div>
              </div>
              {formData.isOnline ? (
                <input type="text" name="videoConferenceUrl" placeholder="URL Video Conference" value={formData.videoConferenceUrl} onChange={handleChange} required />
              ) : (
                <input type="text" name="locationAddress" placeholder="Alamat Lokasi" value={formData.locationAddress} onChange={handleChange} required />
              )}
            </>
          )}

          {formData.type === 'Seminar' && (
            <input type="text" name="speakerNames" placeholder="Nama Speaker (pisahkan dengan koma)" value={formData.speakerNames} onChange={handleChange} />
          )}

          {formData.type === 'Workshop' && (
            <input type="text" name="facilitatorNames" placeholder="Nama Fasilitator (pisahkan dengan koma)" value={formData.facilitatorNames} onChange={handleChange} />
          )}

          {formData.type === 'Competition' && (
            <>
              <input type="text" name="contestRoomUrl" placeholder="URL Ruang Kontes" value={formData.contestRoomUrl} onChange={handleChange} />
              <input type="text" name="hostName" placeholder="Nama Host" value={formData.hostName} onChange={handleChange} />
              <input type="number" name="totalPrize" placeholder="Total Hadiah (Rp)" value={formData.totalPrize} onChange={handleChange} required min="0" step="1" />
            </>
          )}

                    <div className="modal-actions">

                      <button type="submit" className="admin-btn add" disabled={isSubmitting}>

                        {isSubmitting ? 'Menyimpan...' : 'Simpan'}

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
