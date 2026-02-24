import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Check, AlertCircle, FileText, MapPin, User, Briefcase, Phone } from 'lucide-react';

const Onboarding = ({ isOpen, onClose, user, onComplete }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const isLandOwner = user.role === 'land_owner';
    const totalSteps = isLandOwner ? 2 : 3;
    const [formData, setFormData] = useState({
        phone: '',
        address: '',
        bio: '',
        experience_years: '',
        specialization: '',
        portfolio_url: '',
    });
    const [resume, setResume] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setResume(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const finalData = new FormData();
        Object.keys(formData).forEach(key => finalData.append(key, formData[key]));
        if (resume) finalData.append('resume', resume);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/${user.user_id || user.id}/complete-profile`, {
                method: 'PUT',
                body: finalData
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to update profile');

            onComplete(data.user);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#2A1F1D]/80 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden relative"
            >
                <div className="absolute top-6 right-6 z-10">
                    <button onClick={onClose} className="p-2 hover:bg-[#F9F7F2] rounded-full transition-colors">
                        <X size={24} className="text-[#8C7B70]" />
                    </button>
                </div>

                <div className="flex h-full min-h-[500px]">
                    {/* Left Sidebar */}
                    <div className="w-1/3 bg-[#FDFCF8] border-r border-[#E3DACD] p-8 hidden md:flex flex-col">
                        <div className="mb-12">
                            <span className="text-[#A65D3B] font-bold text-xs uppercase tracking-widest">Onboarding</span>
                            <h2 className="text-2xl font-serif font-bold text-[#3E2B26] mt-2">Welcome!</h2>
                            <p className="text-[#8C7B70] text-sm mt-2">Let's finish setting up your account.</p>
                        </div>

                        <div className="space-y-6">
                            {[
                                { id: 1, label: 'Contact Info', icon: <Phone size={18} /> },
                                { id: 2, label: isLandOwner ? 'Project Details' : 'Professional Profile', icon: <Briefcase size={18} /> },
                                !isLandOwner && { id: 3, label: 'Resume & Work', icon: <FileText size={18} /> }
                            ].filter(Boolean).map(item => (
                                <div key={item.id} className={`flex items-center gap-4 transition-colors ${step === item.id ? 'text-[#3E2B26]' : 'text-[#8C7B70]/50'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all ${step === item.id ? 'bg-[#3E2B26] border-[#3E2B26] text-white' : 'border-[#E3DACD]'}`}>
                                        {item.icon}
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-wider">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Form Area */}
                    <div className="flex-1 p-8 md:p-12 overflow-y-auto max-h-[80vh]">
                        <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'TEXTAREA') e.preventDefault(); }} className="space-y-6">
                            {step === 1 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                    <h3 className="text-xl font-serif font-bold text-[#3E2B26]">Contact & Location</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-2">Phone Number</label>
                                            <input required name="phone" type="tel" value={formData.phone} onChange={handleChange} className="w-full bg-[#F9F7F2] border-2 border-transparent focus:border-[#A65D3B] p-4 rounded-2xl outline-none" placeholder="+91 00000 00000" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-2">Office/Site Address</label>
                                            <textarea required name="address" value={formData.address} onChange={handleChange} className="w-full bg-[#F9F7F2] border-2 border-transparent focus:border-[#A65D3B] p-4 rounded-2xl outline-none min-h-[100px]" placeholder="Enter full address for map visibility" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                    <h3 className="text-xl font-serif font-bold text-[#3E2B26]">{isLandOwner ? 'Project Details' : 'Professional Details'}</h3>
                                    <div className="space-y-4">
                                        {!isLandOwner && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-2">Years of Experience</label>
                                                    <input required name="experience_years" type="number" value={formData.experience_years} onChange={handleChange} className="w-full bg-[#F9F7F2] border-2 border-transparent focus:border-[#A65D3B] p-4 rounded-2xl outline-none" />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-2">Specialization</label>
                                                    <input name="specialization" type="text" value={formData.specialization} onChange={handleChange} className="w-full bg-[#F9F7F2] border-2 border-transparent focus:border-[#A65D3B] p-4 rounded-2xl outline-none" placeholder="e.g. Modern Architecture" />
                                                </div>
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-2">{isLandOwner ? 'Project Vision / Site Description' : 'Quick Bio'}</label>
                                            <textarea required name="bio" value={formData.bio} onChange={handleChange} className="w-full bg-[#F9F7F2] border-2 border-transparent focus:border-[#A65D3B] p-4 rounded-2xl outline-none min-h-[100px]" placeholder={isLandOwner ? "Describe your land and what you want to build..." : "Tell landowners about your expertise..."} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                    <h3 className="text-xl font-serif font-bold text-[#3E2B26]">Resume & Portfolio</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-2">Upload Resume (PDF)</label>
                                            <div className="relative border-2 border-dashed border-[#E3DACD] rounded-2xl p-8 text-center hover:border-[#A65D3B] transition-colors cursor-pointer" onClick={() => document.getElementById('resume-upload').click()}>
                                                <input id="resume-upload" type="file" className="hidden" onChange={handleFileChange} accept=".pdf" />
                                                <Upload className="mx-auto mb-2 text-[#8C7B70]" size={32} />
                                                <span className="text-xs font-bold text-[#8C7B70]">{resume ? resume.name : 'Click to select file'}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-2">Portfolio Link (URL)</label>
                                            <input name="portfolio_url" type="url" value={formData.portfolio_url} onChange={handleChange} className="w-full bg-[#F9F7F2] border-2 border-transparent focus:border-[#A65D3B] p-4 rounded-2xl outline-none" placeholder="https://..." />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-4 pt-8">
                                {step > 1 && (
                                    <button type="button" onClick={() => setStep(step - 1)} className="flex-1 py-4 border-2 border-[#E3DACD] text-[#8C7B70] rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                                        Back
                                    </button>
                                )}
                                {step < totalSteps ? (
                                    <button type="button" onClick={() => setStep(step + 1)} className="flex-[2] py-4 bg-[#3E2B26] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-[#3E2B26]/20">
                                        Continue
                                    </button>
                                ) : (
                                    <button type="submit" disabled={loading} className="flex-[2] py-4 bg-[#A65D3B] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-[#A65D3B]/20">
                                        {loading ? 'Submitting...' : 'Launch Profile'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Onboarding;
