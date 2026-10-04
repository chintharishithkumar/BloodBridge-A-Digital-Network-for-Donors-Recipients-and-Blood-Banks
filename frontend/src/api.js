import axios from 'axios';

// Get base URL from environment or default to local backend
let rawBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Normalize: remove trailing slashes
rawBaseURL = rawBaseURL.replace(/\/+$/, '');

// Ensure base URL always ends with /api
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
    // If request url is relative, build absolute URL with rawBaseURL
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
