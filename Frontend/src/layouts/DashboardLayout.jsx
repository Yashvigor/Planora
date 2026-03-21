import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useMockApp } from '../hooks/useMockApp';
import { useToast } from '../context/ToastContext';
import { Menu, Bell, ShieldCheck, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Layout/Sidebar';
import { motion } from 'framer-motion';
import Onboarding from '../components/dashboard/Common/Onboarding';
import AccountDisabled from '../pages/dashboard/Common/AccountDisabled';

const DashboardLayout = () => {
    const { currentUser } = useMockApp();
    const navigate = useNavigate();
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isOnboardingOpen, setOnboardingOpen] = useState(false);

    // Live Location Update
    useEffect(() => {
        const updateLocation = async () => {
            if (!currentUser || !navigator.geolocation) return;

            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                const uid = currentUser.user_id || currentUser.id;

                try {
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${uid}/profile`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ latitude, longitude })
                    });
                    if (!response.ok) {
                        const errorData = await response.json();
                        console.error('[Dashboard] Location update failed:', errorData);
                    }
                } catch (err) {
                    console.error('[Dashboard] Failed to update live location:', err);
                }
            }, (err) => {
                console.warn('[Dashboard] Location access denied:', err.message);
            }, { enableHighAccuracy: true });
        };

        updateLocation();
    }, [currentUser]);

    if (!currentUser) return null;

    // 🔒 Gating Logic: Professionals must be 'Approved' to access the dashboard.
    // Exceptions: Land Owners and Admins are approved by default.
    // Normalize role for consistent status enforcement across the suite
    const cat = (currentUser?.category || '').toLowerCase();
    const subCat = (currentUser?.sub_category || '').toLowerCase();
    const rawRole = currentUser?.role ? currentUser.role.toLowerCase().replace(/ /g, '_') : '';
    const effectiveRole = rawRole || (subCat ? subCat.replace(/ /g, '_') : (cat ? cat.replace(/ /g, '_') : ''));

    const isAdmin = effectiveRole === 'admin';
    const isLandOwner = effectiveRole === 'land_owner';
    const isContractor = effectiveRole === 'contractor';
    
    const status = (currentUser.status || '').toLowerCase();
    const isPending = status === 'pending';
    const isRejected = status === 'rejected';
    const isDisabled = status === 'disabled';
    const isExempt = isAdmin || isLandOwner || isContractor;
    const isAppealing = currentUser.appeal_reason || currentUser.rejection_reason?.startsWith('[APPEAL SUBMITTED]');

    // 🔒 RESTRICTION GATE: 
    // ONLY block established accounts if they are explicitly 'Disabled', 
    // or if they have an active appeal pending review.
    if (isDisabled || (isAppealing && isExempt)) {
        return <AccountDisabled />;
    }

    // 🛡️ VERIFICATION GATE:
    // Block new professionals (non-exempt) who are Pending or Rejected.
    if ((isPending || isRejected) && !isExempt) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#FDFCF8] p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="max-w-xl w-full text-center space-y-10"
                >
                    <div className="relative mx-auto w-24 h-24">
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 3 }}
                            className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl ${isPending ? 'bg-[#3E2B26] text-white' : 'bg-red-50 text-red-600'}`}
                        >
                            {isPending ? <ShieldCheck size={48} /> : <AlertCircle size={48} />}
                        </motion.div>
                        {isPending && (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                                className="absolute -top-2 -right-2 w-8 h-8 bg-[#A65D3B] rounded-full border-4 border-white flex items-center justify-center"
                            >
                                <div className="w-1 h-3 bg-white/50 rounded-full animate-pulse" />
                            </motion.div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl font-serif font-bold text-[#3E2B26] tracking-tight">
                            {isPending ? 'Verification in Progress' : 'Verification Rejected'}
                        </h1>
                        <div className="h-1 w-20 bg-[#A65D3B]/20 mx-auto rounded-full" />
                        <p className="text-lg text-[#8C7B70] leading-relaxed max-w-md mx-auto">
                            {isPending
                                ? "Our admin team is currently reviewing your professional credentials. You'll gain full access to the dashboard as soon as your expertise is verified."
                                : `Your professional verification was not successful. Review the feedback below and update your documents.`
                            }
                        </p>
                    </div>

                    {isRejected && (
                        <div className="bg-red-50/50 border border-red-100 p-6 rounded-[2rem] text-left">
                            <span className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-2 block">Admin Feedback</span>
                            <p className="text-sm text-red-700 font-medium italic">
                                "{currentUser.rejection_reason || 'Documents were unclear or insufficient. Please ensure your Degree and Resume are high-quality PDF/Images.'}"
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => setOnboardingOpen(true)}
                            className="w-full py-5 bg-[#3E2B26] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#3E2B26]/20 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            {isPending ? 'Check Status Again' : 'Update & Re-submit'}
                        </button>

                        {isOnboardingOpen && (
                            <Onboarding 
                                isOpen={isOnboardingOpen} 
                                onClose={() => setOnboardingOpen(false)} 
                                user={currentUser}
                                onComplete={() => window.location.reload()}
                            />
                        )}

                        <button
                            onClick={() => navigate('/')}
                            className="py-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#8C7B70]/60 hover:text-[#3E2B26] transition-colors"
                        >
                            Back to Home
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-enola-beige/20 overflow-hidden relative font-sans text-enola-dark-brown">

            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-20 bg-enola-cream/80 backdrop-blur-sm shadow-sm flex items-center justify-between px-8 z-10 border-b border-enola-sand/20">
                    <button
                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                        className="p-2 rounded-xl hover:bg-enola-brown/10 text-enola-brown transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <div className="flex items-center space-x-6">
                        <div className="hidden md:block">
                            <h2 className="font-serif font-bold text-xl text-enola-dark-brown/80">
                                Welcome back, {currentUser.name.split(' ')[0]}
                            </h2>
                        </div>
                        <button className="p-2 relative rounded-full hover:bg-enola-brown/10 text-enola-taupe transition-colors">
                            <Bell className="w-6 h-6" />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-enola-beige/30 p-4 lg:p-8 custom-scrollbar">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;

