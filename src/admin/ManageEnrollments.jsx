import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from './AdminSidebar';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import useDebounce from '../hooks/useDebounce'; // Import useDebounce
import { useAuth } from '../context/AuthContext'; // Import useAuth
import './admin.css';

const ManageEnrollments = () => {
    const { user } = useAuth(); // Get user from auth context
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [enrollments, setEnrollments] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingEnrollments, setLoadingEnrollments] = useState(false);
    const navigate = useNavigate();

    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoadingUsers(true);
            try {
                const params = { limit: 5 };
                if (debouncedSearchQuery) {
                    params.q = debouncedSearchQuery;
                }
                const response = await api.get('/users', { params });
                setUsers(response.data.data.users);
            } catch (error) {
                toast.error("Gagal memuat daftar pengguna.");
                console.error("Failed to fetch users:", error);
            } finally {
                setLoadingUsers(false);
            }
        };
        fetchUsers();
    }, [debouncedSearchQuery]);

    const fetchEnrollments = useCallback(async () => {
        if (!selectedUser) {
            setEnrollments([]);
            return;
        }
        setLoadingEnrollments(true);
        try {
            const response = await api.get(`/enrollments?userId=${selectedUser.id}&limit=100`);
            setEnrollments(response.data.data.enrollments);
        } catch (error) {
            toast.error("Gagal memuat data pendaftaran.");
            console.error("Failed to fetch enrollments:", error);
        } finally {
            setLoadingEnrollments(false);
        }
    }, [selectedUser]);

    useEffect(() => {
        fetchEnrollments();
    }, [fetchEnrollments]);

    const handleUserSelect = (user) => {
        setSelectedUser(user);
        setSearchQuery(''); // Clear search after selection
        setUsers([]); // Hide the search results
    };
    
    const handleMarkComplete = async (enrollmentId) => {
        if (window.confirm('Yakin ingin menandai program ini sebagai selesai?')) {
            try {
                await api.patch(`/enrollments/${enrollmentId}`, { status: 'Completed' });
                toast.success("Program berhasil ditandai selesai.");
                fetchEnrollments(); // Refresh the list
            } catch (err) {
                toast.error("Gagal menandai program selesai.");
                console.error("Failed to mark as complete:", err);
            }
        }
    };
    
    const handleManageModules = (enrollmentId) => {
        navigate(`/admin/manage-enrollment-modules/${enrollmentId}`);
    };

    return (
        <div style={{ display: 'flex' }}>
            <AdminSidebar />
            <div className="admin-page scroll-hidden" style={{ flex: 1 }}>
                <h1>Kelola Pendaftaran Pengguna</h1>

                <div className="admin-actions">
                    <div className="form-group">
                        <label htmlFor="user-search">Cari Pengguna:</label>
                        <input
                            type="text"
                            id="user-search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Ketik nama atau email..."
                        />
                        {loadingUsers && <p>Mencari...</p>}
                        {users.length > 0 && searchQuery && (
                            <ul className="user-search-results">
                                {users.map(user => (
                                    <li key={user.id} onClick={() => handleUserSelect(user)}>
                                        {user.fullName} ({user.email})
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {selectedUser && (
                    <div className="selected-user-info">
                        <h3>Pendaftaran untuk: {selectedUser.fullName}</h3>
                    </div>
                )}
                
                {loadingEnrollments ? (
                    <p>Memuat pendaftaran...</p>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Judul Program</th>
                                <th>Tipe</th>
                                <th>Status</th>
                                <th>Progress</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {enrollments.map((enrollment) => {
                                console.log('Checking enrollment:', {
                                    id: enrollment.id,
                                    programType: enrollment.programType,
                                    status: enrollment.status,
                                    isNotInCourse: enrollment.programType !== 'Course',
                                    isInProgress: enrollment.status.toLowerCase() === 'in progress',
                                    isAdmin: user?.isAdmin
                                });
                                return (
                                <tr key={enrollment.id}>
                                    <td>{enrollment.programTitle}</td>
                                    <td>{enrollment.programType}</td>
                                    <td>{enrollment.status}</td>
                                    <td>{parseFloat(enrollment.progressPercentage).toFixed(0)}%</td>
                                                                        <td>
                                                                            {enrollment.programType !== 'Course' && enrollment.status.toLowerCase() === 'in progress' && (
                                                                                <button className="admin-btn add" onClick={() => handleMarkComplete(enrollment.id)}>
                                                                                    Tandai Selesai
                                                                                </button>
                                                                            )}
                                                                            {enrollment.programType === 'Course' && (
                                                                                <button className="admin-btn edit" onClick={() => handleManageModules(enrollment.id)}>
                                                                                    Kelola Modul
                                                                                </button>
                                                                            )}
                                                                        </td>                                </tr>
                            )})}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ManageEnrollments;
