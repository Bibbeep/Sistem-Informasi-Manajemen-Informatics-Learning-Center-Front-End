import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../sidebar/Sidebar';
import ProfileBar from '../profilebar/ProfileBar';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import './forum.css';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ForumDetailPage = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();

  const [discussion, setDiscussion] = useState(null);
  const [comments, setComments] = useState([]);
  const [replies, setReplies] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingReplies, setLoadingReplies] = useState(new Set());
  const [error, setError] = useState(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyInputText, setReplyInputText] = useState('');
  const [replyToCommentId, setReplyToCommentId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collapsedComments, setCollapsedComments] = useState(new Set());
  const [likedComments, setLikedComments] = useState(new Set()); // New state for liked comments

  // Function to handle liking/unliking a comment
  const handleLikeToggle = async (commentId, isLiked) => {
    if (!user) {
      toast.error("Anda harus login untuk menyukai komentar.");
      return;
    }

    // Optimistically update the UI
    const newLikedComments = new Set(likedComments);
    if (isLiked) {
      newLikedComments.delete(commentId);
    } else {
      newLikedComments.add(commentId);
    }
    setLikedComments(newLikedComments);

    const updateLikesCount = (commentList, id, increment) => {
      return commentList.map(c => {
        if (c.id === id) {
          return { ...c, likesCount: c.likesCount + increment };
        }
        return c;
      });
    };

    setComments(prev => updateLikesCount(prev, commentId, isLiked ? -1 : 1));
    setReplies(prev => {
      const newReplies = { ...prev };
      for (const parentId in newReplies) {
        newReplies[parentId] = updateLikesCount(newReplies[parentId], commentId, isLiked ? -1 : 1);
      }
      return newReplies;
    });

    // Perform the API call
    try {
      if (isLiked) {
        await api.delete(`/discussions/${id}/comments/${commentId}/likes`);
      } else {
        await api.post(`/discussions/${id}/comments/${commentId}/likes`);
      }
    } catch (err) {
      console.error("Failed to update like status:", err);

      // If it's a 409 conflict on a 'like' attempt, it means the user had already liked it.
      // The UI is already optimistically in the correct 'liked' state, so we just log it and exit.
      if (err.response && err.response.status === 409 && !isLiked) {
        toast.info("You have already liked this comment.");
        return; // Do not revert UI for this specific case
      }

      // For all other errors, revert the optimistic UI update.
      toast.error("Gagal memperbarui status suka.");
      const revertedLikedComments = new Set(likedComments);
      if (isLiked) {
        revertedLikedComments.add(commentId);
      } else {
        revertedLikedComments.delete(commentId);
      }
      setLikedComments(revertedLikedComments);
      setComments(prev => updateLikesCount(prev, commentId, isLiked ? 1 : -1));
      setReplies(prev => {
        const newReplies = { ...prev };
        for (const parentId in newReplies) {
          newReplies[parentId] = updateLikesCount(newReplies[parentId], commentId, isLiked ? 1 : -1);
        }
        return newReplies;
      });
    }
  };

  const fetchDiscussionMetadata = useCallback(async () => {
    try {
      const response = await api.get(`/discussions/${id}`);
      setDiscussion(response.data.data.discussion);
    } catch (err) {
      console.error("Failed to fetch discussion metadata:", err);
      setError("Failed to load discussion metadata.");
      toast.error("Gagal memuat detail diskusi.");
      throw err;
    }
  }, [id]);

  const fetchComments = useCallback(async () => {
    try {
      const response = await api.get(`/discussions/${id}/comments`, {
        params: { parentCommentId: 0 } // Correctly fetch top-level comments
      });
      const topLevelComments = response.data.data.comments;
      setComments(topLevelComments);

      // Pre-collapse all comments that have replies
      const initialCollapsed = new Set();
      topLevelComments.forEach(comment => {
        if (comment.repliesCount > 0) {
          initialCollapsed.add(comment.id);
        }
      });
      setCollapsedComments(initialCollapsed);

    } catch (err) {
      console.error("Failed to fetch comments:", err);
      setError("Failed to load comments.");
      toast.error("Gagal memuat komentar.");
      throw err;
    }
  }, [id]);

  const fetchReplies = useCallback(async (parentCommentId) => {
    setLoadingReplies(prev => new Set(prev).add(parentCommentId));
    try {
      const response = await api.get(`/discussions/${id}/comments`, {
        params: { parentCommentId: parentCommentId }
      });
      const fetchedReplies = response.data.data.comments;
      
      // Update replies state
      setReplies(prev => ({ ...prev, [parentCommentId]: fetchedReplies }));

      // Pre-collapse any newly fetched replies that themselves have replies
      if (fetchedReplies && fetchedReplies.length > 0) {
        setCollapsedComments(prev => {
          const newSet = new Set(prev);
          fetchedReplies.forEach(reply => {
            if (reply.repliesCount > 0) {
              newSet.add(reply.id);
            }
          });
          return newSet;
        });
      }
    } catch (err) {
      console.error(`Failed to fetch replies for comment ${parentCommentId}:`, err);
      toast.error(`Gagal memuat balasan.`);
    } finally {
      setLoadingReplies(prev => {
        const newSet = new Set(prev);
        newSet.delete(parentCommentId);
        return newSet;
      });
    }
  }, [id]);

  const toggleCollapseComment = (commentId) => {
    // If we are expanding a comment (i.e., it is currently in the collapsed set)
    // and its replies haven't been fetched yet, then fetch them.
    if (collapsedComments.has(commentId) && !replies[commentId]) {
      fetchReplies(commentId);
    }
    
    // Then, toggle the collapsed state
    setCollapsedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const handleSubmit = async (message, parentId) => {
    if (!message.trim()) {
      toast.warn("Komentar tidak boleh kosong.");
      return;
    }
    if (!user) {
      toast.error("Anda harus login untuk berkomentar.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        message: message,
        parentCommentId: parentId,
      };
      await api.post(`/discussions/${id}/comments`, payload);
      toast.success("Komentar berhasil ditambahkan!");
      
      if (parentId) {
        setReplyInputText('');
        setReplyToCommentId(null);
        fetchReplies(parentId);
      } else {
        setNewCommentText('');
        fetchComments();
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
      setError("Gagal menambahkan komentar.");
      toast.error("Gagal menambahkan komentar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderComments = (commentList, level = 0) => {
    if (!commentList || commentList.length === 0) return null;

    return commentList.map((comment) => {
      const isCurrentUser = user && user.sub === comment.userId;
      const pictureUrl = isCurrentUser ? profile?.pictureUrl : comment.authorPictureUrl;

      return (
        <div key={comment.id} className={`forum-comment-item level-${level}`}>
          <div className="comment-header">
            <img
              src={pictureUrl || 'https://i.pravatar.cc/30?img=6'}
              alt="Author Avatar"
              className="comment-author-avatar"
            />
            <strong>{comment.fullName || 'Anonim'}</strong>
            <span className="comment-time">{formatDate(comment.createdAt)}</span>
          </div>
          <div className="comment-content">
            <p>{comment.message}</p>
          </div>
          <div className="comment-actions">
            <button
              className={`like-btn ${likedComments.has(comment.id) ? 'liked' : ''}`}
              onClick={() => handleLikeToggle(comment.id, likedComments.has(comment.id))}
            >
              ❤️ {comment.likesCount || 0}
            </button>
            <button className="reply-action-btn" onClick={() => setReplyToCommentId(comment.id)}>Reply</button>
            {comment.repliesCount > 0 && (
              <button
                className="toggle-replies-btn"
                onClick={() => toggleCollapseComment(comment.id)}
                disabled={loadingReplies.has(comment.id)}
              >
                {loadingReplies.has(comment.id)
                  ? 'Loading...'
                  : collapsedComments.has(comment.id)
                  ? `Show ${comment.repliesCount} replies`
                  : 'Hide replies'}
              </button>
            )}
          </div>
          {replyToCommentId === comment.id && (
            <form className="comment-form inline-reply-form" onSubmit={(e) => { e.preventDefault(); handleSubmit(replyInputText, comment.id); }}>
              <textarea
                placeholder={`Membalas ${comment.fullName}...`}
                value={replyInputText}
                onChange={(e) => setReplyInputText(e.target.value)}
                rows="2"
                disabled={isSubmitting}
                autoFocus
              ></textarea>
              <div className="inline-reply-actions">
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Mengirim...' : 'Kirim Balasan'}
                </button>
                <button type="button" className="cancel-reply-btn" onClick={() => setReplyToCommentId(null)}>
                  Batal
                </button>
              </div>
            </form>
          )}
          {!collapsedComments.has(comment.id) && renderComments(replies[comment.id], level + 1)}
        </div>
      );
    });
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchDiscussionMetadata(), fetchComments()]);
        setError(null);
      } catch (err) {
        // Errors are handled in individual fetch functions
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fetchDiscussionMetadata, fetchComments]);

  if (loading) {
    return (
      <div className="forum-container">
        <Sidebar />
        <div className="forum-main">
          <div className="forum-detail-page-content">
            <p>Memuat diskusi...</p>
          </div>
        </div>
        <ProfileBar />
      </div>
    );
  }

  if (error) {
    return (
      <div className="forum-container">
        <Sidebar />
        <div className="forum-main">
          <div className="forum-detail-page-content">
            <p style={{ color: 'red' }}>Error: {error}</p>
            <Link to="/forum" className="back-to-forum-list">← Kembali ke Daftar Forum</Link>
          </div>
        </div>
        <ProfileBar />
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="forum-container">
        <Sidebar />
        <div className="forum-main">
          <div className="forum-detail-page-content">
            <p>Diskusi tidak ditemukan.</p>
            <Link to="/forum" className="back-to-forum-list">← Kembali ke Daftar Forum</Link>
          </div>
        </div>
        <ProfileBar />
      </div>
    );
  }

  return (
    <div className="forum-container">
      <Sidebar />
      <div className="forum-main">
        <div className="forum-detail-page-content">
          <Link to="/forum" className="back-to-forum-list">← Kembali ke Daftar Forum</Link>
          <h1 className="discussion-title">{discussion.title}</h1>
          <div className="discussion-meta">
            Oleh: {discussion.authorName || 'Anonim'} ({discussion.programType || 'Umum'})
            pada {formatDate(discussion.createdAt)}
          </div>
          <div className="discussion-content">
            <p>Konten diskusi utama tidak tersedia melalui API ini.</p>
          </div>
          <hr className="discussion-divider" />
          <div className="comment-section">
            <h3>Komentar ({discussion.commentsCount})</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(newCommentText, null); }} className="comment-form">
              <textarea
                placeholder="Tulis komentar baru..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                rows="3"
                disabled={isSubmitting}
              ></textarea>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Mengirim...' : 'Kirim Komentar'}
              </button>
            </form>
            <div className="comments-list">
              {renderComments(comments)}
              {comments.length === 0 && <p>Belum ada komentar.</p>}
            </div>
          </div>
        </div>
      </div>
      <ProfileBar />
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default ForumDetailPage;
