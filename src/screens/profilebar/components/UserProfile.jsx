import React, { useEffect, useState } from 'react';
import './userprofile.css';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import { FaEdit } from 'react-icons/fa';


const UserProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [editPicture, setEditPicture] = useState(null); // For file upload
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    if (!user || !user.sub) {
      setLoading(false);
      setError("User not logged in.");
      return;
    }

    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/users/${user.sub}`);
        setProfile(response.data.data.user);
        setEditFullName(response.data.data.user.fullName);
        setEditEmail(response.data.data.user.email);
        setError(null);
      } catch (err) {
        setError("Failed to load user profile.");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setError(null);

    if (editPassword && editPassword !== editConfirmPassword) {
      toast.error("Password and Confirm Password do not match.");
      setEditLoading(false);
      return;
    }

    const payload = {};
    if (editFullName !== profile.fullName) payload.fullName = editFullName;
    if (editEmail !== profile.email) payload.email = editEmail;
    if (editPassword) payload.password = editPassword;

    try {
      if (Object.keys(payload).length > 0) {
        await api.patch(`/users/${user.sub}`, payload);
        toast.success("Profile updated successfully!");
        // Re-fetch profile to update UI
        const response = await api.get(`/users/${user.sub}`);
        setProfile(response.data.data.user);
      }

      if (editPicture) {
        const formData = new FormData();
        formData.append('photo', editPicture);
        await api.put(`/users/${user.sub}/profilePhotos`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success("Profile picture updated successfully!");
        const response = await api.get(`/users/${user.sub}`);
        setProfile(response.data.data.user);
      }
      setShowEditModal(false);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to update profile.";
      toast.error(errorMessage);
      console.error("Update error:", err);
    } finally {
      setEditLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setEditPicture(e.target.files[0]);
    }
  };

  const closeModal = () => {
    setShowEditModal(false);
    setEditPassword('');
    setEditConfirmPassword('');
    setEditPicture(null);
  }

  if (authLoading || loading) {
    return <div className="user-profile"><p>Loading profile...</p></div>;
  }

  if (error) {
    return <div className="user-profile"><p style={{ color: 'red' }}>Error: {error}</p></div>;
  }

  if (!profile) {
    return <div className="user-profile"><p>No profile data available.</p></div>;
  }

  return (
    <>
      <div className="user-profile">
        <div className="profile-header">
          <img
            src={profile.pictureUrl || 'https://i.pravatar.cc/100?img=47'}
            alt="User Avatar"
            className="profile-avatar"
          />
          <div className="profile-info">
            <h3>{profile.fullName}</h3>
            <p className="user-role">{profile.role}</p>
          </div>
          <button className="edit-profile-btn" onClick={() => setShowEditModal(true)}>
            <FaEdit />
          </button>
        </div>

        <div className="profile-details">
          <div className="detail-item">
            <span className="label">Email:</span>
            <span className="value">{profile.email}</span>
          </div>
          <div className="detail-item">
            <span className="label">Level Member:</span>
            <span className="value">{profile.memberLevel}</span>
          </div>
          {/* Status online/offline logic, if needed */}
          {/* <div className="detail-item">
            <span className="label">Status:</span>
            <span
              className={`value ${user.status === 'Online' ? 'online' : 'offline'}`}
            >
              {user.status}
            </span>
          </div> */}
        </div>
      </div>

      {showEditModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Profile</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label htmlFor="editFullName">Full Name</label>
                <input
                  type="text"
                  id="editFullName"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  disabled={editLoading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="editEmail">Email</label>
                <input
                  type="email"
                  id="editEmail"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  disabled={editLoading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="editPassword">New Password</label>
                <input
                  type="password"
                  id="editPassword"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  disabled={editLoading}
                  placeholder="Leave blank to keep current password"
                />
              </div>
              <div className="form-group">
                <label htmlFor="editConfirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="editConfirmPassword"
                  value={editConfirmPassword}
                  onChange={(e) => setEditConfirmPassword(e.target.value)}
                  disabled={editLoading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="editPicture">Profile Picture</label>
                <input
                  type="file"
                  id="editPicture"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={editLoading}
                />
              </div>
              <div className="modal-buttons" style={{justifyContent: 'space-between'}}>
                <button type="button" className="close" onClick={closeModal} disabled={editLoading}>
                  Cancel
                </button>
                <button type="submit" className="pay" disabled={editLoading}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ToastContainer position="top-center" autoClose={3000} />
    </>
  );
};

export default UserProfile;
