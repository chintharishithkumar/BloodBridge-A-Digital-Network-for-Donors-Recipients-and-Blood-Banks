import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Droplet, Heart, Building2, Search, ArrowRight, ShieldCheck, Activity, Users, MapPin } from 'lucide-react';
import API from '../api';

export default function Home() {
    const navigate = useNavigate();
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
            .then(res => {
                if (res.data.status === 'success') {
                    setStats(res.data.stats);
                }
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        API.get(`/recipients/cities?blood_group=${encodeURIComponent(searchGroup)}`)
            .then(res => {
                if (res.data.status === 'success' && res.data.cities) {
                    setAvailableCities(res.data.cities);
                }
            })
            .catch(() => {});
    }, [searchGroup]);

    const handleQuickSearch = (e) => {
        e.preventDefault();
        navigate(`/recipient-dashboard?blood_group=${encodeURIComponent(searchGroup)}&city=${encodeURIComponent(searchCity)}`);
    };

    return (
        <div className="home-container">
            {/* HERO SECTION - Wireframe 1 */}
            <section className="hero-section">
                <div className="hero-badge pulse-glow">
                    <Droplet size={16} fill="#e63946" color="#e63946" /> Emergency Blood Donation Network
                </div>

                <h1 className="hero-title">BLOOD-BRIDGE</h1>
                <p className="hero-subtitle">
                    Connecting Donors & Blood Banks with Recipients
                </p>

                <div className="hero-actions">
                    <Link to="/recipient-dashboard" className="btn btn-primary btn-lg">
                        <Search size={20} /> Find Blood
                    </Link>
                    <Link to="/login" className="btn btn-secondary btn-lg">
                        Login / Register
                    </Link>
                </div>

                {/* Quick Search Widget */}
                <form onSubmit={handleQuickSearch} className="quick-search-card glass-panel">
                    <div className="search-inputs">
                        <div className="search-field">
                            <label><Droplet size={14} color="#e63946" /> Blood Group</label>
                            <select 
                                value={searchGroup} 
                                onChange={(e) => setSearchGroup(e.target.value)}
                                className="form-control"
                            >
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                    <option key={bg} value={bg}>{bg}</option>
                                ))}
                            </select>
                        </div>
                        <div className="search-field">
                            <label><MapPin size={14} color="#e63946" /> City / Location</label>
                            <input 
                                type="text"
                                list="home-available-cities"
                                placeholder="Select or type city..."
                                value={searchCity}
                                onChange={(e) => setSearchCity(e.target.value)}
                                className="form-control"
                            />
                            <datalist id="home-available-cities">
                                {availableCities.map(c => (
                                    <option key={c} value={c} />
                                ))}
                            </datalist>
                        </div>
                        <button type="submit" className="btn btn-primary">
                            <Search size={18} /> Search Stock
                        </button>
                    </div>

                    {availableCities.length > 0 && (
                        <div className="available-cities-chips" style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', opacity: 0.85, fontWeight: 500 }}>Available Cities for {searchGroup}:</span>
                            {availableCities.slice(0, 8).map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setSearchCity(c)}
                                    className={`badge ${searchCity === c ? 'badge-blood' : 'badge-secondary'}`}
                                    style={{ cursor: 'pointer', border: 'none', transition: 'all 0.2s' }}
                                >
                                    📍 {c}
                                </button>
                            ))}
                        </div>
                    )}
                </form>
            </section>

            {/* LIVE NETWORK STATS */}
            <section className="stats-section">
                <div className="stats-grid">
                    <div className="stat-card glass-card-interactive">
                        <div className="stat-icon-wrapper red">
                            <Heart size={24} color="#e63946" />
                        </div>
                        <div className="stat-number">{stats.totalDonors}</div>
                        <div className="stat-label">Verified Donors</div>
                    </div>

                    <div className="stat-card glass-card-interactive">
                        <div className="stat-icon-wrapper blue">
                            <Users size={24} color="#3b82f6" />
                        </div>
                        <div className="stat-number">{stats.totalRecipients}</div>
                        <div className="stat-label">Recipients Assisted</div>
                    </div>

                    <div className="stat-card glass-card-interactive">
                        <div className="stat-icon-wrapper green">
                            <Building2 size={24} color="#10b981" />
                        </div>
                        <div className="stat-number">{stats.bloodBanks}</div>
                        <div className="stat-label">Partner Blood Banks</div>
                    </div>

                    <div className="stat-card glass-card-interactive">
                        <div className="stat-icon-wrapper yellow">
                            <Activity size={24} color="#f59e0b" />
                        </div>
                        <div className="stat-number">{stats.pendingRequests}</div>
                        <div className="stat-label">Active Requests</div>
                    </div>
                </div>
            </section>

            {/* FEATURES OVERVIEW */}
            <section className="features-section">
                <div className="section-header">
                    <h2>Empowering Life-Saving Connections</h2>
                    <p>Designed for fast response times in critical healthcare emergencies.</p>
                </div>

                <div className="features-grid">
                    <div className="feature-card glass-card-interactive">
                        <div className="feature-icon">
                            <Heart size={32} color="#e63946" />
                        </div>
                        <h3>For Voluntary Donors</h3>
                        <p>Register your availability, track your donation history, and get notified when someone in your city needs your blood type.</p>
                        <Link to="/login" className="feature-link">Register as Donor <ArrowRight size={16} /></Link>
                    </div>

                    <div className="feature-card glass-card-interactive">
                        <div className="feature-icon">
                            <Search size={32} color="#3b82f6" />
                        </div>
                        <h3>For Patients & Hospitals</h3>
                        <p>Instantly search for available blood inventory across verified blood banks and reach voluntary donors near you.</p>
                        <Link to="/recipient-dashboard" className="feature-link">Search Availability <ArrowRight size={16} /></Link>
                    </div>

                    <div className="feature-card glass-card-interactive">
                        <div className="feature-icon">
                            <Building2 size={32} color="#10b981" />
                        </div>
                        <h3>For Blood Banks</h3>
                        <p>Manage real-time inventory levels, process pending patient requests, and streamline blood distribution seamlessly.</p>
                        <Link to="/login" className="feature-link">Blood Bank Portal <ArrowRight size={16} /></Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
