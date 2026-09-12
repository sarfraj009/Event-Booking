import axios from 'axios';

const apiHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || `http://${apiHost}:5000/api`,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
