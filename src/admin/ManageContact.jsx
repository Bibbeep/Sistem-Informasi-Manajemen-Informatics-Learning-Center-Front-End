import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from './AdminSidebar';
import './admin.css';
import api from '../services/api';
import { toast } from 'react-toastify';

const ManageContact = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewingFeedback, setViewingFeedback] = useState(null); // Feedback object for the modal
  const [responseMessage, setResponseMessage] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // State for search input
  const [ftsQuery, setFtsQuery] = useState(''); // State for triggering FTS API call

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 20, // Or another suitable limit
        sort: '-createdAt',
      };
      if (ftsQuery) { // Only add q if ftsQuery is not empty
        params.q = ftsQuery; 
      }
      const response = await api.get('/feedbacks', {
        params,
      });
      setFeedbacks(response.data.data.feedbacks);
      setTotalPages(response.data.pagination.totalPages);
    } catch (err) {
      console.error("Failed to fetch feedbacks:", err);
      setError("Gagal memuat pesan feedback.");
      toast.error("Gagal memuat pesan feedback.");
    } finally {
      setLoading(false);
    }
  }, [page, ftsQuery]); // Re-fetch when page or ftsQuery changes

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const handleViewFeedback = async (feedback) => {
    try {
      // Fetch detailed feedback
      const response = await api.get(`/feedbacks/${feedback.id}`);
      const detailedFeedback = response.data.data.feedback;

      // For each response, fetch admin user details
      const responsesWithAdminNames = await Promise.all(
        detailedFeedback.responses.map(async (res) => {
          try {
            const adminUserRes = await api.get(`/users/${res.adminUserId}`);
            return { ...res, adminName: adminUserRes.data.data.user.fullName };
          } catch (adminErr) {
            console.error(`Failed to fetch admin user ${res.adminUserId}:`, adminErr);
            return { ...res, adminName: 'Admin Tidak Dikenal' };
          }
        })
      );
      
      setViewingFeedback({ ...detailedFeedback, responses: responsesWithAdminNames });
      setResponseMessage(''); // Always start with an empty response
    } catch (err) {
      console.error("Failed to fetch detailed feedback:", err);
      toast.error("Gagal memuat detail feedback.");
    }
  };

  const handleCloseModal = () => {
    setViewingFeedback(null);
    setResponseMessage('');
    setIsResponding(false);
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!responseMessage.trim()) {
      toast.error("Pesan tanggapan tidak boleh kosong.");
      return;
    }
    if (!viewingFeedback) return;

    setIsResponding(true);
    try {
      await api.post(`/feedbacks/${viewingFeedback.id}/responses`, { message: responseMessage });
      toast.success("Tanggapan berhasil dikirim.");
      handleCloseModal();
      fetchFeedbacks(); // Refresh the list
    } catch (err) {
      console.error("Failed to send response:", err);
      toast.error(err.response?.data?.message || "Gagal mengirim tanggapan.");
    } finally {
      setIsResponding(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFtsQuery(searchQuery); // Set FTS query from current input
    setPage(1); // Reset page on new search
  };


  return (
    <div style={{ display: 'flex' }}>
      <AdminSidebar />
      <div className="admin-page scroll-hidden" style={{ flex: 1 }}>
        <h1>Pesan dari Pengguna</h1>
        
        <div className="admin-actions">
          <form onSubmit={handleSearchSubmit} className="admin-search-form">
            <input
              type="text"
              placeholder="Cari pesan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-search-input"
            />
            <button type="submit" className="admin-btn add">Cari</button>
          </form>
        </div>
        
        {loading ? (
          <p>Memuat pesan...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>Error: {error}</p>
        ) : (
          <>
            <ul className="admin-list contact">
              {feedbacks.length > 0 ? (
                feedbacks.map((feedback) => (
                  <li className="admin-list-item contact" key={feedback.id}>
                    <div>
                      <div className="admin-list-item-title">Dari: {feedback.fullName} ({feedback.email})</div>
                      <div className="admin-contact-message">{feedback.message}</div>
                      {feedback.response && (
                        <div className="admin-contact-response">
                          <strong>Tanggapan:</strong> {feedback.response.message}
                        </div>
                      )}
                    </div>
                    <div className="admin-list-buttons">
                      <button className="admin-btn edit" onClick={() => handleViewFeedback(feedback)}>
                        {feedback.response ? 'Lihat/Edit Tanggapan' : 'Tanggapi'}
                      </button>
                    </div>
                  </li>
                ))
              ) : (
                <p>Tidak ada pesan feedback.</p>
              )}
            </ul>

            <div className="admin-pagination">
              <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages}>
                Next
              </button>
            </div>
          </>
        )}

        {/* Feedback Detail and Response Modal */}
        {viewingFeedback && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h2>Detail Pesan & Tanggapan</h2>
              <div className="feedback-details-content">
                <p><strong>Dari:</strong> {viewingFeedback.fullName} ({viewingFeedback.email})</p>
                <p><strong>Pesan:</strong> {viewingFeedback.message}</p>
                <p><strong>Dikirim Pada:</strong> {new Date(viewingFeedback.createdAt).toLocaleString('id-ID')}</p>

                <hr style={{margin: '15px 0', border: '0', borderTop: '1px solid #eee'}} />

                {viewingFeedback.responses && viewingFeedback.responses.length > 0 && (
                  <div style={{ marginBottom: '15px' }}>
                    <h4>Riwayat Tanggapan:</h4>
                    {viewingFeedback.responses.map((res, index) => (
                      <div key={index} className="admin-contact-response" style={{ marginBottom: '5px' }}>
                        <strong>{res.adminName || 'Admin Tidak Dikenal'}:</strong> {res.message} ({new Date(res.createdAt).toLocaleString('id-ID')})
                      </div>
                    ))}
                  </div>
                )}
                
                <h3>Tanggapi Pesan</h3>
                <form onSubmit={handleSubmitResponse} className="modal-form">
                  <textarea
                    rows="5"
                    placeholder="Tulis tanggapan Anda di sini..."
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    style={{ width: '100%', padding: '10px', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}
                    disabled={isResponding}
                  />
                  <div className="modal-actions" style={{ marginTop: '1rem', justifyContent: 'flex-end' }}>
                    <button type="submit" className="admin-btn add" disabled={isResponding}>
                      {isResponding ? 'Mengirim...' : 'Kirim Tanggapan'}
                    </button>
                    <button type="button" className="admin-btn delete" onClick={handleCloseModal}>
                      Batal
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageContact;
