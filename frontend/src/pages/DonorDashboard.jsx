import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Droplet, MapPin, Phone, Calendar, Heart, Edit, History, PlusCircle, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import API from '../api';

export default function DonorDashboard() {
    const { user, refreshUser } = useAuth();
    const [donorProfile, setDonorProfile] = useState(null);
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Modals
    const [showEditModal, setShowEditModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showLogDonationModal, setShowLogDonationModal] = useState(false);

    // Form States
    const [editForm, setEditForm] = useState({
        full_name: '',
        phone: '',
        city: '',
        state: '',
        blood_group: 'O+',
        is_available: true,
        weight_kg: '',
        medical_conditions: '',
        id_proof_number: ''
    });

    const [logForm, setLogForm] = useState({
        blood_bank_id: null,
        donation_date: new Date().toISOString().split('T')[0],
        units_donated: 1,
        blood_group: 'O+',
        certificate_number: '',
        notes: ''
    });

    const fetchDonorData = async () => {
        setLoading(true);
        try {
            const res = await API.get('/donors/profile');
            if (res.data.status === 'success') {
                setDonorProfile(res.data.donor);
                setEditForm({
                    full_name: res.data.donor.full_name || user?.full_name || '',
                    phone: res.data.donor.phone || user?.phone || '',
                    city: res.data.donor.city || user?.city || '',
                    state: res.data.donor.state || user?.state || '',
                    blood_group: res.data.donor.blood_group || 'O+',
                    is_available: res.data.donor.is_available ?? true,
                    weight_kg: res.data.donor.weight_kg || '',
                    medical_conditions: res.data.donor.medical_conditions || '',
                    id_proof_number: res.data.donor.id_proof_number || ''
                });
                setLogForm(prev => ({ ...prev, blood_group: res.data.donor.blood_group || 'O+' }));
            }
        } catch (err) {
            console.error("Fetch donor error:", err);
        }

        try {
            const histRes = await API.get('/donors/history');
            if (histRes.data.status === 'success') {
                setDonations(histRes.data.donations);
            }
        } catch (err) {
            console.error("Fetch history error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDonorData();
    }, []);

    const toggleAvailability = async () => {
        if (!donorProfile) return;
        const newStatus = !donorProfile.is_available;
        setUpdating(true);
        try {
            const res = await API.put('/donors/availability', { is_available: newStatus });
            if (res.data.status === 'success') {
                setDonorProfile(prev => ({ ...prev, is_available: newStatus }));
            }
        } catch (err) {
            alert('Failed to update availability');
        } finally {
            setUpdating(false);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const res = await API.put('/donors/profile', editForm);
            if (res.data.status === 'success') {
                setShowEditModal(false);
                fetchDonorData();
                refreshUser();
            }
        } catch (err) {
            alert('Error updating profile');
        } finally {
            setUpdating(false);
        }
    };

    const handleLogDonationSubmit = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const res = await API.post('/donors/donations', logForm);
            if (res.data.status === 'success') {
                setShowLogDonationModal(false);
                fetchDonorData();
            }
        } catch (err) {
            alert('Error logging donation');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return <div className="loading-spinner-container">Loading Donor Profile...</div>;
    }

    const donorName = donorProfile?.full_name || user?.full_name || 'Test Donor';
    const bloodGroup = donorProfile?.blood_group || 'O+';
    const location = `${donorProfile?.city || user?.city || 'Hyderabad'}, ${donorProfile?.state || user?.state || 'Telangana'}`;
    const isAvailable = donorProfile?.is_available ?? true;

    return (
        <div className="dashboard-page-container">
            <div className="dashboard-header">
                <h2>Donor Dashboard</h2>
                <p>Manage your donation profile and blood availability status</p>
            </div>

            {/* DONOR DASHBOARD CARD - Wireframe 3 */}
            <div className="donor-card glass-panel">
                <div className="donor-card-header">
                    <div className="donor-welcome-title">
                        <Heart size={28} color="#e63946" fill="#e63946" />
                        <h3>Welcome, {donorName}</h3>
                    </div>
                    <span className="badge badge-blood">{bloodGroup}</span>
                </div>

                <div className="donor-details-grid">
                    <div className="donor-detail-item">
                        <Droplet size={18} color="#e63946" />
                        <div>
                            <span className="detail-label">Blood Group:</span>
                            <span className="detail-value highlight-red">{bloodGroup}</span>
                        </div>
                    </div>

                    <div className="donor-detail-item">
                        <MapPin size={18} color="#3b82f6" />
                        <div>
                            <span className="detail-label">Location:</span>
                            <span className="detail-value">{location}</span>
                        </div>
                    </div>

                    <div className="donor-detail-item">
                        <Phone size={18} color="#10b981" />
                        <div>
                            <span className="detail-label">Contact:</span>
                            <span className="detail-value">{donorProfile?.phone || user?.phone || 'Not provided'}</span>
                        </div>
                    </div>

                    <div className="donor-detail-item">
                        <Calendar size={18} color="#f59e0b" />
                        <div>
                            <span className="detail-label">Last Donation:</span>
                            <span className="detail-value">
                                {donorProfile?.last_donation_date 
                                    ? new Date(donorProfile.last_donation_date).toLocaleDateString()
                                    : 'None recorded'}
                            </span>
                        </div>
                    </div>

                    <div className="donor-detail-item">
                        <span style={{fontSize:'1rem'}}>⚖️</span>
                        <div>
                            <span className="detail-label">Weight:</span>
                            <span className="detail-value">{donorProfile?.weight_kg ? `${donorProfile.weight_kg} kg` : 'Not set'}</span>
                        </div>
                    </div>

                    <div className="donor-detail-item">
                        <span style={{fontSize:'1rem'}}>🩸</span>
                        <div>
                            <span className="detail-label">Total Donations:</span>
                            <span className="detail-value highlight-red">{donorProfile?.total_donations ?? 0}</span>
                        </div>
                    </div>

                    <div className="donor-detail-item">
                        <span style={{fontSize:'1rem'}}>📅</span>
                        <div>
                            <span className="detail-label">Next Eligible:</span>
                            <span className="detail-value">
                                {donorProfile?.next_eligible_date
                                    ? new Date(donorProfile.next_eligible_date).toLocaleDateString()
                                    : 'Anytime'}
                            </span>
                        </div>
                    </div>

                    {donorProfile?.medical_conditions && (
                        <div className="donor-detail-item">
                            <span style={{fontSize:'1rem'}}>🩺</span>
                            <div>
                                <span className="detail-label">Medical Notes:</span>
                                <span className="detail-value">{donorProfile.medical_conditions}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="donor-availability-row">
                    <span className="avail-text">Availability Status:</span>
                    <button 
                        onClick={toggleAvailability}
                        disabled={updating}
                        className={`availability-toggle-btn ${isAvailable ? 'available' : 'unavailable'}`}
                    >
                        {isAvailable ? (
                            <>
                                <CheckCircle size={18} /> AVAILABILITY: AVAILABLE
                            </>
                        ) : (
                            <>
                                <XCircle size={18} /> AVAILABILITY: UNAVAILABLE
                            </>
                        )}
                    </button>
                </div>

                {/* Wireframe 3 Action Buttons */}
                <div className="donor-actions-footer">
                    <button onClick={() => setShowEditModal(true)} className="btn btn-secondary">
                        <Edit size={16} /> [ Update Profile ]
                    </button>
                    <button onClick={() => setShowHistoryModal(true)} className="btn btn-primary">
                        <History size={16} /> [ Donation History ]
                    </button>
                </div>
            </div>

            {/* EDIT PROFILE MODAL */}
            {showEditModal && (
                <div className="modal-overlay">
                    <div className="modal-content modal-lg">
                        <h3>✏️ Update Donor Profile</h3>
                        <form onSubmit={handleEditSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input type="text" value={editForm.full_name}
                                        onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                                        className="form-control" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <input type="text" value={editForm.phone}
                                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="form-control" />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">City</label>
                                    <input type="text" value={editForm.city}
                                        onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                                        className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">State</label>
                                    <input type="text" value={editForm.state}
                                        onChange={e => setEditForm({ ...editForm, state: e.target.value })}
                                        className="form-control" />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">🩸 Blood Group</label>
                                    <select value={editForm.blood_group}
                                        onChange={e => setEditForm({ ...editForm, blood_group: e.target.value })}
                                        className="form-control">
                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                            <option key={bg} value={bg}>{bg}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">⚖️ Weight (kg)</label>
                                    <input type="number" min="40" max="200" value={editForm.weight_kg}
                                        onChange={e => setEditForm({ ...editForm, weight_kg: e.target.value })}
                                        placeholder="65" className="form-control" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">🪪 ID Proof Number (Aadhaar / PAN)</label>
                                <input type="text" value={editForm.id_proof_number}
                                    onChange={e => setEditForm({ ...editForm, id_proof_number: e.target.value })}
                                    placeholder="XXXX-XXXX-XXXX" className="form-control" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">🩺 Medical Conditions (if any)</label>
                                <textarea value={editForm.medical_conditions}
                                    onChange={e => setEditForm({ ...editForm, medical_conditions: e.target.value })}
                                    placeholder="None / Diabetes / Hypertension" className="form-control" rows={2} />
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" disabled={updating} className="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DONATION HISTORY MODAL */}
            {showHistoryModal && (
                <div className="modal-overlay">
                    <div className="modal-content modal-lg">
                        <div className="modal-header-row">
                            <h3>Donation History</h3>
                            <button onClick={() => setShowLogDonationModal(true)} className="btn btn-success btn-sm">
                                <PlusCircle size={16} /> Log New Donation
                            </button>
                        </div>

                        {donations.length === 0 ? (
                            <div className="empty-state">No donation history recorded yet.</div>
                        ) : (
                            <div className="custom-table-container">
                                <table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Blood Group</th>
                                            <th>Units</th>
                                            <th>Blood Bank / Hospital</th>
                                            <th>City</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {donations.map(d => (
                                            <tr key={d.donation_id}>
                                                <td>{new Date(d.donation_date).toLocaleDateString()}</td>
                                                <td><span className="badge badge-blood">{d.blood_group}</span></td>
                                                <td>{d.units_donated} unit(s)</td>
                                                <td>{d.bank_name || 'Direct Donor Center'}</td>
                                                <td>{d.city || 'Hyderabad'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                            <button onClick={() => setShowHistoryModal(false)} className="btn btn-secondary">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* LOG NEW DONATION MODAL */}
            {showLogDonationModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>🩸 Log New Blood Donation</h3>
                        <form onSubmit={handleLogDonationSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Donation Date</label>
                                    <input type="date" value={logForm.donation_date}
                                        onChange={e => setLogForm({ ...logForm, donation_date: e.target.value })}
                                        className="form-control" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Blood Group</label>
                                    <select value={logForm.blood_group}
                                        onChange={e => setLogForm({ ...logForm, blood_group: e.target.value })}
                                        className="form-control">
                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                            <option key={bg} value={bg}>{bg}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Units Donated</label>
                                    <input type="number" min="1" max="5" value={logForm.units_donated}
                                        onChange={e => setLogForm({ ...logForm, units_donated: parseInt(e.target.value) })}
                                        className="form-control" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">🏅 Certificate Number</label>
                                    <input type="text" value={logForm.certificate_number}
                                        onChange={e => setLogForm({ ...logForm, certificate_number: e.target.value })}
                                        placeholder="CERT-2024-XXXX" className="form-control" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">📝 Notes</label>
                                <textarea value={logForm.notes}
                                    onChange={e => setLogForm({ ...logForm, notes: e.target.value })}
                                    placeholder="Any special notes about this donation" className="form-control" rows={2} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowLogDonationModal(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" disabled={updating} className="btn btn-success">Submit Donation Log</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
