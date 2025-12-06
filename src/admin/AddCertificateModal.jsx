import React, { useState, useEffect } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import id from 'date-fns/locale/id'; // For datepicker locale
import 'react-datepicker/dist/react-datepicker.css'; // Datepicker styles
import './admin.css';
import './modals.css'; // Import the new modal styles
import api from '../services/api';
import { toast, ToastContainer } from 'react-toastify'; // Import ToastContainer

registerLocale('id', id);

const AddCertificateModal = ({ onClose, onSave, defaultData }) => {
  const [formData, setFormData] = useState({
    title: '',
    enrollmentId: '',
    issuedAt: new Date(), // New field, default to today
    expiredAt: null, // New field
  });

  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [userEnrollments, setUserEnrollments] = useState([]);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [showEnrollments, setShowEnrollments] = useState(false);

  useEffect(() => {
    if (defaultData) {
      setFormData({
        title: defaultData.title || '',
        enrollmentId: defaultData.enrollmentId || '',
        issuedAt: defaultData.issuedAt ? new Date(defaultData.issuedAt) : new Date(),
        expiredAt: defaultData.expiredAt ? new Date(defaultData.expiredAt) : null,
      });
      // In edit mode, we might need to pre-populate foundUser and selectedEnrollment
      // This part would be more complex and depend on how defaultData comes in (e.g., if it includes user/program details)
    } else {
      setFormData({
        title: '',
        enrollmentId: '',
        issuedAt: new Date(),
        expiredAt: null,
      });
      setFoundUser(null);
      setUserEnrollments([]);
      setSelectedEnrollment(null);
      setShowEnrollments(false);
    }
  }, [defaultData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmailSearch = async () => {
    if (!searchEmail) {
      toast.error("Silakan masukkan email.");
      return;
    }
    try {
      const response = await api.get('/users', { params: { email: searchEmail } });
      if (response.data.data.users.length > 0) {
        const userFound = response.data.data.users[0];
        setFoundUser(userFound);
        fetchUserEnrollments(userFound.id);
        setShowEnrollments(true);
      } else {
        toast.info("Pengguna tidak ditemukan.");
        setFoundUser(null);
        setUserEnrollments([]);
        setShowEnrollments(false);
      }
    } catch (err) {
      console.error("Failed to search user:", err);
      toast.error("Gagal mencari pengguna.");
      setFoundUser(null);
      setUserEnrollments([]);
      setShowEnrollments(false);
    }
  };

  const fetchUserEnrollments = async (userId) => {
    try {
      const response = await api.get('/enrollments', { params: { userId: userId, limit: 100 } }); // Fetch all enrollments for user
      const enrollments = response.data.data.enrollments;
      // Fetch program details for each enrollment
      const enrollmentsWithProgramDetails = await Promise.all(
        enrollments.map(async (enrollment) => {
          const programRes = await api.get(`/programs/${enrollment.programId}`);
          return {
            ...enrollment,
            programTitle: programRes.data.data.program.title,
            programType: programRes.data.data.program.type,
          };
        })
      );
      setUserEnrollments(enrollmentsWithProgramDetails);
    } catch (err) {
      console.error("Failed to fetch user enrollments:", err);
      toast.error("Gagal memuat program terdaftar pengguna.");
      setUserEnrollments([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title: formData.title,
      issuedAt: formData.issuedAt ? formData.issuedAt.toISOString() : null,
    };

    if (defaultData) { // If updating an existing certificate
      if (defaultData.programType === 'Course' && formData.expiredAt) {
        payload.expiredAt = formData.expiredAt.toISOString();
      } else if (defaultData.programType === 'Course' && !formData.expiredAt) {
        payload.expiredAt = null; // Allow setting expiredAt to null
      }
      // Ensure issuedAt is not sent in PATCH as it's not allowed
      delete payload.issuedAt;

    } else { // If adding a new certificate
      if (!selectedEnrollment) {
        toast.error("Silakan pilih program terdaftar.");
        return;
      }
      payload.enrollmentId = selectedEnrollment.id;
      if (selectedEnrollment.programType === 'Course' && formData.expiredAt) {
        payload.expiredAt = formData.expiredAt.toISOString();
      }
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

          {!defaultData && ( // Only show user/enrollment selection for adding new cert
            <>
              <div className="form-group">
                <label>Cari Pengguna berdasarkan Email</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="email"
                    placeholder="Email pengguna"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    className="input-text"
                  />
                  <button type="button" className="admin-btn add" onClick={handleEmailSearch}>Cari</button>
                </div>
              </div>

              {foundUser && (
                <div className="form-group">
                  <p><strong>Pengguna Ditemukan:</strong> {foundUser.fullName} ({foundUser.email})</p>
                  {userEnrollments.length > 0 && (
                    <>
                      <label>Pilih Program Terdaftar:</label>
                      <select
                        className="admin-select"
                        onChange={(e) => {
                          const selectedEnrollmentId = Number(e.target.value);
                          const enrollment = userEnrollments.find(e => e.id === selectedEnrollmentId);
                          setSelectedEnrollment(enrollment);
                        }}
                        value={selectedEnrollment?.id || ''}
                        required
                      >
                        <option value="">-- Pilih Program --</option>
                        {userEnrollments.map(enrollment => (
                          <option key={enrollment.id} value={enrollment.id}>
                            {enrollment.programTitle} ({enrollment.programType}) - {enrollment.status}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                  {userEnrollments.length === 0 && <p>Pengguna ini tidak terdaftar di program apapun.</p>}
                </div>
              )}
            </>
          )}

          {/* Issued At field (always displayed in edit, hidden in add but defaulted) */}
          <label>Tanggal Terbit</label>
          <input
            type="text"
            value={formData.issuedAt ? formData.issuedAt.toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'}) : 'N/A'}
            className="input-text"
            disabled
          />

          {defaultData && defaultData.programType === 'Course' && ( // Only show expiredAt for course type program in update mode
            <>
              <label>Tanggal Kadaluwarsa</label>
              <DatePicker
                selected={formData.expiredAt}
                onChange={(date) => setFormData((prev) => ({ ...prev, expiredAt: date }))}
                dateFormat="dd MMMM yyyy"
                locale="id"
                placeholderText="Pilih tanggal"
                className="input-text"
              />
            </>
          )}
           {!defaultData && selectedEnrollment?.programType === 'Course' && ( // For new cert, only if selected enrollment is Course
            <>
              <label>Tanggal Kadaluwarsa</label>
              <DatePicker
                selected={formData.expiredAt}
                onChange={(date) => setFormData((prev) => ({ ...prev, expiredAt: date }))}
                dateFormat="dd MMMM yyyy"
                locale="id"
                placeholderText="Pilih tanggal"
                className="input-text"
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
