import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Droplet, MapPin, Building2, User, Phone, CheckCircle, Clock, AlertTriangle, Send } from 'lucide-react';
import API from '../api';

export default function RecipientDashboard() {
    const { user } = useAuth();
    const location = useLocation();

    // Parse query params if redirected from Home quick search
    const queryParams = new URLSearchParams(location.search);
    const initialGroup = queryParams.get('blood_group') || 'O+';
    const initialCity = queryParams.get('city') || 'Hyderabad';

    const [bloodGroup, setBloodGroup] = useState(initialGroup);
    const [city, setCity] = useState(initialCity);
    const [searching, setSearching] = useState(false);

    // Search Results
    const [bloodBanks, setBloodBanks] = useState([]);
    const [donors, setDonors] = useState([]);
    const [searched, setSearched] = useState(false);

    // Available cities
    const [availableCities, setAvailableCities] = useState([]);

    // My Requests
    const [myRequests, setMyRequests] = useState([]);
    const [requestModal, setRequestModal] = useState(null); // target bank object or general request
    const [requestForm, setRequestForm] = useState({
        blood_group: 'O+',
        units_required: 2,
        emergency: true,
        notes: '',
        hospital_name: '',
        patient_name: '',
        required_by: '',
        blood_bank_id: null
    });
    const [submitting, setSubmitting] = useState(false);

    // Profile state & edit modal
    const [recipientProfile, setRecipientProfile] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileForm, setProfileForm] = useState({
        full_name: '',
        phone: '',
        city: '',
        state: '',
        blood_group: 'O+',
        medical_reason: '',
        hospital_name: '',
        doctor_name: '',
        contact_person: '',
        contact_phone: ''
    });

    useEffect(() => {
        API.get(`/recipients/cities?blood_group=${encodeURIComponent(bloodGroup)}`)
            .then(res => {
                if (res.data.status === 'success' && res.data.cities) {
                    setAvailableCities(res.data.cities);
                }
            })
            .catch(() => {});
    }, [bloodGroup]);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        setSearching(true);
        setSearched(true);
        try {
            const res = await API.get(`/recipients/search?blood_group=${encodeURIComponent(bloodGroup)}&city=${encodeURIComponent(city)}`);
            if (res.data.status === 'success') {
                setBloodBanks(res.data.bloodBanks);
                setDonors(res.data.donors);
            }
        } catch (err) {
            console.error("Search error:", err);
        } finally {
            setSearching(false);
        }
    };

    const fetchMyRequests = async () => {
        if (!user) return;
        try {
            const res = await API.get('/recipients/my-requests');
            if (res.data.status === 'success') {
                setMyRequests(res.data.requests);
            }
        } catch (err) {
            console.error("Fetch requests error:", err);
        }
    };

    const fetchRecipientProfile = async () => {
        if (!user) return;
        try {
            const res = await API.get('/recipients/profile');
            if (res.data.status === 'success' && res.data.recipient) {
                setRecipientProfile(res.data.recipient);
                setProfileForm({
                    full_name: res.data.recipient.recipient_name || res.data.recipient.full_name || user?.full_name || '',
                    phone: res.data.recipient.phone || user?.phone || '',
                    city: res.data.recipient.city || user?.city || '',
                    state: res.data.recipient.state || user?.state || '',
                    blood_group: res.data.recipient.blood_group || 'O+',
                    medical_reason: res.data.recipient.medical_reason || '',
                    hospital_name: res.data.recipient.hospital_name || '',
                    doctor_name: res.data.recipient.doctor_name || '',
                    contact_person: res.data.recipient.contact_person || '',
                    contact_phone: res.data.recipient.contact_phone || ''
                });
            }
        } catch (err) {
            console.error("Fetch recipient profile error:", err);
        }
    };

    useEffect(() => {
        handleSearch();
        fetchMyRequests();
        fetchRecipientProfile();
    }, []);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await API.put('/recipients/profile', profileForm);
            if (res.data.status === 'success') {
                setShowProfileModal(false);
                fetchRecipientProfile();
                alert('Recipient profile updated successfully!');
            }
        } catch (err) {
            alert('Error updating profile: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    const openRequestModal = (bank = null) => {
        if (!user) {
            alert('Please login or select a Demo Profile to request blood');
            return;
        }
        setRequestModal(bank || { isGeneral: true, bank_name: 'General Emergency Network Request', blood_bank_id: null, units_available: 10 });
        setRequestForm({
            blood_group: recipientProfile?.blood_group || bloodGroup || 'O+',
            units_required: 2,
            emergency: true,
            notes: bank ? `Request for ${bloodGroup} blood from ${bank.bank_name}` : 'Emergency blood request broadcast',
            hospital_name: recipientProfile?.hospital_name || '',
            patient_name: recipientProfile?.recipient_name || recipientProfile?.full_name || user?.full_name || '',
            required_by: '',
            blood_bank_id: bank?.blood_bank_id || null
        });
    };

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                blood_bank_id: requestForm.blood_bank_id || (requestModal?.blood_bank_id || null),
                blood_group: requestForm.blood_group || bloodGroup,
                units_required: requestForm.units_required,
                emergency: requestForm.emergency,
                notes: requestForm.notes,
                hospital_name: requestForm.hospital_name,
                patient_name: requestForm.patient_name,
                required_by: requestForm.required_by || null
            };
            const res = await API.post('/recipients/requests', payload);
            if (res.data.status === 'success') {
                setRequestModal(null);
                fetchMyRequests();
                alert(`Blood request for ${requestForm.units_required} units of ${requestForm.blood_group || bloodGroup} submitted successfully!`);
            }
        } catch (err) {
            alert('Failed to submit request: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'APPROVED':
                return <span className="badge badge-success"><CheckCircle size={12} /> APPROVED</span>;
            case 'REJECTED':
                return <span className="badge badge-danger"><AlertTriangle size={12} /> REJECTED</span>;
            case 'FULFILLED':
                return <span className="badge badge-info"><CheckCircle size={12} /> FULFILLED</span>;
            default:
                return <span className="badge badge-warning"><Clock size={12} /> PENDING</span>;
        }
    };

    return (
        <div className="dashboard-page-container">
            <div className="dashboard-header-with-actions">
                <div>
                    <h2>Recipient Dashboard</h2>
                    <p>Find available blood stock in blood banks or connect with nearby voluntary donors</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {user ? (
                        <>
                            <button onClick={() => openRequestModal(null)} className="btn btn-primary btn-sm pulse-glow">
                                <Send size={16} /> 🩸 Submit Blood Request
                            </button>
                            <button onClick={() => setShowProfileModal(true)} className="btn btn-secondary btn-sm">
                                ✏️ Edit Profile
                            </button>
                        </>
                    ) : (
                        <button onClick={() => openRequestModal(null)} className="btn btn-primary btn-sm">
                            <Send size={16} /> Submit Blood Request
                        </button>
                    )}
                </div>
            </div>

            {/* RECIPIENT DASHBOARD FIND BLOOD CARD - Wireframe 4 */}
            <div className="recipient-card glass-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 className="card-section-title" style={{ margin: 0 }}>Find Blood</h3>
                    {user && (
                        <button onClick={() => openRequestModal(null)} className="btn btn-secondary btn-sm">
                            <Send size={14} /> + New Request
                        </button>
                    )}
                </div>

                <form onSubmit={handleSearch} className="recipient-search-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label"><Droplet size={16} color="#e63946" /> Blood Group:</label>
                            <select
                                value={bloodGroup}
                                onChange={e => setBloodGroup(e.target.value)}
                                className="form-control"
                            >
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                    <option key={bg} value={bg}>[ {bg} ]</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label"><MapPin size={16} color="#e63946" /> City:</label>
                            <input
                                type="text"
                                list="recipient-available-cities"
                                value={city}
                                onChange={e => setCity(e.target.value)}
                                placeholder="Select or type city..."
                                className="form-control"
                            />
                            <datalist id="recipient-available-cities">
                                {availableCities.map(c => (
                                    <option key={c} value={c} />
                                ))}
                            </datalist>
                        </div>
                    </div>

                    <button type="submit" disabled={searching} className="btn btn-primary btn-lg">
                        <Search size={18} /> {searching ? 'SEARCHING...' : '[ SEARCH ]'}
                    </button>
                </form>

                {availableCities.length > 0 && (
                    <div className="available-cities-chips" style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', opacity: 0.85, fontWeight: 500 }}>Available Cities for {bloodGroup}:</span>
                        {availableCities.map(c => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setCity(c)}
                                className={`badge ${city === c ? 'badge-blood' : 'badge-secondary'}`}
                                style={{ cursor: 'pointer', border: 'none', transition: 'all 0.2s' }}
                            >
                                📍 {c}
                            </button>
                        ))}
                    </div>
                )}

                <div className="card-divider"></div>

                {/* SEARCH RESULTS MATCHING WIREFRAME 4 */}
                {searched && (
                    <div className="search-results-section">
                        <h4>Blood Banks Availability</h4>
                        
                        {bloodBanks.length === 0 ? (
                            <div className="empty-state-box">
                                <p>No blood banks with {bloodGroup} stock found in {city || 'selected location'}.</p>
                                {user && (
                                    <button onClick={() => openRequestModal(null)} className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem' }}>
                                        <Send size={14} /> Submit Direct Emergency Request
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="results-list">
                                {bloodBanks.map(bank => (
                                    <div key={bank.inventory_id} className="bank-result-item glass-card-interactive">
                                        <div className="bank-item-header">
                                            <div className="bank-name-group">
                                                <Building2 size={20} color="#10b981" />
                                                <span className="bank-name">{bank.bank_name}</span>
                                            </div>
                                            <div className="bank-city-tag">
                                                <MapPin size={14} /> {bank.city}
                                            </div>
                                        </div>

                                        <div className="stock-info-row">
                                            <span className="stock-label">Blood Bank {bank.blood_group} Available:</span>
                                            <span className="stock-units">{bank.units_available} units</span>
                                        </div>

                                        <div className="bank-action-row">
                                            <button 
                                                onClick={() => openRequestModal(bank)} 
                                                className="btn btn-primary btn-sm"
                                            >
                                                <Send size={14} /> [ REQUEST BLOOD ]
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <h4 style={{ marginTop: '2rem' }}>Voluntary Donors Nearby</h4>
                        {donors.length === 0 ? (
                            <div className="empty-state-box">No available voluntary donors for {bloodGroup} currently registered in {city}.</div>
                        ) : (
                            <div className="donors-grid">
                                {donors.map(d => (
                                    <div key={d.donor_id} className="donor-item-card glass-card-interactive">
                                        <div className="donor-card-top">
                                            <User size={18} color="#e63946" />
                                            <span className="donor-name">{d.full_name}</span>
                                            <span className="badge badge-blood">{d.blood_group}</span>
                                        </div>
                                        <div className="donor-card-body">
                                            <div><MapPin size={14} /> {d.city}, {d.state}</div>
                                            <div><Phone size={14} /> {d.phone}</div>
                                            <div className="status-chip available"><CheckCircle size={12} /> AVAILABLE</div>
                                            <button 
                                                onClick={() => openRequestModal(null)} 
                                                className="btn btn-secondary btn-sm"
                                                style={{ width: '100%', marginTop: '0.5rem' }}
                                            >
                                                <Send size={12} /> Request Donor
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* MY BLOOD REQUESTS TRACKER */}
            {user && (
                <div className="recipient-requests-card glass-panel" style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0 }}>My Submitted Blood Requests</h3>
                        <button onClick={() => openRequestModal(null)} className="btn btn-primary btn-sm">
                            <Send size={14} /> + Submit New Request
                        </button>
                    </div>

                    {myRequests.length === 0 ? (
                        <div className="empty-state-box">
                            <p>You have not submitted any blood requests yet.</p>
                            <button onClick={() => openRequestModal(null)} className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem' }}>
                                <Send size={14} /> Submit Blood Request Now
                            </button>
                        </div>
                    ) : (
                        <div className="custom-table-container">
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>Req ID</th>
                                        <th>Blood Group</th>
                                        <th>Units</th>
                                        <th>Patient</th>
                                        <th>Hospital</th>
                                        <th>Target Blood Bank</th>
                                        <th>Date</th>
                                        <th>Required By</th>
                                        <th>Emergency</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myRequests.map(req => (
                                        <tr key={req.request_id}>
                                            <td>#{req.request_id}</td>
                                            <td><span className="badge badge-blood">{req.blood_group}</span></td>
                                            <td>{req.units_required} units</td>
                                            <td>{req.patient_name || '-'}</td>
                                            <td>{req.hospital_name || '-'}</td>
                                            <td>{req.bank_name || 'General Request'}</td>
                                            <td>{new Date(req.request_date).toLocaleDateString()}</td>
                                            <td>{req.required_by ? new Date(req.required_by).toLocaleDateString() : '-'}</td>
                                            <td>{req.emergency ? <span className="badge badge-danger">YES</span> : 'NO'}</td>
                                            <td>
                                                {getStatusBadge(req.status)}
                                                {req.rejected_reason && (
                                                    <div style={{fontSize:'0.7rem',color:'#ef4444',marginTop:'2px'}}>{req.rejected_reason}</div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* REQUEST BLOOD MODAL */}
            {requestModal && (
                <div className="modal-overlay">
                    <div className="modal-content modal-lg">
                        <h3>🩸 {requestModal.bank_name ? `Request Blood from ${requestModal.bank_name}` : 'Submit Emergency Blood Request'}</h3>
                        <p className="modal-subtitle">
                            {requestModal.units_available !== undefined ? (
                                <>Available Stock: <strong>{requestModal.units_available} units</strong></>
                            ) : (
                                <>Broadcast your blood requirement across all blood banks and voluntary donors</>
                            )}
                        </p>

                        <form onSubmit={handleRequestSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">🩸 Blood Group *</label>
                                    <select
                                        value={requestForm.blood_group}
                                        onChange={e => setRequestForm({ ...requestForm, blood_group: e.target.value })}
                                        className="form-control"
                                    >
                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                            <option key={bg} value={bg}>{bg}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">🏥 Target Blood Bank (Optional)</label>
                                    <select
                                        value={requestForm.blood_bank_id || ''}
                                        onChange={e => setRequestForm({ ...requestForm, blood_bank_id: e.target.value ? Number(e.target.value) : null })}
                                        className="form-control"
                                    >
                                        <option value="">-- General Request (Broadcast to All) --</option>
                                        {bloodBanks.map(b => (
                                            <option key={b.blood_bank_id} value={b.blood_bank_id}>
                                                {b.bank_name} ({b.city} - {b.units_available} units)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">👤 Patient Name *</label>
                                    <input type="text" required value={requestForm.patient_name}
                                        onChange={e => setRequestForm({ ...requestForm, patient_name: e.target.value })}
                                        placeholder="Patient's full name" className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">🏥 Hospital Name & Address *</label>
                                    <input type="text" required value={requestForm.hospital_name}
                                        onChange={e => setRequestForm({ ...requestForm, hospital_name: e.target.value })}
                                        placeholder="AIIMS Hyderabad" className="form-control" />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Units Required *</label>
                                    <input type="number" min="1" max="20"
                                        value={requestForm.units_required}
                                        onChange={e => setRequestForm({ ...requestForm, units_required: parseInt(e.target.value) || 1 })}
                                        className="form-control" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">📅 Required By Date</label>
                                    <input type="date" value={requestForm.required_by}
                                        onChange={e => setRequestForm({ ...requestForm, required_by: e.target.value })}
                                        className="form-control" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">⚠️ Emergency Level</label>
                                <select value={requestForm.emergency ? 'true' : 'false'}
                                    onChange={e => setRequestForm({ ...requestForm, emergency: e.target.value === 'true' })}
                                    className="form-control">
                                    <option value="true">YES - High Emergency</option>
                                    <option value="false">NO - Standard Request</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">📝 Additional Notes / Medical Reason</label>
                                <textarea rows="2" value={requestForm.notes}
                                    onChange={e => setRequestForm({ ...requestForm, notes: e.target.value })}
                                    placeholder="Room number, condition details, doctor's note..."
                                    className="form-control" />
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setRequestModal(null)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" disabled={submitting} className="btn btn-primary">
                                    {submitting ? 'Submitting...' : 'CONFIRM BLOOD REQUEST'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT RECIPIENT PROFILE MODAL */}
            {showProfileModal && (
                <div className="modal-overlay">
                    <div className="modal-content modal-lg">
                        <h3>✏️ Update Recipient Profile</h3>
                        <form onSubmit={handleProfileSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Patient / Requester Name</label>
                                    <input type="text" value={profileForm.full_name}
                                        onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })}
                                        className="form-control" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <input type="text" value={profileForm.phone}
                                        onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                                        className="form-control" />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">City</label>
                                    <input type="text" value={profileForm.city}
                                        onChange={e => setProfileForm({ ...profileForm, city: e.target.value })}
                                        className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">State</label>
                                    <input type="text" value={profileForm.state}
                                        onChange={e => setProfileForm({ ...profileForm, state: e.target.value })}
                                        className="form-control" />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">🩸 Required Blood Group</label>
                                    <select value={profileForm.blood_group}
                                        onChange={e => setProfileForm({ ...profileForm, blood_group: e.target.value })}
                                        className="form-control">
                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                            <option key={bg} value={bg}>{bg}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">🏥 Hospital Name & Address</label>
                                    <input type="text" value={profileForm.hospital_name}
                                        onChange={e => setProfileForm({ ...profileForm, hospital_name: e.target.value })}
                                        placeholder="AIIMS Hospital, Hyderabad" className="form-control" />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">👨‍⚕️ Doctor's Name</label>
                                    <input type="text" value={profileForm.doctor_name}
                                        onChange={e => setProfileForm({ ...profileForm, doctor_name: e.target.value })}
                                        placeholder="Dr. Ramesh Kumar" className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">📋 Medical Reason / Diagnosis</label>
                                    <input type="text" value={profileForm.medical_reason}
                                        onChange={e => setProfileForm({ ...profileForm, medical_reason: e.target.value })}
                                        placeholder="Surgery / Anemia" className="form-control" />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">👤 Emergency Contact Person Name</label>
                                    <input type="text" value={profileForm.contact_person}
                                        onChange={e => setProfileForm({ ...profileForm, contact_person: e.target.value })}
                                        placeholder="Guardian / Relative Name" className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">📞 Emergency Contact Phone</label>
                                    <input type="text" value={profileForm.contact_phone}
                                        onChange={e => setProfileForm({ ...profileForm, contact_phone: e.target.value })}
                                        placeholder="+91 9876543210" className="form-control" />
                                </div>
                            </div>

                            <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
                                <button type="button" onClick={() => setShowProfileModal(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" disabled={submitting} className="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
