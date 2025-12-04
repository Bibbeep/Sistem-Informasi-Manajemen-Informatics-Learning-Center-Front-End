import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../services/api';
import Right from '../login/components/Right';
import '../login/login.css'; 
import '../login/components/left.css';

const ResetPasswordForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const userIdParam = searchParams.get('userId');

    if (!tokenParam || !userIdParam) {
      setError('Token atau User ID tidak valid. Silakan gunakan link dari email Anda.');
      setIsValid(false);
    } else {
      setToken(tokenParam);
      setUserId(userIdParam);
      setIsValid(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) {
        toast.error(error);
        return;
    }
    if (!newPassword || !confirmPassword) {
      toast.error('Semua kolom wajib diisi!');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Password tidak cocok!');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', {
        userId: parseInt(userId, 10),
        token,
        newPassword,
        confirmNewPassword: confirmPassword,
      });

      toast.success(response.data.message || 'Password berhasil direset! Anda akan diarahkan ke halaman login.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      let errorMessage = 'Reset password gagal. Silakan coba lagi.';
      if (err.response) {
        if (err.response.status === 400 && err.response.data?.errors?.length > 0) {
          errorMessage = err.response.data.errors.map(e => e.message).join('; ');
        } else {
          errorMessage = err.response.data?.message || 'Token mungkin tidak valid atau telah kedaluwarsa.';
        }
      } else if (err.request) {
        errorMessage = 'Tidak dapat terhubung ke server.';
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="form-box">
        <h2>Buat Password Baru</h2>
        <br/>
        {!isValid ? (
          <p className="error-message" style={{color: 'red'}}>{error}</p>
        ) : (
          <form className="form" onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="Password Baru"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Konfirmasi Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Reset Password'}
            </button>
          </form>
        )}
         <p className="signin-link" style={{ marginTop: '20px' }}>
          Kembali ke <Link to="/login">Sign in</Link>
        </p>
      </div>
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};


const ResetPasswordPage = () => {
    return (
        <div className="login-page">
            <div className="main-content">
                <ResetPasswordForm />
                <Right />
            </div>
        </div>
    )
}

export default ResetPasswordPage;
