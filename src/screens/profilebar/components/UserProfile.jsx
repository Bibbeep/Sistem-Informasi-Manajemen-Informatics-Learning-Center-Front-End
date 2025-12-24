import React, { useEffect, useState } from 'react';
import './userprofile.css';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import { FaEdit, FaEye, FaEyeSlash } from 'react-icons/fa';


  const UserProfile = () => {
  const { user, profile, setProfile, loading: authLoading } = useAuth(); // Consume profile and setProfile from context

  const [showEditModal, setShowEditModal] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [editPicture, setEditPicture] = useState(null); // For file upload
  const [picturePreview, setPicturePreview] = useState(null); // For previewing current or selected photo
  const [editLoading, setEditLoading] = useState(false);
  const [error, setError] = useState(null); // Keep local error state for edit operations

  // Initialize edit form fields when profile data becomes available or changes
  useEffect(() => {
    if (profile) {
      setEditFullName(profile.fullName);
      setEditEmail(profile.email);
      setPicturePreview(profile.pictureUrl || 'https://i.pravatar.cc/100?img=47');
    }
  }, [profile]);

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
    
    if (editPassword) {
      // Password strength validation
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
      if (!passwordRegex.test(editPassword)) {
        toast.error('Password does not meet the requirements.');
        setEditLoading(false);
        return;
      }
      payload.password = editPassword;
    }

    try {
      if (Object.keys(payload).length > 0) {
        const response = await api.patch(`/users/${user.sub}`, payload);
        toast.success("Profile updated successfully!");
        // Update global profile state in AuthContext
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
        // Explicitly re-fetch the profile to ensure we get the latest data,
        // as file upload endpoints might not return the full user object.
        const updatedProfileResponse = await api.get(`/users/${user.sub}`);
        setProfile(updatedProfileResponse.data.data.user); 
      }
      setShowEditModal(false);
    } catch (err) {
      if (err.response && err.response.status === 409) {
        toast.error("Email already in use. Please choose another.");
      } else {
        const errorMessage = err.response?.data?.message || "Failed to update profile.";
        toast.error(errorMessage);
        setError(errorMessage);
      }
      console.error("Update error:", err);
    } finally {
      setEditLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditPicture(file);
      setPicturePreview(URL.createObjectURL(file));
    }
  };

  const closeModal = () => {
    setShowEditModal(false);
    setEditPassword('');
    setEditConfirmPassword('');
    setEditPicture(null);
    // Reset edit form fields to current profile values on close
    if (profile) {
      setEditFullName(profile.fullName);
      setEditEmail(profile.email);
      setPicturePreview(profile.pictureUrl || 'https://i.pravatar.cc/100?img=47');
    }
  }

  // Use authLoading directly, no need for local loading state
  if (authLoading || !profile) { // If auth is loading or profile not yet loaded from context
    return <div className="user-profile"><p>Loading profile...</p></div>;
  }

  // Display error from local edit operations, or if AuthContext couldn't load profile
  if (error) {
    return <div className="user-profile"><p style={{ color: 'red' }}>Error: {error}</p></div>;
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
              <div className="form-group password-input-container">
                <label htmlFor="editPassword">New Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  id="editPassword"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  disabled={editLoading}
                  placeholder="Leave blank to keep current password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
                <p className="password-strength-warning">
                  Password must be at least 12 characters long and include an uppercase letter, a lowercase letter, a number, and a symbol.
                </p>
              </div>
              <div className="form-group password-input-container">
                <label htmlFor="editConfirmPassword">Confirm New Password</label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="editConfirmPassword"
                  value={editConfirmPassword}
                  onChange={(e) => setEditConfirmPassword(e.target.value)}
                  disabled={editLoading}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <div className="form-group">
                <label htmlFor="editPicture">Profile Picture</label>
                {picturePreview && (
                  <img src={picturePreview} alt="Preview" className="preview-image" />
                )}
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
