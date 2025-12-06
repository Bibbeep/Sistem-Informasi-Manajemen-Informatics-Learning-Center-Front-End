import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './left.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';

const Left = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Email tidak boleh kosong!');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Format email tidak valid!');
      return;
    }
    if (!password) {
      toast.error('Password tidak boleh kosong!');
      return;
    }

    setLoading(true);
    try {
      const { user } = await login(email, password); // Destructure to get the user object
      toast.success('Login berhasil!');
      setTimeout(() => {
        // Use the admin property from the user object for redirection
        navigate(user.admin ? '/admin/dashboard' : '/dashboard');
      }, 1000);
    } catch (error) {
      let errorMessage = 'Terjadi kesalahan. Silakan coba lagi.';
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Email atau password salah.';
        } else if (error.response.status === 400) {
          const errors = error.response.data?.errors;
          if (errors && errors.length > 0) {
            errorMessage = errors.map(err => err.message).join('; ');
          } else {
            errorMessage = error.response.data?.message || 'Permintaan tidak valid.';
          }
        } else {
          errorMessage = error.response.data?.message || 'Gagal login karena kesalahan server.';
        }
      } else if (error.request) {
        errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error('Email tidak boleh kosong!');
      return;
    }

    setForgotLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email: forgotEmail });
      
      toast.success(response.data.message || 'Jika email terdaftar, instruksi reset password telah dikirim.');
      setForgotMode(false);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Gagal mengirim instruksi reset password.';
      toast.error(errorMessage);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="form-box">
        {!forgotMode ? (
          <>
            <h2>Login To Your Account</h2>
            <br/>
            <form className="form" onSubmit={handleSubmit}>
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
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Loading...' : 'Login'}
              </button>
            </form>

            <p
              className="forgot-password-link"
              style={{ cursor: 'pointer', color: 'blue', marginTop: '10px' }}
              onClick={() => setForgotMode(true)}
            >
              Lupa Password?
            </p>

            <p className="signup-link">
              Don't have an account? <Link to="/register">Sign up</Link>
            </p>
          </>
        ) : (
          <>
            <h2>Reset Password</h2>
            <p style={{ marginBottom: '30px' }}>
              Masukkan email Anda untuk menerima link reset password.
            </p>
            <form className="form" onSubmit={handleForgotSubmit}>
              <input
                type="email"
                placeholder="Email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                disabled={forgotLoading}
              />
              <button type="submit" className="submit-btn" disabled={forgotLoading}>
                {forgotLoading ? 'Mengirim...' : 'Kirim Link Reset'}
              </button>
            </form>
            <p
              className="forgot-password-link"
              style={{ cursor: 'pointer', color: 'blue', marginTop: '10px' }}
              onClick={() => setForgotMode(false)}
            >
              Kembali ke Login
            </p>
          </>
        )}
      </div>

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default Left;
