import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../sidebar/Sidebar';
import ProfileBar from '../profilebar/ProfileBar';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import './payment.css'; // Reuse payment styles

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

const InvoiceDetailPage = () => {
  const { id: invoiceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!invoiceId || !user || !user.sub) {
      if (!user) setError("Please log in to view this page.");
      else setError("Invoice ID not found.");
      setLoading(false);
      return;
    }

    const fetchInvoiceDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/invoices/${invoiceId}`);
        setInvoice(response.data.data.invoice);
      } catch (err) {
        setError("Failed to load invoice details.");
        console.error("Fetch error:", err);
        toast.error("Gagal memuat detail invoice.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceDetails();
  }, [invoiceId, user]);

  if (loading) {
    return (
      <div className="payment-container">
        <Sidebar />
        <div className="payment-main">
          <div className="payment-box">
            <h2>Memuat Invoice...</h2>
          </div>
        </div>
        <ProfileBar />
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-container">
        <Sidebar />
        <div className="payment-main">
          <div className="payment-box">
            <h2>Error</h2>
            <p style={{ color: 'red' }}>{error}</p>
            <button className="pay-button" onClick={() => navigate(-1)}>Kembali</button>
          </div>
        </div>
        <ProfileBar />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="payment-container">
        <Sidebar />
        <div className="payment-main">
          <div className="payment-box">
            <h2>Invoice Tidak Ditemukan</h2>
            <button className="pay-button" onClick={() => navigate(-1)}>Kembali</button>
          </div>
        </div>
        <ProfileBar />
      </div>
    );
  }

  return (
    <div className="payment-container">
      <Sidebar />
      <div className="payment-main">
        <div className="payment-box">
          <h2>Detail Invoice</h2>

          <div className="payment-summary">
            <div className="payment-row">
              <span>Program</span>
              <strong>{invoice.programTitle}</strong>
            </div>
            <div className="payment-row">
              <span>Jenis</span>
              <strong>{invoice.programType}</strong>
            </div>
            <div className="payment-row">
              <span>Total</span>
              <strong>{formatRupiah(invoice.amountIdr)}</strong>
            </div>
            <div className="payment-row">
              <span>Nomor Virtual Account</span>
              <strong>{invoice.virtualAccountNumber || 'N/A'}</strong>
            </div>
            <div className="payment-row">
              <span>Jatuh Tempo</span>
              <strong>{formatDate(invoice.paymentDueDatetime)}</strong>
            </div>
            <div className="payment-row">
              <span>Status</span>
              <strong>{invoice.status}</strong>
            </div>
            {invoice.payment && (
              <>
                <div className="payment-row">
                  <span>Tanggal Pembayaran</span>
                  <strong>{formatDate(invoice.payment.createdAt)}</strong>
                </div>
                <div className="payment-row">
                  <span>Jumlah Dibayar</span>
                  <strong>{formatRupiah(invoice.payment.amountPaidIdr)}</strong>
                </div>
              </>
            )}
          </div>

          {invoice.status === 'verified' ? (
            <>
              <button className="pay-button" onClick={() => navigate(`/materi/detail/${invoice.programId}`)}>
                Lihat Enrollment
              </button>
              <button className="pay-button close-detail-button" onClick={() => navigate(-1)}>
                Kembali
              </button>
            </>
          ) : (
            <>
              <div className="payment-instructions">
                <p><strong>Catatan:</strong></p>
                {invoice.status === 'unverified' ? (
                  <p style={{color: 'orange', fontWeight: 'bold'}}>Menunggu konfirmasi pembayaran.</p>
                ) : (
                  <p style={{color: 'red', fontWeight: 'bold'}}>Pembayaran telah {invoice.status}.</p>
                )}
              </div>
              <button className="pay-button" onClick={() => navigate(-1)}>Kembali</button>
            </>
          )}
        </div>
      </div>
      <ProfileBar />
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default InvoiceDetailPage;
