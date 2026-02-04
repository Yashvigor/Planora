import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMockApp } from '../hooks/useMockApp';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Auth = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, signup } = useMockApp();
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        role: location.state?.role || ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Category structure with domains
    const categories = {
        land_owner: {
            id: 'land_owner',
            label: 'Land Owner',
            icon: '🏠',
            domains: null, // No domain selection needed
            defaultRole: 'land_owner'
        },
        planning: {
            id: 'planning',
            label: 'Planning & Approval',
            icon: '📐',
            domains: [
                { id: 'architect', label: 'Architect' },
                { id: 'structural_engineer', label: 'Structural Engineer' },
                { id: 'civil_engineer', label: 'Civil Engineer' }
            ]
        },
        design: {
            id: 'design',
            label: 'Design & Finishing',
            icon: '🎨',
            domains: [
                { id: 'interior_designer', label: 'Interior Designer' },
                { id: 'false_ceiling', label: 'False Ceiling Worker' },
                { id: 'fabrication', label: 'Fabrication Worker' }
            ]
        },
        site_work: {
            id: 'site_work',
            label: 'Site Work',
            icon: '🔨',
            domains: [
                { id: 'mason', label: 'Mason' },
                { id: 'electrician', label: 'Electrician' },
                { id: 'plumber', label: 'Plumber' },
                { id: 'carpenter', label: 'Carpenter' },
                { id: 'tile_fixer', label: 'Tile Fixer' },
                { id: 'painter', label: 'Painter' }
            ]
        },
        admin: {
            id: 'admin',
            label: 'Admin',
            icon: '⚙️',
            domains: null, // No domain selection needed
            defaultRole: 'admin'
        }
    };

    const handleCategorySelect = (categoryId) => {
        setSelectedCategory(categoryId);
        const category = categories[categoryId];

        // If category has no domains, set role directly
        if (!category.domains) {
            setFormData({ ...formData, role: category.defaultRole });
        } else {
            // Reset role when switching categories with domains
            setFormData({ ...formData, role: '' });
        }
    };

    const handleDomainSelect = (domainId) => {
        setFormData({ ...formData, role: domainId });
    };

    const validateForm = useCallback(() => {
        if (!formData.email || !formData.password) return "Email and password are required.";
        if (formData.password.length < 6) return "Password must be at least 6 characters.";
        if (!isLogin) {
            if (!formData.name) return "Name is required for signup.";
            if (!selectedCategory) return "Please select your role category.";
            if (!formData.role) return "Please select your specific role.";
            if (!formData.confirmPassword) return "Please confirm your password.";
            if (formData.password !== formData.confirmPassword) return "Passwords do not match.";
        }
        return null;
    }, [formData, isLogin, selectedCategory]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        try {
            const endpoint = isLogin ? 'http://localhost:5000/api/login' : 'http://localhost:5000/api/signup';

            const payload = isLogin
                ? { email: formData.email, password: formData.password }
                : {
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role
                };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Authentication failed');
            }

            // Success
            // You might want to store the user data/token here (e.g., localStorage)
            console.log('Auth success:', data);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setLoading(false);
        setSelectedCategory(null);
        setFormData({ email: '', password: '', confirmPassword: '', name: '', role: '' });
    };

    return (
        <div className="min-h-screen flex font-sans bg-[#FDFCF8] relative overflow-hidden text-[#2A1F1D]">

            {/* Enhanced Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            {/* Main Container */}
            <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen relative z-10">

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="w-full max-w-6xl glass-panel rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[750px] border border-white/40"
                >
                    {/* Left: Enhanced Brand Sidebar */}
                    <div className="hidden lg:flex w-5/12 text-white p-12 flex-col justify-between relative overflow-hidden">
                        {/* Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#2A1F1D] via-[#4A342E] to-[#C06842]"></div>

                        {/* Pattern Overlay */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')]"></div>
                        </div>

                        {/* Animated Circles */}
                        <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
                        <div className="absolute bottom-20 left-10 w-40 h-40 bg-[#D97706]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>

                        {/* Logo & Brand */}
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md p-2.5 rounded-xl border border-white/30 shadow-lg">
                                    <img src="/assets/planora_icon_new.png" alt="Logo" className="w-full h-full object-contain" />
                                </div>
                                <span className="font-serif font-bold text-3xl tracking-tight">Planora</span>
                            </div>

                            {/* Feature Pills */}
                            <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium border border-white/20">🏗️ Project Management</span>
                                <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium border border-white/20">📊 Real-time Tracking</span>
                                <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium border border-white/20">👥 Team Collaboration</span>
                            </div>
                        </div>

                        {/* Main Message */}
                        <div className="relative z-10 space-y-6">
                            <h2 className="text-4xl font-serif font-bold leading-tight">
                                Build smarter.<br />
                                Manage better.
                            </h2>
                            <p className="text-[#EAE0D5] text-base font-light leading-relaxed max-w-sm">
                                Join thousands of construction professionals streamlining their projects with intelligent tools and real-time collaboration.
                            </p>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 pt-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold">5K+</div>
                                    <div className="text-xs text-white/60">Active Users</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">12K+</div>
                                    <div className="text-xs text-white/60">Projects</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">98%</div>
                                    <div className="text-xs text-white/60">Satisfaction</div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="relative z-10 text-xs text-white/50">
                            © 2026 Planora Technologies. All rights reserved.
                        </div>
                    </div>

                    {/* Right: Form */}
                    <div className="flex-1 p-8 lg:p-16 flex flex-col justify-center bg-white relative overflow-y-auto max-h-screen">
                        <div className="max-w-md mx-auto w-full">
                            <h2 className="text-3xl font-serif font-bold text-[#3E2B26] mb-2">{isLogin ? 'Welcome Back' : 'Get Started'}</h2>
                            <p className="text-[#8C7B70] mb-8">{isLogin ? 'Please enter your details.' : 'Select your role and create an account.'}</p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <AnimatePresence>
                                    {!isLogin && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden space-y-6"
                                        >
                                            {/* Step 1: Category Selection */}
                                            <div>
                                                <label className="block text-xs font-bold text-[#3E2B26] uppercase tracking-wider mb-3">
                                                    Step 1: Select Your Category
                                                </label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {Object.values(categories).map((cat) => (
                                                        <button
                                                            key={cat.id}
                                                            type="button"
                                                            onClick={() => handleCategorySelect(cat.id)}
                                                            className={`p-4 rounded-xl border-2 transition-all text-left ${selectedCategory === cat.id
                                                                ? 'bg-[#3E2B26] border-[#3E2B26] text-white shadow-lg scale-105'
                                                                : 'bg-white border-[#E5E0D8] text-[#5D4037] hover:border-[#A65D3B] hover:shadow-md'
                                                                }`}
                                                        >
                                                            <div className="text-2xl mb-2">{cat.icon}</div>
                                                            <div className="font-bold text-sm">{cat.label}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Step 2: Domain Selection (if applicable) */}
                                            {selectedCategory && categories[selectedCategory].domains && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="space-y-3"
                                                >
                                                    <label className="block text-xs font-bold text-[#3E2B26] uppercase tracking-wider">
                                                        Step 2: Select Your Domain
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {categories[selectedCategory].domains.map((domain) => (
                                                            <button
                                                                key={domain.id}
                                                                type="button"
                                                                onClick={() => handleDomainSelect(domain.id)}
                                                                className={`relative p-3 rounded-lg border text-sm font-medium transition-all text-left ${formData.role === domain.id
                                                                    ? 'bg-[#A65D3B] border-[#A65D3B] text-white shadow-md'
                                                                    : 'bg-[#F9F7F2] border-[#D8CFC4] text-[#5D4037] hover:border-[#A65D3B]'
                                                                    }`}
                                                            >
                                                                {domain.label}
                                                                {formData.role === domain.id && (
                                                                    <span className="absolute top-2 right-2 text-white">✓</span>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* Name Field */}
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 }}
                                            >
                                                <label className="block text-xs font-bold text-[#3E2B26] uppercase tracking-wider mb-2">Full Name</label>
                                                <input
                                                    required
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full bg-[#F9F7F2] border-2 border-transparent rounded-xl px-4 py-3 text-[#3E2B26] focus:bg-white focus:border-[#A65D3B] focus:ring-2 focus:ring-[#A65D3B]/20 transition-all outline-none hover:bg-white"
                                                    placeholder="John Doe"
                                                />
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <label className="block text-xs font-bold text-[#3E2B26] uppercase tracking-wider mb-2">Email</label>
                                    <input
                                        required
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-[#F9F7F2] border-2 border-transparent rounded-xl px-4 py-3 text-[#3E2B26] focus:bg-white focus:border-[#A65D3B] focus:ring-2 focus:ring-[#A65D3B]/20 transition-all outline-none hover:bg-white"
                                        placeholder="name@example.com"
                                    />
                                </motion.div>

                                <motion.div
                                    className="relative"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <label className="block text-xs font-bold text-[#3E2B26] uppercase tracking-wider mb-2">Password</label>
                                    <input
                                        required
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-[#F9F7F2] border-2 border-transparent rounded-xl px-4 py-3 text-[#3E2B26] focus:bg-white focus:border-[#A65D3B] focus:ring-2 focus:ring-[#A65D3B]/20 transition-all outline-none pr-10 hover:bg-white"
                                        placeholder="Min 6 characters"
                                    />
                                    <motion.button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-[34px] text-[#8C7B70] hover:text-[#A65D3B] transition-colors"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </motion.button>
                                </motion.div>

                                {!isLogin && (
                                    <motion.div
                                        className="relative"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <label className="block text-xs font-bold text-[#3E2B26] uppercase tracking-wider mb-2">Confirm Password</label>
                                        <input
                                            required
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className="w-full bg-[#F9F7F2] border-2 border-transparent rounded-xl px-4 py-3 text-[#3E2B26] focus:bg-white focus:border-[#A65D3B] focus:ring-2 focus:ring-[#A65D3B]/20 transition-all outline-none pr-10 hover:bg-white"
                                            placeholder="Re-enter password"
                                        />
                                        <motion.button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-[34px] text-[#8C7B70] hover:text-[#A65D3B] transition-colors"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </motion.button>
                                    </motion.div>
                                )}

                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            className="p-4 bg-red-50 border-2 border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-3 shadow-sm"
                                        >
                                            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                                            <span className="flex-1">{error}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <motion.button
                                    type="submit"
                                    disabled={loading}
                                    whileHover={{ scale: loading ? 1 : 1.02 }}
                                    whileTap={{ scale: loading ? 1 : 0.98 }}
                                    className="w-full py-4 bg-gradient-to-r from-[#A65D3B] to-[#8C4A32] hover:from-[#8C4A32] hover:to-[#6D3622] text-white rounded-xl font-bold tracking-wide shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <motion.div
                                                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            ></motion.div>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            {isLogin ? 'Sign In' : 'Create Account'}
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </motion.button>

                                {/* OR Divider */}
                                {(!isLogin && selectedCategory && formData.role) || isLogin ? (
                                    <div className="relative my-6">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-[#E5E0D8]"></div>
                                        </div>
                                        <div className="relative flex justify-center text-xs">
                                            <span className="px-4 bg-white text-[#8C7B70] font-medium">OR</span>
                                        </div>
                                    </div>
                                ) : null}

                                {/* Google Sign-In */}
                                {(!isLogin && selectedCategory && formData.role) || isLogin ? (
                                    <motion.button
                                        type="button"
                                        onClick={() => {
                                            alert('Google Sign-In integration coming soon! For now, please use email/password.');
                                        }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full py-3.5 bg-white border-2 border-[#E5E0D8] hover:border-[#A65D3B] hover:bg-[#F9F7F2] text-[#3E2B26] rounded-xl font-semibold transition-all flex items-center justify-center gap-3 group shadow-sm hover:shadow-md"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                        <span>Continue with Google</span>
                                    </motion.button>
                                ) : null}
                            </form>

                            <div className="mt-8 pt-6 border-t border-[#F9F7F2] text-center">
                                <p className="mt-4 text-sm text-[#8C7B70]">
                                    {isLogin ? "New here? " : "Already have an account? "}
                                    <button onClick={toggleMode} className="text-[#3E2B26] font-bold hover:underline">
                                        {isLogin ? 'Create Account' : 'Sign In'}
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Auth;
