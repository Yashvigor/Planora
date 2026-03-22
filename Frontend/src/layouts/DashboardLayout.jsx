import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useMockApp } from '../hooks/useMockApp';
import { Menu, Bell, ShieldCheck, AlertCircle, X, Search, User } from 'lucide-react';
import Sidebar from '../components/Layout/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import Onboarding from '../components/dashboard/Common/Onboarding';
import AccountDisabled from '../pages/dashboard/Common/AccountDisabled';

const DashboardLayout = () => {
    const { currentUser } = useMockApp();
    const navigate = useNavigate();
    const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
    const [isOnboardingOpen, setOnboardingOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Live Location Update
    useEffect(() => {
        const updateLocation = async () => {
            if (!currentUser || !navigator.geolocation) return;
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                const uid = currentUser.user_id || currentUser.id;
                try {
                    await fetch(`${import.meta.env.VITE_API_URL}/api/users/${uid}/profile`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ latitude, longitude })
                    });
                } catch (err) { console.error('[Dashboard] Location update failed:', err); }
            }, null, { enableHighAccuracy: true });
        };
        updateLocation();
    }, [currentUser]);

    // Handle Resize for sidebar responsiveness
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) setSidebarOpen(false);
            else setSidebarOpen(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!currentUser) return null;

    const role = (currentUser?.role || '').toLowerCase();
    const status = (currentUser.status || '').toLowerCase();
    
    // Authorization & Status Gating
    const isExempt = ['admin', 'land_owner', 'contractor'].includes(role);
    const isPending = status === 'pending';
    const isRejected = status === 'rejected';
    const isDisabled = status === 'disabled';
    const isAppealing = currentUser.appeal_reason || currentUser.rejection_reason?.startsWith('[APPEAL SUBMITTED]');

    if (isDisabled || (isAppealing && isExempt)) return <AccountDisabled />;

    if ((isPending || isRejected) && !isExempt) {
        return (
            <div className="flex items-center justify-center min-vh-screen bg-[#FDFCF8] p-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl w-full text-center space-y-10">
                    <div className="relative mx-auto w-24 h-24">
                        <div className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl ${isPending ? 'bg-[#2A1F1D] text-white' : 'bg-red-50 text-red-600'}`}>
                            {isPending ? <ShieldCheck size={48} /> : <AlertCircle size={48} />}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-4xl font-serif font-black text-[#2A1F1D] tracking-tight">{isPending ? 'Verification Protocol' : 'Identity Verification Rejected'}</h1>
                        <p className="text-lg text-[#8C7B70] leading-relaxed max-w-sm mx-auto font-medium">
                            {isPending ? "Your credentials are currently undergoing operational review. Full dashboard access awaits verification." : "Your professional identity could not be verified. Please update your documentation."}
                        </p>
                    </div>
                    {isRejected && <div className="bg-red-50/50 p-6 rounded-3xl border border-red-100 text-sm text-red-700 italic font-semibold italic text-left">"{currentUser.rejection_reason || 'Incomplete or unclear documentation.'}"</div>}
                    <div className="flex flex-col gap-4">
                        <button onClick={() => setOnboardingOpen(true)} className="w-full py-5 bg-[#2A1F1D] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Update Operational Profile</button>
                        <button onClick={() => navigate('/')} className="text-[10px] font-black uppercase text-[#8C7B70] tracking-[0.2em]">Exit Portal</button>
                    </div>
                </motion.div>
                {isOnboardingOpen && <Onboarding isOpen={isOnboardingOpen} onClose={() => setOnboardingOpen(false)} user={currentUser} onComplete={() => window.location.reload()} />}
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#FDFCF8] font-sans text-[#2A1F1D] overflow-hidden">
            {/* Sidebar Backdrop for Mobile */}
            <AnimatePresence>
                {isSidebarOpen && window.innerWidth < 1024 && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-[#2A1F1D]/40 backdrop-blur-sm z-30 lg:hidden"
                    />
                )}
            </AnimatePresence>

            <div className={`fixed inset-y-0 left-0 z-40 lg:relative lg:block transform transition-transform duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${isSidebarOpen ? 'lg:w-64' : 'lg:w-20'}`}>
                <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
            </div>

            {/* Main Application Area */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Modern Unified Header */}
                <header className="h-16 shrink-0 bg-white/80 backdrop-blur-xl border-b border-[#E3DACD]/40 flex items-center justify-between px-4 lg:px-10 z-20">
                    <div className="flex items-center gap-5">
                        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2.5 rounded-xl bg-[#F9F7F2] text-[#2A1F1D] hover:bg-[#C06842] hover:text-white transition-all duration-300 active:scale-95 shadow-sm">
                            {isSidebarOpen && window.innerWidth < 1024 ? <X size={18} /> : <Menu size={18} />}
                        </button>
                        <div className="hidden sm:block">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#C06842] mb-0">Global Navigation</p>
                            <h2 className="font-serif font-black text-lg text-[#2A1F1D] tracking-tight truncate">Welcome Back, {currentUser.name.split(' ')[0]}</h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 lg:gap-5">
                        <div className="hidden md:flex items-center bg-[#F9F7F2] px-4 py-2 rounded-xl border border-[#E3DACD]/50 w-56 focus-within:border-[#C06842] group transition-all">
                            <Search size={14} className="text-[#8C7B70] group-focus-within:text-[#C06842]" />
                            <input 
                                type="text" 
                                placeholder="Strategic search..." 
                                className="bg-transparent border-none outline-none text-[11px] font-bold w-full ml-3 placeholder:text-[#8C7B70]/60" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        // Update URL query param to trigger search in sub-pages
                                        const url = new URL(window.location.href);
                                        url.searchParams.set('search', searchQuery);
                                        window.history.pushState({}, '', url.toString());
                                        // Dispatch a custom event for components that don't listen to URL
                                        window.dispatchEvent(new CustomEvent('planora_search', { detail: searchQuery }));
                                    }
                                }}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => navigate('/dashboard/notifications')} className="p-2.5 relative rounded-xl bg-[#F9F7F2] hover:bg-white text-[#8C7B70] hover:text-[#C06842] border border-[#E3DACD]/20 transition-all shadow-sm group">
                                <Bell size={18} className="group-hover:rotate-12 transition-transform" />
                                <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-[#C06842] rounded-full ring-2 ring-white animate-pulse" />
                            </button>
                            <button onClick={() => navigate('/dashboard/settings')} className="flex items-center gap-3 p-1 bg-[#F9F7F2] rounded-xl border border-[#E3DACD]/20 hover:shadow-lg transition-all group pr-4">
                                <div className="w-8 h-8 rounded-lg bg-[#2A1F1D] flex items-center justify-center text-white text-[10px] font-black shadow-lg">
                                    {currentUser.name?.[0]}
                                </div>
                                <span className="hidden lg:block text-[9px] font-black uppercase tracking-widest text-[#2A1F1D] group-hover:text-[#C06842]">My Profile</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Primary Content Scrollable Area */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar bg-[#FDFCF8] relative selection:bg-[#C06842]/20">
                    <div className="p-4 lg:p-10 min-h-full">
                        <Outlet />
                    </div>
                    {/* Background Subtle Aesthetics */}
                    <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 bg-[#FDFCF8]">
                        <div className="absolute top-0 right-0 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#C06842 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
