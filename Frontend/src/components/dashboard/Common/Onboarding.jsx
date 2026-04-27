import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Check, AlertCircle, FileText, MapPin, User, Briefcase, Phone, Award, ShieldCheck } from 'lucide-react';

const Onboarding = ({ isOpen, onClose, user, onComplete }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');
    const isExempt = ['land_owner', 'admin', 'contractor'].includes(user.role);
    const totalSteps = isExempt ? 1 : 3;
    const [formData, setFormData] = useState({
        phone: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        birthdate: '',
        bio: '',
        experience_years: '',
        specialization: '',
        portfolio_url: '',
    });
    const [resume, setResume] = useState(null);
    const [degree, setDegree] = useState(null);
    const [aadhar, setAadhar] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e, type) => {
        if (type === 'resume') setResume(e.target.files[0]);
        if (type === 'degree') setDegree(e.target.files[0]);
        if (type === 'aadhar') setAadhar(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation for Professionals (Step 3)
        if (!isExempt) {
            if (!resume || !degree || !formData.portfolio_url) {
                setError('Resume, Degree, and Portfolio Link are mandatory for professional verification.');
                return;
            }
        }

        setLoading(true);
        setError('');

        const finalData = new FormData();
        Object.keys(formData).forEach(key => finalData.append(key, formData[key]));
        if (resume) finalData.append('resume', resume);
        if (degree) finalData.append('degree', degree);
        if (aadhar) finalData.append('aadhar_card', aadhar);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/${user.user_id || user.id}/complete-profile`, {
                method: 'PUT',
                body: finalData
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to update profile');

            if (isExempt) {
                onComplete(data.user);
                onClose();
            } else {
                setIsSubmitted(true);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    if (isSubmitted) {
        return (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#2A1F1D]/80 backdrop-blur-md">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-12 text-center">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                        <ShieldCheck size={48} />
                    </div>
                    <h2 className="text-3xl font-serif font-bold text-[#3E2B26] mb-4">Verification Pending</h2>
                    <p className="text-[#8C7B70] leading-relaxed mb-8">
                        Thank you for submitting your credentials. Our admin team will review your Resume and Degree within 24-48 hours.
                        You'll receive full access once verified.
                    </p>
                    <button
                        onClick={() => {
                            // Don't auto-login pending users into the dashboard
                            onClose();
                            window.location.reload(); // Refresh to enforce logged-out state or show the Auth portal error
                        }}
                        className="w-full py-4 bg-[#3E2B26] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                    >
                        Understood
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#2A1F1D]/80 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[2.5rem] w-full max-w-3xl shadow-2xl overflow-hidden relative"
            >
                <div className="absolute top-6 right-6 z-10">
                    <button onClick={onClose} className="p-2 hover:bg-[#F9F7F2] rounded-full transition-colors">
                        <X size={24} className="text-[#8C7B70]" />
                    </button>
                </div>

                <div className="flex h-full min-h-[550px]">
                    {/* Left Sidebar */}
                    <div className="w-1/3 bg-[#FDFCF8] border-r border-[#E3DACD] p-8 hidden md:flex flex-col">
                        <div className="mb-12">
                            <span className="text-[#A65D3B] font-bold text-xs uppercase tracking-widest">Onboarding</span>
                            <h2 className="text-2xl font-serif font-bold text-[#3E2B26] mt-2">Welcome!</h2>
                            <p className="text-[#8C7B70] text-sm mt-2">Let's verify your expertise.</p>
                        </div>

                        <div className="space-y-6">
                            {[
                                { id: 1, label: 'Contact Info', icon: <Phone size={18} /> },
                                !isExempt && { id: 2, label: 'Professional Profile', icon: <Briefcase size={18} /> },
                                !isExempt && { id: 3, label: 'Credentials', icon: <Award size={18} /> }
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
                    <div className="flex-1 p-8 md:p-12 overflow-y-auto max-h-[85vh]">
                        {user.status === 'Rejected' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-8 p-6 bg-red-50 border border-red-100 rounded-[2rem] flex items-start gap-4"
                            >
                                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shrink-0">
                                    <AlertCircle size={24} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-red-800 uppercase tracking-wider mb-1">Previous Application Rejected</h4>
                                    <p className="text-xs text-red-700 leading-relaxed font-medium">
                                        Reason: {user.rejection_reason || "No specific reason provided. Please ensure all documents are clear and valid."}
                                    </p>
                                    <div className="mt-2 text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-100/50 px-2 py-0.5 rounded-full inline-block">
                                        Action Required: Resubmit Documents
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'TEXTAREA') e.preventDefault(); }} className="space-y-6">
                            {step === 1 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                    <h3 className="text-xl font-serif font-bold text-[#3E2B26]">Contact & Location</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-2">Phone Number</label>
                                            <input required name="phone" type="tel" value={formData.phone} onChange={handleChange} className="w-full bg-[#F9F7F2] border-2 border-transparent focus:border-[#A65D3B] p-4 rounded-2xl outline-none" placeholder="+91 00000 00000" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-2">Birth Date</label>
                                            <input required name="birthdate" type="date" value={formData.birthdate} onChange={handleChange} className="w-full bg-[#F9F7F2] border-2 border-transparent focus:border-[#A65D3B] p-4 rounded-2xl outline-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-2">Office/Site Address</label>
                                        <textarea required name="address" value={formData.address} onChange={handleChange} className="w-full bg-[#F9F7F2] border-2 border-transparent focus:border-[#A65D3B] p-4 rounded-2xl outline-none min-h-[80px]" placeholder="Enter full address for map visibility" />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-2">City</label>
                                            <input required name="city" type="text" value={formData.city} onChange={handleChange} className="w-full bg-[#F9F7F2] border-2 border-transparent focus:border-[#A65D3B] p-4 rounded-2xl outline-none" placeholder="City" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-2">State</label>
                                            <input required name="state" type="text" value={formData.state} onChange={handleChange} className="w-full bg-[#F9F7F2] border-2 border-transparent focus:border-[#A65D3B] p-4 rounded-2xl outline-none" placeholder="State" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-2">Zip Code</label>
                                            <input required name="zip_code" type="text" value={formData.zip_code} onChange={handleChange} className="w-full bg-[#F9F7F2] border-2 border-transparent focus:border-[#A65D3B] p-4 rounded-2xl outline-none" placeholder="Zip" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-2">Identity Proof (Aadhar Card)</label>
                                        <div className="relative border-2 border-dashed border-[#E3DACD] rounded-2xl p-4 text-center hover:border-[#A65D3B] transition-colors cursor-pointer" onClick={() => document.getElementById('aadhar-upload').click()}>
                                            <input id="aadhar-upload" type="file" className="hidden" onChange={(e) => handleFileChange(e, 'aadhar')} accept=".pdf,image/*" />
                                            <div className="flex items-center justify-center gap-4">
                                                <ShieldCheck className="text-[#8C7B70]" size={20} />
                                                <span className="text-[10px] font-bold text-[#8C7B70] line-clamp-1">{aadhar ? aadhar.name : 'Click to Upload Aadhar Card (PDF/JPG)'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                    <h3 className="text-xl font-serif font-bold text-[#3E2B26]">{isExempt ? 'Profile Details' : 'Professional Details'}</h3>
                                    <div className="space-y-4">
                                        {!isExempt && (
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
                                            <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-2">{isExempt ? 'Bio / Description' : 'Quick Bio'}</label>
                                            <textarea required name="bio" value={formData.bio} onChange={handleChange} className="w-full bg-[#F9F7F2] border-2 border-transparent focus:border-[#A65D3B] p-4 rounded-2xl outline-none min-h-[100px]" placeholder={isExempt ? "Tell us about yourself..." : "Tell landowners about your expertise..."} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                    <h3 className="text-xl font-serif font-bold text-[#3E2B26]">Professional Credentials</h3>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-2">Resume (PDF)</label>
                                                <div className="relative border-2 border-dashed border-[#E3DACD] rounded-2xl p-6 text-center hover:border-[#A65D3B] transition-colors cursor-pointer" onClick={() => document.getElementById('resume-upload').click()}>
                                                    <input id="resume-upload" type="file" className="hidden" onChange={(e) => handleFileChange(e, 'resume')} accept=".pdf" />
                                                    <FileText className="mx-auto mb-2 text-[#8C7B70]" size={24} />
                                                    <span className="text-[10px] font-bold text-[#8C7B70] line-clamp-1">{resume ? resume.name : 'Upload PDF'}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-2">Degree/Certification (PDF/Img)</label>
                                                <div className="relative border-2 border-dashed border-[#E3DACD] rounded-2xl p-6 text-center hover:border-[#A65D3B] transition-colors cursor-pointer" onClick={() => document.getElementById('degree-upload').click()}>
                                                    <input id="degree-upload" type="file" className="hidden" onChange={(e) => handleFileChange(e, 'degree')} accept=".pdf,image/*" />
                                                    <Award className="mx-auto mb-2 text-[#8C7B70]" size={24} />
                                                    <span className="text-[10px] font-bold text-[#8C7B70] line-clamp-1">{degree ? degree.name : 'Upload Credentials'}</span>
                                                </div>
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
                                        {loading ? 'Processing...' : (isExempt ? 'Complete Profile' : (user.status === 'Rejected' ? 'Resubmit for Verification' : 'Submit for Verification'))}
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

