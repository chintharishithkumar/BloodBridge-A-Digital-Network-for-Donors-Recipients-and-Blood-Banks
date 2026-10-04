import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Heart, Users, Building2, Activity, Clock, RefreshCw, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import API from '../api';

export default function AdminDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalDonors: 80,
        totalRecipients: 45,
        bloodBanks: 8,
        pendingRequests: 12
    });
    const [recentRequests, setRecentRequests] = useState([]);
    const [recentDonations, setRecentDonations] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAdminData = async () => {
        setLoading(true);
        try {
            const statsRes = await API.get('/admin/stats');
            if (statsRes.data.status === 'success') {
                setStats(statsRes.data.stats);
            }
        } catch (err) {
            console.error("Fetch admin stats error:", err);
        }

        try {
            const reqRes = await API.get('/admin/recent-requests');
            if (reqRes.data.status === 'success') {
                setRecentRequests(reqRes.data.requests);
            }
        } catch (err) {
            console.error("Fetch admin requests error:", err);
        }

        try {
            const donRes = await API.get('/admin/recent-donations');
            if (donRes.data.status === 'success') {
                setRecentDonations(donRes.data.donations);
            }
        } catch (err) {
            console.error("Fetch admin donations error:", err);
        }

        try {
            const usersRes = await API.get('/admin/users');
            if (usersRes.data.status === 'success') {
                setUsersList(usersRes.data.users);
            }
        } catch (err) {
            console.error("Fetch admin users error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminData();
    }, []);

    if (loading) {
        return <div className="loading-spinner-container">Loading Admin Overview...</div>;
    }

    return (
        <div className="dashboard-page-container">
            <div className="dashboard-header-with-actions">
                <div>
                    <h2>Admin Dashboard</h2>
                    <p>System Overview & Network Analytics</p>
                </div>
                <button onClick={fetchAdminData} className="btn btn-secondary btn-sm">
                    <RefreshCw size={14} /> Sync Metrics
                </button>
            </div>

            {/* ADMIN DASHBOARD MAIN CARD - Wireframe 6 */}
            <div className="admin-overview-card glass-panel">
                <div className="admin-stats-grid">
                    <div className="admin-stat-item">
                        <div className="stat-value highlight-red">{stats.totalDonors}</div>
                        <div className="stat-label">Total Donors</div>
                    </div>

                    <div className="admin-stat-item">
                        <div className="stat-value highlight-blue">{stats.totalRecipients}</div>
                        <div className="stat-label">Total Recipients</div>
                    </div>

                    <div className="admin-stat-item">
                        <div className="stat-value highlight-green">{stats.bloodBanks}</div>
                        <div className="stat-label">Blood Banks</div>
                    </div>

                    <div className="admin-stat-item">
                        <div className="stat-value highlight-yellow">{stats.pendingRequests}</div>
                        <div className="stat-label">Pending Requests</div>
                    </div>
                </div>

                <div className="card-divider"></div>

                {/* RECENT REQUESTS - Wireframe 6 */}
                <div className="admin-section">
                    <h3 className="admin-section-title">Recent Requests</h3>
                    {recentRequests.length === 0 ? (
                        <p className="text-muted">No recent requests recorded.</p>
                    ) : (
                        <div className="custom-table-container">
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>Req ID</th>
                                        <th>Recipient</th>
                                        <th>Blood Group</th>
                                        <th>Units</th>
                                        <th>Target Bank</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentRequests.map(r => (
                                        <tr key={r.request_id}>
                                            <td>#{r.request_id}</td>
                                            <td>{r.recipient_name}</td>
                                            <td><span className="badge badge-blood">{r.blood_group}</span></td>
                                            <td>{r.units_required} units</td>
                                            <td>{r.bank_name || 'General'}</td>
                                            <td>{new Date(r.request_date).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`badge ${
                                                    r.status === 'APPROVED' ? 'badge-success' :
                                                    r.status === 'REJECTED' ? 'badge-danger' :
                                                    r.status === 'FULFILLED' ? 'badge-info' : 'badge-warning'
                                                }`}>
                                                    {r.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="card-divider"></div>

                {/* RECENT DONATIONS - Wireframe 6 */}
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
                                    {recentDonations.map(d => (
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

                <div className="card-divider"></div>

                {/* REGISTERED USERS DIRECTORY */}
                <div className="admin-section">
                    <h3 className="admin-section-title">System Users Directory</h3>
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
                                </tr>
                            </thead>
                            <tbody>
                                {usersList.map(u => (
                                    <tr key={u.user_id}>
                                        <td>#{u.user_id}</td>
                                        <td><strong>{u.full_name}</strong></td>
                                        <td>{u.email}</td>
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
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
