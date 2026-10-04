import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Droplet, User, LogOut, ShieldAlert, Heart, Building2, Search, Sparkles } from 'lucide-react';
import API from '../api';

export default function Navbar() {
    const { user, logout, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [demoLoading, setDemoLoading] = useState(false);

    // Quick demo login handlers
    const handleDemoLogin = async (roleEmail, defaultPassword = 'password123') => {
        setDemoLoading(true);
        try {
            const res = await API.post('/auth/login', {
                email: roleEmail,
                password: defaultPassword
            });

            if (res.data.status === 'success') {
                login(res.data.token, res.data.user);
                if (res.data.user.role === 'donor') navigate('/donor-dashboard');
                else if (res.data.user.role === 'recipient') navigate('/recipient-dashboard');
                else if (res.data.user.role === 'blood_bank') navigate('/blood-bank-dashboard');
                else if (res.data.user.role === 'admin') navigate('/admin-dashboard');
            }
        } catch (err) {
            console.error("Demo login error:", err);
            alert("Demo login failed for " + roleEmail + ". Please try logging in manually or registering.");
        } finally {
            setDemoLoading(false);
        }
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="navbar-container">
            <div className="navbar-content">
                <Link to="/" className="navbar-logo">
                    <div className="logo-icon-wrapper pulse-glow">
                        <Droplet className="logo-icon" size={24} fill="#e63946" color="#e63946" />
                    </div>
                    <div className="logo-text-group">
                        <span className="logo-title">BLOOD-BRIDGE</span>
                        <span className="logo-subtitle">Saving Lives Together</span>
                    </div>
                </Link>

                <div className="navbar-links">
                    <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
                        Home
                    </Link>
                    <Link to="/recipient-dashboard" className={`nav-link ${isActive('/recipient-dashboard') ? 'active' : ''}`}>
                        <Search size={16} /> Find Blood
                    </Link>
                    {user?.role === 'donor' && (
                        <Link to="/donor-dashboard" className={`nav-link ${isActive('/donor-dashboard') ? 'active' : ''}`}>
                            <Heart size={16} /> Donor Portal
                        </Link>
                    )}
                    {user?.role === 'blood_bank' && (
                        <Link to="/blood-bank-dashboard" className={`nav-link ${isActive('/blood-bank-dashboard') ? 'active' : ''}`}>
                            <Building2 size={16} /> Blood Bank Portal
                        </Link>
                    )}
                    {user?.role === 'admin' && (
                        <Link to="/admin-dashboard" className={`nav-link ${isActive('/admin-dashboard') ? 'active' : ''}`}>
                            <ShieldAlert size={16} /> Admin Dashboard
                        </Link>
                    )}
                </div>

                <div className="navbar-actions">
                    {/* Quick Demo Selector Menu */}
                    <div className="demo-dropdown">
                        <button className="btn btn-secondary btn-sm demo-btn">
                            <Sparkles size={14} color="#f59e0b" /> Demo Roles
                        </button>
                        <div className="demo-menu">
                            <div className="demo-header">Select Demo Profile</div>
                            <button onClick={() => handleDemoLogin('john.donor@example.com')} className="demo-item">
                                <Heart size={14} color="#ef4444" /> Test Donor (John)
                            </button>
                            <button onClick={() => handleDemoLogin('rahul.recipient@example.com')} className="demo-item">
                                <Search size={14} color="#3b82f6" /> Test Recipient (Rahul)
                            </button>
                            <button onClick={() => handleDemoLogin('hyd.redcross@bloodbank.com')} className="demo-item">
                                <Building2 size={14} color="#10b981" /> Test Blood Bank (Hyd Red Cross)
                            </button>
                            <button onClick={() => handleDemoLogin('admin@bloodbridge.com')} className="demo-item">
                                <ShieldAlert size={14} color="#f59e0b" /> Test Admin
                            </button>
                        </div>
                    </div>

                    {user ? (
                        <div className="user-profile-badge">
                            <div className="user-info">
                                <span className="user-name">{user.full_name}</span>
                                <span className="user-role badge badge-blood">{user.role}</span>
                            </div>
                            <button onClick={logout} className="btn-icon" title="Logout">
                                <LogOut size={18} color="#ef4444" />
                            </button>
                        </div>
                    ) : (
                        <Link to="/login" className="btn btn-primary btn-sm">
                            <User size={16} /> Login / Register
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
