import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from './AdminSidebar';
import './admin.css';
import api from '../services/api'; // Import your API service
import { toast } from 'react-toastify';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/users', {
        params: {
          page,
          limit: 20,
        },
      });
      setUsers(response.data.data.users);
      setTotalPages(response.data.pagination.totalPages);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Gagal memuat data pengguna.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (userId) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) {
      try {
        await api.delete(`/users/${userId}`);
        toast.success("Pengguna berhasil dihapus.");
        fetchUsers(); // Refresh the user list
      } catch (err) {
        console.error("Failed to delete user:", err);
        toast.error("Gagal menghapus pengguna.");
      }
    }
  };


  return (
    <div style={{ display: 'flex' }}>
      <AdminSidebar />
      <div className="admin-page scroll-hidden" style={{ flex: 1 }}>
        <h1>Kelola Pengguna</h1>

        {loading ? (
          <p>Memuat pengguna...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>Error: {error}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Peran</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map(user => (
                  <tr key={user.id}>
                    <td>{user.fullName}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      {/* Simplified action, assuming delete is the primary action now */}
                      <button className="admin-btn payment-cancel" onClick={() => handleDelete(user.id)}>Hapus</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center' }}>Tidak ada pengguna.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        <div className="admin-pagination">
          <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;
