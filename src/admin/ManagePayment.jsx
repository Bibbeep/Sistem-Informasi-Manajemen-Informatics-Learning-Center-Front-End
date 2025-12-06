import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from './AdminSidebar';
import './admin.css';
import api from '../services/api';
import { toast } from 'react-toastify';

const formatRupiah = (angka) => {
  if (angka === null || angka === undefined || Number(angka) === 0) return 'Gratis';
  const number = Number(angka);
  return 'Rp. ' + number.toLocaleString('id-ID');
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const options = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  return date.toLocaleDateString('id-ID', options);
};

const ManagePayment = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all'); // 'all', 'verified', 'unverified', 'expired'

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/invoices', {
        params: {
          page,
          limit: 20, // Or another suitable limit
          status: filter,
          sort: '-createdAt',
        },
      });
      let fetchedInvoices = response.data.data.invoices;

      // Fetch user full name for each invoice
      const enrichedInvoicesPromises = fetchedInvoices.map(async (invoice) => {
        let userFullName = 'N/A';
        try {
          const userRes = await api.get(`/users/${invoice.userId}`);
          userFullName = userRes.data.data.user.fullName;
        } catch (userErr) {
          console.error(`Failed to fetch user ${invoice.userId} for invoice ${invoice.id}:`, userErr);
        }
        return { ...invoice, userFullName };
      });

      const enrichedInvoices = await Promise.all(enrichedInvoicesPromises);
      setInvoices(enrichedInvoices);
      setTotalPages(response.data.pagination.totalPages);
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
      setError("Gagal memuat data pembayaran.");
      toast.error("Gagal memuat data pembayaran.");
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleVerifyPayment = async (invoiceId) => {
    if (window.confirm('Yakin ingin memverifikasi pembayaran ini?')) {
      try {
        await api.post(`/invoices/${invoiceId}/payments`);
        toast.success("Pembayaran berhasil diverifikasi.");
        fetchInvoices(); // Refresh the list
      } catch (err) {
        console.error("Failed to verify payment:", err);
        toast.error(err.response?.data?.message || "Gagal memverifikasi pembayaran.");
      }
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (window.confirm('Yakin ingin menghapus invoice ini?')) {
      try {
        await api.delete(`/invoices/${invoiceId}`);
        toast.success("Invoice berhasil dihapus.");
        fetchInvoices(); // Refresh the list
      } catch (err) {
        console.error("Failed to delete invoice:", err);
        toast.error(err.response?.data?.message || "Gagal menghapus invoice.");
      }
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <AdminSidebar />
      <div className="admin-page scroll-hidden" style={{ flex: 1 }}>
        <h1>Kelola Pembayaran</h1>

        <div className="admin-filter-controls">
          {['all', 'verified', 'unverified', 'expired'].map((status) => (
            <button
              key={status}
              className={`admin-filter-btn ${filter === status ? 'active' : ''}`}
              onClick={() => { setFilter(status); setPage(1); }}
            >
              {status === 'all' ? 'Semua' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        
        {loading ? (
          <p>Memuat data pembayaran...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>Error: {error}</p>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nama Pengguna</th>
                  <th>Judul Program</th>
                  <th>Jenis Program</th>
                  <th>Total Pembayaran</th>
                  <th>Jatuh Tempo</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length > 0 ? (
                  invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>{invoice.userFullName}</td>
                      <td>{invoice.programTitle}</td>
                      <td>{invoice.programType}</td>
                      <td>{formatRupiah(invoice.amountIdr)}</td>
                      <td>{formatDate(invoice.paymentDueDatetime)}</td>
                      <td>{invoice.status}</td>
                      <td>
                        {invoice.status === 'unverified' && (
                          <button className="admin-btn payment-verify" onClick={() => handleVerifyPayment(invoice.id)}>
                            Verifikasi
                          </button>
                        )}
                        <button className="admin-btn delete" onClick={() => handleDeleteInvoice(invoice.id)}>
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center' }}>Tidak ada data pembayaran.</td>
                  </tr>
                )}
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
      </div>
    </div>
  );
};

export default ManagePayment;
