import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from './AdminSidebar';
import AddMaterialModal from './AddMaterialModal';
import ManageMaterialsModal from './ManageMaterialsModal';
import EditMarkdownModal from './EditMarkdownModal'; // Import the new markdown modal
import './admin.css';
import api from '../services/api';
import { toast } from 'react-toastify';

const ManageMaterial = () => {
  const [programs, setPrograms] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingModules, setLoadingModules] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [showMarkdownModal, setShowMarkdownModal] = useState(false); // State for markdown modal
  const [selectedModule, setSelectedModule] = useState(null); // State for the selected module object

  const handleManageMaterials = (moduleId) => {
    setSelectedModuleId(moduleId);
    setShowMaterialsModal(true);
  };

  const handleEditMarkdown = (module) => {
    setSelectedModule(module);
    setShowMarkdownModal(true);
  };
  
  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/programs', {
        params: {
          type: 'course',
          limit: 100, // Fetch all courses
        },
      });
      setPrograms(response.data.data.programs);
    } catch (err) {
      console.error('Gagal fetch programs', err);
      setError("Gagal memuat data program.");
      toast.error("Gagal memuat data program.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const fetchModules = useCallback(async () => {
    if (!selectedProgramId) return;
    setLoadingModules(true);
    try {
      const response = await api.get(`/programs/${selectedProgramId}/modules`);
      setModules(response.data.data.modules);
    } catch (err) {
      console.error(`Failed to fetch modules for program ${selectedProgramId}:`, err);
      toast.error("Gagal memuat modul.");
    } finally {
      setLoadingModules(false);
    }
  }, [selectedProgramId]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const handleAdd = () => {
    setEditData(null);
    setShowModal(true);
  };

  const handleEdit = (module) => {
    setEditData(module);
    setShowModal(true);
  };

  const handleDelete = async (moduleId) => {
    if (window.confirm('Yakin ingin menghapus modul ini?')) {
      try {
        await api.delete(`/programs/${selectedProgramId}/modules/${moduleId}`);
        toast.success("Modul berhasil dihapus.");
        fetchModules(); // Refresh the list
      } catch (err) {
        console.error("Failed to delete module:", err);
        toast.error("Gagal menghapus modul.");
      }
    }
  };


  return (
    <div style={{ display: 'flex' }}>
      <AdminSidebar />
      <div className="admin-page scroll-hidden" style={{ flex: 1 }}>
        <h1>Kelola Modul Materi</h1>

        <div className="admin-actions">
          <label style={{ fontWeight: 600, marginRight: '10px', marginTop: '5px', color: '#0d3b66'}}>
            Pilih Program Kursus:
          </label>
          {loading ? (
            <p>Memuat program...</p>
          ) : error ? (
            <p style={{color: 'red'}}>{error}</p>
          ) : (
            <select
              className="admin-select"
              value={selectedProgramId}
              onChange={(e) => setSelectedProgramId(e.target.value)}
            >
              <option value="">-- Pilih Program --</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          )}

          {selectedProgramId && (
            <button className="admin-btn add" style={{ marginLeft: '10px' }} onClick={handleAdd}>
              Tambah Modul
            </button>
          )}
        </div>

        {selectedProgramId && (
          loadingModules ? (
            <p>Memuat modul...</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>No. Modul</th>
                  <th>Link YouTube</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {modules.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', color: '#999' }}>
                      Belum ada modul untuk program ini.
                    </td>
                  </tr>
                ) : (
                  modules
                    .sort((a, b) => a.numberCode - b.numberCode)
                    .map(mod => (
                      <tr key={mod.id}>
                        <td>{mod.numberCode}</td>
                        <td>
                          <a href={mod.youtubeUrl} target="_blank" rel="noreferrer">
                            {mod.youtubeUrl}
                          </a>
                        </td>
                        <td>
                          <button className="admin-btn edit" onClick={() => handleEdit(mod)}>
                            Update
                          </button>
                          <button className="admin-btn" onClick={() => handleManageMaterials(mod.id)}>
                            Materi
                          </button>
                          <button className="admin-btn" onClick={() => handleEditMarkdown(mod)}>
                            Teks
                          </button>
                          <button className="admin-btn delete" onClick={() => handleDelete(mod.id)}>
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          )
        )}
      
        {showModal && (
          <AddMaterialModal
            onClose={() => setShowModal(false)}
            onSave={fetchModules}
            defaultData={editData}
            programId={selectedProgramId}
          />
        )}
      
        {showMaterialsModal && (
          <ManageMaterialsModal
            onClose={() => setShowMaterialsModal(false)}
            programId={selectedProgramId}
            moduleId={selectedModuleId}
          />
        )}

        {showMarkdownModal && (
          <EditMarkdownModal
            show={showMarkdownModal}
            onClose={() => setShowMarkdownModal(false)}
            programId={selectedProgramId}
            module={selectedModule}
            onSave={fetchModules}
          />
        )}
      </div>
    </div>
  );
};

export default ManageMaterial;
