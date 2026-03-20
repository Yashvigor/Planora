import React, { useState } from 'react';
import { X, MapPin, User, Save, Info, Home, Phone, FileText, CheckCircle2, Sparkles } from 'lucide-react';

const ProfilePromptModal = ({ currentUser, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        address: currentUser?.address || '',
        city: currentUser?.city || '',
        state: currentUser?.state || '',
        zip_code: currentUser?.zip_code || '',
        mobile_number: currentUser?.mobile_number || '',
        bio: currentUser?.bio || ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/${currentUser.user_id || currentUser.id}/sync-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const updatedUser = await res.json();
                onSave(updatedUser);
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to update profile');
            }
        } catch (err) {
            console.error('Error updating profile:', err);
            alert('Connection error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-[#1a1412]/80 backdrop-blur-md animate-in fade-in duration-500">
            <div className="bg-[#FDFCF8] rounded-[3rem] w-full max-w-2xl p-0 shadow-2xl border border-[#E3DACD] relative overflow-hidden flex flex-col md:flex-row min-h-[500px]">
                
                {/* Left Side: Brand/Welcome */}
                <div className="w-full md:w-5/12 bg-[#2A1F1D] p-10 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#C06842]/20 to-transparent pointer-events-none" />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#C06842]/10 rounded-full blur-3xl" />
                    
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-[#C06842] mb-6 backdrop-blur-sm border border-white/5">
                            <Sparkles size={24} />
                        </div>
                        <h2 className="text-3xl font-serif font-bold text-white leading-tight">Final Step to Your Dream Project</h2>
                        <p className="text-white/60 mt-4 text-sm leading-relaxed">
                            Complete your profile to unlock precise expert matching and seamless project coordination.
                        </p>
                    </div>

                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3 text-white/50 text-xs font-bold uppercase tracking-widest">
                            <CheckCircle2 size={16} className="text-[#C06842]" />
                            Live Discovery
                        </div>
                        <div className="flex items-center gap-3 text-white/50 text-xs font-bold uppercase tracking-widest">
                            <CheckCircle2 size={16} className="text-[#C06842]" />
                            Smart Estimates
                        </div>
                        <div className="flex items-center gap-3 text-white/50 text-xs font-bold uppercase tracking-widest">
                            <CheckCircle2 size={16} className="text-[#C06842]" />
                            Verified Experts
                        </div>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="w-full md:w-7/12 p-10 bg-white/50 overflow-y-auto max-h-[90vh]">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8C7B70] block mb-1">Onboarding</span>
                            <h3 className="text-xl font-bold text-[#2A1F1D]">Initialize Workspace</h3>
                        </div>
                        <button onClick={onCancel} className="p-2 hover:bg-red-50 text-[#8C7B70] hover:text-red-500 rounded-full transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#8C7B70] mb-2">
                                    <Home size={14} className="text-[#C06842]" /> Location Details
                                </label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Street Address, Landmark..."
                                    className="w-full bg-[#FDFCF8] border border-[#E3DACD] rounded-2xl px-5 py-3.5 text-sm focus:border-[#C06842] focus:ring-4 focus:ring-[#C06842]/5 outline-none transition-all shadow-sm"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <input
                                        required
                                        type="text"
                                        placeholder="City"
                                        className="w-full bg-[#FDFCF8] border border-[#E3DACD] rounded-2xl px-5 py-3.5 text-sm focus:border-[#C06842] focus:ring-4 focus:ring-[#C06842]/5 outline-none transition-all shadow-sm"
                                        value={formData.city}
                                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <input
                                        required
                                        type="text"
                                        placeholder="State"
                                        className="w-full bg-[#FDFCF8] border border-[#E3DACD] rounded-2xl px-5 py-3.5 text-sm focus:border-[#C06842] focus:ring-4 focus:ring-[#C06842]/5 outline-none transition-all shadow-sm"
                                        value={formData.state}
                                        onChange={e => setFormData({ ...formData, state: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Zip Code"
                                        className="w-full bg-[#FDFCF8] border border-[#E3DACD] rounded-2xl px-5 py-3.5 text-sm focus:border-[#C06842] focus:ring-4 focus:ring-[#C06842]/5 outline-none transition-all shadow-sm"
                                        value={formData.zip_code}
                                        onChange={e => setFormData({ ...formData, zip_code: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <div className="relative">
                                        <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C06842]" />
                                        <input
                                            required
                                            type="text"
                                            placeholder="Phone Number"
                                            className="w-full bg-[#FDFCF8] border border-[#E3DACD] rounded-2xl pl-10 pr-5 py-3.5 text-sm focus:border-[#C06842] focus:ring-4 focus:ring-[#C06842]/5 outline-none transition-all shadow-sm"
                                            value={formData.mobile_number}
                                            onChange={e => setFormData({ ...formData, mobile_number: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#8C7B70] mb-2">
                                    <FileText size={14} className="text-[#C06842]" /> Bio / Headline
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Tell us about your project goals..."
                                    className="w-full bg-[#FDFCF8] border border-[#E3DACD] rounded-2xl px-5 py-3.5 text-sm focus:border-[#C06842] focus:ring-4 focus:ring-[#C06842]/5 outline-none transition-all shadow-sm resize-none"
                                    value={formData.bio}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4 border-t border-[#E3DACD]/50">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="flex-1 py-4 text-[#8C7B70] font-black uppercase tracking-widest text-[10px] hover:text-[#2A1F1D] transition-colors"
                            >
                                Skip
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-[2] py-4 bg-[#2A1F1D] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-[#2A1F1D]/10 hover:bg-[#C06842] hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Save size={16} />
                                {loading ? 'Syncing...' : 'Initialize Profile'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfilePromptModal;

