import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, Star, Quote, ChevronLeft, ChevronRight, Layout, Activity, Package, ClipboardCheck } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();
    const [scrollY, setScrollY] = useState(0);
    const observerRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);

        // Intersection Observer for scroll animations
        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-fade-in-up');
                    }
                });
            },
            { threshold: 0.1 }
        );

        document.querySelectorAll('.scroll-animate').forEach((el) => {
            observerRef.current?.observe(el);
        });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            observerRef.current?.disconnect();
        };
    }, []);

    const scrollToLogin = (role) => {
        navigate('/login', { state: { role } });
    };

    const constructionLifecycle = [
        {
            icon: Layout,
            title: 'Planning & Design',
            description: 'Comprehensive scheduling, architectural drawing management, and resource allocation tools to keep your timeline on track.',
            color: '#A65D3B'
        },
        {
            icon: Activity,
            title: 'Site Monitoring',
            description: 'Real-time updates from the field with digital daily logs, photo documentation, and progress tracking.',
            color: '#5D4037'
        },
        {
            icon: Package,
            title: 'Material Tracking',
            description: 'Monitor inventory levels, track material usage, and manage procurement to prevent shortages and overages.',
            color: '#D97706'
        },
        {
            icon: ClipboardCheck,
            title: 'Quality Assurance',
            description: 'Integrated inspection checklists, rigid compliance verification, and safety protocol management.',
            color: '#8C7B70'
        }
    ];

    const steps = [
        { number: '01', title: 'Create Your Project', description: 'Define your construction vision and requirements' },
        { number: '02', title: 'Connect with Experts', description: 'Match with verified professionals for your needs' },
        { number: '03', title: 'Collaborate & Build', description: 'Manage everything from planning to completion' },
        { number: '04', title: 'Celebrate Success', description: 'Move into your dream space with confidence' }
    ];





    return (
        <div className="bg-[#FDFCF8] min-h-screen text-[#2A1F1D] font-sans selection:bg-[#C06842] selection:text-white overflow-x-hidden relative">
            <Navbar theme="light" />

            {/* Background Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            {/* --- ENHANCED HERO SECTION WITH PARALLAX --- */}
            <section className="relative h-screen min-h-[800px] flex items-center justify-start overflow-hidden pt-20">
                {/* Parallax Background */}
                <div
                    className="absolute inset-0 bg-[url('/assets/hero_bg.png')] bg-cover bg-center opacity-40"
                    style={{ transform: `translateY(${scrollY * 0.5}px)` }}
                ></div>

                {/* Animated Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#FDFCF8] via-[#FDFCF8]/90 to-transparent"></div>

                <div className="container mx-auto px-6 relative z-10 w-full pl-8 md:pl-24 h-full flex flex-col justify-center">
                    <div className="max-w-5xl">
                        <div className="flex items-center space-x-4 mb-8 opacity-0 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
                            <div className="h-[2px] w-16 bg-[#C06842]"></div>
                            <span className="text-[#C06842] font-bold tracking-[0.3em] uppercase text-sm">Architectural Excellence</span>
                        </div>

                        <h1 className="text-6xl md:text-8xl font-serif font-medium leading-[1.1] mb-8 text-[#2A1F1D] opacity-0 animate-fade-in-up" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
                            Crafting <br />
                            <span className="italic relative z-10 text-gradient-main">Legacy</span> <br />
                            Structures.
                        </h1>

                        <p className="text-xl text-[#6E5E56] mb-12 leading-relaxed font-light max-w-xl opacity-0 animate-fade-in-up" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
                            The definitive operating system for visionary owners, architects, and builders.
                        </p>

                        <div className="flex items-center gap-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
                            <button
                                onClick={() => scrollToLogin('owner')}
                                className="group bg-[#2A1F1D] text-white px-10 py-4 rounded-full font-sans text-sm tracking-widest uppercase hover:bg-[#C06842] transition-all duration-500 shadow-xl hover:shadow-2xl hover:scale-105 flex items-center gap-3"
                            >
                                Begin Journey
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                                className="text-[#2A1F1D] font-semibold hover:text-[#C06842] transition-colors flex items-center gap-2 group text-base"
                            >
                                Learn More
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>



            {/* --- CONSTRUCTION LIFECYCLE SECTION --- */}
            <section id="lifecycle" className="py-32 relative scroll-animate opacity-0">
                <div className="container mx-auto px-6 relative z-10">
                    <div className="text-center mb-24">
                        <h2 className="text-5xl font-serif text-[#2A1F1D] mb-6">End-to-End Construction Management</h2>
                        <p className="text-xl text-[#6E5E56] max-w-2xl mx-auto">
                            Powerful tools designed for every stage of your building project
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {constructionLifecycle.map((item, index) => (
                            <div
                                key={index}
                                className="glass-card p-10 rounded-2xl group hover:-translate-y-2 transition-all duration-500 cursor-pointer"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-lg"
                                    style={{ backgroundColor: item.color, color: 'white' }}
                                >
                                    <item.icon size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-[#2A1F1D] mb-4 group-hover:text-[#C06842] transition-colors">
                                    {item.title}
                                </h3>
                                <p className="text-[#6E5E56] leading-relaxed">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- HOW IT WORKS SECTION --- */}
            <section id="how-it-works" className="py-32 bg-[#FDFCF8] scroll-animate opacity-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-[#C06842]/5 skew-y-3 transform origin-top-left scale-110"></div>
                <div className="container mx-auto px-6 relative z-10">
                    <div className="text-center mb-24">
                        <h2 className="text-5xl font-serif text-[#2A1F1D] mb-6">How It Works</h2>
                        <p className="text-xl text-[#6E5E56] max-w-2xl mx-auto">
                            Four simple steps to transform your construction project
                        </p>
                    </div>

                    <div className="max-w-5xl mx-auto">
                        {steps.map((step, index) => (
                            <div key={index} className="relative flex items-center mb-20 last:mb-0 group">
                                {/* Connecting Line */}
                                {index < steps.length - 1 && (
                                    <div className="absolute left-[3rem] top-24 bottom-[-4rem] w-0.5 bg-gradient-to-b from-[#C06842] to-transparent opacity-30"></div>
                                )}

                                {/* Step Number */}
                                <div className="flex-shrink-0 w-24 h-24 rounded-full bg-gradient-to-br from-[#C06842] to-[#4A342E] flex items-center justify-center text-white font-serif text-2xl font-bold shadow-xl group-hover:scale-110 transition-transform duration-500 ring-4 ring-white relative z-10">
                                    {step.number}
                                </div>

                                {/* Content */}
                                <div className="ml-12 flex-1 glass-card p-10 rounded-3xl hover:border-[#C06842]/30 transition-all duration-500">
                                    <h3 className="text-2xl font-bold text-[#2A1F1D] mb-3 group-hover:text-[#C06842] transition-colors">
                                        {step.title}
                                    </h3>
                                    <p className="text-[#6E5E56] text-lg">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>





            {/* --- CTA SECTION --- */}
            <section className="py-32 bg-gradient-to-br from-[#3E2B26] to-[#5D4037] text-white scroll-animate opacity-0">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-5xl md:text-6xl font-serif mb-6">
                        Ready to Build Something Amazing?
                    </h2>
                    <p className="text-xl text-[#EAE0D5] mb-12 max-w-2xl mx-auto">
                        Join thousands of construction professionals who trust Planora for their projects
                    </p>
                    <button
                        onClick={() => scrollToLogin('owner')}
                        className="group bg-white text-[#3E2B26] px-12 py-5 rounded-xl font-bold text-lg hover:bg-[#EAE0D5] transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 inline-flex items-center gap-3"
                    >
                        Start Your Free Trial
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </section>

            <Footer theme="light" />
        </div>
    );
};

export default LandingPage;
