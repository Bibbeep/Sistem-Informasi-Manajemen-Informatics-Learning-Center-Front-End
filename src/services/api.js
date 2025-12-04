import axios from 'axios';

const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_ENDPOINT || 'http://localhost:3000'}/api/v1`,
});

// Add a request interceptor to include the token in headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
