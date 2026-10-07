import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Heart, Users, Building2, Activity, RefreshCw,
    CheckCircle, AlertTriangle, Clock, Droplet,
    MapPin, Phone, Mail, ShieldCheck, User, Search, Trash2
} from 'lucide-react';
import API from '../api';

const TABS = ['Overview', 'Donors', 'Recipients', 'Blood Banks', 'All Users', 'Blood Requests'];

export default function AdminDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('Overview');

    const [stats, setStats] = useState({
        totalDonors: 0,
        totalRecipients: 0,
        bloodBanks: 0,
        pendingRequests: 0,
        totalUsers: 0
    });
    const [recentRequests, setRecentRequests] = useState([]);
    const [recentDonations, setRecentDonations] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [donorsList, setDonorsList] = useState([]);
    const [recipientsList, setRecipientsList] = useState([]);
    const [bloodBanksList, setBloodBanksList] = useState([]);

    const [loading, setLoading] = useState(true);
    const [tabLoading, setTabLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [lastRefresh, setLastRefresh] = useState(null);

    const handleDeleteUser = async (userId, userName) => {
        if (!window.confirm(`Are you sure you want to delete user "${userName}" (ID #${userId})?\n\nThis will permanently remove their user record, role details, requests, and donations.`)) {
            return;
        }

        try {
            const res = await API.delete(`/admin/users/${userId}`);
            if (res.data.status === 'success') {
                alert(res.data.message);
                handleRefresh();
            }
        } catch (err) {
            console.error("Delete user error:", err);
            alert(err.response?.data?.message || "Failed to delete user.");
        }
    };

    const fetchStats = async () => {
        try {
            const res = await API.get('/admin/stats');
            if (res.data.status === 'success') setStats(res.data.stats);
        } catch (err) {
            console.error("Fetch admin stats error:", err);
        }
    };

    const fetchOverview = async () => {
        try {
            const [reqRes, donRes] = await Promise.all([
                API.get('/admin/recent-requests').catch(() => null),
                API.get('/admin/recent-donations').catch(() => null)
            ]);
            if (reqRes?.data?.status === 'success') setRecentRequests(reqRes.data.requests);
            if (donRes?.data?.status === 'success') setRecentDonations(donRes.data.donations);
        } catch (err) {
            console.error("Fetch admin overview error:", err);
        }
    };

    const fetchDonors = async () => {
        setTabLoading(true);
        try {
            const res = await API.get('/admin/donors');
            if (res.data.status === 'success') setDonorsList(res.data.donors);
        } catch (err) {
            console.error("Fetch donors error:", err);
        } finally {
            setTabLoading(false);
        }
    };

    const fetchRecipients = async () => {
        setTabLoading(true);
        try {
            const res = await API.get('/admin/recipients');
            if (res.data.status === 'success') setRecipientsList(res.data.recipients);
        } catch (err) {
            console.error("Fetch recipients error:", err);
        } finally {
            setTabLoading(false);
        }
    };

    const fetchBloodBanks = async () => {
        setTabLoading(true);
        try {
            const res = await API.get('/admin/blood-banks');
            if (res.data.status === 'success') setBloodBanksList(res.data.bloodBanks);
        } catch (err) {
            console.error("Fetch blood banks error:", err);
        } finally {
            setTabLoading(false);
        }
    };

    const fetchUsers = async () => {
        setTabLoading(true);
        try {
            const res = await API.get('/admin/users');
            if (res.data.status === 'success') setUsersList(res.data.users);
        } catch (err) {
            console.error("Fetch users error:", err);
        } finally {
            setTabLoading(false);
        }
    };

    const fetchBloodRequests = async () => {
        setTabLoading(true);
        try {
            const res = await API.get('/admin/recent-requests');
            if (res.data.status === 'success') setRecentRequests(res.data.requests);
        } catch (err) {
            console.error("Fetch blood requests error:", err);
        } finally {
            setTabLoading(false);
        }
    };

    const fetchAdminData = async () => {
        setLoading(true);
        await Promise.all([fetchStats(), fetchOverview()]);
        setLastRefresh(new Date());
        setLoading(false);
    };

    const handleRefresh = async () => {
        await fetchStats();
        switch (activeTab) {
            case 'Donors': await fetchDonors(); break;
            case 'Recipients': await fetchRecipients(); break;
            case 'Blood Banks': await fetchBloodBanks(); break;
            case 'All Users': await fetchUsers(); break;
            case 'Blood Requests': await fetchBloodRequests(); break;
            default: await fetchOverview(); break;
        }
        setLastRefresh(new Date());
    };

    useEffect(() => {
        fetchAdminData();
        // Auto-refresh every 30 seconds to catch new registrations
        const interval = setInterval(() => {
            fetchStats();
        }, 30000);
        return () => clearInterval(interval);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        setSearchQuery('');
        fetchStats(); // Always refresh counts on tab switch
        switch (activeTab) {
            case 'Donors': fetchDonors(); break;
            case 'Recipients': fetchRecipients(); break;
            case 'Blood Banks': fetchBloodBanks(); break;
            case 'All Users': fetchUsers(); break;
            case 'Blood Requests': fetchBloodRequests(); break;
            default: fetchOverview(); break;
        }
    }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

    const getStatusBadge = (status) => {
        const s = (status || '').toUpperCase();
        if (s === 'APPROVED') return <span className="badge badge-success"><CheckCircle size={12} /> APPROVED</span>;
        if (s === 'REJECTED') return <span className="badge badge-danger"><AlertTriangle size={12} /> REJECTED</span>;
        if (s === 'FULFILLED') return <span className="badge badge-info"><CheckCircle size={12} /> FULFILLED</span>;
        return <span className="badge badge-warning"><Clock size={12} /> PENDING</span>;
    };

    const filterRows = (rows, keys) => {
        if (!searchQuery.trim()) return rows;
        const q = searchQuery.toLowerCase();
        return rows.filter(r => keys.some(k => (r[k] || '').toString().toLowerCase().includes(q)));
    };

    if (loading) {
        return (
            <div className="loading-spinner-container">
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{
                        width: 48, height: 48, borderRadius: '50%',
                        border: '4px solid rgba(230,57,70,0.2)',
                        borderTopColor: '#e63946',
                        animation: 'spin 0.8s linear infinite',
                        margin: '0 auto 1rem'
                    }} />
                    Loading Admin Dashboard...
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-page-container">
            {/* HEADER */}
            <div className="dashboard-header-with-actions">
                <div>
                    <h2>Admin Dashboard</h2>
                    <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>
                        System Overview &amp; Network Management
                        {lastRefresh && <span style={{ marginLeft: '0.75rem', color: '#10b981' }}>
                            ✓ Last synced: {lastRefresh.toLocaleTimeString()}
                        </span>}
                    </p>
                </div>
                <button onClick={handleRefresh} className="btn btn-secondary btn-sm">
                    <RefreshCw size={14} /> Refresh Data
                </button>
            </div>

            {/* STATS GRID */}
            <div className="admin-overview-card glass-panel" style={{ marginBottom: '1.5rem' }}>
                <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                    <div className="admin-stat-item" onClick={() => setActiveTab('Donors')} style={{ cursor: 'pointer' }}>
                        <div className="stat-value highlight-red">{stats.totalDonors}</div>
                        <div className="stat-label"><Heart size={13} /> Total Donors</div>
                    </div>
                    <div className="admin-stat-item" onClick={() => setActiveTab('Recipients')} style={{ cursor: 'pointer' }}>
                        <div className="stat-value highlight-blue">{stats.totalRecipients}</div>
                        <div className="stat-label"><Users size={13} /> Total Recipients</div>
                    </div>
                    <div className="admin-stat-item" onClick={() => setActiveTab('Blood Banks')} style={{ cursor: 'pointer' }}>
                        <div className="stat-value highlight-green">{stats.bloodBanks}</div>
                        <div className="stat-label"><Building2 size={13} /> Blood Banks</div>
                    </div>
                    <div className="admin-stat-item" onClick={() => setActiveTab('Blood Requests')} style={{ cursor: 'pointer' }}>
                        <div className="stat-value highlight-yellow">{stats.pendingRequests}</div>
                        <div className="stat-label"><Activity size={13} /> Pending Requests</div>
                    </div>
                    <div className="admin-stat-item" onClick={() => setActiveTab('All Users')} style={{ cursor: 'pointer' }}>
                        <div className="stat-value" style={{ color: '#a78bfa' }}>{stats.totalUsers}</div>
                        <div className="stat-label"><ShieldCheck size={13} /> Total Users</div>
                    </div>
                </div>
            </div>

            {/* TAB BAR */}
            <div className="glass-panel" style={{ padding: '0', marginBottom: '1.5rem', overflow: 'hidden' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', overflowX: 'auto' }}>
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: '0.85rem 1.4rem',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                letterSpacing: '0.03em',
                                whiteSpace: 'nowrap',
                                color: activeTab === tab ? '#e63946' : 'rgba(255,255,255,0.55)',
                                borderBottom: activeTab === tab ? '2px solid #e63946' : '2px solid transparent',
                                transition: 'all 0.2s',
                                fontFamily: 'inherit'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* SEARCH BAR (for tabs with lists) */}
            {activeTab !== 'Overview' && (
                <div style={{ marginBottom: '1rem', position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                    <input
                        type="text"
                        placeholder={`Search ${activeTab.toLowerCase()}...`}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="form-control"
                        style={{ paddingLeft: '2.5rem' }}
                    />
                </div>
            )}

            {/* TAB CONTENT */}
            {tabLoading ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ opacity: 0.6 }}>Loading {activeTab}...</div>
                </div>
            ) : (
                <div className="glass-panel">

                    {/* ─── OVERVIEW TAB ─── */}
                    {activeTab === 'Overview' && (
                        <>
                            <div className="admin-section">
                                <h3 className="admin-section-title">Recent Blood Requests</h3>
                                {recentRequests.length === 0 ? (
                                    <p className="text-muted">No recent requests recorded.</p>
                                ) : (
                                    <div className="custom-table-container">
                                        <table className="custom-table">
                                            <thead>
                                                <tr>
                                                    <th>Req ID</th>
                                                    <th>Recipient</th>
                                                    <th>Patient</th>
                                                    <th>Blood</th>
                                                    <th>Units</th>
                                                    <th>Target Bank</th>
                                                    <th>Date</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {recentRequests.slice(0, 10).map(r => (
                                                    <tr key={r.request_id}>
                                                        <td>#{r.request_id}</td>
                                                        <td>{r.recipient_name}</td>
                                                        <td>{r.patient_name || '-'}</td>
                                                        <td><span className="badge badge-blood">{r.blood_group}</span></td>
                                                        <td>{r.units_required} units</td>
                                                        <td>{r.bank_name || 'General'}</td>
                                                        <td>{r.request_date ? new Date(r.request_date).toLocaleDateString() : '-'}</td>
                                                        <td>{getStatusBadge(r.status)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="card-divider" />

                            <div className="admin-section">
                                <h3 className="admin-section-title">Recent Donations</h3>
                                {recentDonations.length === 0 ? (
                                    <p className="text-muted">No recent donations logged.</p>
                                ) : (
                                    <div className="custom-table-container">
                                        <table className="custom-table">
                                            <thead>
                                                <tr>
                                                    <th>Donation ID</th>
                                                    <th>Donor Name</th>
                                                    <th>Blood Group</th>
                                                    <th>Units</th>
                                                    <th>Blood Bank / Center</th>
                                                    <th>Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {recentDonations.slice(0, 10).map(d => (
                                                    <tr key={d.donation_id}>
                                                        <td>#{d.donation_id}</td>
                                                        <td>{d.donor_name}</td>
                                                        <td><span className="badge badge-blood">{d.blood_group}</span></td>
                                                        <td>{d.units_donated} unit(s)</td>
                                                        <td>{d.bank_name || 'Red Cross Center'}</td>
                                                        <td>{new Date(d.donation_date).toLocaleDateString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* ─── DONORS TAB ─── */}
                    {activeTab === 'Donors' && (
                        <div className="admin-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 className="admin-section-title" style={{ margin: 0 }}>
                                    Registered Donors
                                    <span className="badge badge-blood" style={{ marginLeft: '0.6rem', fontSize: '0.75rem' }}>
                                        {donorsList.length} total
                                    </span>
                                </h3>
                            </div>
                            {donorsList.length === 0 ? (
                                <div className="empty-state-box">No donors registered yet.</div>
                            ) : (
                                <div className="custom-table-container">
                                    <table className="custom-table">
                                        <thead>
                                            <tr>
                                                <th>Donor ID</th>
                                                <th>Full Name</th>
                                                <th>Email</th>
                                                <th>Phone</th>
                                                <th>Blood Group</th>
                                                <th>Gender</th>
                                                <th>Location</th>
                                                <th>Available</th>
                                                <th>Total Donations</th>
                                                <th>Next Eligible</th>
                                                <th>Registered</th>
                                                <th style={{ textAlign: 'center' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filterRows(donorsList, ['full_name', 'email', 'phone', 'blood_group', 'city', 'state']).map(d => (
                                                <tr key={d.donor_id}>
                                                    <td>#{d.user_id}</td>
                                                    <td><strong>{d.full_name}</strong></td>
                                                    <td style={{ fontSize: '0.8rem' }}>{d.email}</td>
                                                    <td>{d.phone}</td>
                                                    <td><span className="badge badge-blood">{d.blood_group}</span></td>
                                                    <td>{d.gender || '-'}</td>
                                                    <td><MapPin size={12} /> {d.city}, {d.state}</td>
                                                    <td>
                                                        {d.is_available
                                                            ? <span className="badge badge-success"><CheckCircle size={11} /> Yes</span>
                                                            : <span className="badge badge-warning">No</span>
                                                        }
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>{d.total_donations || 0}</td>
                                                    <td style={{ fontSize: '0.8rem' }}>{d.next_eligible_date ? new Date(d.next_eligible_date).toLocaleDateString() : '-'}</td>
                                                    <td style={{ fontSize: '0.78rem', opacity: 0.7 }}>{d.created_at ? new Date(d.created_at).toLocaleDateString() : '-'}</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <button
                                                            onClick={() => handleDeleteUser(d.user_id, d.full_name)}
                                                            className="btn btn-secondary btn-sm"
                                                            style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', padding: '3px 8px' }}
                                                            title="Delete User"
                                                        >
                                                            <Trash2 size={13} /> Remove
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── RECIPIENTS TAB ─── */}
                    {activeTab === 'Recipients' && (
                        <div className="admin-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 className="admin-section-title" style={{ margin: 0 }}>
                                    Registered Recipients
                                    <span className="badge badge-info" style={{ marginLeft: '0.6rem', fontSize: '0.75rem' }}>
                                        {recipientsList.length} total
                                    </span>
                                </h3>
                            </div>
                            {recipientsList.length === 0 ? (
                                <div className="empty-state-box">No recipients registered yet.</div>
                            ) : (
                                <div className="custom-table-container">
                                    <table className="custom-table">
                                        <thead>
                                            <tr>
                                                <th>User ID</th>
                                                <th>Full Name</th>
                                                <th>Email</th>
                                                <th>Phone</th>
                                                <th>Blood Needed</th>
                                                <th>Medical Reason</th>
                                                <th>Hospital</th>
                                                <th>Location</th>
                                                <th>Registered</th>
                                                <th style={{ textAlign: 'center' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filterRows(recipientsList, ['full_name', 'email', 'phone', 'blood_group', 'city', 'hospital_name']).map(r => (
                                                <tr key={r.recipient_id}>
                                                    <td>#{r.user_id}</td>
                                                    <td><strong>{r.full_name}</strong></td>
                                                    <td style={{ fontSize: '0.8rem' }}>{r.email}</td>
                                                    <td>{r.phone}</td>
                                                    <td><span className="badge badge-blood">{r.blood_group}</span></td>
                                                    <td style={{ fontSize: '0.8rem', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.medical_reason || '-'}</td>
                                                    <td style={{ fontSize: '0.8rem' }}>{r.hospital_name || '-'}</td>
                                                    <td><MapPin size={12} /> {r.city}, {r.state}</td>
                                                    <td style={{ fontSize: '0.78rem', opacity: 0.7 }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <button
                                                            onClick={() => handleDeleteUser(r.user_id, r.full_name)}
                                                            className="btn btn-secondary btn-sm"
                                                            style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', padding: '3px 8px' }}
                                                            title="Delete User"
                                                        >
                                                            <Trash2 size={13} /> Remove
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── BLOOD BANKS TAB ─── */}
                    {activeTab === 'Blood Banks' && (
                        <div className="admin-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 className="admin-section-title" style={{ margin: 0 }}>
                                    Registered Blood Banks
                                    <span className="badge badge-success" style={{ marginLeft: '0.6rem', fontSize: '0.75rem' }}>
                                        {bloodBanksList.length} total
                                    </span>
                                </h3>
                            </div>
                            {bloodBanksList.length === 0 ? (
                                <div className="empty-state-box">No blood banks registered yet.</div>
                            ) : (
                                <div className="custom-table-container">
                                    <table className="custom-table">
                                        <thead>
                                            <tr>
                                                <th>Bank ID</th>
                                                <th>Bank Name</th>
                                                <th>License</th>
                                                <th>Contact</th>
                                                <th>Location</th>
                                                <th>Total Units</th>
                                                <th>Verified</th>
                                                <th>Active</th>
                                                <th>Registered</th>
                                                <th style={{ textAlign: 'center' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filterRows(bloodBanksList, ['bank_name', 'license_number', 'phone', 'email', 'city', 'state']).map(b => (
                                                <tr key={b.blood_bank_id}>
                                                    <td>#{b.blood_bank_id}</td>
                                                    <td><strong>{b.bank_name}</strong></td>
                                                    <td style={{ fontSize: '0.78rem' }}>{b.license_number}</td>
                                                    <td style={{ fontSize: '0.78rem' }}>{b.phone || b.email || '-'}</td>
                                                    <td><MapPin size={12} /> {b.city}, {b.state}</td>
                                                    <td><span className="badge badge-blood">{b.total_units} units</span></td>
                                                    <td>
                                                        {b.verified
                                                            ? <span className="badge badge-success"><ShieldCheck size={11} /> Yes</span>
                                                            : <span className="badge badge-warning">Pending</span>
                                                        }
                                                    </td>
                                                    <td>
                                                        {b.is_active
                                                            ? <span className="badge badge-success">Active</span>
                                                            : <span className="badge badge-danger">Inactive</span>
                                                        }
                                                    </td>
                                                    <td style={{ fontSize: '0.78rem', opacity: 0.7 }}>{b.created_at ? new Date(b.created_at).toLocaleDateString() : '-'}</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <button
                                                            onClick={() => handleDeleteUser(b.user_id, b.bank_name)}
                                                            className="btn btn-secondary btn-sm"
                                                            style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', padding: '3px 8px' }}
                                                            title="Delete Blood Bank User"
                                                        >
                                                            <Trash2 size={13} /> Remove
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── ALL USERS TAB ─── */}
                    {activeTab === 'All Users' && (
                        <div className="admin-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 className="admin-section-title" style={{ margin: 0 }}>
                                    System Users Directory
                                    <span className="badge badge-secondary" style={{ marginLeft: '0.6rem', fontSize: '0.75rem' }}>
                                        {usersList.length} loaded
                                    </span>
                                </h3>
                            </div>
                            <div className="custom-table-container">
                                <table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>User ID</th>
                                            <th>Full Name</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Role</th>
                                            <th>Location</th>
                                            <th>Registered</th>
                                            <th style={{ textAlign: 'center' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filterRows(usersList, ['full_name', 'email', 'phone', 'role', 'city', 'state']).map(u => (
                                            <tr key={u.user_id}>
                                                <td>#{u.user_id}</td>
                                                <td><strong>{u.full_name}</strong></td>
                                                <td style={{ fontSize: '0.8rem' }}>{u.email}</td>
                                                <td>{u.phone}</td>
                                                <td>
                                                    <span className={`badge ${
                                                        u.role === 'admin' ? 'badge-danger' :
                                                        u.role === 'blood_bank' ? 'badge-success' :
                                                        u.role === 'donor' ? 'badge-blood' : 'badge-info'
                                                    }`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td>{u.city}, {u.state}</td>
                                                <td style={{ fontSize: '0.78rem', opacity: 0.7 }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {u.user_id !== user?.user_id ? (
                                                        <button
                                                            onClick={() => handleDeleteUser(u.user_id, u.full_name)}
                                                            className="btn btn-secondary btn-sm"
                                                            style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', padding: '3px 8px' }}
                                                            title="Delete User"
                                                        >
                                                            <Trash2 size={13} /> Remove
                                                        </button>
                                                    ) : (
                                                        <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>You</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ─── BLOOD REQUESTS TAB ─── */}
                    {activeTab === 'Blood Requests' && (
                        <div className="admin-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 className="admin-section-title" style={{ margin: 0 }}>
                                    All Blood Requests
                                    <span className="badge badge-warning" style={{ marginLeft: '0.6rem', fontSize: '0.75rem' }}>
                                        {recentRequests.length} loaded
                                    </span>
                                </h3>
                            </div>
                            {recentRequests.length === 0 ? (
                                <div className="empty-state-box">No blood requests submitted yet.</div>
                            ) : (
                                <div className="custom-table-container">
                                    <table className="custom-table">
                                        <thead>
                                            <tr>
                                                <th>Req ID</th>
                                                <th>Recipient</th>
                                                <th>Patient</th>
                                                <th>Blood</th>
                                                <th>Units</th>
                                                <th>Hospital</th>
                                                <th>Target Bank</th>
                                                <th>Emergency</th>
                                                <th>Date</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filterRows(recentRequests, ['recipient_name', 'patient_name', 'blood_group', 'bank_name', 'hospital_name']).map(r => (
                                                <tr key={r.request_id}>
                                                    <td>#{r.request_id}</td>
                                                    <td>{r.recipient_name}</td>
                                                    <td>{r.patient_name || '-'}</td>
                                                    <td><span className="badge badge-blood">{r.blood_group}</span></td>
                                                    <td>{r.units_required}</td>
                                                    <td style={{ fontSize: '0.8rem' }}>{r.hospital_name || '-'}</td>
                                                    <td>{r.bank_name || 'General'}</td>
                                                    <td>
                                                        {r.emergency
                                                            ? <span className="badge badge-danger">🚨 YES</span>
                                                            : <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>No</span>
                                                        }
                                                    </td>
                                                    <td style={{ fontSize: '0.8rem' }}>{r.request_date ? new Date(r.request_date).toLocaleDateString() : '-'}</td>
                                                    <td>{getStatusBadge(r.status)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}
