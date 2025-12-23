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
  const [searchQuery, setSearchQuery] = useState(''); // State for search input
  const [ftsQuery, setFtsQuery] = useState(''); // State for triggering FTS API call
  const [availabilityFilter, setAvailabilityFilter] = useState(''); // State for availability filter
  const abortControllerRef = React.useRef(null);


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
        sort: `${sort.order === 'desc' ? '-' : ''}${sort.field === 'priceIdr' ? 'price' : sort.field}`,
      };
      if (ftsQuery) {
        params.q = ftsQuery;
      }
      if (availabilityFilter !== '') {
        params.isAvailable = availabilityFilter;
      }

      const response = await api.get('/programs', { 
          params,
          signal: abortControllerRef.current.signal,
      });
      setPrograms(response.data.data.programs);
      setTotalPages(response.data.pagination.totalPages);
    } catch (err) {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
            return;
        }
      console.error("Failed to fetch programs:", err);
      setError("Gagal memuat data program.");
      toast.error("Gagal memuat data program.");
    } finally {
        if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
            setLoading(false);
        }
    }
  }, [page, sort.field, sort.order, ftsQuery, availabilityFilter]); // Re-fetch when page, sort, or ftsQuery changes

  useEffect(() => {
    fetchPrograms();
    return () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    }
  }, [fetchPrograms]);

  const handleAdd = () => {
    setEditProgram(null);
    setShowModal(true);
  };

  const handleEdit = async (program) => {
    try {
      const response = await api.get(`/programs/${program.id}`);
      setEditProgram(response.data.data.program);
      setShowModal(true);
    } catch (err) {
      console.error("Failed to fetch program details for edit:", err);
      toast.error("Gagal memuat detail program untuk diedit.");
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFtsQuery(searchQuery); // Set FTS query from current input
    setPage(1); // Reset page on new search
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

          

                    <div className="admin-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                      <button className="admin-btn add" onClick={handleAdd}>Tambah Program</button>
                      
                      <form onSubmit={handleSearchSubmit} className="admin-search-form" style={{ flexGrow: 1 }}>
                        <input
                          type="text"
                          placeholder="Cari program..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="admin-search-input"
                        />
                        <button type="submit" className="admin-btn add">Cari</button>
                      </form>

                      <div className="filter-group">
                        <label htmlFor="availability-filter" style={{ marginRight: '5px', fontWeight: '600', color: '#0d3b66' }}>Ketersediaan:</label>
                        <select
                          id="availability-filter"
                          className="admin-select"
                          value={availabilityFilter}
                          onChange={(e) => {
                            setAvailabilityFilter(e.target.value);
                            setPage(1); // Reset page on filter change
                          }}
                        >
                          <option value="">Semua</option>
                          <option value="true">Tersedia</option>
                          <option value="false">Tidak Tersedia</option>
                        </select>
                      </div>
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
