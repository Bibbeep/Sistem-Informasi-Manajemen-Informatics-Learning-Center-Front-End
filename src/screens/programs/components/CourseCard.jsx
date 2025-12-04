import React, { useState, useEffect } from 'react';
import './coursecard.css';

// Format Rupiah
const formatRupiah = (angka) => {
  if (!angka) return 'Rp. 0,00';
  const number = Number(angka);
  return 'Rp. ' + number.toLocaleString('id-ID') + ',00';
};

// Format tanggal: 27 Mei 2025
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

const CourseCard = ({ title, type, image, date, price, description, onClick }) => {
  const [imgSrc, setImgSrc] = useState(image);

  useEffect(() => {
    setImgSrc(image);
  }, [image]);

  const handleImageError = () => {
    const fallbackSrc = typeImageMap[type] || '/images/default.png';
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
  };

  return (
    <div className="course-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <img
        src={imgSrc || (typeImageMap[type] || '/images/default.png')}
        alt={title || 'Program Image'}
        className="course-image"
        onError={handleImageError}
      />
      <div className="course-info">
        <h3 className="course-title">{title}</h3>
        <p className="course-description">
          <span>{description || '-'}</span>
        </p>
        <div className="course-meta">
          <p><span role="img" aria-label="calendar">📅</span> {formatDate(date)}</p>
          <p><span role="img" aria-label="money">💰</span> {formatRupiah(price)}</p>
          <p><span role="img" aria-label="type">📝</span> {type || '-'}</p>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
