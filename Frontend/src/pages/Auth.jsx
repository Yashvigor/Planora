import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMockApp } from '../hooks/useMockApp';
import { Eye, EyeOff, ArrowRight, User, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import Onboarding from '../components/dashboard/Common/Onboarding';

const Auth = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { setAuthUser } = useMockApp();
    const [isLogin, setIsLogin] = useState(true);
    const [authState, setAuthState] = useState('auth');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [forgotMode, setForgotMode] = useState('none');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        role: location.state?.role || '',
        otp: '',
        newPassword: '',
        userId: null // For onboarding
    });
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
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
                { id: 'contractor', label: 'Contractor' },
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

        if (!category.domains) {
            setFormData({ ...formData, role: category.defaultRole });
        } else {
            setFormData({ ...formData, role: '' });
        }
    };

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            setError('');
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: tokenResponse.access_token }),
                });

                const data = await response.json();
                if (!response.ok) {
                    const detailMsg = data.details ? (typeof data.details === 'string' ? data.details : (data.details.message || JSON.stringify(data.details))) : '';
                    const errorMsg = detailMsg ? `${data.error}: ${detailMsg}` : (data.error || 'Google Login failed');
                    throw new Error(errorMsg);
                }

                if (data.status === 'incomplete') {
                    setFormData(prev => ({ ...prev, userId: data.user.user_id, name: data.user.name, email: data.user.email }));
                    setAuthState('onboarding');
                } else {
                    setAuthUser(data.user);
                    navigate('/dashboard');
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        },
        onError: () => setError('Google Login Failed'),
    });

    const handleCompleteProfile = async (e) => {
        e.preventDefault();
        if (!selectedCategory || !formData.role) {
            setError('Please select your role and category');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: formData.userId,
                    role: formData.role
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Profile completion failed');

            setAuthUser(data.user);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const validateForm = useCallback(() => {
        if (forgotMode === 'reset') {
            if (!formData.otp) return "OTP is required.";
            if (!formData.newPassword) return "New password is required.";
            const passwordRegex = /^(?=.*[A-Z])(?=.*\d.*\d)(?=.*[!@#$%^&*])(?=.{6,})/;
            if (!passwordRegex.test(formData.newPassword)) {
                return "Password must be at least 6 characters, contain 1 uppercase letter, 2 numbers, and 1 special character.";
            }
            return null;
        }

        if (forgotMode === 'email') {
            if (!formData.email) return "Email is required.";
            return null;
        }

        if (!formData.email || !formData.password) return "Email and password are required.";

        if (!isLogin) {
            const passwordRegex = /^(?=.*[A-Z])(?=.*\d.*\d)(?=.*[!@#$%^&*])(?=.{6,})/;
            if (!passwordRegex.test(formData.password)) {
                return "Password must be at least 6 characters, contain 1 uppercase letter, 2 numbers, and 1 special character.";
            }
            if (!formData.name) return "Name is required for signup.";
            if (!selectedCategory) return "Please select your role category.";
            if (!formData.role) return "Please select your specific role.";
            if (!formData.confirmPassword) return "Please confirm your password.";
            if (formData.password !== formData.confirmPassword) return "Passwords do not match.";
        }
        return null;
    }, [formData, isLogin, selectedCategory, forgotMode]);

    const handleForgotPasswordRequest = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to send OTP');

            setSuccessMsg(data.message);
            setForgotMode('reset');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        const vError = validateForm();
        if (vError) { setError(vError); return; }

        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    otp: formData.otp,
                    newPassword: formData.newPassword
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to reset password');

            setSuccessMsg('Password reset successful! You can now login.');
            setTimeout(() => {
                setForgotMode('none');
                setSuccessMsg('');
                setFormData(prev => ({ ...prev, password: '', confirmPassword: '', otp: '', newPassword: '' }));
            }, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (authState === 'onboarding') return handleCompleteProfile(e);
        if (forgotMode === 'email') return handleForgotPasswordRequest(e);
        if (forgotMode === 'reset') return handleResetPassword(e);

        setError('');
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        try {
            const endpoint = isLogin ? `${import.meta.env.VITE_API_URL}/api/login` : `${import.meta.env.VITE_API_URL}/api/signup`;

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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Authentication failed');
            }

            setAuthUser(data.user);

            if (data.status === 'incomplete') {
                setFormData(prev => ({ ...prev, userId: data.user.id || data.user.user_id, name: data.user.name, email: data.user.email }));
                setAuthState('onboarding');
            } else {
                navigate('/dashboard');
            }
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
        setForgotMode('none');
        setAuthState('auth');
        setSelectedCategory(null);
        setFormData({ email: '', password: '', confirmPassword: '', name: '', role: '', otp: '', newPassword: '', userId: null });
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
                    {/* Left: Brand Sidebar (Reverted to standard consistency) */}
                    <div className="hidden lg:flex w-5/12 text-white p-12 flex-col justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#2A1F1D] to-[#4A342E]"></div>
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')]"></div>

                        <div className="relative z-10 space-y-12">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/40 backdrop-blur-md p-2.5 rounded-xl border border-white/50 shadow-lg">
                                    <img src="/assets/planora_icon_new.png" alt="Logo" className="w-full h-full object-contain" />
                                </div>
                                <span className="font-serif font-bold text-3xl tracking-tight text-[#E3DACD]">Planora</span>
                            </div>

                            <div className="space-y-6">
                                <h2 className="text-4xl font-serif font-light leading-tight !text-[#E3DACD]">
                                    {authState === 'onboarding' ? 'Finalize Your Profile' : (forgotMode !== 'none' ? 'Reset Security' : 'Precision in Construction Management.')}
                                </h2>
                                <p className="text-[#E3DACD]/80 text-base font-light leading-relaxed max-w-sm">
                                    {authState === 'onboarding'
                                        ? 'Complete your professional profile to access the platform.'
                                        : (forgotMode !== 'none' ? 'Securely update your access credentials.' : 'Digital infrastructure for modern construction professionals.')}
                                </p>
                            </div>
                        </div>

                        <div className="absolute bottom-12 left-12 right-12 z-10 text-[10px] uppercase font-bold tracking-[0.2em] text-[#E3DACD]/30 border-t border-white/10 pt-8 mt-auto">
                            © 2026 Planora Technologies. All rights reserved.
                        </div>
                    </div>

                    {/* Right: Form Section */}
                    <div className="flex-1 p-8 lg:p-16 flex flex-col bg-white overflow-y-auto max-h-[85vh] custom-scrollbar">
                        <div className="max-w-md mx-auto w-full">

                            <AnimatePresence mode="wait">
                                {authState === 'onboarding' ? (
                                    <motion.div
                                        key="onboarding"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-8"
                                    >
                                        <div className="flex items-center gap-4 mb-2">
                                            <div className="w-12 h-12 bg-[#F9F7F2] rounded-2xl flex items-center justify-center text-[#A65D3B] shadow-inner">
                                                <User size={24} />
                                            </div>
                                            <div>
                                                <h2 className="text-3xl font-serif font-bold text-[#3E2B26]">Complete Profile</h2>
                                                <p className="text-[#8C7B70] text-sm">Welcome back, {formData.name}!</p>
                                            </div>
                                        </div>

                                        <form onSubmit={handleCompleteProfile} className="space-y-6">
                                            {/* Unified Category Selection */}
                                            <div className="space-y-6 p-6 bg-[#F9F7F2]/50 rounded-[2rem] border border-[#E5E0D8] backdrop-blur-sm shadow-sm">
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-[#A65D3B]"></div>
                                                        <label className="text-[10px] font-black text-[#3E2B26] uppercase tracking-[0.15em]">Step 1: Your Category</label>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {Object.values(categories).map(cat => (
                                                            <button
                                                                key={cat.id}
                                                                type="button"
                                                                onClick={() => handleCategorySelect(cat.id)}
                                                                className={`py-3 px-2 rounded-2xl border-2 text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1 group ${selectedCategory === cat.id ? 'bg-[#3E2B26] text-white border-[#3E2B26] shadow-md' : 'bg-white border-[#E5E0D8] text-[#5D4037] hover:border-[#A65D3B] hover:shadow-sm'}`}
                                                            >
                                                                <span className="text-xl transition-transform group-hover:scale-110">{cat.icon}</span>
                                                                <span>{cat.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {selectedCategory && categories[selectedCategory].domains && (
                                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-2 border-t border-[#E5E0D8]">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-[#A65D3B]"></div>
                                                            <label className="text-[10px] font-black text-[#3E2B26] uppercase tracking-[0.15em]">Step 2: Specific Role</label>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {categories[selectedCategory].domains.map(dom => (
                                                                <button
                                                                    key={dom.id}
                                                                    type="button"
                                                                    onClick={() => setFormData({ ...formData, role: dom.id })}
                                                                    className={`p-2.5 rounded-xl border-2 text-[10px] font-black transition-all ${formData.role === dom.id ? 'bg-[#A65D3B] text-white border-[#A65D3B] shadow-sm' : 'bg-white border-[#E5E0D8] text-[#5D4037] hover:border-[#A65D3B]'}`}
                                                                >
                                                                    {dom.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={loading || !formData.role}
                                                className="w-full py-5 bg-[#3E2B26] hover:bg-[#2A1F1D] text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
                                            >
                                                {loading ? 'Processing...' : 'Access Dashboard'}
                                                <ArrowRight size={20} />
                                            </button>
                                        </form>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="auth"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-8"
                                    >
                                        <div className="space-y-2">
                                            <h2 className="text-4xl font-serif font-bold text-[#3E2B26] tracking-tight">
                                                {forgotMode === 'email' ? 'Security Access' : (forgotMode === 'reset' ? 'Update Credentials' : (isLogin ? 'Sign In' : 'Create Account'))}
                                            </h2>
                                            <p className="text-[#8C7B70] text-sm font-medium">
                                                {forgotMode === 'email' ? 'Enter your registered email to receive a secure OTP.' : (forgotMode === 'reset' ? 'Configure a secure new password for your account.' : (isLogin ? 'Enter your credentials to access the platform.' : 'Register to streamline your construction projects.'))}
                                            </p>
                                        </div>

                                        <form onSubmit={handleSubmit} className="space-y-5">
                                            {forgotMode === 'email' ? (
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-[#3E2B26] uppercase tracking-[0.2em] ml-1">Email Address</label>
                                                    <input required type="email" placeholder="name@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-[#F9F7F2] border-2 border-transparent focus:border-[#A65D3B] focus:bg-white p-4 rounded-2xl outline-none transition-all shadow-sm" />
                                                </div>
                                            ) : forgotMode === 'reset' ? (
                                                <div className="space-y-4">
                                                    <input required type="text" placeholder="6-digit OTP" maxLength="6" value={formData.otp} onChange={(e) => setFormData({ ...formData, otp: e.target.value })} className="w-full bg-[#F9F7F2] p-5 rounded-2xl text-center text-2xl font-black tracking-[0.5em] outline-none border-2 border-transparent focus:border-[#A65D3B] focus:bg-white" />
                                                    <div className="relative">
                                                        <input required type={showPassword ? "text" : "password"} placeholder="New Password" value={formData.newPassword} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} className="w-full bg-[#F9F7F2] p-4 rounded-xl outline-none border-2 border-transparent focus:border-[#A65D3B] focus:bg-white transition-all shadow-sm" />
                                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-[#8C7B70]">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-5">
                                                    {!isLogin && (
                                                        <div className="space-y-6 mb-6 p-6 bg-[#F9F7F2]/50 rounded-[2rem] border border-[#E5E0D8] backdrop-blur-sm">
                                                            <div className="space-y-4">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#A65D3B]"></div>
                                                                    <label className="text-[10px] font-black text-[#3E2B26] uppercase tracking-[0.15em]">Step 1: Your Category</label>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    {Object.values(categories).map(cat => (
                                                                        <button
                                                                            key={cat.id}
                                                                            type="button"
                                                                            onClick={() => handleCategorySelect(cat.id)}
                                                                            className={`py-3 px-2 rounded-2xl border-2 text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1 group ${selectedCategory === cat.id ? 'bg-[#3E2B26] text-white border-[#3E2B26] shadow-md' : 'bg-white border-[#E5E0D8] text-[#5D4037] hover:border-[#A65D3B] hover:shadow-sm'}`}
                                                                        >
                                                                            <span className="text-xl transition-transform group-hover:scale-110">{cat.icon}</span>
                                                                            <span>{cat.label}</span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            {selectedCategory && categories[selectedCategory].domains && (
                                                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-2 border-t border-[#E5E0D8]">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-[#A65D3B]"></div>
                                                                        <label className="text-[10px] font-black text-[#3E2B26] uppercase tracking-[0.15em]">Step 2: Specific Role</label>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        {categories[selectedCategory].domains.map(dom => (
                                                                            <button
                                                                                key={dom.id}
                                                                                type="button"
                                                                                onClick={() => setFormData({ ...formData, role: dom.id })}
                                                                                className={`p-2.5 rounded-xl border-2 text-[10px] font-black transition-all ${formData.role === dom.id ? 'bg-[#A65D3B] text-white border-[#A65D3B] shadow-sm' : 'bg-white border-[#E5E0D8] text-[#5D4037] hover:border-[#A65D3B]'}`}
                                                                            >
                                                                                {dom.label}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                            <div className="pt-2">
                                                                <input required type="text" placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white border-2 border-[#E5E0D8] focus:border-[#A65D3B] p-4 rounded-2xl outline-none transition-all font-medium text-sm shadow-inner placeholder:text-[#8C7B70]/50" />
                                                            </div>
                                                        </div>
                                                    )}

                                                    <input required type="email" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-[#F9F7F2] border-2 border-transparent focus:border-[#A65D3B] focus:bg-white p-4 rounded-xl outline-none transition-all shadow-sm font-medium" />

                                                    <div className="relative">
                                                        <input required type={showPassword ? "text" : "password"} placeholder="Password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full bg-[#F9F7F2] border-2 border-transparent focus:border-[#A65D3B] focus:bg-white p-4 rounded-xl outline-none pr-12 transition-all shadow-sm font-medium" />
                                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-[#8C7B70] hover:text-[#3E2B26] transition-colors">
                                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                        </button>
                                                    </div>

                                                    {!isLogin && (
                                                        <div className="relative">
                                                            <input required type={showConfirmPassword ? "text" : "password"} placeholder="Confirm Password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="w-full bg-[#F9F7F2] border-2 border-transparent focus:border-[#A65D3B] focus:bg-white p-4 rounded-xl outline-none pr-12 transition-all shadow-sm font-medium" />
                                                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-4 text-[#8C7B70] hover:text-[#3E2B26] transition-colors">
                                                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {isLogin && forgotMode === 'none' && (
                                                <div className="flex justify-end">
                                                    <button type="button" onClick={() => setForgotMode('email')} className="text-xs font-bold text-[#A65D3B] hover:text-[#3E2B26] transition-colors">Forgot Password?</button>
                                                </div>
                                            )}

                                            {error && (
                                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                                    {error}
                                                </motion.div>
                                            )}

                                            {successMsg && (
                                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-green-50 text-green-700 text-xs font-bold rounded-xl border border-green-100 flex items-center gap-3">
                                                    <Check size={18} className="text-green-500" />
                                                    {successMsg}
                                                </motion.div>
                                            )}

                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full py-5 bg-[#3E2B26] hover:bg-[#2A1F1D] text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl hover:shadow-2xl transform active:scale-[0.98] flex items-center justify-center gap-3"
                                            >
                                                {loading ? 'Processing...' : (forgotMode === 'email' ? 'Send OTP' : (forgotMode === 'reset' ? 'Save New Password' : (isLogin ? 'Sign In' : 'Create Account')))}
                                                <ArrowRight size={20} />
                                            </button>
                                        </form>

                                        {/* Google Login - Only for Sign In */}
                                        {isLogin && forgotMode === 'none' && (
                                            <>
                                                <div className="relative py-4">
                                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E5E0D8]"></div></div>
                                                    <div className="relative flex justify-center text-[10px]"><span className="px-4 bg-white text-[#8C7B70] font-black uppercase tracking-widest leading-none">or</span></div>
                                                </div>

                                                <motion.button
                                                    type="button"
                                                    onClick={() => handleGoogleLogin()}
                                                    whileHover={{ scale: 1.01, translateY: -1 }}
                                                    whileActive={{ scale: 0.99 }}
                                                    className="w-full py-4 bg-white border-2 border-[#E5E0D8] hover:border-[#3E2B26] text-[#3E2B26] rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md"
                                                >
                                                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                                                    <span>Continue with Google</span>
                                                </motion.button>
                                            </>
                                        )}

                                        <div className="pt-4 text-center">
                                            <button onClick={toggleMode} className="text-sm text-[#8C7B70] font-medium transition-colors hover:text-[#3E2B26]">
                                                {isLogin ? "Need a professional account? " : "Already registered? "}
                                                <span className="text-[#3E2B26] font-bold underline decoration-[#A65D3B] underline-offset-4 decoration-2">
                                                    {isLogin ? 'Create Account' : 'Sign In Now'}
                                                </span>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <Onboarding
                                isOpen={authState === 'onboarding'}
                                onClose={() => {
                                    setAuthState('auth');
                                    navigate('/dashboard');
                                }}
                                user={{ id: formData.userId, name: formData.name, role: formData.role }}
                                onComplete={(updatedUser) => {
                                    setAuthUser(updatedUser);
                                    setAuthState('auth');
                                    navigate('/dashboard');
                                }}
                            />

                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Auth;



