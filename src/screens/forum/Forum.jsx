import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../sidebar/Sidebar';
import './forum.css';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'; // Import API service
import { ToastContainer, toast } from 'react-toastify'; // For notifications
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import AddDiscussionModal from './AddDiscussionModal'; // Import the new modal

const Forum = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Get user info for authentication
  
  // State for forum list
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [sort] = useState('-createdAt'); // Default sort by newest
  const [searchQuery, setSearchQuery] = useState(''); // For search input
  const [showAddModal, setShowAddModal] = useState(false); // State for Add Discussion Modal

  // Function to fetch discussions from API
  const fetchDiscussions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit,
        sort,
      };
      // Removed filter !== 'All' logic as programType filter is removed

      if (searchQuery) {
        params.title = searchQuery; // Assuming API can search by title field
      }

      const response = await api.get('/discussions', { params });
      const discussionData = response.data.data.discussions;
      const totalPages = response.data.pagination.totalPages;

      // Fetch user data for each discussion
      const discussionsWithAuthors = await Promise.all(
        discussionData.map(async (discussion) => {
          try {
            const userResponse = await api.get(`/users/${discussion.userId}`);
            return {
              ...discussion,
              authorName: userResponse.data.data.user.fullName,
            };
          } catch (err) {
            console.error(`Failed to fetch user for discussion ${discussion.id}:`, err);
            return { ...discussion, authorName: 'Unknown' }; // Fallback author name
          }
        })
      );

      setDiscussions(discussionsWithAuthors);
      setTotalPages(totalPages);
    } catch (err) {
      console.error("Failed to fetch discussions:", err); // DEBUGGING LINE
      setError("Failed to load forum topics.");
      toast.error("Gagal memuat topik forum.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, sort, searchQuery]);

  // Initial fetch and re-fetch on dependency changes
  useEffect(() => {
    fetchDiscussions();
  }, [fetchDiscussions]);

  const handleForumClick = (id) => {
    navigate(`/forum/${id}`); // Navigate to detail page
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1); // Reset page on new search
    fetchDiscussions(); // Trigger search
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };


  return (
    <div className="forum-container">
      <Sidebar />
      <div className="forum-main">
        <div className="forum-left">
          <div className="forum-header">
            <h2>Forum Diskusi</h2>
            <div className="forum-actions">
              {user && ( // Only show button if user is authenticated
                <button
                  className="admin-btn add" // Reusing admin-btn styling for consistency
                  onClick={() => setShowAddModal(true)}
                  style={{ marginRight: '10px' }}
                >
                  Buat Diskusi Baru
                </button>
              )}
              <form onSubmit={handleSearchSubmit} className="forum-search">
                <input
                  type="text"
                  placeholder="Cari topik..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit">Cari</button>
              </form>
            </div>
          </div>
          <div className="forum-list">
            {loading ? (
              <p className="forum-message">Memuat topik diskusi...</p>
            ) : error ? (
              <p className="forum-message error">{error}</p>
            ) : !Array.isArray(discussions) || discussions.length === 0 ? ( // Defensive check
              <p className="forum-message">Tidak ada topik diskusi ditemukan.</p>
            ) : (
              discussions.map((discussion) => (
                <div
                  key={discussion.id}
                  className="forum-item"
                  onClick={() => handleForumClick(discussion.id)}
                >
                  <div className="forum-info">
                    <p className="forum-title">{discussion.title}</p>
                    <span className="forum-meta">
                                            Oleh: {discussion.authorName} pada {new Date(discussion.createdAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="forum-pagination">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      <ToastContainer position="top-center" autoClose={3000} />

      {showAddModal && (
        <AddDiscussionModal
          onClose={() => setShowAddModal(false)}
          onSave={fetchDiscussions}
        />
      )}
    </div>
  );
};

export default Forum;
