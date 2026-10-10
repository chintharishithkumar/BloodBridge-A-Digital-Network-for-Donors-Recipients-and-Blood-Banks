import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Droplet, User, LogOut, ShieldAlert, Heart, Building2, Search, AlertTriangle } from 'lucide-react';
import API from '../api';
import NotificationBell from './NotificationBell';
import EmergencyRequestModal from './EmergencyRequestModal';

export default function Navbar() {
    const { user, logout, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

    const isActive = (path) => location.pathname === path;

    return (
        <>
            <nav className="navbar-container">
                <div className="navbar-content">
                    <Link to="/" className="navbar-logo">
                        <div className="logo-icon-wrapper pulse-glow">
                            <Droplet className="logo-icon" size={24} fill="#dc2626" color="#dc2626" />
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

                    <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* 🚨 PUBLIC EMERGENCY BLOOD REQUEST BUTTON */}
                        <button
                            onClick={() => setIsEmergencyModalOpen(true)}
                            className="btn btn-sm"
                            style={{
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                color: '#ffffff',
                                border: 'none',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                padding: '0.45rem 0.85rem',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                boxShadow: '0 0 12px rgba(239, 68, 68, 0.6)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <AlertTriangle size={15} color="#ffffff" className="pulse" />
                            <span>🚨 EMERGENCY REQUEST</span>
                        </button>

                        {/* Notifications Bell for Logged-In Users */}
                        {user && <NotificationBell />}



                        {user ? (
                            <div className="user-profile-badge">
                                <div className="user-info">
                                    <span className="user-name">{user.full_name}</span>
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

            {/* Emergency Request Modal */}
            <EmergencyRequestModal
                isOpen={isEmergencyModalOpen}
                onClose={() => setIsEmergencyModalOpen(false)}
            />
        </>
    );
}
