import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, Users, Shield, Zap, FileCheck, Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();
    const [scrollY, setScrollY] = useState(0);
    const [currentTestimonial, setCurrentTestimonial] = useState(0);
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

    const features = [
        {
            icon: Users,
            title: 'Team Collaboration',
            description: 'Connect seamlessly with architects, engineers, and contractors in real-time.',
            color: '#A65D3B'
        },
        {
            icon: Shield,
            title: 'Verified Professionals',
            description: 'Work with certified experts who have proven track records in construction.',
            color: '#5D4037'
        },
        {
            icon: Zap,
            title: 'Real-time Updates',
            description: 'Stay informed with instant notifications and project progress tracking.',
            color: '#D97706'
        },
        {
            icon: FileCheck,
            title: 'Document Management',
            description: 'Organize plans, permits, and contracts in one secure digital workspace.',
            color: '#8C7B70'
        }
    ];

    const steps = [
        { number: '01', title: 'Create Your Project', description: 'Define your construction vision and requirements' },
        { number: '02', title: 'Connect with Experts', description: 'Match with verified professionals for your needs' },
        { number: '03', title: 'Collaborate & Build', description: 'Manage everything from planning to completion' },
        { number: '04', title: 'Celebrate Success', description: 'Move into your dream space with confidence' }
    ];

    const pricingPlans = [
        {
            name: 'Starter',
            price: 'Free',
            description: 'Perfect for small projects',
            features: ['Up to 2 projects', 'Basic collaboration', 'Document storage (5GB)', 'Email support'],
            highlighted: false
        },
        {
            name: 'Professional',
            price: '$49',
            period: '/month',
            description: 'For growing teams',
            features: ['Unlimited projects', 'Advanced collaboration', 'Document storage (100GB)', 'Priority support', 'Custom workflows', 'Analytics dashboard'],
            highlighted: true
        },
        {
            name: 'Enterprise',
            price: 'Custom',
            description: 'For large organizations',
            features: ['Everything in Professional', 'Dedicated account manager', 'Custom integrations', 'Advanced security', 'SLA guarantee', 'Training & onboarding'],
            highlighted: false
        }
    ];

    const testimonials = [
        {
            name: 'Sarah Johnson',
            role: 'Property Developer',
            company: 'Urban Spaces LLC',
            content: 'Planora transformed how we manage our construction projects. The collaboration tools are exceptional, and we\'ve reduced project delays by 40%.',
            rating: 5,
            avatar: '👩‍💼'
        },
        {
            name: 'Michael Chen',
            role: 'Lead Architect',
            company: 'Chen & Associates',
            content: 'The best platform for architectural project management. Our team productivity has increased significantly since we started using Planora.',
            rating: 5,
            avatar: '👨‍💼'
        },
        {
            name: 'Emily Rodriguez',
            role: 'Construction Manager',
            company: 'BuildRight Construction',
            content: 'Finally, a platform that understands construction workflows. The real-time updates and document management are game-changers.',
            rating: 5,
            avatar: '👷‍♀️'
        }
    ];

    const nextTestimonial = () => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    };

    const prevTestimonial = () => {
        setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

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

            {/* --- STATS STRIP --- */}
            <div className="relative py-24 border-y border-[#C06842]/20 bg-white/50 backdrop-blur-md scroll-animate opacity-0">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-16 max-w-6xl mx-auto">
                        <div className="text-center md:text-left group cursor-pointer">
                            <span className="block text-6xl font-serif text-gradient-main mb-2">25+</span>
                            <span className="text-xs uppercase tracking-[0.2em] text-[#C06842]">Years of Excellence</span>
                        </div>
                        <div className="hidden md:block w-px h-16 bg-[#C06842]/20"></div>
                        <div className="text-center md:text-left group cursor-pointer">
                            <span className="block text-6xl font-serif text-gradient-main mb-2">$500M+</span>
                            <span className="text-xs uppercase tracking-[0.2em] text-[#C06842]">Project Value Managed</span>
                        </div>
                        <div className="hidden md:block w-px h-16 bg-[#C06842]/20"></div>
                        <div className="text-center md:text-left group cursor-pointer">
                            <span className="block text-6xl font-serif text-gradient-main mb-2">45+</span>
                            <span className="text-xs uppercase tracking-[0.2em] text-[#C06842]">Design Awards</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- FEATURES SECTION --- */}
            <section id="features" className="py-32 relative scroll-animate opacity-0">
                <div className="container mx-auto px-6 relative z-10">
                    <div className="text-center mb-24">
                        <h2 className="text-5xl font-serif text-[#2A1F1D] mb-6">Why Choose Planora</h2>
                        <p className="text-xl text-[#6E5E56] max-w-2xl mx-auto">
                            Everything you need to manage construction projects from start to finish
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="glass-card p-10 rounded-2xl group hover:-translate-y-2 transition-all duration-500 cursor-pointer"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-lg"
                                    style={{ backgroundColor: feature.color, color: 'white' }}
                                >
                                    <feature.icon size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-[#2A1F1D] mb-4 group-hover:text-[#C06842] transition-colors">
                                    {feature.title}
                                </h3>
                                <p className="text-[#6E5E56] leading-relaxed">
                                    {feature.description}
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

            {/* --- PRICING SECTION --- */}
            <section id="pricing" className="py-32 relative scroll-animate opacity-0">
                <div className="container mx-auto px-6 relative z-10">
                    <div className="text-center mb-24">
                        <h2 className="text-5xl font-serif text-[#2A1F1D] mb-6">Simple, Transparent Pricing</h2>
                        <p className="text-xl text-[#6E5E56] max-w-2xl mx-auto">
                            Choose the plan that fits your project needs
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        {pricingPlans.map((plan, index) => (
                            <div
                                key={index}
                                className={`relative p-10 rounded-[2rem] transition-all duration-500 ${plan.highlighted
                                    ? 'bg-[#2A1F1D] text-white shadow-2xl scale-105 border-0'
                                    : 'glass-card hover:bg-white border-white/50'
                                    }`}
                            >
                                {plan.highlighted && (
                                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#C06842] text-white px-8 py-2 rounded-full text-sm font-bold shadow-lg tracking-wide uppercase">
                                        Most Popular
                                    </div>
                                )}

                                <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-[#2A1F1D]'}`}>
                                    {plan.name}
                                </h3>
                                <p className={`text-sm mb-8 ${plan.highlighted ? 'text-[#E3DACD]' : 'text-[#6E5E56]'}`}>
                                    {plan.description}
                                </p>

                                <div className="mb-10">
                                    <span className={`text-6xl font-serif font-medium ${plan.highlighted ? 'text-white' : 'text-gradient-main'}`}>
                                        {plan.price}
                                    </span>
                                    {plan.period && (
                                        <span className={`text-lg ${plan.highlighted ? 'text-[#E3DACD]' : 'text-[#6E5E56]'}`}>
                                            {plan.period}
                                        </span>
                                    )}
                                </div>

                                <ul className="space-y-5 mb-10">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-4">
                                            <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.highlighted ? 'text-[#C06842]' : 'text-[#C06842]'}`} />
                                            <span className={plan.highlighted ? 'text-[#E3DACD]' : 'text-[#4A342E]'}>
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => scrollToLogin('owner')}
                                    className={`w-full py-4 rounded-xl font-bold transition-all duration-300 ${plan.highlighted
                                        ? 'bg-gradient-to-r from-[#C06842] to-[#E68A2E] text-white hover:shadow-lg hover:scale-[1.02]'
                                        : 'bg-[#2A1F1D] text-white hover:bg-[#C06842] hover:shadow-lg'
                                        }`}
                                >
                                    Get Started
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- TESTIMONIALS SECTION --- */}
            <section className="py-32 bg-[#F9F7F2] scroll-animate opacity-0">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-5xl font-serif text-[#3E2B26] mb-6">What Our Clients Say</h2>
                        <p className="text-xl text-[#8C7B70] max-w-2xl mx-auto">
                            Trusted by construction professionals worldwide
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto relative">
                        <div className="bg-white rounded-3xl p-12 shadow-xl">
                            <Quote className="w-16 h-16 text-[#A65D3B] mb-6 opacity-20" />

                            <div className="mb-8">
                                <div className="flex gap-1 mb-6">
                                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                                        <Star key={i} className="w-6 h-6 fill-[#D97706] text-[#D97706]" />
                                    ))}
                                </div>

                                <p className="text-2xl text-[#3E2B26] leading-relaxed mb-8 font-light italic">
                                    "{testimonials[currentTestimonial].content}"
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#A65D3B] to-[#5D4037] flex items-center justify-center text-3xl">
                                    {testimonials[currentTestimonial].avatar}
                                </div>
                                <div>
                                    <div className="font-bold text-[#3E2B26] text-lg">
                                        {testimonials[currentTestimonial].name}
                                    </div>
                                    <div className="text-[#8C7B70]">
                                        {testimonials[currentTestimonial].role} at {testimonials[currentTestimonial].company}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-center gap-4 mt-8">
                            <button
                                onClick={prevTestimonial}
                                className="w-12 h-12 rounded-full bg-white hover:bg-[#3E2B26] text-[#3E2B26] hover:text-white transition-all duration-300 flex items-center justify-center shadow-md"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                onClick={nextTestimonial}
                                className="w-12 h-12 rounded-full bg-white hover:bg-[#3E2B26] text-[#3E2B26] hover:text-white transition-all duration-300 flex items-center justify-center shadow-md"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Dots Indicator */}
                        <div className="flex justify-center gap-2 mt-6">
                            {testimonials.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentTestimonial(index)}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentTestimonial ? 'bg-[#A65D3B] w-8' : 'bg-[#D8CFC4]'
                                        }`}
                                />
                            ))}
                        </div>
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
