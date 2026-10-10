import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Droplet, Heart, Building2, Search, ArrowRight, Activity, Users, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';
import API from '../api';
import EmergencyRequestModal from '../components/EmergencyRequestModal';

export default function Home() {
    const navigate = useNavigate();
    const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
    const [stats, setStats] = useState({
        totalDonors: 80,
        totalRecipients: 45,
        bloodBanks: 8,
        pendingRequests: 12
    });
    const [searchCity, setSearchCity] = useState('');
    const [searchGroup, setSearchGroup] = useState('O+');
    const [availableCities, setAvailableCities] = useState([]);

    useEffect(() => {
        API.get('/admin/stats')
            .then(res => { if (res.data.status === 'success') setStats(res.data.stats); })
            .catch(() => {});
    }, []);

    useEffect(() => {
        API.get(`/recipients/cities?blood_group=${encodeURIComponent(searchGroup)}`)
            .then(res => { if (res.data.status === 'success' && res.data.cities) setAvailableCities(res.data.cities); })
            .catch(() => {});
    }, [searchGroup]);

    const handleQuickSearch = (e) => {
        e.preventDefault();
        navigate(`/recipient-dashboard?blood_group=${encodeURIComponent(searchGroup)}&city=${encodeURIComponent(searchCity)}`);
    };

    return (
        <div className="home-container">

            {/* ── HERO SECTION ── */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-badge pulse-glow">
                        <Droplet size={15} fill="#dc2626" color="#dc2626" />
                        India's Emergency Blood Donation Network
                    </div>

                    <h1 className="hero-title">
                        Save Lives with <span>Blood</span>-Bridge
                    </h1>

                    <p className="hero-subtitle">
                        Connecting voluntary donors, verified blood banks, and patients
                        in real-time — so no one waits when every second counts.
                    </p>

                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {['No login required to raise an emergency request', 'Real-time donor & blood bank availability', 'Instant Telegram alerts to nearby donors'].map(point => (
                            <li key={point} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#5a5a72' }}>
                                <CheckCircle size={16} color="#16a34a" />
                                {point}
                            </li>
                        ))}
                    </ul>

                    <div className="hero-actions">
                        <button
                            onClick={() => setIsEmergencyModalOpen(true)}
                            className="btn btn-primary btn-lg"
                            style={{ boxShadow: '0 0 20px rgba(220, 38, 38, 0.4)', fontWeight: 700 }}
                            id="emergency-request-btn"
                        >
                            <AlertTriangle size={20} className="pulse" /> 🚨 Emergency Blood Request
                        </button>
                        <Link to="/recipient-dashboard" className="btn btn-secondary btn-lg" id="search-blood-btn">
                            <Search size={18} /> Search Blood
                        </Link>
                    </div>
                </div>

                {/* Hero Image */}
                <div className="hero-image-wrapper">
                    <img
                        src="/hero_blood_donation.png"
                        alt="Blood donation — doctors and donors saving lives"
                        onError={e => { e.target.style.display = 'none'; }}
                    />
                    <div className="hero-trust-badge">
                        ❤️ 80+ verified donors across India
                    </div>
                </div>
            </section>

            {/* ── QUICK SEARCH ── */}
            <section style={{ display: 'flex', justifyContent: 'center' }}>
                <form onSubmit={handleQuickSearch} className="quick-search-card glass-panel" style={{ width: '100%', maxWidth: '760px' }}>
                    <p style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a2e', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Search size={17} color="#dc2626" /> Quick Blood Stock Search
                    </p>
                    <div className="search-inputs">
                        <div className="search-field">
                            <label><Droplet size={14} color="#dc2626" /> Blood Group</label>
                            <select
                                value={searchGroup}
                                onChange={(e) => setSearchGroup(e.target.value)}
                                className="form-control"
                                id="home-blood-group-select"
                            >
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                    <option key={bg} value={bg}>{bg}</option>
                                ))}
                            </select>
                        </div>
                        <div className="search-field">
                            <label><MapPin size={14} color="#dc2626" /> City / Location</label>
                            <input
                                type="text"
                                list="home-available-cities"
                                placeholder="Select or type city..."
                                value={searchCity}
                                onChange={(e) => setSearchCity(e.target.value)}
                                className="form-control"
                                id="home-city-input"
                            />
                            <datalist id="home-available-cities">
                                {availableCities.map(c => <option key={c} value={c} />)}
                            </datalist>
                        </div>
                        <button type="submit" className="btn btn-primary" id="home-search-btn" style={{ alignSelf: 'flex-end' }}>
                            <Search size={17} /> Search
                        </button>
                    </div>

                    {availableCities.length > 0 && (
                        <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500 }}>Available cities for {searchGroup}:</span>
                            {availableCities.slice(0, 8).map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setSearchCity(c)}
                                    className={`badge ${searchCity === c ? 'badge-blood' : 'badge-secondary'}`}
                                    style={{ cursor: 'pointer', border: searchCity === c ? '1px solid #fecaca' : '1px solid #e5e7eb', transition: 'all 0.2s' }}
                                >
                                    📍 {c}
                                </button>
                            ))}
                        </div>
                    )}
                </form>
            </section>

            {/* ── LIVE STATS ── */}
            <section className="stats-section">
                <div className="section-header" style={{ marginBottom: '1.75rem' }}>
                    <h2 style={{ fontSize: '1.75rem' }}>Our Live Network</h2>
                    <p>Real-time figures from our blood donation ecosystem</p>
                </div>
                <div className="stats-grid">
                    <div className="stat-card glass-card-interactive">
                        <div className="stat-icon-wrapper red">
                            <Heart size={26} color="#dc2626" fill="#fecaca" />
                        </div>
                        <div className="stat-number" style={{ color: '#dc2626' }}>{stats.totalDonors}+</div>
                        <div className="stat-label">Verified Donors</div>
                    </div>
                    <div className="stat-card glass-card-interactive">
                        <div className="stat-icon-wrapper blue">
                            <Users size={26} color="#2563eb" />
                        </div>
                        <div className="stat-number" style={{ color: '#2563eb' }}>{stats.totalRecipients}+</div>
                        <div className="stat-label">Patients Assisted</div>
                    </div>
                    <div className="stat-card glass-card-interactive">
                        <div className="stat-icon-wrapper green">
                            <Building2 size={26} color="#16a34a" />
                        </div>
                        <div className="stat-number" style={{ color: '#16a34a' }}>{stats.bloodBanks}</div>
                        <div className="stat-label">Partner Blood Banks</div>
                    </div>
                    <div className="stat-card glass-card-interactive">
                        <div className="stat-icon-wrapper yellow">
                            <Activity size={26} color="#d97706" />
                        </div>
                        <div className="stat-number" style={{ color: '#d97706' }}>{stats.pendingRequests}</div>
                        <div className="stat-label">Active Requests</div>
                    </div>
                </div>
            </section>

            {/* ── FEATURES WITH IMAGES ── */}
            <section className="features-section">
                <div className="section-header">
                    <h2>How Blood-Bridge Works</h2>
                    <p>Designed for fast response times in critical healthcare emergencies.</p>
                </div>

                <div className="features-grid">
                    {/* Feature 1 – Donor */}
                    <div className="feature-card glass-card-interactive">
                        <img
                            src="/donor_illustration.png"
                            alt="Voluntary blood donor at a clinic"
                            className="feature-card-image"
                            onError={e => {
                                e.target.style.display = 'none';
                            }}
                        />
                        <div className="feature-card-body">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ background: '#fef2f2', padding: '0.4rem', borderRadius: '8px', display: 'flex' }}>
                                    <Heart size={22} color="#dc2626" fill="#fecaca" />
                                </span>
                                <h3>For Voluntary Donors</h3>
                            </div>
                            <p>Register your blood type and availability. Get instantly alerted when someone in your city urgently needs your blood group. Track your donation history and save lives.</p>
                            <Link to="/login" className="feature-link" id="donor-register-link">
                                Register as Donor <ArrowRight size={15} />
                            </Link>
                        </div>
                    </div>

                    {/* Feature 2 – Recipient */}
                    <div className="feature-card glass-card-interactive">
                        <img
                            src="/recipient_illustration.png"
                            alt="Patient and family searching for blood"
                            className="feature-card-image"
                            onError={e => { e.target.style.display = 'none'; }}
                        />
                        <div className="feature-card-body">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ background: '#eff6ff', padding: '0.4rem', borderRadius: '8px', display: 'flex' }}>
                                    <Search size={22} color="#2563eb" />
                                </span>
                                <h3>For Patients & Hospitals</h3>
                            </div>
                            <p>Instantly search for available blood inventory across verified blood banks. Raise a no-login emergency request and reach voluntary donors near you in seconds.</p>
                            <Link to="/recipient-dashboard" className="feature-link" style={{ color: '#2563eb' }} id="recipient-search-link">
                                Search Blood Availability <ArrowRight size={15} />
                            </Link>
                        </div>
                    </div>

                    {/* Feature 3 – Blood Bank */}
                    <div className="feature-card glass-card-interactive">
                        <img
                            src="/blood_bank_illustration.png"
                            alt="Blood bank facility with blood storage"
                            className="feature-card-image"
                            onError={e => { e.target.style.display = 'none'; }}
                        />
                        <div className="feature-card-body">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ background: '#f0fdf4', padding: '0.4rem', borderRadius: '8px', display: 'flex' }}>
                                    <Building2 size={22} color="#16a34a" />
                                </span>
                                <h3>For Blood Banks</h3>
                            </div>
                            <p>Manage real-time blood inventory levels, process patient requests, approve or reject them, and streamline blood distribution — all from one simple portal.</p>
                            <Link to="/login" className="feature-link" style={{ color: '#16a34a' }} id="bloodbank-portal-link">
                                Blood Bank Portal <ArrowRight size={15} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CALL TO ACTION BANNER ── */}
            <section style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                borderRadius: '20px',
                padding: '3rem 2rem',
                textAlign: 'center',
                color: '#fff',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 10px 40px rgba(220, 38, 38, 0.3)'
            }}>
                <div style={{ position: 'absolute', top: '-30px', left: '-30px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.07)', borderRadius: '50%' }}></div>
                <div style={{ position: 'absolute', bottom: '-40px', right: '-20px', width: '160px', height: '160px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <Droplet size={40} fill="rgba(255,255,255,0.9)" color="rgba(255,255,255,0.9)" style={{ marginBottom: '1rem' }} />
                    <h2 style={{ color: '#fff', fontSize: '2rem', marginBottom: '0.75rem' }}>Every Drop Counts. Be a Hero Today.</h2>
                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.05rem', marginBottom: '1.75rem', maxWidth: '520px', margin: '0 auto 1.75rem' }}>
                        One blood donation can save up to three lives. Join the Blood-Bridge network and make a difference in your community.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/login" className="btn btn-lg" id="join-donor-cta-btn"
                            style={{ background: '#ffffff', color: '#dc2626', fontWeight: 700, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                            <Heart size={18} /> Join as Donor
                        </Link>
                        <button onClick={() => setIsEmergencyModalOpen(true)} className="btn btn-lg" id="cta-emergency-btn"
                            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '2px solid rgba(255,255,255,0.5)', backdropFilter: 'blur(4px)' }}>
                            <AlertTriangle size={18} /> Request Emergency Blood
                        </button>
                    </div>
                </div>
            </section>

            {/* Emergency Request Modal */}
            <EmergencyRequestModal
                isOpen={isEmergencyModalOpen}
                onClose={() => setIsEmergencyModalOpen(false)}
            />
        </div>
    );
}
