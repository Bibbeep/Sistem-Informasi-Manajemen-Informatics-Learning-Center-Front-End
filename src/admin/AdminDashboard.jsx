import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from './AdminSidebar';
import './admin.css';
import api from '../services/api'; // Import API service
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth(); // Get user from auth context
  const [stats, setStats] = useState({
    users: 0,
    programs: 0,
    certificates: 0,
    discussions: 0,
    payments: 0,
    feedbacks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    if (!user) return; // Do not fetch if user is not logged in

    setLoading(true);
    setError(null);
    try {
      const [
        usersRes,
        programsRes,
        certsRes,
        discussionsRes,
        paymentsRes,
        feedbacksRes,
      ] = await Promise.all([
        api.get('/users', { params: { limit: 1 } }),
        api.get('/programs', { params: { limit: 1 } }),
        api.get('/certificates', { params: { limit: 1 } }),
        api.get('/discussions', { params: { limit: 1 } }),
        api.get('/invoices', { params: { status: 'verified', limit: 1 } }),
        api.get('/feedbacks', { params: { limit: 1 } }),
      ]);

      setStats({
        users: usersRes.data.pagination.totalRecords,
        programs: programsRes.data.pagination.totalRecords,
        certificates: certsRes.data.pagination.totalRecords,
        discussions: discussionsRes.data.pagination.totalRecords,
        payments: paymentsRes.data.pagination.totalRecords,
        feedbacks: feedbacksRes.data.pagination.totalRecords,
      });
    } catch (err) {
      console.error("Failed to fetch admin dashboard stats:", err);
      setError("Gagal memuat statistik. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [user]); // Add user as a dependency

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div style={{ display: 'flex' }}>
      <AdminSidebar />
      <div className="admin-page scroll-hidden" style={{ flex: 1 }}>
        <h1>Admin Dashboard</h1>
        {loading ? (
          <p>Memuat statistik...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>Error: {error}</p>
        ) : (
          <div className="admin-grid">
            <div className="admin-card">
              <span className="admin-icon">👥</span>
              <div className="admin-card-content">
                <p>Total Pengguna</p>
                <h3>{stats.users}</h3>
              </div>
            </div>

            <div className="admin-card">
              <span className="admin-icon">📚</span>
              <div className="admin-card-content">
                <p>Total Program</p>
                <h3>{stats.programs}</h3>
              </div>
            </div>

            <div className="admin-card">
              <span className="admin-icon">🎓</span>
              <div className="admin-card-content">
                <p>Total Sertifikat</p>
                <h3>{stats.certificates}</h3>
              </div>
            </div>

            <div className="admin-card">
              <span className="admin-icon">💬</span>
              <div className="admin-card-content">
                <p>Total Forum</p>
                <h3>{stats.discussions}</h3>
              </div>
            </div>

            <div className="admin-card">
              <span className="admin-icon">💳</span>
              <div className="admin-card-content">
                <p>Total Payment</p>
                <h3>{stats.payments}</h3>
              </div>
            </div>

            <div className="admin-card">
              <span className="admin-icon">📩</span>
              <div className="admin-card-content">
                <p>Total Feedback</p>
                <h3>{stats.feedbacks}</h3>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
