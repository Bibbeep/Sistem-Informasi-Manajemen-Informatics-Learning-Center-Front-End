import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './left_regis.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../../services/api';

const Left_Regis = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      toast.error('Semua kolom wajib diisi!');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Password dan konfirmasi password tidak cocok!');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', {
        fullName,
        email,
        password,
      });

      toast.success('Registrasi berhasil! Silakan login.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      const errorMessage = error.response?.data?.errors?.[0]?.message || error.response?.data?.message || 'Registrasi gagal.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="left-container">
      <div className="form-box">
        <h2>Create An Account</h2>
        <p><br /></p>
        <form className="form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={loading}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </form>

        <p className="signin-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default Left_Regis;
