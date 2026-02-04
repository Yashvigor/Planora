import React from 'react';
import { Users, Shield, Zap, FileCheck, Hammer, MessageSquare } from 'lucide-react';

const Features = () => {
    const features = [
        {
            icon: Users,
            title: 'Easy Connections',
            description: 'Browse profiles and connect with local professionals suited for your project scale and type.',
            color: 'var(--primary)',
        },
        {
            icon: Shield,
            title: 'Verified Professionals',
            description: 'We check credentials so you can hire with peace of mind. Quality and trust come first.',
            color: 'var(--secondary)',
        },
        {
            icon: MessageSquare,
            title: 'Direct Communication',
            description: 'Chat directly with architects and contractors. No middlemen, just clear communication.',
            color: 'var(--accent-purple)',
        },
        {
            icon: FileCheck,
            title: 'Project Management',
            description: 'Organize your documents, plans, and contracts in one secure digital workspace.',
            color: 'var(--accent-orange)',
        },
    ];

    return (
        <section id="features" className="section-padding bg-alt">
            <div className="container">
                <div className="section-header text-center">
                    <h2 className="section-title">
                        Your Project, <span className="text-primary">Simplified.</span>
                    </h2>
                    <p className="section-subtitle">
                        Planora provides the essential tools to bring land owners and builders together.
                    </p>
                </div>

                <div className="features-grid">
                    {features.map((feature, index) => (
                        <div key={index} className="feature-card">
                            <div
                                className="feature-icon-wrapper"
                                style={{ backgroundColor: `${feature.color}15`, color: feature.color }}
                            >
                                <feature.icon size={24} />
                            </div>
                            <h3 className="feature-title">{feature.title}</h3>
                            <p className="feature-desc">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
