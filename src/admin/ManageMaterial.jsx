import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from './AdminSidebar';
import AddMaterialModal from './AddMaterialModal';
import ManageMaterialsModal from './ManageMaterialsModal';
import EditMarkdownModal from './EditMarkdownModal'; // Import the new markdown modal
import './admin.css';
import api from '../services/api';
import { toast } from 'react-toastify';

const ManageMaterial = () => {
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedProgramTitle, setSelectedProgramTitle] = useState(''); // New state to display selected program
  const [modules, setModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [showMarkdownModal, setShowMarkdownModal] = useState(false); // State for markdown modal
  const [selectedModule, setSelectedModule] = useState(null); // State for the selected module object

  // Program Search States
  const [searchProgramQuery, setSearchProgramQuery] = useState(''); // Input for program search
  const [ftsProgramQuery, setFtsProgramQuery] = useState(''); // Query to trigger API call
  const [searchedPrograms, setSearchedPrograms] = useState([]); // Results from program search
  const [loadingProgramsSearch, setLoadingProgramsSearch] = useState(false); // Loading state for program search

  const handleManageMaterials = (moduleId) => {
    setSelectedModuleId(moduleId);
    setShowMaterialsModal(true);
  };

  const handleEditMarkdown = (module) => {
    setSelectedModule(module);
    setShowMarkdownModal(true);
  };
  
  // Function to fetch programs based on search query
  const fetchProgramsForSearch = useCallback(async () => {
    setLoadingProgramsSearch(true);
    try {
      const params = {
        type: 'course',
        limit: 20, // Limit search results
      };
      if (ftsProgramQuery) {
        params.q = ftsProgramQuery;
      }
      const response = await api.get('/programs', { params });
      setSearchedPrograms(response.data.data.programs);
    } catch (err) {
      console.error('Failed to search programs', err);
      toast.error("Gagal mencari program.");
    } finally {
      setLoadingProgramsSearch(false);
    }
  }, [ftsProgramQuery]);

  // Effect to trigger program search when ftsProgramQuery changes
  useEffect(() => {
    fetchProgramsForSearch();
  }, [fetchProgramsForSearch]);

  const fetchModules = useCallback(async () => {
    if (!selectedProgramId) {
      setModules([]); // Clear modules if no program is selected
      return;
    }
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

  const handleSearchProgramSubmit = (e) => {
    e.preventDefault();
    setFtsProgramQuery(searchProgramQuery);
    setSelectedProgramId(''); // Clear selected program when new search is initiated
    setSelectedProgramTitle('');
    setModules([]); // Clear modules when a new search is initiated
  };

  const handleSelectSearchedProgram = (program) => {
    setSelectedProgramId(program.id);
    setSelectedProgramTitle(program.title);
    setSearchedPrograms([]); // Clear search results after selection
    setSearchProgramQuery(program.title); // Display selected program name in search bar
  };


  return (
    <div style={{ display: 'flex' }}>
      <AdminSidebar />
      <div className="admin-page scroll-hidden" style={{ flex: 1 }}>
        <h1>Kelola Modul Materi</h1>

        <div className="admin-actions">
          <form onSubmit={handleSearchProgramSubmit} className="admin-search-form" style={{ flexGrow: 1, marginRight: '10px' }}>
            <label style={{ fontWeight: 600, marginRight: '10px', color: '#0d3b66', whiteSpace: 'nowrap'}}>
              Cari Program Kursus:
            </label>
            <input
              type="text"
              placeholder="Cari program berdasarkan judul..."
              value={searchProgramQuery}
              onChange={(e) => setSearchProgramQuery(e.target.value)}
              className="admin-search-input"
            />
            <button type="submit" className="admin-btn add">Cari</button>
          </form>

          {selectedProgramId && (
            <button className="admin-btn add" onClick={handleAdd}>
              Tambah Modul
            </button>
          )}
        </div>

        {/* Display Search Results */}
        {loadingProgramsSearch ? (
          <p>Memuat hasil pencarian...</p>
        ) : (searchedPrograms.length > 0 && !selectedProgramId) && (
          <div className="search-results-dropdown" style={{ border: '1px solid #ccc', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto', backgroundColor: '#fff', position: 'relative', zIndex: 10 }}>
            {searchedPrograms.map(program => (
              <div 
                key={program.id} 
                className="search-result-item" 
                onClick={() => handleSelectSearchedProgram(program)}
                style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
              >
                {program.title}
              </div>
            ))}
          </div>
        )}

        {selectedProgramTitle && <h2 style={{marginTop: '20px'}}>Modul untuk Program: {selectedProgramTitle}</h2>}

        {selectedProgramId && (
          loadingModules ? (
            <p>Memuat modul...</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Judul Modul</th>
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
                    .sort((a, b) => a.id - b.id)
                    .map(mod => (
                      <tr key={mod.id}>
                        <td>{mod.title}</td>
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
