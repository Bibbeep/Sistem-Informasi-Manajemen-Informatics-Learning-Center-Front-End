import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from './AdminSidebar';
import './admin.css';
import api from '../services/api';
import { toast } from 'react-toastify';
import EditUserModal from './EditUserModal';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState(''); // State for search input
  const [ftsQuery, setFtsQuery] = useState(''); // State for triggering FTS API call
  const [editingUser, setEditingUser] = useState(null); // State for user being edited
  const [roleFilter, setRoleFilter] = useState(''); // State for role filter
  const abortControllerRef = React.useRef(null);


    const fetchUsers = useCallback(async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setLoading(true);
        setError(null);
        try {
            const params = {
                page,
                limit: 20,
            };
            if (ftsQuery) {
                params.q = ftsQuery;
            }
            if (roleFilter) {
                params.role = roleFilter.toLowerCase();
            }
            const response = await api.get('/users', { 
                params,
                signal: abortControllerRef.current.signal,
            });
            setUsers(response.data.data.users);
            setTotalPages(response.data.pagination.totalPages);
        } catch (err) {
            if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
                return;
            }
            console.error("Failed to fetch users:", err);
            setError("Gagal memuat data pengguna.");
        } finally {
            if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
                setLoading(false);
            }
        }
    }, [page, ftsQuery, roleFilter]); // Re-fetch when page or ftsQuery changes

    useEffect(() => {
        fetchUsers();
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        }
    }, [fetchUsers]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFtsQuery(searchQuery); // Set FTS query from current input
    setPage(1); // Reset page on new search
  };

  const handleEdit = (user) => {
    setEditingUser(user);
  };

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

        <div className="admin-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <form onSubmit={handleSearchSubmit} className="admin-search-form" style={{ flexGrow: 1 }}>
            <input
              type="text"
              placeholder="Cari pengguna..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-search-input"
            />
            <button type="submit" className="admin-btn add">Cari</button>
          </form>
          <div className="filter-group">
            <label htmlFor="role-filter" style={{ marginRight: '5px', fontWeight: '600', color: '#0d3b66' }}>Filter Role:</label>
            <select
              id="role-filter"
              className="admin-select"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1); // Reset page when filter changes
              }}
            >
              <option value="">All</option>
              <option value="Admin">Admin</option>
              <option value="User">User</option>
            </select>
          </div>
        </div>

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
                      <button className="admin-btn edit" onClick={() => handleEdit(user)} style={{marginRight: '5px'}}>Update</button>
                      <button className="admin-btn delete" onClick={() => handleDelete(user.id)}>Hapus</button>
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

        {editingUser && (
          <EditUserModal
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onSave={fetchUsers}
          />
        )}
      </div>
    </div>
  );
};

export default ManageUsers;
