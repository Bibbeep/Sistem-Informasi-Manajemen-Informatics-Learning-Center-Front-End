import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './homepage.css';
import { useAuth } from '../context/AuthContext';


const programDescriptions = {
  Course: 'Pelatihan intensif untuk meningkatkan keterampilan teknis secara bertahap dan terstruktur.',
  Workshop: 'Sesi praktikal dan interaktif untuk memperdalam pemahaman lewat praktik langsung.',
  Seminar: 'Diskusi dan presentasi bersama ahli untuk memperluas wawasan di bidang teknologi terkini.',
  Competition: 'Ajang kompetitif untuk menguji kemampuan dan kreativitas dalam dunia nyata.',
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatHarga = (harga) => {
  if (harga === null || harga === undefined) {
    return 'Harga tidak tersedia';
  }
  if (harga === 0 || harga === 'Gratis') return 'Gratis';
  return `Rp ${harga.toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Use useAuth hook
  const [scrolled, setScrolled] = useState(false);
  const [courses, setCourses] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [seminars, setSeminars] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pagination, setPagination] = useState({
    Course: { page: 1, hasMore: true },
    Workshop: { page: 1, hasMore: true },
    Seminar: { page: 1, hasMore: true },
    Competition: { page: 1, hasMore: true },
  });

  const [loadingMore, setLoadingMore] = useState({
    Course: false,
    Workshop: false,
    Seminar: false,
    Competition: false,
  });

  const [contactFullName, setContactFullName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState('');
  const [contactError, setContactError] = useState('');

  const aboutRef = useRef(null);
  const programRef = useRef(null);
  const contactRef = useRef(null);

  const courseRef = useRef(null);
  const workshopRef = useRef(null);
  const seminarRef = useRef(null);
  const competitionRef = useRef(null);

  const fetchProgramData = async (type, setState, page = 1) => {
    try {
      const lowerCaseType = type.toLowerCase();
      const response = await fetch(`${process.env.REACT_APP_API_ENDPOINT}/api/v1/programs?type=${lowerCaseType}&limit=10&page=${page}&sort=availableDate`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${type}`);
      }
      const data = await response.json();
      if (page > 1) {
        setState(prev => [...prev, ...data.data.programs]);
      } else {
        setState(data.data.programs);
      }
      setPagination(prev => ({
        ...prev,
        [type]: {
          page: data.pagination.currentPage,
          hasMore: data.pagination.currentPage < data.pagination.totalPages,
        },
      }));
    } catch (err) {
      setError(prevError => prevError || err.message);
    }
  };

  useEffect(() => {
    const fetchAllPrograms = async () => {
        setLoading(true);
        await Promise.all([
            fetchProgramData('Course', setCourses),
            fetchProgramData('Workshop', setWorkshops),
            fetchProgramData('Seminar', setSeminars),
            fetchProgramData('Competition', setCompetitions)
        ]);
        setLoading(false);
    };

    fetchAllPrograms();
  }, []);

  const fetchMorePrograms = async (type) => {
    if (loadingMore[type] || !pagination[type].hasMore) return;

    setLoadingMore(prev => ({ ...prev, [type]: true }));

    const next_page = pagination[type].page + 1
    const setState = (setter) => {
        if(type === "Course") return setCourses(setter)
        if(type === "Workshop") return setWorkshops(setter)
        if(type === "Seminar") return setSeminars(setter)
        if(type === "Competition") return setCompetitions(setter)
    }

    await fetchProgramData(type, setState, next_page);

    setLoadingMore(prev => ({ ...prev, [type]: false }));
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactLoading(true);
    setContactSuccess('');
    setContactError('');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_ENDPOINT}/api/v1/feedbacks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          fullName: contactFullName, 
          email: contactEmail, 
          message: contactMessage 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message.');
      }

      setContactSuccess('Pesan Anda berhasil terkirim!');
      setContactFullName('');
      setContactEmail('');
      setContactMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setContactError(error.message || 'Terjadi kesalahan saat mengirim pesan.');
    } finally {
      setContactLoading(false);
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToRef = (ref) => ref.current?.scrollIntoView({ behavior: 'smooth' });

  const handleCarouselCardClick = (program) => {
    if (!user) {
      navigate('/login');
    } else {
      localStorage.setItem('selectedProgramIdForModal', program.id);
      navigate('/programs');
    }
  };

  const scrollContainer = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = 300;
      ref.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const handleNextClick = (type, carouselRef) => {
    scrollContainer(carouselRef, 'right');
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    if (scrollLeft + clientWidth >= scrollWidth - 50) {
      fetchMorePrograms(type);
    }
  };

  const renderProgramSection = (type, carouselRef, programList) => {
    if (loading) return <p>Loading programs...</p>;
    if (error) return <p>Error fetching programs: {error}</p>;

    return (
      <div className="program-type-section">
        <h3>{type}</h3>
        <p className="program-desc">{programDescriptions[type]}</p>
        <div className="carousel-wrapper">
          <button className="carousel-arrow left" onClick={() => scrollContainer(carouselRef, 'left')}>&#8249;</button>
          <div className="carousel-scroll" ref={carouselRef}>
            {programList.map((program) => (
              <div
                key={program.id}
                className="carousel-card enhanced-card"
                onClick={() => handleCarouselCardClick(program)} // Pass program object
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleCarouselCardClick(program)}
              >
                <div className="card-content">
                  <h4 className="card-title">{program.title}</h4>
                  <p><strong>Tanggal:</strong> {formatDate(program.availableDate)}</p>
                  <p><strong>Harga:</strong> {formatHarga(program.priceIdr)}</p>
                </div>
              </div>
            ))}
            {loadingMore[type] && <p>Loading more...</p>}
          </div>
          <button className="carousel-arrow right" onClick={() => handleNextClick(type, carouselRef)}>&#8250;</button>
        </div>
      </div>
    );
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <nav className={`home-navbar ${scrolled ? 'scrolled' : ''}`}>
          <div className="home-logo-container">
            <img src="/images/logo2.png" alt="ILC Logo" className="ilc-logo" />
            <span className="home-logo-text glow">Informatics Learning Center</span>
          </div>
          <div className="home-nav-buttons">
            <button className="auth-btn" onClick={() => scrollToRef(aboutRef)}>About</button>
            <button className="auth-btn" onClick={() => scrollToRef(programRef)}>Programs</button>
            <button className="auth-btn" onClick={() => scrollToRef(contactRef)}>Contact</button>
            <button onClick={() => navigate('/login')} className="auth-btn">Sign In</button>
            <button onClick={() => navigate('/register')} className="auth-btn">Sign Up</button>
          </div>
        </nav>
        <h1>Selamat Datang di ILC</h1>
        <p className="subheadline">
          Belajar teknologi kekinian, berbagi ilmu bersama komunitas, dan tumbuh menjadi talenta digital masa depan.
        </p>
      </header>

      <section className="ilc-intro-section" ref={aboutRef}>
        <h2 className="section-title">Tentang ILC</h2>
        <div className="ilc-intro-banner">
          <div className="intro-content">
            <p>
              <strong>Informatics Learning Center (ILC)</strong> adalah wadah pembelajaran mandiri dan kolaboratif
              bagi mahasiswa Teknik Informatika UNTAN. Kami menghadirkan berbagai program menarik seperti pelatihan,
              workshop, seminar, hingga kompetisi untuk mengasah kemampuan digital serta memperluas wawasanmu di bidang teknologi terkini.
            </p>
          </div>
        </div>
      </section>

      <section className="carousel-section" ref={programRef}>
        <h2>Program Unggulan</h2>
        {renderProgramSection('Course', courseRef, courses)}
        {renderProgramSection('Workshop', workshopRef, workshops)}
        {renderProgramSection('Seminar', seminarRef, seminars)}
        {renderProgramSection('Competition', competitionRef, competitions)}
      </section>

      <section className="contact-section" ref={contactRef}>
        <h2>Hubungi Kami</h2>
        <p>Kami siap membantu kamu. Silakan hubungi kami melalui form di bawah ini atau kontak langsung!</p>
        <form className="contact-form" onSubmit={handleContactSubmit}>
          <input 
            type="text" 
            placeholder="Nama Lengkap" 
            value={contactFullName}
            onChange={(e) => setContactFullName(e.target.value)}
            required
            disabled={contactLoading}
          />
          <input 
            type="email" 
            placeholder="Email" 
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            required
            disabled={contactLoading}
          />
          <textarea 
            placeholder="Pesan Anda" 
            rows="4" 
            value={contactMessage}
            onChange={(e) => setContactMessage(e.target.value)}
            required
            disabled={contactLoading}
          />
          <button type="submit" className="submit-btn" disabled={contactLoading}>
            {contactLoading ? 'Mengirim...' : 'Kirim Pesan'}
          </button>
          {contactSuccess && <p className="success-message" style={{color: 'green', marginTop: '10px'}}>{contactSuccess}</p>}
          {contactError && <p className="error-message" style={{color: 'red', marginTop: '10px'}}>{contactError}</p>}
        </form>
      </section>

      <footer className="home-footer">
        <div>
          <h4>Kontak Kami</h4>
          <p>Email: info@informatika.untan.ac.id</p>
          <p>Telepon: 0878-181-20209</p>
          <p>Alamat: Jl. Prof. Dr. H. Hadari Nawawi, Pontianak</p>
          <p>© 2025 ILC. All Rights Reserved</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

