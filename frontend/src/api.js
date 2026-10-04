import axios from 'axios';

let rawBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
// Normalize: strip trailing slash
rawBaseURL = rawBaseURL.replace(/\/+$/, '');
// Ensure base URL always ends with /api
if (!rawBaseURL.endsWith('/api')) {
    rawBaseURL = `${rawBaseURL}/api`;
}

const API = axios.create({
    baseURL: rawBaseURL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor to add JWT token to requests
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default API;
