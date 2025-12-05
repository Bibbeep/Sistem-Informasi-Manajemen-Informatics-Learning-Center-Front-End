import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from './AdminSidebar';
import AddProgramModal from './AddProgramModal';
import './admin.css';
import api from '../services/api';
import { toast } from 'react-toastify';

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formatRupiah = (number) => {
  if (number === 0) return 'Gratis';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
};

const ManagePrograms = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editProgram, setEditProgram] = useState(null);
  const [sort, setSort] = useState({ field: 'availableDate', order: 'desc' }); // Default sort by date descending

  const handleSort = (field) => {
    setSort(prev => {
      if (prev.field === field) {
        return { ...prev, order: prev.order === 'asc' ? 'desc' : 'asc' };
      }
      return { field, order: 'asc' }; // Default to ascending for a new field
    });
    setPage(1); // Reset to first page on sort change
  };

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/programs', {
        params: {
          page,
          limit: 20,
          sort: `${sort.order === 'desc' ? '-' : ''}${sort.field === 'priceIdr' ? 'price' : sort.field}`,
        },
      });
      setPrograms(response.data.data.programs);
      setTotalPages(response.data.pagination.totalPages);
    } catch (err) {
      console.error("Failed to fetch programs:", err);
      setError("Gagal memuat data program.");
      toast.error("Gagal memuat data program.");
    } finally {
      setLoading(false);
    }
  }, [page, sort.field, sort.order]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const handleAdd = () => {
    setEditProgram(null);
    setShowModal(true);
  };

  const handleEdit = (program) => {
    setEditProgram(program);
    setShowModal(true);
  };

    const handleDelete = async (id) => {

      if (window.confirm('Yakin ingin menghapus program ini?')) {

        try {

          await api.delete(`/programs/${id}`);

          toast.success("Program berhasil dihapus.");

          fetchPrograms(); // Refresh the list

        } catch (err) {

          console.error("Failed to delete program:", err);

          toast.error("Gagal menghapus program.");

        }

      }

    };

  

    return (

      <div style={{ display: 'flex' }}>

        <AdminSidebar />

        <div className="admin-page scroll-hidden" style={{ flex: 1 }}>

          <h1>Kelola Program</h1>

          <div className="admin-actions">

            <button className="admin-btn add" onClick={handleAdd}>Tambah Program</button>

          </div>

  

          {loading ? (

            <p>Memuat program...</p>

          ) : error ? (

            <p style={{ color: 'red' }}>Error: {error}</p>

          ) : (

            <>

              <table className="admin-table">

                                <thead>

                                  <tr>

                                    <th>Judul Program</th>

                                    <th>Deskripsi</th>

                                    <th onClick={() => handleSort('availableDate')} className="sortable">

                                      Tanggal{' '}

                                      {sort.field === 'availableDate' && (

                                        <span>{sort.order === 'asc' ? '↑' : '↓'}</span>

                                      )}

                                    </th>

                                    <th>Jenis</th>

                                    <th onClick={() => handleSort('priceIdr')} className="sortable">

                                      Harga{' '}

                                      {sort.field === 'priceIdr' && (

                                        <span>{sort.order === 'asc' ? '↑' : '↓'}</span>

                                      )}

                                    </th>

                                    <th>Aksi</th>

                                  </tr>

                                </thead>

                <tbody>

                  {programs.map((program) => (

                    <tr key={program.id}>

                      <td>{program.title}</td>

                      <td>{program.description}</td>

                      <td>{formatDate(program.availableDate)}</td>

                      <td>{program.type}</td>

                      <td>{formatRupiah(program.priceIdr)}</td>

                      <td>

                        <button className="admin-btn edit" onClick={() => handleEdit(program)}>Update</button>

                        <button className="admin-btn delete" onClick={() => handleDelete(program.id)}>Hapus</button>

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

            <AddProgramModal

              onClose={() => setShowModal(false)}

              onSave={fetchPrograms}

              defaultData={editProgram}

            />

          )}

        </div>

      </div>

    );
};

export default ManagePrograms;
