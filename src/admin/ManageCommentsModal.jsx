import React, { useState, useEffect, useCallback } from 'react';
import './admin.css';
import './modals.css';
import api from '../services/api';
import { toast } from 'react-toastify';

const ManageCommentsModal = ({ onClose, discussionId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingComment, setEditingComment] = useState(null); // Comment being edited
  const [editedMessage, setEditedMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/discussions/${discussionId}/comments`, {
        params: { parentCommentId: null, limit: 100 } // Fetch top-level comments
      });
      const topLevelComments = response.data.data.comments;
      setComments(topLevelComments);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
      setError("Gagal memuat komentar.");
      toast.error("Gagal memuat komentar.");
    } finally {
      setLoading(false);
    }
  }, [discussionId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleEdit = (comment) => {
    setEditingComment(comment);
    setEditedMessage(comment.message);
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditedMessage('');
  };

  const handleUpdateComment = async (commentId) => {
    if (!editedMessage.trim()) {
      toast.error("Pesan komentar tidak boleh kosong.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.patch(`/discussions/${discussionId}/comments/${commentId}`, { message: editedMessage });
      toast.success("Komentar berhasil diperbarui.");
      handleCancelEdit();
      fetchComments(); // Refresh comments
    } catch (err) {
      console.error("Failed to update comment:", err);
      toast.error(err.response?.data?.message || "Gagal memperbarui komentar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Yakin ingin menghapus komentar ini?')) {
      try {
        await api.delete(`/discussions/${discussionId}/comments/${commentId}`);
        toast.success("Komentar berhasil dihapus.");
        fetchComments(); // Refresh comments
      } catch (err) {
        console.error("Failed to delete comment:", err);
        toast.error(err.response?.data?.message || "Gagal menghapus komentar.");
      }
    }
  };

  const renderComment = (comment, level) => (
    <div key={comment.id} className={`comment-item level-${level}`}>
      <div className="comment-header">
        <strong>{comment.fullName || 'Anonim'} (ID: {comment.id})</strong>
        <span className="comment-time">{new Date(comment.createdAt).toLocaleString()}</span>
      </div>
      {comment.parentCommentId && (
        <p className="replied-to-info">Membalas komentar #{comment.parentCommentId}</p>
      )}
      <div className="comment-content">
        <p>{comment.message}</p>
      </div>
      <div className="comment-actions">
        <button className="admin-btn edit" onClick={() => handleEdit(comment)}>Edit</button>
        <button className="admin-btn delete" onClick={() => handleDeleteComment(comment.id)}>Hapus</button>
      </div>
      {editingComment && editingComment.id === comment.id && (
        <form onSubmit={(e) => { e.preventDefault(); handleUpdateComment(comment.id); }} className="modal-form">
          <textarea
            value={editedMessage}
            onChange={(e) => setEditedMessage(e.target.value)}
            rows="3"
            disabled={isSubmitting}
            required
          />
          <div className="modal-actions">
            <button type="submit" className="admin-btn add" disabled={isSubmitting}>
              {isSubmitting ? 'Memperbarui...' : 'Simpan'}
            </button>
            <button type="button" className="admin-btn delete" onClick={handleCancelEdit}>
              Batal
            </button>
          </div>
        </form>
      )}
      {/* Recursively render replies if available (API returns flat list for now, needs manual nesting) */}
      {/* For now, this will only show top-level comments and their direct replies based on parentCommentId */}
      {/* To implement full nesting, an additional API call for replies to replies would be needed here */}
    </div>
  );

  return (
    <div className="modal-overlay">
      <div className="modal-box comments-modal-box">
        <h2>Kelola Komentar Diskusi</h2>
        {loading ? (
          <p>Memuat komentar...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : comments.length > 0 ? (
          <div className="comments-list">
            {comments.map(comment => renderComment(comment, 0))}
          </div>
        ) : (
          <p>Belum ada komentar untuk diskusi ini.</p>
        )}
        <div className="modal-actions">
          <button type="button" className="admin-btn delete" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageCommentsModal;