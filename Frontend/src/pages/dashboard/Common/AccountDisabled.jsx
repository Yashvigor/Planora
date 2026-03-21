import React, { useState, useEffect } from 'react';
import { 
    ShieldAlert, Send, FilePlus, LogOut, 
    CheckCircle2, ChevronRight, HelpCircle, Activity 
} from 'lucide-react';
import { useMockApp } from '../../../hooks/useMockApp';
import { motion, AnimatePresence } from 'framer-motion';

export default function AccountDisabled() {
    const { currentUser, logout, socket } = useMockApp();
    const [appealText, setAppealText] = useState('');
    const [appealFile, setAppealFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [appealSent, setAppealSent] = useState(currentUser?.status?.toLowerCase() === 'pending');

    // Listen for real-time account status changes (e.g. if Admin enables while user is on this page)
    useEffect(() => {
        if (!socket || !currentUser) return;
        
        const handleStatusChange = (data) => {
            if (data.status === 'Approved' || data.status === 'Verified') {
                window.location.reload(); // Re-check routing
            }
        };

        socket.on('account_status_changed', handleStatusChange);
        return () => socket.off('account_status_changed', handleStatusChange);
    }, [socket, currentUser]);

    const [error, setError] = useState(null);

    const handleAppeal = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        
        const formData = new FormData();
        formData.append('message', appealText);
        if (appealFile) formData.append('appealDocument', appealFile);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/appeal`, {
                method: 'POST', // Use POST for multipart
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}`
                },
                body: formData
            });

            if (res.ok) {
                setAppealSent(true);
            } else {
                const err = await res.json();
                setError(err.error || 'The system was unable to process your appeal at this time. Please verify your connection.');
            }
        } catch (error) {
            console.error(error);
            setError('A structural communication error has occurred. Our team has been notified.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-4 lg:p-12 text-[#2A1F1D] font-sans overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#C06842]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white max-w-2xl w-full rounded-[2.5rem] shadow-[0_20px_60px_rgb(0,0,0,0.06)] border border-[#E3DACD]/40 overflow-hidden relative z-10"
            >
                {/* Visual Header */}
                <div className="h-2 bg-gradient-to-r from-red-500 via-orange-400 to-[#C06842]"></div>
                
                <div className="p-8 md:p-14">
                    <div className="flex flex-col items-center text-center mb-10">
                        <motion.div 
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ repeat: Infinity, duration: 4 }}
                            className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-red-100"
                        >
                            <ShieldAlert size={44} className="text-red-500" />
                        </motion.div>
                        
                        <h1 className="text-4xl font-serif font-black tracking-tight mb-3 text-[#2A1F1D]">Account Restricted</h1>
                        <p className="text-[#8C7B70] font-medium max-w-md">Your Planora workspace access has been temporarily suspended by our security administration team.</p>
                    </div>

                    {/* Reason Panel */}
                    <div className="bg-[#FFF8F7] border border-red-100 p-6 rounded-3xl mb-10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 text-red-100 group-hover:text-red-200 transition-colors">
                            <HelpCircle size={64} strokeWidth={1} />
                        </div>
                        <div className="relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400 mb-3 block">Primary Reason for Suspension</span>
                            <p className="text-[#2A1F1D] font-serif text-lg leading-relaxed italic">
                                "{currentUser?.rejection_reason || "Unusual account activity or verification non-compliance detected."}"
                            </p>
                            <p className="text-[11px] text-[#A65D4D] mt-3 flex items-center gap-2 font-bold">
                                <Activity size={12} /> Status: Administrative Hold
                            </p>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {!appealSent && currentUser?.status?.toLowerCase() !== 'pending' ? (
                            <motion.form 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onSubmit={handleAppeal} 
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-[0.1em] text-[#8C7B70] ml-1">Formal Statement</label>
                                    <textarea 
                                        value={appealText}
                                        onChange={(e) => setAppealText(e.target.value)}
                                        placeholder="Provide a detailed explanation or clarify the activities mentioned above..."
                                        className="w-full bg-[#FDFCF8] border-2 border-[#E3DACD]/50 p-5 text-sm rounded-2xl focus:ring-4 focus:ring-[#C06842]/10 focus:border-[#C06842] outline-none h-40 resize-none transition-all placeholder:text-[#B8AFA5]"
                                        required
                                    ></textarea>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-[0.1em] text-[#8C7B70] ml-1">Supporting Documentation (Optional)</label>
                                    <div className="relative group">
                                        <input 
                                            type="file" 
                                            id="appeal-file"
                                            onChange={(e) => setAppealFile(e.target.files[0])}
                                            className="hidden"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                        />
                                        <label 
                                            htmlFor="appeal-file"
                                            className={`flex items-center justify-between p-5 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
                                                appealFile ? 'border-[#C06842] bg-[#FDFCF8]' : 'border-[#E3DACD] hover:border-[#C06842]/50 hover:bg-[#FDFCF8]'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-xl ${appealFile ? 'bg-[#C06842] text-white' : 'bg-[#F9F7F2] text-[#8C7B70]'}`}>
                                                    <FilePlus size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-[#2A1F1D]">{appealFile ? appealFile.name : 'Choose file to upload'}</p>
                                                    <p className="text-[10px] text-[#B8AFA5]">{appealFile ? (appealFile.size / 1024 / 1024).toFixed(2) + ' MB' : 'Upload ID, Proof, or Clarifying docs'}</p>
                                                </div>
                                            </div>
                                            {!appealFile && <ChevronRight size={18} className="text-[#B8AFA5]" />}
                                        </label>
                                    </div>
                                </div>

                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="bg-red-50/50 p-4 rounded-xl border-l-4 border-red-500 text-red-700 text-xs font-bold"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="w-full py-5 bg-[#2A1F1D] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-[#2A1F1D]/20 hover:bg-[#3D322F] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0"
                                >
                                    {isSubmitting ? (
                                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                                    ) : (
                                        <><Send size={16} /> Submit Appeal to Administration</>
                                    )}
                                </button>
                            </motion.form>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-[#F0FDF4] text-[#166534] p-8 rounded-[2rem] border border-[#DCFCE7] text-center"
                            >
                                <div className="w-16 h-16 bg-[#22C55E] text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h3 className="text-xl font-serif font-black mb-2">Appeal Submitted</h3>
                                <p className="text-sm font-medium leading-relaxed opacity-80">
                                    Your request has been formally lodged with our administration. We will review your submission and the attached evidence. A decision will be communicated via your registered email address.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mt-12 pt-8 border-t border-[#E3DACD]/40 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3 text-[#B8AFA5]">
                            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Verification</span>
                        </div>
                        <button 
                            onClick={logout} 
                            className="flex items-center gap-2 text-[#8C7B70] hover:text-[#2A1F1D] font-bold text-xs uppercase tracking-widest transition-colors py-2 px-4 rounded-xl hover:bg-[#F9F7F2]"
                        >
                            <LogOut size={16} /> Sign Out
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
