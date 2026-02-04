import React from 'react';
import { ArrowRight, HardHat, Home, Zap, Hammer } from 'lucide-react';

const Hero = () => {
    return (
        <section className="hero-section" id="home">
            <div className="hero-bg-pattern"></div>

            <div className="container relative z-10">
                <div className="hero-grid">

                    {/* Text Content */}
                    <div className="hero-content animate-slide-up">
                        <h1 className="hero-title">
                            Connect. Plan. <br />
                            <span className="text-primary">Build Together.</span>
                        </h1>

                        <p className="hero-subtitle">
                            The simplest way to connect Land Owners with trusted Architects, Engineers, and Contractors. Get your construction project moving today.
                        </p>

                        <div className="hero-actions">
                            <button className="btn btn-primary">
                                Find Professionals <ArrowRight size={20} className="ml-2" />
                            </button>
                            <button className="btn btn-outline">
                                List Your Business
                            </button>
                        </div>
                    </div>

                    {/* Visual Content - Simplified */}
                    <div className="hero-visual">
                        <div className="hero-card-display animate-float">
                            <div className="card-top-row">
                                <div className="icon-circle bg-blue">
                                    <Home size={24} />
                                </div>
                                <div>
                                    <h3 className="card-title">Residential Project</h3>
                                    <p className="card-subtitle">Looking for Architect</p>
                                </div>
                                <span className="status-badge">ACTIVE</span>
                            </div>

                            <div className="connector-list">
                                <div className="connector-item">
                                    <div className="person-info">
                                        <div className="avatar bg-purple">
                                            <HardHat size={16} />
                                        </div>
                                        <div className="text-info">
                                            <p className="name">Sarah Jenkins</p>
                                            <p className="role">Architect</p>
                                        </div>
                                    </div>
                                    <button className="connect-btn">Connect</button>
                                </div>

                                <div className="connector-item">
                                    <div className="person-info">
                                        <div className="avatar bg-orange">
                                            <Hammer size={16} />
                                        </div>
                                        <div className="text-info">
                                            <p className="name">Mike Ross</p>
                                            <p className="role">Contractor</p>
                                        </div>
                                    </div>
                                    <button className="connect-btn">Connect</button>
                                </div>
                            </div>
                        </div>

                        {/* Background Decoration */}
                        <div className="visual-glow"></div>
                    </div>
                </div>

                {/* Construction Fields */}
                <div className="construction-fields-wrapper">
                    <p className="fields-label">Diverse Experts For Every Need</p>
                    <div className="construction-grid">
                        {[
                            { label: 'Residential', icon: Home, class: 'blue' },
                            { label: 'Commercial', icon: Zap, class: 'emerald' },
                            { label: 'Industrial', icon: HardHat, class: 'purple' },
                            { label: 'Renovation', icon: Hammer, class: 'orange' }
                        ].map((item, i) => (
                            <div key={i} className="field-box">
                                <div className={`icon-circle bg-${item.class}`}>
                                    <item.icon size={24} />
                                </div>
                                <span className="field-name">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
};

export default Hero;
