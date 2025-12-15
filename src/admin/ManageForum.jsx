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
  const [searchQuery, setSearchQuery] = useState(''); // State for search input
  const [ftsQuery, setFtsQuery] = useState(''); // State for triggering FTS API call

  const handleManageComments = (discussionId) => {
    setSelectedDiscussionId(discussionId);
    setShowCommentsModal(true);
  };


  const fetchDiscussions = useCallback(async () => {
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
      const response = await api.get('/discussions', {
        params,
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
  }, [page, ftsQuery]); // Re-fetch when page or ftsQuery changes

  useEffect(() => {
    fetchDiscussions();
  }, [fetchDiscussions]);

  const handleAdd = () => {
    setEditData(null);
    setShowModal(true);
  };

  const handleEdit = async (discussion) => {
    try {
      const response = await api.get(`/discussions/${discussion.id}`);
      setEditData(response.data.data.discussion);
      setShowModal(true);
    } catch (err) {
      console.error("Failed to fetch discussion details for edit:", err);
      toast.error("Gagal memuat detail diskusi untuk diedit.");
    }
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFtsQuery(searchQuery); // Set FTS query from current input
    setPage(1); // Reset page on new search
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
          <form onSubmit={handleSearchSubmit} className="admin-search-form">
            <input
              type="text"
              placeholder="Cari forum..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-search-input"
            />
            <button type="submit" className="admin-btn add">Cari</button>
          </form>
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
