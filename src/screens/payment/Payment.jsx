import React, { useEffect, useState, useRef, useCallback } from 'react';
import Sidebar from '../sidebar/Sidebar';
import './payment.css';
import { useNavigate } from 'react-router-dom';
import ProfileBar from '../profilebar/ProfileBar';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // This line was added/ensured

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

const Payment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedProgramFromLS, setSelectedProgramFromLS] = useState(null); // Stores program details for current invoice
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState(null);
  const [currentInvoice, setCurrentInvoice] = useState(null); // The invoice being processed or viewed in modal
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const pollingIntervalRef = useRef(null);
  const [paymentConfirmationLoading, setPaymentConfirmationLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false); // State to control modal visibility
  const [timeLeft, setTimeLeft] = useState(null); // State for countdown timer

  // --- Fetch Payment History ---
  const fetchPaymentHistory = useCallback(async () => {
    if (!user || !user.sub) {
        setHistoryError("Silakan login untuk melihat riwayat pembayaran.");
        setFetchingHistory(false);
        return;
    }
    setFetchingHistory(true);
    setHistoryError(null);
    try {
      const response = await api.get('/invoices', {
        params: { userId: user.sub, limit: 10, sort: '-paymentDue' },
      });
      setPaymentHistory(response.data.data.invoices);
    } catch (err) {
      setHistoryError("Gagal memuat riwayat pembayaran.");
      console.error("Fetch history error:", err);
    } finally {
      setFetchingHistory(false);
    }
  }, [user]); // 'user' is a dependency for fetchPaymentHistory

  // --- Countdown Effect ---
  useEffect(() => {
    let timerInterval;

    const calculateTimeLeft = () => {
      if (currentInvoice && currentInvoice.paymentDueDatetime && currentInvoice.status?.toLowerCase() === 'unverified') {
        const paymentDue = new Date(currentInvoice.paymentDueDatetime).getTime();
        const now = new Date().getTime();
        const distance = paymentDue - now;

        if (distance < 0) {
          setTimeLeft("00:00:00");
          clearInterval(timerInterval);
          // Optionally, trigger a fetch for updated invoice status if it has expired
          fetchPaymentHistory(); // <--- This line caused the error due to hoisting
          return;
        }

        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeLeft(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );
      } else {
        setTimeLeft(null); // Clear countdown if not unverified or no due date
      }
    };

    calculateTimeLeft(); // Initial calculation
    timerInterval = setInterval(calculateTimeLeft, 1000);

    return () => {
      clearInterval(timerInterval);
    };
  }, [currentInvoice, fetchPaymentHistory]);

  // --- Dismiss toasts on unmount ---
  useEffect(() => {
    return () => {
      toast.dismiss();
    };
  }, []);

  // --- Initial Enrollment Creation / History Fetch ---
  useEffect(() => {
    const programId = localStorage.getItem('selectedProgramIdForModal');
    localStorage.removeItem('selectedProgramIdForModal'); // Clear it after reading

    if (programId && user && user.sub && !enrollmentLoading) {
      const createEnrollment = async () => {
        setEnrollmentLoading(true);
        setEnrollmentError(null);
        try {
          // Fetch program details to get full info for display
          const programRes = await api.get('/programs', { params: { id: programId } });
          const programDetails = programRes.data.data.programs[0];
          setSelectedProgramFromLS(programDetails);

          // Create enrollment
          const enrollmentRes = await api.post('/enrollments', { programId: parseInt(programId, 10) });
          const { invoice } = enrollmentRes.data.data;
          
          toast.success("Enrollment created successfully!");

          if (invoice) {
            setCurrentInvoice(invoice);
            setShowDetailModal(true); // Show detail modal if invoice is created
            toast.info("Program berbayar. Selesaikan pembayaran!");
          } else {
            // Free program, direct to materi
            toast.success("Program gratis. Selamat belajar!");
            setTimeout(() => { // Add small delay before navigation
              navigate(`/materi/detail/${programDetails.id}`);
            }, 100);
          }
        } catch (err) {
          let msg = "Gagal membuat enrollment. Mohon coba lagi.";
          if (err.response) {
            if (err.response.status === 400 && err.response.data?.errors?.length > 0) {
              msg = err.response.data.errors.map(e => e.message).join('; ');
            } else {
              msg = err.response.data?.message || msg;
            }
          } else if (err.request) {
            msg = "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
          }
          setEnrollmentError(msg);
          toast.error(msg);
          console.error("Enrollment error:", err);
        } finally {
          setEnrollmentLoading(false);
        }
      };
      createEnrollment();
    } else if (!programId && user && user.sub) {
        // If no programId in LS, just fetch history
        fetchPaymentHistory();
    } else if (!user) {
        // If not logged in, cannot create enrollment or fetch history
        setFetchingHistory(false);
        setEnrollmentLoading(false);
        setEnrollmentError("Silakan login untuk melihat riwayat pembayaran.");
    }
  }, [user, enrollmentLoading, fetchPaymentHistory, navigate]);

  // --- Invoice Polling Effect ---
  useEffect(() => {
    if (currentInvoice && currentInvoice.status === 'unverified' && user && user.sub) {
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const response = await api.get(`/invoices/${currentInvoice.id}`);
          const updatedInvoice = response.data.data.invoice;
          setCurrentInvoice(updatedInvoice);

          if (updatedInvoice.status === 'verified') {
            clearInterval(pollingIntervalRef.current);
            toast.success("Pembayaran terverifikasi! Selamat belajar.");
            setTimeout(() => { // Add small delay before navigation
                navigate(`/materi/detail/${updatedInvoice.programId}`);
            }, 100);
          } else if (updatedInvoice.status === 'expired') {
            clearInterval(pollingIntervalRef.current);
            toast.error("Pembayaran kedaluwarsa. Silakan coba lagi.");
            setCurrentInvoice(null); // Clear invoice to show history
            setShowDetailModal(false); // Hide modal
            fetchPaymentHistory();
          }
        } catch (err) {
          console.error("Error polling invoice status:", err);
          // Don't show toast for every poll error, just log
        }
      }, 5000); // Poll every 5 seconds
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [currentInvoice, user, fetchPaymentHistory, navigate]);
  
  // --- Handle 'Saya Sudah Bayar' Click ---
  const handlePayNowConfirmation = async () => {
    if (!currentInvoice || !user || !user.sub) {
      toast.error("Tidak dapat memproses pembayaran. Data tidak lengkap.");
      return;
    }
    setPaymentConfirmationLoading(true);
    try {
      await api.post(`/invoices/${currentInvoice.id}/payments`);
      toast.success("Konfirmasi pembayaran berhasil dikirim. Menunggu verifikasi...");
      
      // Fetch the updated invoice immediately after confirmation is sent
      const response = await api.get(`/invoices/${currentInvoice.id}`);
      const updatedInvoice = response.data.data.invoice;
      setCurrentInvoice(updatedInvoice); // This will re-render the modal with updated status

      // If the invoice is already verified (e.g., instant payment processing),
      // we can navigate directly
      if (updatedInvoice.status?.toLowerCase() === 'verified') {
        toast.success("Pembayaran terverifikasi! Selamat belajar.");
        setTimeout(() => {
            navigate(`/materi/detail/${updatedInvoice.programId}`);
        }, 100);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal mengirim konfirmasi pembayaran.";
      toast.error(msg);
      console.error("Payment confirmation error:", err);
    } finally {
      setPaymentConfirmationLoading(false);
    }
  };

  const handleInvoiceRowClick = async (invoiceItem) => {
    // For all statuses (verified, unverified, expired), show the payment details modal
    setCurrentInvoice(invoiceItem);
    // Need to fetch the program details for selectedProgramFromLS for the modal
    try {
      const programRes = await api.get('/programs', { params: { id: invoiceItem.programId } });
      setSelectedProgramFromLS(programRes.data.data.programs[0]);
      setShowDetailModal(true); // Show detail modal
    } catch (err) {
      toast.error("Gagal memuat detail program untuk invoice.");
      console.error("Fetch program for invoice error:", err);
    }
  };

  const closeModal = () => {
    setShowDetailModal(false);
    setCurrentInvoice(null);
    setSelectedProgramFromLS(null);
  }

  const handleBuyAgain = (programId) => {
    localStorage.setItem('selectedProgramIdForModal', programId);
    navigate('/programs');
    closeModal();
  }

  return (
    <div className="payment-container">
      <Sidebar />
      <div className="payment-main">
        {enrollmentLoading ? (
          <div className="payment-box">
            <h2>Memproses Pendaftaran...</h2>
            <p>Mohon tunggu sebentar.</p>
          </div>
        ) : enrollmentError ? (
          <div className="payment-box">
            <h2>Pendaftaran Gagal</h2>
            <p style={{ color: 'red' }}>Error: {enrollmentError}</p>
            <button className="pay-button" onClick={() => navigate('/programs')}>Lihat Program Lain</button>
            <button className="pay-button" onClick={fetchPaymentHistory}>Lihat Riwayat Pembayaran</button>
          </div>
        ) : showDetailModal && currentInvoice && selectedProgramFromLS ? ( /* Render modal if showDetailModal is true */
          <div className="payment-box">
            <h2>Detail Pembayaran</h2>
            {console.log('Rendering Modal - currentInvoice:', currentInvoice)}
            {console.log('Rendering Modal - selectedProgramFromLS:', selectedProgramFromLS)}
            {console.log('Rendering Modal - currentInvoice.status:', currentInvoice?.status)}
            {console.log('Rendering Modal - currentInvoice.payment:', currentInvoice?.payment)}
            {currentInvoice.status?.toLowerCase() === 'verified' ? (
                <>
                    <p className="payment-desc">
                        Pembayaran Anda untuk program {selectedProgramFromLS.title} telah terverifikasi.
                    </p>
                    <div className="payment-summary">
                        <div className="payment-row">
                            <span>Program</span>
                            <strong>{selectedProgramFromLS.title}</strong>
                        </div>
                        <div className="payment-row">
                            <span>Jenis</span>
                            <strong>{selectedProgramFromLS.type}</strong>
                        </div>
                        <div className="payment-row">
                            <span>Total</span>
                            <strong>{formatRupiah(currentInvoice.amountIdr)}</strong>
                        </div>
                        <div className="payment-row">
                            <span>Nomor Virtual Account</span>
                            <strong>{currentInvoice.virtualAccountNumber || 'N/A'}</strong>
                        </div>
                        <div className="payment-row">
                            <span>Status Pembayaran</span>
                            <strong>{currentInvoice.status}</strong>
                        </div>
                        {currentInvoice.payment && (
                            <div className="payment-row">
                                <span>Dibayar Pada</span>
                                <strong>{formatDate(currentInvoice.payment.createdAt)}</strong>
                            </div>
                        )}
                    </div>
                    <button className="pay-button" onClick={() => navigate(`/materi/detail/${selectedProgramFromLS.id}`)}>
                        Go to Program
                    </button>
                    <button className="pay-button close-detail-button" onClick={closeModal}>
                        Kembali
                    </button>
                </>
            ) : currentInvoice.status?.toLowerCase() === 'expired' ? (
                <>
                    <p className="payment-desc">
                        Pembayaran Anda untuk program {selectedProgramFromLS.title} telah kedaluwarsa.
                    </p>
                    <div className="payment-summary">
                        <div className="payment-row">
                            <span>Program</span>
                            <strong>{selectedProgramFromLS.title}</strong>
                        </div>
                        <div className="payment-row">
                            <span>Jenis</span>
                            <strong>{selectedProgramFromLS.type}</strong>
                        </div>
                        <div className="payment-row">
                            <span>Total</span>
                            <strong>{formatRupiah(currentInvoice.amountIdr)}</strong>
                        </div>
                        <div className="payment-row">
                            <span>Nomor Virtual Account</span>
                            <strong>{currentInvoice.virtualAccountNumber || 'N/A'}</strong>
                        </div>
                        <div className="payment-row">
                            <span>Status Pembayaran</span>
                            <strong>{currentInvoice.status}</strong>
                        </div>
                        <div className="payment-row">
                            <span>Kedaluwarsa Pada</span>
                            <strong>{formatDate(currentInvoice.paymentDueDatetime)}</strong>
                        </div>
                    </div>
                    <button className="pay-button" onClick={() => handleBuyAgain(selectedProgramFromLS.id)}>
                        Beli Lagi
                    </button>
                    <button className="pay-button close-detail-button" onClick={closeModal}>
                        Kembali
                    </button>
                </>
            ) : ( /* Unverified invoice */
                <>
                    <p className="payment-desc">
                    Silakan membayar melalui Bank Transfer ke nomor virtual account berikut sebelum {formatDate(currentInvoice.paymentDueDatetime)}:
                    </p>
                    <div className="payment-summary">
                        <div className="payment-row">
                            <span>Program</span>
                            <strong>{selectedProgramFromLS.title}</strong>
                        </div>
                        <div className="payment-row">
                            <span>Jenis</span>
                            <strong>{selectedProgramFromLS.type}</strong>
                        </div>
                        <div className="payment-row">
                            <span>Total</span>
                            <strong>{formatRupiah(currentInvoice.amountIdr)}</strong>
                        </div>
                        <div className="payment-row">
                            <span>Nomor Virtual Account</span>
                            <strong>{currentInvoice.virtualAccountNumber || 'N/A'}</strong>
                        </div>
                        <div className="payment-row">
                            <span>Status</span>
                            <strong>{currentInvoice.status}</strong>
                        </div>
                        {timeLeft && currentInvoice.status?.toLowerCase() === 'unverified' && (
                            <div className="payment-row countdown-row">
                                <span>Waktu Tersisa</span>
                                <strong>{timeLeft}</strong>
                            </div>
                        )}
                    </div>

                    <div className="payment-instructions">
                        <p><strong>Instruksi:</strong></p>
                        <ol>
                            <li>Salin nomor virtual account di atas.</li>
                            <li>Lakukan transfer ke nomor tersebut melalui mobile banking/ATM.</li>
                            <li>Pastikan jumlah transfer sesuai dengan total pembayaran.</li>
                            <li>Status akan diperbarui secara otomatis.</li>
                        </ol>
                    </div>

                    <button className="pay-button" onClick={handlePayNowConfirmation} disabled={currentInvoice.status?.toLowerCase() !== 'unverified' || paymentConfirmationLoading}>
                        {paymentConfirmationLoading ? 'Mengirim Konfirmasi...' : currentInvoice.status === 'verified' ? 'Pembayaran Terverifikasi' : 'Saya Sudah Bayar'}
                    </button>
                    <button className="pay-button close-detail-button" onClick={closeModal}>
                        Kembali
                    </button>
                </>
            )}
          </div>
        ) : ( /* Regular history display */
          <div className="history-box">
            <h2>Riwayat Pembayaran</h2>
            {fetchingHistory ? (
              <p>Memuat riwayat pembayaran...</p>
            ) : historyError ? (
              <p style={{ color: 'red' }}>Error: {historyError}</p>
            ) : paymentHistory.length === 0 ? (
              <p>Tidak ada riwayat pembayaran.</p>
            ) : (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Judul Program</th>
                    <th>Jenis</th>
                    <th>Harga</th>
                    <th>Tanggal Jatuh Tempo</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((item) => {
                    return (
                    <tr key={item.id} onClick={() => handleInvoiceRowClick(item)} style={{ cursor: 'pointer' }}>
                      <td>{item.programTitle}</td>
                      <td>{item.programType}</td>
                      <td>{formatRupiah(item.amountIdr)}</td>
                      <td>{formatDate(item.paymentDueDatetime)}</td>
                      <td>{item.status}</td>
                    </tr>
                  )})}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
      <ProfileBar />
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default Payment;