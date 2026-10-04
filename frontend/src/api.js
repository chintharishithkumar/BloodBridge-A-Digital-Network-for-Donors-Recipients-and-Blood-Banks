import axios from 'axios';

// Smart dynamic API resolution function
function getBaseURL() {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (envUrl && envUrl !== 'undefined' && envUrl.trim() !== '') {
        return envUrl;
    }

    // Check if browser is running locally
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:5000/api';
        }
    }

    // Production cloud fallback (Render deployed backend)
    return 'https://blood-bridge-backend.onrender.com/api';
}

let rawBaseURL = getBaseURL();
rawBaseURL = rawBaseURL.replace(/\/+$/, '');
if (!rawBaseURL.endsWith('/api')) {
    rawBaseURL = `${rawBaseURL}/api`;
}

const API = axios.create({
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor to construct absolute request URLs and attach JWT token
API.interceptors.request.use((config) => {
    if (config.url && !config.url.startsWith('http://') && !config.url.startsWith('https://')) {
        const cleanPath = config.url.replace(/^\/+/, '');
        config.url = `${rawBaseURL}/${cleanPath}`;
    }

    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default API;
