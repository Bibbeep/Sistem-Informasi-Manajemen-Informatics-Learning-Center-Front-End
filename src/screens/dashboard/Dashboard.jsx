import React, { useEffect, useState } from 'react';
import Sidebar from './../sidebar/Sidebar';
import ProfileBar from './../profilebar/ProfileBar';
import './dashboard.css';
import DashboardHeader from './components/DashboardHeader';
import CourseCards from './components/CourseCards';
import StatisticChart from './components/StatisticChart';
import CertificateBox from './components/CertificateBox';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';


const Dashboard = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loadingCertificates, setLoadingCertificates] = useState(true);
  const [certificateError, setCertificateError] = useState(null);

  const abortControllerRef = React.useRef(null);

  useEffect(() => {
    const fetchCertificates = async () => {
      if (!user || !user.sub) {
        setLoadingCertificates(false);
        setCertificateError("User not logged in.");
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const response = await api.get('/certificates', {
          params: { userId: user.sub, limit: 6, sort: '-issuedAt' }, // Fetch up to 6 certificates, newest first
          signal: abortControllerRef.current.signal,
        });
        setCertificates(response.data.data.certificates);
        setCertificateError(null);
      } catch (err) {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
          return;
        }
        setCertificateError("Failed to load certificates.");
        console.error("Fetch error:", err);
      } finally {
        if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
          setLoadingCertificates(false);
        }
      }
    };

    fetchCertificates();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [user]);

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <DashboardHeader />
        <CourseCards />
        <StatisticChart />
        <CertificateBox 
          certificates={certificates} 
          loading={loadingCertificates} 
          error={certificateError} 
        />
      </div>
      <ProfileBar />
    </div>
  );
};

export default Dashboard;
