import React, { useState } from 'react';
import { AlertTriangle, Droplet, Phone, MapPin, Building2, User, Send, CheckCircle2, X } from 'lucide-react';
import API from '../api';

export default function EmergencyRequestModal({ isOpen, onClose }) {
    const [formData, setFormData] = useState({
        patient_name: '',
        blood_group: 'O+',
        units_required: 1,
        contact_phone: '',
        hospital_name: '',
        location: '',
        notes: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successData, setSuccessData] = useState(null);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await API.post('/recipients/emergency-request', formData);
            if (res.data.status === 'success') {
                setSuccessData(res.data);
            }
        } catch (err) {
            console.error("Emergency request submit error:", err);
            setError(err.response?.data?.message || 'Failed to send emergency request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setSuccessData(null);
        setError('');
        setFormData({
            patient_name: '',
            blood_group: 'O+',
            units_required: 1,
            contact_phone: '',
            hospital_name: '',
            location: '',
            notes: ''
        });
        onClose();
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 15, 30, 0.5)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
        }}>
            <div style={{
                background: '#ffffff',
                border: '1.5px solid #fecaca',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '520px',
                boxShadow: '0 20px 60px rgba(220, 38, 38, 0.15), 0 8px 30px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    background: 'linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%)',
                    borderBottom: '1.5px solid #fecaca',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            background: '#ef4444',
                            borderRadius: '50%',
                            padding: '8px',
                            display: 'flex',
                            boxShadow: '0 0 12px rgba(239, 68, 68, 0.8)'
                        }}>
                            <AlertTriangle size={20} color="#ffffff" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1a1a2e', fontWeight: 700 }}>
                                🚨 Request Emergency Blood
                            </h3>
                            <span style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 500 }}>
                                No account or login required • Instant Network Broadcast
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleReset}
                        style={{
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            color: '#dc2626',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '8px',
                            display: 'flex'
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem', background: '#ffffff' }}>
                    {successData ? (
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                background: 'rgba(16, 185, 129, 0.15)',
                                border: '2px solid #10b981',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.25rem'
                            }}>
                                <CheckCircle2 size={36} color="#10b981" />
                            </div>
                            <h4 style={{ color: '#10b981', fontSize: '1.2rem', margin: '0 0 0.5rem 0' }}>
                                Emergency Alert Broadcasted!
                            </h4>
                            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                                {successData.message}
                            </p>

                            <div style={{
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '10px',
                                padding: '1rem',
                                textAlign: 'left',
                                fontSize: '0.85rem',
                                marginBottom: '1.5rem'
                            }}>
                                <div><strong>Blood Group:</strong> <span className="badge badge-blood">{formData.blood_group}</span> ({formData.units_required} Units)</div>
                                <div style={{ marginTop: '4px' }}><strong>Hospital:</strong> {formData.hospital_name}</div>
                                <div style={{ marginTop: '4px' }}><strong>Location:</strong> {formData.location}</div>
                                <div style={{ marginTop: '4px' }}><strong>Contact Phone:</strong> {formData.contact_phone}</div>
                            </div>

                            <button onClick={handleReset} className="btn btn-primary full-width">
                                Done / Close Window
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {error && (
                                <div style={{
                                    background: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    color: '#dc2626',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    marginBottom: '1rem'
                                }}>
                                    {error}
                                </div>
                            )}

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label"><Droplet size={15} color="#ef4444" /> Required Blood Group *</label>
                                    <select
                                        name="blood_group"
                                        value={formData.blood_group}
                                        onChange={handleChange}
                                        className="form-control"
                                        required
                                    >
                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                            <option key={bg} value={bg}>{bg}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Units Needed *</label>
                                    <input
                                        type="number"
                                        name="units_required"
                                        min="1"
                                        max="20"
                                        value={formData.units_required}
                                        onChange={handleChange}
                                        className="form-control"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label"><User size={15} /> Patient / Contact Person Name *</label>
                                    <input
                                        type="text"
                                        name="patient_name"
                                        placeholder="e.g. Rajesh Kumar"
                                        value={formData.patient_name}
                                        onChange={handleChange}
                                        className="form-control"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label"><Phone size={15} color="#10b981" /> Emergency Mobile Number *</label>
                                    <input
                                        type="text"
                                        name="contact_phone"
                                        placeholder="+91 9876543210"
                                        value={formData.contact_phone}
                                        onChange={handleChange}
                                        className="form-control"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label"><Building2 size={15} /> Hospital Name &amp; Ward *</label>
                                    <input
                                        type="text"
                                        name="hospital_name"
                                        placeholder="e.g. Apollo Hospital, ICU Ward"
                                        value={formData.hospital_name}
                                        onChange={handleChange}
                                        className="form-control"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label"><MapPin size={15} /> City / Location *</label>
                                    <input
                                        type="text"
                                        name="location"
                                        placeholder="e.g. Hyderabad, Jubilee Hills"
                                        value={formData.location}
                                        onChange={handleChange}
                                        className="form-control"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Additional Urgent Notes (Optional)</label>
                                <textarea
                                    name="notes"
                                    placeholder="e.g. Urgent surgery required in 2 hours..."
                                    value={formData.notes}
                                    onChange={handleChange}
                                    className="form-control"
                                    rows={2}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary full-width"
                                style={{
                                    marginTop: '1rem',
                                    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                                    border: 'none',
                                    padding: '0.85rem',
                                    fontSize: '0.95rem',
                                    fontWeight: 700,
                                    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)'
                                }}
                            >
                                {loading ? 'Broadcasting Alert...' : '🚨 SUBMIT EMERGENCY BROADCAST REQUEST'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
