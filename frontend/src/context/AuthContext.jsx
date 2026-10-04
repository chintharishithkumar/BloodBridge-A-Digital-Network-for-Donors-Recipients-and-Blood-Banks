import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });
    const [roleDetails, setRoleDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setUser(null);
            setRoleDetails(null);
            setLoading(false);
            return;
        }

        try {
            const res = await API.get('/auth/me');
            if (res.data.status === 'success') {
                setUser(res.data.user);
                setRoleDetails(res.data.roleDetails);
                localStorage.setItem('user', JSON.stringify(res.data.user));
            }
        } catch (err) {
            console.error("Auth verify error:", err);
            logout();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    const login = (token, userData) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        refreshUser();
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setRoleDetails(null);
    };

    return (
        <AuthContext.Provider value={{ user, roleDetails, loading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
