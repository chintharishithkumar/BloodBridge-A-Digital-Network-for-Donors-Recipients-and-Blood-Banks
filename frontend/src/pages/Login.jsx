import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Droplet, Lock, Mail, User, Phone, MapPin, Sparkles, Building2, Heart, Search, ShieldAlert, Weight, Stethoscope, IdCard, Clock, Hash } from 'lucide-react';
import API from '../api';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Login Form State
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });

    // Register Form State - all DB columns
    const [registerData, setRegisterData] = useState({
        // users table
        full_name: '',
        email: '',
        phone: '',
        password: '',
        role: 'donor',
        city: '',
        state: '',
        // donors table
        blood_group: 'O+',
        date_of_birth: '',
        gender: 'Male',
        weight_kg: '',
        medical_conditions: '',
        id_proof_number: '',
        // recipients table
        medical_reason: '',
        hospital_name: '',
        doctor_name: '',
        contact_person: '',
        contact_phone: '',
        // blood_banks table
        bank_name: '',
        license_number: '',
        address: '',
        bank_phone: '',
        bank_email: '',
        operating_hours: '',
        pincode: ''
    });

    const handleLoginChange = (e) => {
        setLoginData({ ...loginData, [e.target.name]: e.target.value });
    };

    const handleRegisterChange = (e) => {
        const { name, value, type, checked } = e.target;
        let newValue;
        if (type === 'checkbox') {
            newValue = checked;
        } else if (type === 'number') {
            newValue = value === '' ? '' : Number(value);
        } else {
            newValue = value;
        }
        setRegisterData({ ...registerData, [name]: newValue });
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await API.post('/auth/login', loginData);
            if (res.data.status === 'success') {
                login(res.data.token, res.data.user);
                redirectByRole(res.data.user.role);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await API.post('/auth/register', registerData);
            if (res.data.status === 'success') {
                // Auto login after registration
                const loginRes = await API.post('/auth/login', {
                    email: registerData.email,
                    password: registerData.password
                });
                if (loginRes.data.status === 'success') {
                    login(loginRes.data.token, loginRes.data.user);
                    redirectByRole(loginRes.data.user.role);
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please check form entries.');
        } finally {
            setLoading(false);
        }
    };

    const redirectByRole = (role) => {
        if (role === 'donor') navigate('/donor-dashboard');
        else if (role === 'recipient') navigate('/recipient-dashboard');
        else if (role === 'blood_bank') navigate('/blood-bank-dashboard');
        else if (role === 'admin') navigate('/admin-dashboard');
        else navigate('/');
    };

    const handleQuickDemo = async (email, password = 'password123') => {
        setLoading(true);
        setError('');
        try {
            const res = await API.post('/auth/login', { email, password });
            if (res.data.status === 'success') {
                login(res.data.token, res.data.user);
                redirectByRole(res.data.user.role);
            }
        } catch (err) {
            setError(`Quick login failed for ${email}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            <div className={`auth-card glass-panel ${isRegister ? 'register-card' : ''}`}>
                <div className="auth-header">
                    <div className="auth-logo pulse-glow">
                        <Droplet size={32} fill="#e63946" color="#e63946" />
                    </div>
                    <h2>{isRegister ? 'Create Blood-Bridge Account' : 'Login to Blood-Bridge'}</h2>
                    <p>{isRegister ? 'Join our life-saving donor and medical network' : 'Enter your email and password to access your dashboard'}</p>
                </div>

                {error && <div className="auth-error-alert">{error}</div>}

                {/* DEMO QUICK LOGINS */}
                {!isRegister && (
                    <div className="demo-accounts-box">
                        <div className="demo-title">
                            <Sparkles size={14} color="#f59e0b" /> Quick Demo One-Click Login
                        </div>
                        <div className="demo-buttons">
                            <button type="button" onClick={() => handleQuickDemo('john.donor@example.com')} className="btn btn-secondary btn-sm">
                                <Heart size={14} color="#ef4444" /> Donor (John)
                            </button>
                            <button type="button" onClick={() => handleQuickDemo('rahul.recipient@example.com')} className="btn btn-secondary btn-sm">
                                <Search size={14} color="#3b82f6" /> Recipient (Rahul)
                            </button>
                            <button type="button" onClick={() => handleQuickDemo('hyd.redcross@bloodbank.com')} className="btn btn-secondary btn-sm">
                                <Building2 size={14} color="#10b981" /> Blood Bank (Hyd)
                            </button>
                            <button type="button" onClick={() => handleQuickDemo('admin@bloodbridge.com')} className="btn btn-secondary btn-sm">
                                <ShieldAlert size={14} color="#f59e0b" /> Admin
                            </button>
                        </div>
                    </div>
                )}

                {!isRegister ? (
                    /* LOGIN FORM */
                    <form onSubmit={handleLoginSubmit} className="auth-form">
                        <div className="form-group">
                            <label className="form-label"><Mail size={16} /> Email Address</label>
                            <input
                                type="email"
                                name="email"
                                required
                                value={loginData.email}
                                onChange={handleLoginChange}
                                placeholder="name@example.com"
                                className="form-control"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label"><Lock size={16} /> Password</label>
                            <input
                                type="password"
                                name="password"
                                required
                                value={loginData.password}
                                onChange={handleLoginChange}
                                placeholder="••••••••"
                                className="form-control"
                            />
                        </div>

                        <button type="submit" disabled={loading} className="btn btn-primary btn-lg full-width">
                            {loading ? 'Signing in...' : '[ LOGIN ]'}
                        </button>

                        <div className="auth-footer-toggle">
                            <span>Don't have an account?</span>
                            <button type="button" onClick={() => setIsRegister(true)} className="toggle-btn">
                                Register as Donor / Recipient / Blood Bank
                            </button>
                        </div>
                    </form>
                ) : (
                    /* REGISTER FORM WITH ROLE TABS */
                    <form onSubmit={handleRegisterSubmit} className="auth-form">

                        {/* ROLE SELECTOR TABS */}
                        <div className="form-group">
                            <label className="form-label"><User size={16} /> Select Account Role</label>
                            <div className="role-tabs-container">
                                <button
                                    type="button"
                                    onClick={() => setRegisterData({ ...registerData, role: 'donor' })}
                                    className={`role-tab-btn donor-tab ${registerData.role === 'donor' ? 'active' : ''}`}
                                >
                                    <Droplet size={20} color="#e63946" />
                                    <span>Voluntary Donor</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRegisterData({ ...registerData, role: 'recipient' })}
                                    className={`role-tab-btn recipient-tab ${registerData.role === 'recipient' ? 'active' : ''}`}
                                >
                                    <Stethoscope size={20} color="#3b82f6" />
                                    <span>Recipient / Patient</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRegisterData({ ...registerData, role: 'blood_bank' })}
                                    className={`role-tab-btn bank-tab ${registerData.role === 'blood_bank' ? 'active' : ''}`}
                                >
                                    <Building2 size={20} color="#10b981" />
                                    <span>Blood Bank</span>
                                </button>
                            </div>
                        </div>

                        {/* BASIC ACCOUNT DETAILS */}
                        <div className="form-section-divider">
                            <User size={16} /> Account & Login Credentials
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">
                                    {registerData.role === 'recipient' ? 'Patient / Requester Name *' :
                                     registerData.role === 'blood_bank' ? 'Contact Representative Name *' : 'Full Name *'}
                                </label>
                                <input
                                    type="text"
                                    name="full_name"
                                    required
                                    value={registerData.full_name}
                                    onChange={handleRegisterChange}
                                    placeholder={registerData.role === 'recipient' ? 'Rahul Sharma' : 'John Doe'}
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label"><Mail size={16} /> Email Address *</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={registerData.email}
                                    onChange={handleRegisterChange}
                                    placeholder="name@example.com"
                                    className="form-control"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label"><Phone size={16} /> Phone Number *</label>
                                <input
                                    type="text"
                                    name="phone"
                                    required
                                    value={registerData.phone}
                                    onChange={handleRegisterChange}
                                    placeholder="+91 9876543210"
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label"><Lock size={16} /> Password *</label>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    value={registerData.password}
                                    onChange={handleRegisterChange}
                                    placeholder="••••••••"
                                    className="form-control"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label"><MapPin size={16} /> City *</label>
                                <input
                                    type="text"
                                    name="city"
                                    required
                                    value={registerData.city}
                                    onChange={handleRegisterChange}
                                    placeholder="Hyderabad"
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label"><MapPin size={16} /> State *</label>
                                <input
                                    type="text"
                                    name="state"
                                    required
                                    value={registerData.state}
                                    onChange={handleRegisterChange}
                                    placeholder="Telangana"
                                    className="form-control"
                                />
                            </div>
                        </div>

                        {/* DONOR SPECIFIC FIELDS */}
                        {registerData.role === 'donor' && (
                            <>
                                <div className="form-section-divider">
                                    <Droplet size={16} /> Donor Health & Identification Details
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label"><Droplet size={16} color="#e63946" /> Blood Group *</label>
                                        <select name="blood_group" value={registerData.blood_group} onChange={handleRegisterChange} className="form-control">
                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                                <option key={bg} value={bg}>{bg}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Gender *</label>
                                        <select name="gender" value={registerData.gender} onChange={handleRegisterChange} className="form-control">
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">📅 Date of Birth *</label>
                                        <input type="date" name="date_of_birth" required value={registerData.date_of_birth} onChange={handleRegisterChange} className="form-control" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">⚖️ Weight (kg) *</label>
                                        <input type="number" name="weight_kg" required min="40" max="200" value={registerData.weight_kg} onChange={handleRegisterChange} placeholder="65" className="form-control" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label"><IdCard size={16} /> ID Proof Number (Aadhaar / PAN) *</label>
                                    <input type="text" name="id_proof_number" required value={registerData.id_proof_number} onChange={handleRegisterChange} placeholder="XXXX-XXXX-XXXX" className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label"><Stethoscope size={16} /> Medical Conditions / History (if any)</label>
                                    <textarea name="medical_conditions" value={registerData.medical_conditions} onChange={handleRegisterChange} placeholder="e.g. None / Diabetes / Hypertension" className="form-control" rows={2} />
                                </div>
                            </>
                        )}

                        {/* RECIPIENT SPECIFIC FIELDS */}
                        {registerData.role === 'recipient' && (
                            <>
                                <div className="form-section-divider blue">
                                    <Stethoscope size={16} /> Medical & Hospital Requirements
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label"><Droplet size={16} color="#3b82f6" /> Required Blood Group *</label>
                                        <select name="blood_group" value={registerData.blood_group} onChange={handleRegisterChange} className="form-control">
                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                                <option key={bg} value={bg}>{bg}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">🏥 Hospital Name & Address *</label>
                                        <input type="text" name="hospital_name" required value={registerData.hospital_name} onChange={handleRegisterChange} placeholder="AIIMS Hospital, Hyderabad" className="form-control" />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">👨‍⚕️ Attending Doctor's Name *</label>
                                        <input type="text" name="doctor_name" required value={registerData.doctor_name} onChange={handleRegisterChange} placeholder="Dr. Ramesh Kumar" className="form-control" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">📋 Medical Reason / Diagnosis *</label>
                                        <input type="text" name="medical_reason" required value={registerData.medical_reason} onChange={handleRegisterChange} placeholder="e.g. Emergency Surgery / Anemia" className="form-control" />
                                    </div>
                                </div>

                                <div className="form-section-divider blue">
                                    <Phone size={16} /> Emergency Contact Information
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">👤 Emergency Contact Person Name *</label>
                                        <input type="text" name="contact_person" required value={registerData.contact_person} onChange={handleRegisterChange} placeholder="Relative / Guardian Name" className="form-control" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label"><Phone size={16} /> Emergency Contact Phone Number *</label>
                                        <input type="text" name="contact_phone" required value={registerData.contact_phone} onChange={handleRegisterChange} placeholder="+91 9876543210" className="form-control" />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* BLOOD BANK SPECIFIC FIELDS */}
                        {registerData.role === 'blood_bank' && (
                            <>
                                <div className="form-section-divider green">
                                    <Building2 size={16} /> Blood Bank Organization Details
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label"><Building2 size={16} /> Blood Bank Name *</label>
                                        <input type="text" name="bank_name" required value={registerData.bank_name} onChange={handleRegisterChange} placeholder="Hyderabad Central Blood Bank" className="form-control" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">📄 License Number *</label>
                                        <input type="text" name="license_number" required value={registerData.license_number} onChange={handleRegisterChange} placeholder="BB-TS-2024-001" className="form-control" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label"><MapPin size={16} /> Full Organization Address *</label>
                                    <textarea name="address" required value={registerData.address} onChange={handleRegisterChange} placeholder="123, MG Road, Hyderabad" className="form-control" rows={2} />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label"><Phone size={16} /> Bank Phone / Hotline *</label>
                                        <input type="text" name="bank_phone" required value={registerData.bank_phone} onChange={handleRegisterChange} placeholder="+91 9876543210" className="form-control" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label"><Mail size={16} /> Bank Official Email *</label>
                                        <input type="email" name="bank_email" required value={registerData.bank_email} onChange={handleRegisterChange} placeholder="bank@example.com" className="form-control" />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">🕒 Operating Hours *</label>
                                        <input type="text" name="operating_hours" required value={registerData.operating_hours} onChange={handleRegisterChange} placeholder="24/7 or 9AM - 8PM, Mon-Sat" className="form-control" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">📮 Pincode *</label>
                                        <input type="text" name="pincode" required value={registerData.pincode} onChange={handleRegisterChange} placeholder="500001" className="form-control" />
                                    </div>
                                </div>
                            </>
                        )}

                        <button type="submit" disabled={loading} className="btn btn-primary btn-lg full-width" style={{ marginTop: '1.25rem' }}>
                            {loading ? 'Creating Account...' : `REGISTER AS ${registerData.role.toUpperCase().replace('_', ' ')}`}
                        </button>

                        <div className="auth-footer-toggle">
                            <span>Already have an account?</span>
                            <button type="button" onClick={() => setIsRegister(false)} className="toggle-btn">
                                Back to Login
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
