import React from 'react';
import { Clock, Shield, LogOut, Mail } from 'lucide-react';

const PendingApproval = () => {
    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6 font-sans text-[#2A1F1D]">
            <div className="max-w-2xl w-full text-center space-y-8 animate-fade-in">
                {/* Icon Section */}
                <div className="relative inline-block">
                    <div className="w-24 h-24 bg-[#F9F7F2] rounded-[2rem] border-2 border-[#E3DACD] flex items-center justify-center text-[#C06842] shadow-xl shadow-orange-900/5 relative z-10">
                        <Clock size={48} strokeWidth={1.5} className="animate-pulse" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-[#2A1F1D] rounded-xl flex items-center justify-center text-white shadow-lg z-20">
                        <Shield size={20} />
                    </div>
                </div>

                {/* Text Content */}
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-serif font-black tracking-tight text-[#2A1F1D]">
                        Verification <span className="text-[#C06842]">Pending</span>
                    </h1>
                    <p className="text-lg text-[#8C7B70] max-w-lg mx-auto leading-relaxed font-medium">
                        Your account is currently being reviewed by our administration team. 
                        We take security seriously to ensure the highest quality of professionals on Planora.
                    </p>
                </div>

                {/* Details Card */}
                <div className="bg-white rounded-[2.5rem] border border-[#E3DACD]/50 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] text-left space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 flex-shrink-0">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-[#2A1F1D]">Manual Document Review</h3>
                            <p className="text-sm text-[#8C7B70] mt-1">An administrator is reviewing your uploaded degree and resume to verify your professional credentials.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
                            <Mail size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-[#2A1F1D]">Email Notification</h3>
                            <p className="text-sm text-[#8C7B70] mt-1">You will receive an automated email as soon as your verification status is updated.</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button 
                        onClick={() => window.location.reload()}
                        className="w-full sm:w-auto px-8 py-4 bg-[#2A1F1D] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-gray-900/20 hover:-translate-y-1 transition-all active:scale-95"
                    >
                        Check Status Again
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="w-full sm:w-auto px-8 py-4 bg-white text-[#2A1F1D] border border-[#E3DACD] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all flex items-center justify-center gap-2"
                    >
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>

                <p className="text-xs text-[#B8AFA5] font-bold uppercase tracking-[0.2em] pt-8">
                    Powered by Planora System Intelligence
                </p>
            </div>
        </div>
    );
};

export default PendingApproval;
