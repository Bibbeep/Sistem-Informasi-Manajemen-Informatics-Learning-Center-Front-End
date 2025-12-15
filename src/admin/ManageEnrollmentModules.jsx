import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import api from '../services/api';
import { toast } from 'react-toastify';
import { FaCheckCircle } from 'react-icons/fa';
import './admin.css';

const ManageEnrollmentModules = () => {
    const { enrollmentId } = useParams();
    const navigate = useNavigate();
    const [enrollment, setEnrollment] = useState(null);
    const [modules, setModules] = useState([]);
    const [completedModules, setCompletedModules] = useState(new Set());
    const [loading, setLoading] = useState(true);

    const fetchEnrollmentDetails = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch enrollment details to get programId and completed modules
            const enrollmentRes = await api.get(`/enrollments/${enrollmentId}`);
            const enrollmentData = enrollmentRes.data.data.enrollment;
            setEnrollment(enrollmentData);
            if (enrollmentData.completedModules) {
                setCompletedModules(new Set(enrollmentData.completedModules.map(m => m.courseModuleId)));
            }

            // Fetch all modules for that program
            const modulesRes = await api.get(`/programs/${enrollmentData.programId}/modules`);
            setModules(modulesRes.data.data.modules);
        } catch (error) {
            toast.error("Gagal memuat detail pendaftaran.");
            console.error("Failed to fetch enrollment details:", error);
        } finally {
            setLoading(false);
        }
    }, [enrollmentId]);

    useEffect(() => {
        fetchEnrollmentDetails();
    }, [fetchEnrollmentDetails]);

    const handleMarkModuleComplete = async (moduleId) => {
        if (completedModules.has(moduleId)) {
            toast.info("Modul ini sudah selesai.");
            return;
        }

        try {
            await api.post(`/enrollments/${enrollmentId}/completed-modules`, { courseModuleId: moduleId });
            toast.success("Modul berhasil ditandai selesai.");
            // Refresh the data
            fetchEnrollmentDetails();
        } catch (error) {
            toast.error("Gagal menandai modul selesai.");
            console.error("Failed to mark module complete:", error);
        }
    };

    return (
        <div style={{ display: 'flex' }}>
            <AdminSidebar />
            <div className="admin-page scroll-hidden" style={{ flex: 1 }}>
                <h1>Kelola Modul Pendaftaran</h1>
                <button className="admin-btn delete" onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
                    Kembali
                </button>

                {loading ? (
                    <p>Memuat modul...</p>
                ) : (
                    <div>
                        <h2>{enrollment?.programTitle}</h2>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Kode Modul</th>
                                    <th>Judul Modul</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {modules.map(module => (
                                    <tr key={module.id}>
                                        <td>{module.numberCode}</td>
                                        <td>{module.title}</td>
                                        <td>
                                            {completedModules.has(module.id) ? (
                                                <FaCheckCircle style={{ color: 'green' }} />
                                            ) : (
                                                'Belum Selesai'
                                            )}
                                        </td>
                                        <td>
                                            {!completedModules.has(module.id) && (
                                                <button 
                                                    className="admin-btn add"
                                                    onClick={() => handleMarkModuleComplete(module.id)}
                                                >
                                                    Tandai Selesai
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageEnrollmentModules;
