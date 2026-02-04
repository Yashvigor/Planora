import React from 'react';
import { UserPlus, Search, Rocket } from 'lucide-react';

const HowItWorks = () => {
    const steps = [
        {
            icon: UserPlus,
            title: 'Create Profile',
            desc: 'Sign up as a Land Owner, Architect, or Contractor. It takes less than 2 minutes.',
            class: 'blue',
        },
        {
            icon: Search,
            title: 'Find Professionals',
            desc: 'Browse local experts or list your project to get bids from qualified teams.',
            class: 'emerald',
        },
        {
            icon: Rocket,
            title: 'Build',
            desc: 'Connect directly and start your project with clear communication channels.',
            class: 'purple',
        },
    ];

    return (
        <section id="how-it-works" className="section-padding">
            <div className="container">
                <div className="section-header text-center">
                    <h2 className="section-title">How It Works</h2>
                    <p className="section-subtitle">Simple steps to get your construction project moving.</p>
                </div>

                <div className="steps-container">
                    {/* Connector Line */}
                    <div className="steps-connector"></div>

                    {steps.map((step, index) => (
                        <div key={index} className="step-item">
                            <div className={`step-icon-circle bg-${step.class}-light border-white`}>
                                <step.icon size={32} className={`text-${step.class}`} />
                            </div>

                            <h3 className="step-title">{step.title}</h3>
                            <p className="step-desc">{step.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="centered-action">
                    <button className="btn btn-primary">
                        Get Started Now
                    </button>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
