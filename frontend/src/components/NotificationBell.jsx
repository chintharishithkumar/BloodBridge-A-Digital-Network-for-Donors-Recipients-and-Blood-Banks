import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, AlertTriangle, Droplet, Clock, X } from 'lucide-react';
import API from '../api';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const res = await API.get('/notifications');
            if (res.data.status === 'success') {
                setNotifications(res.data.notifications || []);
                setUnreadCount(res.data.unreadCount || 0);
            }
        } catch (err) {
            // Quiet fail if unauthenticated or error
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAllRead = async () => {
        try {
            await API.put('/notifications/read-all');
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (err) {
            console.error("Mark all read error:", err);
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await API.put(`/notifications/${id}/read`);
            setUnreadCount(prev => Math.max(0, prev - 1));
            setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
        } catch (err) {
            console.error("Mark read error:", err);
        }
    };

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="btn-icon"
                style={{
                    position: 'relative',
                    background: isOpen ? 'rgba(230,57,70,0.15)' : 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#ffffff',
                    transition: 'all 0.2s'
                }}
                title="Notifications & Network Alerts"
            >
                <Bell size={18} color={unreadCount > 0 ? '#ef4444' : '#e2e8f0'} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        background: '#ef4444',
                        color: '#ffffff',
                        fontSize: '0.68rem',
                        fontWeight: 'bold',
                        borderRadius: '10px',
                        padding: '1px 5px',
                        minWidth: '16px',
                        textAlign: 'center',
                        boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)',
                        animation: 'pulse 1.5s infinite'
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '46px',
                    width: '340px',
                    maxHeight: '450px',
                    background: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        padding: '0.85rem 1rem',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Bell size={15} color="#e63946" /> Network Alerts
                            {unreadCount > 0 && (
                                <span className="badge badge-blood" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#60a5fa',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                }}
                            >
                                <CheckCheck size={13} /> Mark all read
                            </button>
                        )}
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1, padding: '0.5rem' }}>
                        {notifications.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem 1rem', opacity: 0.6, fontSize: '0.85rem' }}>
                                <Bell size={24} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                                <p>No alerts or notifications yet.</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.notification_id}
                                    onClick={() => !n.is_read && handleMarkRead(n.notification_id)}
                                    style={{
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        marginBottom: '0.5rem',
                                        background: n.type === 'emergency_request'
                                            ? 'rgba(239, 68, 68, 0.12)'
                                            : !n.is_read ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                                        border: n.type === 'emergency_request'
                                            ? '1px solid rgba(239, 68, 68, 0.3)'
                                            : !n.is_read ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid transparent',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        position: 'relative'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                        {n.type === 'emergency_request' ? (
                                            <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                                        ) : (
                                            <Droplet size={16} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                fontSize: '0.82rem',
                                                fontWeight: 600,
                                                color: n.type === 'emergency_request' ? '#fca5a5' : '#ffffff',
                                                marginBottom: '3px'
                                            }}>
                                                {n.title}
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: '1.35', marginBottom: '6px' }}>
                                                {n.message}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={11} /> {new Date(n.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        {!n.is_read && (
                                            <span style={{
                                                width: '7px',
                                                height: '7px',
                                                borderRadius: '50%',
                                                background: '#ef4444',
                                                flexShrink: 0,
                                                marginTop: '4px'
                                            }} />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
