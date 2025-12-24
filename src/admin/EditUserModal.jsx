import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './modals.css';

const EditUserModal = ({ user, onClose, onSave }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [picturePreview, setPicturePreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPicturePreview(user.pictureUrl || null);
    }
  }, [user]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicture(file);
      setPicturePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Update text fields
      const payload = {};
      if (fullName !== user.fullName) payload.fullName = fullName;
      if (email !== user.email) payload.email = email;
      if (password) {
        // Password strength validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
        if (!passwordRegex.test(password)) {
          toast.error('Password does not meet the requirements.');
          setLoading(false);
          return;
        }
        payload.password = password;
      }

      if (Object.keys(payload).length > 0) {
        await api.patch(`/users/${user.id}`, payload);
      }

      // 2. Update profile picture
      if (profilePicture) {
        const formData = new FormData();
        formData.append('photo', profilePicture);
        await api.put(`/users/${user.id}/profilePhotos`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      toast.success("User updated successfully!");
      onSave(); // Refresh list
      onClose();
    } catch (err) {
      console.error("Failed to update user:", err);
      if (err.response && err.response.status === 409) {
        toast.error("Email already in use. Please choose another.");
      } else {
        toast.error(err.response?.data?.message || "Failed to update user.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3>Update User</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          
          {/* Profile Picture */}
          <div className="form-group" style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '10px' }}>
              <img 
                src={picturePreview || 'https://i.pravatar.cc/120?img=default'} 
                alt="Profile Preview" 
                style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ccc' }}
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://i.pravatar.cc/120?img=default'; }}
              />
            </div>
            <label htmlFor="profilePicture" style={{ cursor: 'pointer', color: '#3b82f6', fontWeight: 'bold' }}>
              Change Picture
            </label>
            <input
              type="file"
              id="profilePicture"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label>New Password (Optional)</label>
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Leave blank to keep current"
                          />
                          <p className="password-strength-warning">
                            Password must be at least 12 characters long and include an uppercase letter, a lowercase letter, a number, and a symbol.
                          </p>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '35px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#666'
                          }}
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
          <div className="modal-actions">
            <button type="submit" className="admin-btn add" disabled={loading}>
              {loading ? 'Saving...' : 'Update'}
            </button>
            <button type="button" className="admin-btn delete" onClick={onClose} disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
