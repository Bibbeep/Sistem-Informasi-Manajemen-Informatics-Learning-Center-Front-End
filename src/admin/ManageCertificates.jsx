import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from './AdminSidebar';
import AddCertificateModal from './AddCertificateModal';
import './admin.css';
import api from '../services/api';
import { toast } from 'react-toastify';

const ManageCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [viewingCert, setViewingCert] = useState(null); // For viewing certificate

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/certificates', {
        params: {
          page,
          limit: 20,
        },
      });
      let fetchedCerts = response.data.data.certificates;

      // Fetch user and program details for each certificate
      const enrichedCertPromises = fetchedCerts.map(async (cert) => {
        let userDetails = {};
        let programDetails = {};

        // Fetch user details
        try {
          const userRes = await api.get(`/users/${cert.userId}`);
          userDetails = userRes.data.data.user;
        } catch (userErr) {
          console.error(`Failed to fetch user ${cert.userId} for certificate ${cert.id}:`, userErr);
        }

        // Fetch program details
        try {
          const programRes = await api.get(`/programs/${cert.programId}`);
          programDetails = programRes.data.data.program;
        } catch (programErr) {
          console.error(`Failed to fetch program ${cert.programId} for certificate ${cert.id}:`, programErr);
        }

        return {
          ...cert,
          ownerName: userDetails.fullName || 'N/A',
          ownerEmail: userDetails.email || 'N/A',
          programName: programDetails.title || 'N/A',
          programType: programDetails.type || 'N/A',
        };
      });

      const enrichedCertificates = await Promise.all(enrichedCertPromises);
      setCertificates(enrichedCertificates);
      setTotalPages(response.data.pagination.totalPages);
    } catch (err) {
      console.error("Failed to fetch certificates:", err);
      setError("Gagal memuat data sertifikat.");
      toast.error("Gagal memuat data sertifikat.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const handleAdd = () => {
    setEditData(null);
    setShowModal(true);
  };

  const handleEdit = (cert) => {
    setEditData(cert);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus sertifikat ini?')) {
      try {
        await api.delete(`/certificates/${id}`);
        toast.success("Sertifikat berhasil dihapus.");
        fetchCertificates(); // Refresh list
      } catch (err) {
        console.error("Failed to delete certificate:", err);
        toast.error("Gagal menghapus sertifikat.");
      }
    }
  };

  // handleSave will be re-implemented later
  const handleSave = () => {
    setShowModal(false);
    fetchCertificates();
  };

  const handleView = (cert) => {
    setViewingCert(cert);
  };


  const formatTanggal = (tanggal) => {
    if (!tanggal) return '–';
    const dateObj = new Date(tanggal);
    if (isNaN(dateObj)) return tanggal; // fallback kalau bukan tanggal valid

    return dateObj.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div style={{ display: 'flex' }}>
      <AdminSidebar />
      <div className="admin-page scroll-hidden" style={{ flex: 1 }}>
        <h1>Kelola Sertifikat</h1>
        <div className="admin-actions">
          <button className="admin-btn add" onClick={handleAdd}>
            Tambah Sertifikat
          </button>
        </div>
        
        {loading ? (
          <p>Memuat sertifikat...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>Error: {error}</p>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nama Sertifikat</th>
                  <th>Nama Pemilik</th>
                  <th>Email Pemilik</th>
                  <th>Nama Program</th>
                  <th>Tipe Program</th>
                  <th>Tanggal Terbit</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert) => (
                  <tr key={cert.id}>
                    <td>{cert.title}</td>
                    <td>{cert.ownerName}</td>
                    <td>{cert.ownerEmail}</td>
                    <td>{cert.programName}</td>
                    <td>{cert.programType}</td>
                    <td>{formatTanggal(cert.issuedAt)}</td>
                    <td>
                      <button className="admin-btn" onClick={() => handleView(cert)}>Lihat</button>
                      <button className="admin-btn edit" onClick={() => handleEdit(cert)}>Update</button>
                      <button className="admin-btn delete" onClick={() => handleDelete(cert.id)}>Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

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
          </>
        )}

        {showModal && (
          <AddCertificateModal
            onClose={() => setShowModal(false)}
            onSave={handleSave}
            defaultData={editData}
          />
        )}

        {viewingCert && (
          <div className="modal-overlay" onClick={() => setViewingCert(null)}>
            <div className="modal-box certificate-modal-box" onClick={(e) => e.stopPropagation()}>
              <h3>{viewingCert.title}</h3>
              {viewingCert.documentUrl ? (
                <iframe src={viewingCert.documentUrl} width="100%" height="100%" style={{border: 'none'}} title={viewingCert.title}></iframe>
              ) : (
                <p>No document available for this certificate.</p>
              )}
              <div className="modal-actions" style={{justifyContent: 'center'}}>
                <button className="admin-btn delete" onClick={() => setViewingCert(null)}>
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCertificates;
