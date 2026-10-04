import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, Plus, Minus, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, Droplet } from 'lucide-react';
import API from '../api';

export default function BloodBankDashboard() {
    const { user } = useAuth();
    const [bankInfo, setBankInfo] = useState(null);
    const [inventory, setInventory] = useState({
        'A+': 18,
        'A-': 5,
        'B+': 21,
        'B-': 4,
        'AB+': 10,
        'AB-': 3,
        'O+': 25,
        'O-': 7
    });
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const invRes = await API.get('/blood-bank/inventory');
            if (invRes.data.status === 'success') {
                setBankInfo(invRes.data.bank);
                if (invRes.data.inventory) {
                    setInventory(invRes.data.inventory);
                }
            }
        } catch (err) {
            console.error("Fetch inventory error:", err);
        }

        try {
            const reqRes = await API.get('/blood-bank/requests');
            if (reqRes.data.status === 'success') {
                setRequests(reqRes.data.requests);
            }
        } catch (err) {
            console.error("Fetch bank requests error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const updateStock = async (bloodGroup, newUnits) => {
        if (newUnits < 0) return;
        setInventory(prev => ({ ...prev, [bloodGroup]: newUnits }));

        try {
            await API.put('/blood-bank/inventory', {
                blood_group: bloodGroup,
                units_available: newUnits
            });
        } catch (err) {
            console.error("Update stock error:", err);
            fetchData();
        }
    };

    const handleRequestAction = async (requestId, status) => {
        setActionLoading(true);
        let rejected_reason = null;
        if (status === 'REJECTED') {
            rejected_reason = window.prompt('Enter reason for rejection (optional):');
        }
        try {
            const res = await API.put(`/blood-bank/requests/${requestId}/status`, { status, rejected_reason });
            if (res.data.status === 'success') {
                fetchData();
            }
        } catch (err) {
            alert('Failed to update request: ' + (err.response?.data?.message || err.message));
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return <div className="loading-spinner-container">Loading Blood Bank Dashboard...</div>;
    }

    const bloodGroupsList = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const pendingRequests = requests.filter(r => r.status === 'PENDING');
    const processedRequests = requests.filter(r => r.status !== 'PENDING');

    return (
        <div className="dashboard-page-container">
            <div className="dashboard-header-with-actions">
                <div>
                    <h2>Blood Bank Dashboard</h2>
                    <p>{bankInfo?.bank_name || 'Blood Bank Portal'} — {bankInfo?.city || 'Hyderabad'}, {bankInfo?.state || ''}</p>
                    {bankInfo && (
                        <div style={{display:'flex', gap:'1.5rem', flexWrap:'wrap', marginTop:'0.4rem', fontSize:'0.82rem', color:'#94a3b8'}}>
                            {bankInfo.phone && <span>📞 {bankInfo.phone}</span>}
                            {bankInfo.email && <span>📧 {bankInfo.email}</span>}
                            {bankInfo.operating_hours && <span>🕒 {bankInfo.operating_hours}</span>}
                            {bankInfo.pincode && <span>📮 {bankInfo.pincode}</span>}
                            {bankInfo.license_number && <span>📄 {bankInfo.license_number}</span>}
                        </div>
                    )}
                </div>
                <button onClick={fetchData} className="btn btn-secondary btn-sm">
                    <RefreshCw size={14} /> Refresh Data
                </button>
            </div>

            {/* BLOOD INVENTORY CARD - Wireframe 5 */}
            <div className="inventory-card glass-panel">
                <div className="card-header-row">
                    <h3>Blood Inventory</h3>
                    <span className="badge badge-info">8 Groups Stocked</span>
                </div>

                <div className="inventory-grid">
                    {bloodGroupsList.map(bg => {
                        const units = inventory[bg] !== undefined ? inventory[bg] : 0;
                        const isLow = units < 5;
                        return (
                            <div key={bg} className={`inventory-item-card glass-card-interactive ${isLow ? 'low-stock' : ''}`}>
                                <div className="inventory-bg-label">{bg}</div>
                                <div className="inventory-units-count">
                                    {units} <span className="unit-text">units</span>
                                </div>
                                <div className="inventory-controls">
                                    <button 
                                        onClick={() => updateStock(bg, Math.max(0, units - 1))}
                                        className="btn-stock-control minus"
                                        title="Decrease Stock"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <button 
                                        onClick={() => updateStock(bg, units + 1)}
                                        className="btn-stock-control plus"
                                        title="Increase Stock"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* PENDING REQUESTS CARD - Wireframe 5 */}
            <div className="requests-management-card glass-panel" style={{ marginTop: '2rem' }}>
                <div className="card-header-row">
                    <h3>Pending Requests</h3>
                    <span className="badge badge-warning">{pendingRequests.length} Pending</span>
                </div>

                {pendingRequests.length === 0 ? (
                    <div className="empty-state-box">No pending blood requests at this moment.</div>
                ) : (
                    <div className="pending-requests-list">
                        {pendingRequests.map(req => (
                            <div key={req.request_id} className="pending-request-item glass-card-interactive">
                                <div className="req-details-left">
                                    <div className="req-bg-badge">
                                        <Droplet size={18} fill="#e63946" color="#e63946" />
                                        <span className="req-bg-text">{req.blood_group} | {req.units_required} units</span>
                                        {req.emergency && <span className="badge badge-danger" style={{fontSize:'0.65rem'}}>EMERGENCY</span>}
                                    </div>
                                    <div className="req-meta-info">
                                        {req.patient_name && <span><strong>Patient:</strong> {req.patient_name}</span>}
                                        {req.hospital_name && <span><strong>Hospital:</strong> {req.hospital_name}</span>}
                                        <span><strong>Recipient:</strong> {req.recipient_name} ({req.recipient_phone})</span>
                                        <span><strong>City:</strong> {req.recipient_city}</span>
                                        <span><strong>Requested:</strong> {new Date(req.request_date).toLocaleDateString()}</span>
                                        {req.required_by && <span><strong>Required By:</strong> {new Date(req.required_by).toLocaleDateString()}</span>}
                                        {req.notes && <div className="req-notes">"{req.notes}"</div>}
                                    </div>
                                </div>

                                <div className="req-actions-right">
                                    <button 
                                        onClick={() => handleRequestAction(req.request_id, 'APPROVED')}
                                        disabled={actionLoading}
                                        className="btn btn-success btn-sm"
                                    >
                                        <CheckCircle size={14} /> [ APPROVE ]
                                    </button>
                                    <button 
                                        onClick={() => handleRequestAction(req.request_id, 'REJECTED')}
                                        disabled={actionLoading}
                                        className="btn btn-danger btn-sm"
                                    >
                                        <XCircle size={14} /> [ REJECT ]
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Processed Requests History */}
                {processedRequests.length > 0 && (
                    <div style={{ marginTop: '2rem' }}>
                        <h4 className="text-muted" style={{ marginBottom: '1rem' }}>Processed Requests History</h4>
                        <div className="custom-table-container">
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>Req ID</th>
                                        <th>Recipient</th>
                                        <th>Patient</th>
                                        <th>Hospital</th>
                                        <th>Blood Group</th>
                                        <th>Units</th>
                                        <th>Fulfilled</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {processedRequests.map(r => (
                                        <tr key={r.request_id}>
                                            <td>#{r.request_id}</td>
                                            <td>{r.recipient_name}</td>
                                            <td>{r.patient_name || '-'}</td>
                                            <td>{r.hospital_name || '-'}</td>
                                            <td><span className="badge badge-blood">{r.blood_group}</span></td>
                                            <td>{r.units_required} units</td>
                                            <td>{r.fulfilled_date ? new Date(r.fulfilled_date).toLocaleDateString() : '-'}</td>
                                            <td>
                                                <span className={`badge ${r.status === 'APPROVED' ? 'badge-success' : 'badge-danger'}`}>
                                                    {r.status}
                                                </span>
                                                {r.rejected_reason && (
                                                    <div style={{fontSize:'0.7rem',color:'#ef4444',marginTop:'2px'}}>{r.rejected_reason}</div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
