import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from './AdminSidebar';
import AddForumModal from './AddForumModal';
import ManageCommentsModal from './ManageCommentsModal'; // Import the new modal
import './admin.css';
import './modals.css'; // Import the new modal styles
import api from '../services/api';
import { toast } from 'react-toastify';

const ManageForum = () => {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false); // New state for comments modal
  const [selectedDiscussionId, setSelectedDiscussionId] = useState(null); // New state for selected discussion

  const handleManageComments = (discussionId) => {
    setSelectedDiscussionId(discussionId);
    setShowCommentsModal(true);
  };


  const fetchDiscussions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/discussions', {
        params: {
          page,
          limit: 20, // Or another suitable limit
          sort: '-createdAt',
        },
      });
      const { discussions } = response.data.data;
      const { pagination } = response.data;

      const discussionsWithAuthors = await Promise.all(
        discussions.map(async (discussion) => {
          try {
            const userResponse = await api.get(`/users/${discussion.userId}`);
            return {
              ...discussion,
              authorName: userResponse.data.data.user.fullName,
            };
          } catch (err) {
            console.error(`Failed to fetch user for discussion ${discussion.id}:`, err);
            return { ...discussion, authorName: 'Unknown' };
          }
        })
      );

      setDiscussions(discussionsWithAuthors);
      setTotalPages(pagination.totalPages);
    } catch (err) {
      console.error("Failed to fetch discussions:", err);
      setError("Gagal memuat data forum.");
      toast.error("Gagal memuat data forum.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchDiscussions();
  }, [fetchDiscussions]);

  const handleAdd = () => {
    setEditData(null);
    setShowModal(true);
  };

  const handleEdit = (discussion) => {
    setEditData(discussion);
    setShowModal(true);
  };

  const handleDelete = async (discussionId) => {
    if (window.confirm('Yakin ingin menghapus diskusi ini?')) {
      try {
        await api.delete(`/discussions/${discussionId}`);
        toast.success("Diskusi berhasil dihapus.");
        fetchDiscussions(); // Refresh the list
      } catch (err) {
        console.error("Failed to delete discussion:", err);
        toast.error(err.response?.data?.message || "Gagal menghapus diskusi.");
      }
    }
  };

  const handleSave = () => {
    setShowModal(false);
    fetchDiscussions();
  };

  const formatTanggal = (tanggal) => {
    if (!tanggal) return '–';
    const dateObj = new Date(tanggal);
    if (isNaN(dateObj)) return tanggal;

    return dateObj.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div style={{ display: 'flex' }}>
      <AdminSidebar />
      <div className="admin-page scroll-hidden" style={{ flex: 1 }}>
        <h1>Kelola Forum</h1>
        <div className="admin-actions">
          <button className="admin-btn add" onClick={handleAdd}>
            Tambah Forum
          </button>
        </div>

        {loading ? (
          <p>Memuat data forum...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>Error: {error}</p>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Judul Forum</th>
                  <th>Penulis</th>
                  <th>Tanggal Dibuat</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {discussions.length > 0 ? (
                  discussions.map((discussion) => (
                    <tr key={discussion.id}>
                      <td>{discussion.title}</td>
                      <td>{discussion.authorName}</td>
                      <td>{formatTanggal(discussion.createdAt)}</td>
                      <td>
                        <button className="admin-btn edit" onClick={() => handleEdit(discussion)}>Update</button>
                        <button className="admin-btn" onClick={() => handleManageComments(discussion.id)}>Kelola Komentar</button>
                        <button className="admin-btn delete" onClick={() => handleDelete(discussion.id)}>Hapus</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center' }}>Tidak ada data forum.</td>
                  </tr>
                )}
              </tbody>
            </table>

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

        {showModal && (
          <AddForumModal
            onClose={() => setShowModal(false)}
            onSave={handleSave}
            defaultData={editData}
          />
        )}

        {showCommentsModal && (
          <ManageCommentsModal
            onClose={() => setShowCommentsModal(false)}
            discussionId={selectedDiscussionId}
          />
        )}
      </div>
    </div>
  );
};

export default ManageForum;
