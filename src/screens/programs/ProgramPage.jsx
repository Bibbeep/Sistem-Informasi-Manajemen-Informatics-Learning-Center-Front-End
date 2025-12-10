import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../sidebar/Sidebar';
import ProfileBar from '../profilebar/ProfileBar';
import DashboardHeader from '../dashboard/components/DashboardHeader';
import CourseCard from './components/CourseCard';
import Filter from './components/Filter';
import api from '../../services/api';
import useDebounce from '../../hooks/useDebounce';
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import './course.css';

const formatRupiah = (angka) => {
  if (angka === null || angka === undefined || Number(angka) === 0) return 'Gratis';
  return 'Rp. ' + Number(angka).toLocaleString('id-ID');
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return date.toLocaleDateString('id-ID', options);
};

const typeImageMap = {
  Course: "/images/course_thumb.png",
  Competition: "/images/competition_thumb.png",
  Seminar: "/images/seminar_thumb.png",
  Workshop: "/images/workshop_thumb.png",
};

const ProgramPage = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [sortOption, setSortOption] = useState('id');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [modalImgSrc, setModalImgSrc] = useState('');
  const [enrolledProgramIds, setEnrolledProgramIds] = useState(new Set());
  const [enrolledProgramsData, setEnrolledProgramsData] = useState([]);

  const navigate = useNavigate();
  const { user } = useAuth(); // Get user from AuthContext

  const debouncedSearchKeyword = useDebounce(searchKeyword, 500);
  const debouncedMinPrice = useDebounce(minPrice, 500);
  const debouncedMaxPrice = useDebounce(maxPrice, 500);

  useEffect(() => {
    if (selectedProgram) {
      setModalImgSrc(selectedProgram.thumbnailUrl);
    }
  }, [selectedProgram]);

  // Effect to check for program ID from localStorage for modal
  useEffect(() => {
    const programIdFromLocalStorage = localStorage.getItem('selectedProgramIdForModal');
    if (programIdFromLocalStorage) {
      localStorage.removeItem('selectedProgramIdForModal'); // Clear it immediately

      const fetchSpecificProgram = async () => {
        try {
          const response = await api.get(`/programs`, { params: { id: programIdFromLocalStorage } });
          setSelectedProgram(response.data.data.programs[0]); // Access the first program from the array
        } catch (err) {
          console.error('Failed to fetch specific program for modal:', err);
          // Optionally, show a toast error here
        }
      };
      fetchSpecificProgram();
    }
  }, []); // Run only once on mount

  // Fetch enrolled programs
  useEffect(() => {
    const fetchEnrolledPrograms = async () => {
      if (!user || !user.sub) {
        setEnrolledProgramIds(new Set());
        setEnrolledProgramsData([]);
        return;
      }
      try {
        const response = await api.get('/enrollments', {
          params: { userId: user.sub, limit: 100 }, // Fetch all for now
        });
        const enrolled = response.data.data.enrollments;
        setEnrolledProgramsData(enrolled);
        setEnrolledProgramIds(new Set(enrolled.map(p => p.programId)));
      } catch (err) {
        console.error('Failed to fetch enrolled programs:', err);
        setEnrolledProgramIds(new Set());
        setEnrolledProgramsData([]);
      }
    };
    fetchEnrolledPrograms();
  }, [user]); // Refetch when user changes

  const fetchPrograms = async (currentPage, filter, isSearchOrFilterChange = false) => {
    setLoading(true);
    try {
      const params = {
        type: filter === 'All' ? 'all' : filter.toLowerCase(),
        limit: 10,
        page: currentPage,
        title: debouncedSearchKeyword || undefined,
        'price.gte': debouncedMinPrice || undefined,
        'price.lte': debouncedMaxPrice || undefined,
        isAvailable: showAvailableOnly ? true : undefined,
        sort: sortOption,
      };

      const response = await api.get('/programs', {
        params,
        paramsSerializer: params => {
          return Object.entries(params)
            .map(([key, value]) => (value !== undefined && value !== null) ? `${encodeURIComponent(key)}=${encodeURIComponent(value)}` : null)
            .filter(p => p !== null)
            .join('&');
        }
      });
      
      const { data, pagination } = response.data;
      setPrograms(prev => isSearchOrFilterChange ? data.programs : [...prev, ...data.programs]);
      setHasMore(pagination.currentPage < pagination.totalPages);
      setError(null);
    } catch (err) {
      setError('Gagal memuat program. Silakan coba lagi nanti.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPrograms([]);
    setPage(1);
    fetchPrograms(1, selectedFilter, true);
  }, [debouncedSearchKeyword, selectedFilter, debouncedMinPrice, debouncedMaxPrice, showAvailableOnly, sortOption]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPrograms(nextPage, selectedFilter);
  };

  const handleSearch = (keyword) => {
    setSearchKeyword(keyword);
  };

  const handleFilterSelect = (filter) => {
    setSelectedFilter(filter);
  };
  
  const handleJoinProgram = (program) => {
    localStorage.setItem('selectedProgramIdForModal', program.id);
    navigate('/payment');
  }

  const handleContinueProgram = (programId) => {
    navigate(`/materi/detail/${programId}`);
  }

  const isProgramEnrolled = selectedProgram && enrolledProgramIds.has(selectedProgram.id);
  const enrolledProgram = isProgramEnrolled ? enrolledProgramsData.find(ep => ep.programId === selectedProgram.id) : null;

  // Check if program is available (availableDate is in the past or today)
  const isProgramAvailable = selectedProgram && new Date(selectedProgram.availableDate) <= new Date();

  return (
    <div className="course-container">
      <Sidebar />
      <div className="course-content">
        <DashboardHeader onSearch={handleSearch} />
        
        <div className="program-filters">
          <div className="filter-group">
            <label htmlFor="minPrice">Min Price:</label>
            <input
              type="number"
              id="minPrice"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="e.g. 50000"
            />
          </div>
          <div className="filter-group">
            <label htmlFor="maxPrice">Max Price:</label>
            <input
              type="number"
              id="maxPrice"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="e.g. 300000"
            />
          </div>
          <div className="filter-group checkbox-group">
            <input
              type="checkbox"
              id="showAvailableOnly"
              checked={showAvailableOnly}
              onChange={(e) => setShowAvailableOnly(e.target.checked)}
            />
            <label htmlFor="showAvailableOnly">Available Only</label>
          </div>
          <div className="filter-group">
            <label htmlFor="sortOption">Sort By:</label>
            <select id="sortOption" value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
              <option value="id">Default</option>
              <option value="price">Price (Low to High)</option>
              <option value="-price">Price (High to Low)</option>
              <option value="availableDate">Date (Oldest)</option>
              <option value="-availableDate">Date (Newest)</option>
            </select>
          </div>
        </div>

        <Filter selected={selectedFilter} onSelect={handleFilterSelect} />
        
        {error && <p className="error-message">{error}</p>}

        <div className="course-grid">
          {programs.length === 0 && !loading && <p>No programs found.</p>}
          {programs.map((program) => {
            const enrollment = enrolledProgramsData.find(e => e.programId === program.id);
            return (
              <CourseCard
                key={program.id}
                title={program.title}
                type={program.type}
                image={program.thumbnailUrl}
                date={program.availableDate}
                price={program.priceIdr}
                description={program.description}
                enrollmentStatus={enrollment ? enrollment.status : null} // Pass status string
                onClick={() => setSelectedProgram(program)}
              />
            );
          })}
        </div>

        {loading && programs.length === 0 && <p>Loading...</p>}

        {!loading && hasMore && (
          <div className="load-more-container">
            <button onClick={handleLoadMore} className="load-more-btn">
              Load More
            </button>
          </div>
        )}
      </div>
      <ProfileBar />

      {selectedProgram && (
        <div className="modal-overlay" onClick={() => setSelectedProgram(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <img 
              src={modalImgSrc || (typeImageMap[selectedProgram.type] || '/images/default.png')} 
              alt={selectedProgram.title} 
              className="modal-image"
              onError={() => {
                setModalImgSrc(typeImageMap[selectedProgram.type] || '/images/default.png');
              }}
            />
            <h3>{selectedProgram.title}</h3>
            <p>{selectedProgram.description || '-'}</p>
            <p><strong>Tanggal:</strong> {formatDate(selectedProgram.availableDate)}</p>
            <p><strong>Harga:</strong> {formatRupiah(selectedProgram.priceIdr)}</p>
            <p><strong>Jenis:</strong> {selectedProgram.type || '-'} </p>
            
            {isProgramEnrolled && enrolledProgram ? (
              <>
                <p><strong>Status:</strong> Enrolled</p>
                <p><strong>Progress:</strong> {parseFloat(enrolledProgram.progressPercentage).toFixed(0)}%</p>
                <div className="modal-buttons">
                  <button className="pay" onClick={() => handleContinueProgram(selectedProgram.id)}>
                    Continue
                  </button>
                  <button className="close" onClick={() => setSelectedProgram(null)}>
                    Close
                  </button>
                </div>
              </>
            ) : (
              <div className="modal-buttons-column"> {/* Use a column layout for message and button */}
                {user ? (
                  isProgramAvailable ? (
                    <button className="pay" onClick={() => handleJoinProgram(selectedProgram)}>
                      Join
                    </button>
                  ) : (
                    <p className="program-unavailable-message">Program belum tersedia.</p>
                  )
                ) : (
                  <p className="program-unavailable-message">Silakan login untuk bergabung.</p>
                )}
                <button className="close" onClick={() => setSelectedProgram(null)}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramPage;