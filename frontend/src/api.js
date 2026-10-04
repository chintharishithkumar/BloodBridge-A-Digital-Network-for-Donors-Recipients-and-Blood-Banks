import axios from 'axios';

const API = axios.create({
    baseURL: 'https://bloodbridge-a-digital-network-for-donors-lx0i.onrender.com',
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
