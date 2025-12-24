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
    startDate: null,
    endDate: null,
    type: 'Course',
    priceIdr: '',
    isOnline: true,
    videoConferenceUrl: null,
    locationAddress: null,
    contestRoomUrl: null,
    speakerNames: '', // Storing as comma-separated string
    facilitatorNames: '', // Storing as comma-separated string
    hostName: '',
    totalPrize: '',
  });
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [showImagePreviewModal, setShowImagePreviewModal] = useState(false);

  useEffect(() => {
    if (defaultData) {
      const details = defaultData.details || {};
      setFormData({
        title: defaultData.title || '',
        availableDate: defaultData.availableDate ? new Date(defaultData.availableDate) : null,
        startDate: details.startDate ? new Date(details.startDate) : null,
        endDate: details.endDate ? new Date(details.endDate) : null,
        type: defaultData.type || 'Course',
        priceIdr: defaultData.priceIdr || '',
        isOnline: details.isOnline !== undefined ? details.isOnline : true,
        videoConferenceUrl: details.videoConferenceUrl || null,
        locationAddress: details.locationAddress || null,
        contestRoomUrl: details.contestRoomUrl || null,
        speakerNames: Array.isArray(details.speakerNames) ? details.speakerNames.join(', ') : '',
        facilitatorNames: Array.isArray(details.facilitatorNames) ? details.facilitatorNames.join(', ') : '',
        hostName: details.hostName || '',
        totalPrize: details.totalPrize || '',
      });
      setDescription(defaultData.description || '');
    } else {
      // Reset form to default values for a new program
      setFormData({
        title: '',
        availableDate: null,
        startDate: null,
        endDate: null,
        type: 'Course',
        priceIdr: '',
        isOnline: true,
        videoConferenceUrl: null,
        locationAddress: null,
        contestRoomUrl: null,
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

    try {
      if (defaultData) {
        // Update logic: only send changed fields
        const changes = {};

        // API requires 'type' to be present even if unchanged, but it cannot be modified.
        changes.type = defaultData.type; 

        if (formData.title !== defaultData.title) changes.title = formData.title;
        if (description !== defaultData.description) changes.description = description;
        
        // Compare dates safely
        const newDateISO = formData.availableDate ? formData.availableDate.toISOString() : null;
        // defaultData.availableDate might be ISO string already
        if (newDateISO !== defaultData.availableDate) changes.availableDate = newDateISO;

        if (Number(formData.priceIdr) !== Number(defaultData.priceIdr)) changes.priceIdr = Number(formData.priceIdr);

        // Type specific checks
        if (formData.type !== 'Course') {
           const details = defaultData.details || {};
           if (formData.isOnline !== details.isOnline) changes.isOnline = formData.isOnline;
           
           if (formData.isOnline) {
               if (formData.videoConferenceUrl !== details.videoConferenceUrl) changes.videoConferenceUrl = formData.videoConferenceUrl;
           } else {
               if (formData.locationAddress !== details.locationAddress) changes.locationAddress = formData.locationAddress;
           }
           // Date checks
           const newStartDateISO = formData.startDate ? formData.startDate.toISOString() : null;
           if (newStartDateISO !== details.startDate) changes.startDate = newStartDateISO;

           const newEndDateISO = formData.endDate ? formData.endDate.toISOString() : null;
           if (newEndDateISO !== details.endDate) changes.endDate = newEndDateISO;
        }

        if (formData.type === 'Seminar') {
            const newSpeakers = formData.speakerNames.split(',').map(s => s.trim()).filter(s => s);
            if (JSON.stringify(newSpeakers) !== JSON.stringify(defaultData.details?.speakerNames || [])) {
                changes.speakerNames = newSpeakers;
            }
        } else if (formData.type === 'Workshop') {
            const newFacilitators = formData.facilitatorNames.split(',').map(s => s.trim()).filter(s => s);
            if (JSON.stringify(newFacilitators) !== JSON.stringify(defaultData.details?.facilitatorNames || [])) {
                changes.facilitatorNames = newFacilitators;
            }
        } else if (formData.type === 'Competition') {
            const details = defaultData.details || {};
            if (formData.contestRoomUrl !== details.contestRoomUrl) changes.contestRoomUrl = formData.contestRoomUrl;
            if (formData.hostName !== details.hostName) changes.hostName = formData.hostName;
            if (Number(formData.totalPrize) !== Number(details.totalPrize)) changes.totalPrize = Number(formData.totalPrize);
        }

        if (Object.keys(changes).length <= 1) { // Only 'type' is present
            toast.info("Tidak ada perubahan untuk disimpan.");
            onClose();
            return;
        }
        
        await api.patch(`/programs/${defaultData.id}`, changes);
        toast.success("Program berhasil diperbarui.");

      } else {
        // Create logic: send all fields
        const programData = {
          title: formData.title,
          description: description,
          availableDate: formData.availableDate ? formData.availableDate.toISOString() : null,
          type: formData.type,
          priceIdr: Number(formData.priceIdr),
        };

        if (formData.type !== 'Course') {
          programData.startDate = formData.startDate ? formData.startDate.toISOString() : null;
          programData.endDate = formData.endDate ? formData.endDate.toISOString() : null;
        }

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

        await api.post('/programs', programData);
        toast.success("Program berhasil ditambahkan.");
      }
      onSave();
      onClose();
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

  const handleThumbnailUpload = async () => {
    if (!thumbnailFile || !defaultData) {
      toast.warn("Silakan pilih file thumbnail terlebih dahulu.");
      return;
    }
    const thumbnailFormData = new FormData();
    thumbnailFormData.append('thumbnail', thumbnailFile);

    try {
      await api.put(`/programs/${defaultData.id}/thumbnails`, thumbnailFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success("Thumbnail berhasil diunggah.");
      onSave(); // Refresh the program list
      setThumbnailFile(null); // Reset file input
    } catch (err) {
      console.error("Failed to upload thumbnail:", err);
      toast.error("Gagal mengunggah thumbnail.");
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
          <DatePicker 
            selected={formData.availableDate} 
            onChange={(date) => setFormData((prev) => ({ ...prev, availableDate: date }))} 
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={15}
            dateFormat="dd MMMM yyyy HH:mm" 
            locale="id" 
            placeholderText="Pilih tanggal dan waktu" 
            required 
          />
          <select name="type" value={formData.type} onChange={handleChange} disabled={!!defaultData}>
            <option value="Course">Course</option>
            <option value="Seminar">Seminar</option>
            <option value="Competition">Competition</option>
            <option value="Workshop">Workshop</option>
          </select>
          <input type="number" name="priceIdr" placeholder="Harga Program (Rp)" value={formData.priceIdr} onChange={handleChange} required min="0" step="1" />

          {formData.type !== 'Course' && (
            <>
              <div className="form-group">
                <label>Tanggal Mulai</label>
                <DatePicker 
                  selected={formData.startDate} 
                  onChange={(date) => setFormData((prev) => ({ ...prev, startDate: date }))} 
                  showTimeSelect
                  dateFormat="dd MMMM yyyy HH:mm"
                  locale="id"
                  placeholderText="Pilih tanggal mulai"
                  required
                />
              </div>
              <div className="form-group">
                <label>Tanggal Selesai</label>
                <DatePicker 
                  selected={formData.endDate} 
                  onChange={(date) => setFormData((prev) => ({ ...prev, endDate: date }))} 
                  showTimeSelect
                  dateFormat="dd MMMM yyyy HH:mm"
                  locale="id"
                  placeholderText="Pilih tanggal selesai"
                  minDate={formData.startDate}
                />
              </div>
              <div className="form-group">
                <label>Tipe Pelaksanaan:</label>
                <div className="radio-group">
                  <label className={formData.isOnline ? 'checked' : ''}><input type="radio" name="isOnline" value="true" checked={formData.isOnline === true} onChange={handleRadioChange} /> Online</label>
                  <label className={!formData.isOnline ? 'checked' : ''}><input type="radio" name="isOnline" value="false" checked={formData.isOnline === false} onChange={handleRadioChange} /> Offline</label>
                </div>
              </div>
              {formData.isOnline ? (
                <input type="text" name="videoConferenceUrl" placeholder="URL Video Conference" value={formData.videoConferenceUrl || ''} onChange={handleChange} required />
              ) : (
                <input type="text" name="locationAddress" placeholder="Alamat Lokasi" value={formData.locationAddress || ''} onChange={handleChange} required />
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
              <input type="text" name="contestRoomUrl" placeholder="URL Ruang Kontes" value={formData.contestRoomUrl || ''} onChange={handleChange} />
              <input type="text" name="hostName" placeholder="Nama Host" value={formData.hostName} onChange={handleChange} />
              <input type="number" name="totalPrize" placeholder="Total Hadiah (Rp)" value={formData.totalPrize} onChange={handleChange} required min="0" step="1" />
            </>
          )}

          {defaultData && (
            <div className="form-group thumbnail-upload-section">
              <label className="form-label">Current Thumbnail</label>
              <img src={defaultData.thumbnailUrl} alt="Current thumbnail" className="thumbnail-preview" onClick={() => setShowImagePreviewModal(true)} style={{ cursor: 'pointer' }} />
              <label htmlFor="thumbnail" className="form-label">Update Thumbnail</label>
              <div className="thumbnail-controls">
                <input 
                  type="file" 
                  id="thumbnail" 
                  name="thumbnail" 
                  onChange={(e) => setThumbnailFile(e.target.files[0])} 
                  accept="image/png, image/jpeg, image/webp"
                />
                <button type="button" className="admin-btn" onClick={handleThumbnailUpload} disabled={!thumbnailFile}>
                  Upload
                </button>
              </div>
            </div>
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

        {showImagePreviewModal && (
          <div className="modal-overlay" onClick={() => setShowImagePreviewModal(false)}>
            <div className="image-preview-modal-content" onClick={(e) => e.stopPropagation()}>
              <img src={defaultData.thumbnailUrl} alt="Full-size preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddProgramModal;
