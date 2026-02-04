import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Save, Shield, FileText, AlertCircle, Eye, EyeOff, Upload, Check, Pencil } from 'lucide-react';
import { useMockApp } from '../../../hooks/useMockApp';

// In Settings.jsx start
const Settings = () => {
    const { currentUser, updateProfile, updatePassword } = useMockApp();
    const [activeTab, setActiveTab] = useState('profile');
    const [isEditing, setIsEditing] = useState(false);

    // Profile State
    const [profileData, setProfileData] = useState({
        birthdate: '',
        aadhar: null,
        profilePic: null,
        name: currentUser?.name || 'User Name',
        email: currentUser?.email || 'user@example.com',
        phone: '+1 (555) 123-4567',
        location: 'New York, USA',
        bio: 'Construction enthusiast and project manager.'
    });

    // Password State
    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
    const [passwordMessage, setPasswordMessage] = useState(null);

    // Mock Documents State
    const [documents] = useState([
        { id: 1, name: 'Verified ID Card', type: 'Identity Proof', date: '2023-10-15', status: 'Verified' },
        { id: 2, name: 'Construction License', type: 'Professional License', date: '2023-11-20', status: 'Pending' },
        { id: 3, name: 'Insurance Policy', type: 'Insurance', date: '2024-01-05', status: 'Verified' },
        { id: 4, name: 'Safety Certificate', type: 'Certification', date: '2024-02-10', status: 'Expired' },
    ]);

    const handleProfileSave = (e) => {
        e.preventDefault();
        try {
            updateProfile({
                birthdate: profileData.birthdate,
                aadhar: profileData.aadhar,
                profilePic: profileData.profilePic,
                name: profileData.name,
                email: profileData.email,
                phone: profileData.phone, // Assuming we add this to user object if needed, or just keep it in local state for now if not in schema
                location: profileData.location,
                bio: profileData.bio
            });
            alert('Profile updated successfully!');
        } catch (error) {
            console.error("Profile Update Failed", error);
            alert("Failed to update profile.");
        }
    };

    const handlePasswordChange = (e) => {
        e.preventDefault();
        if (passwordData.new !== passwordData.confirm) {
            setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
            return;
        }
        if (passwordData.new.length < 6) {
            setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
            return;
        }

        try {
            updatePassword(passwordData.current, passwordData.new);
            setPasswordMessage({ type: 'success', text: 'Password changed successfully.' });
            setPasswordData({ current: '', new: '', confirm: '' });
        } catch (error) {
            setPasswordMessage({ type: 'error', text: error.message });
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in p-4 md:p-8">
            <h1 className="text-4xl font-serif font-bold text-[#2A1F1D]">Account Settings</h1>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-72 flex-shrink-0">
                    <div className="glass-card rounded-[2rem] border border-[#E3DACD] overflow-hidden shadow-lg bg-white/80 backdrop-blur-md">
                        <div className="p-6 border-b border-[#E3DACD]/50 bg-gradient-to-br from-[#FDFCF8] to-[#F9F7F2]">
                            <h3 className="text-lg font-serif font-bold text-[#2A1F1D]">Settings Menu</h3>
                            <p className="text-xs text-[#8C7B70] mt-1">Manage your account preferences</p>
                        </div>
                        <div className="p-3 space-y-2">
                            {[
                                { id: 'profile', label: 'My Profile', icon: User, desc: 'Personal details & bio' },
                                { id: 'security', label: 'Security', icon: Shield, desc: 'Password & privacy' },
                                { id: 'documents', label: 'My Documents', icon: FileText, desc: 'Uploads & approvals' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center space-x-4 px-4 py-4 rounded-xl transition-all duration-300 text-left group ${activeTab === tab.id
                                        ? 'bg-[#2A1F1D] text-white shadow-lg shadow-[#2A1F1D]/20 transform scale-[1.02]'
                                        : 'text-[#5D4037] hover:bg-[#E3DACD]/30'
                                        }`}
                                >
                                    <div className={`p-2.5 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-white/10 text-white' : 'bg-[#E3DACD]/40 text-[#5D4037] group-hover:bg-[#E3DACD]/60'}`}>
                                        <tab.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="block font-bold text-sm leading-tight">{tab.label}</span>
                                        <span className={`text-[10px] uppercase tracking-wider font-bold mt-0.5 block ${activeTab === tab.id ? 'text-white/60' : 'text-[#8C7B70]'}`}>{tab.desc}</span>
                                    </div>
                                    {activeTab === tab.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C06842] shadow-[0_0_8px_rgba(192,104,66,1)]"></div>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    {activeTab === 'profile' && (
                        <div className="glass-card rounded-[2.5rem] shadow-xl border border-[#E3DACD]/80 p-8 md:p-12 relative overflow-hidden bg-white/70 backdrop-blur-xl">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#C06842]/10 via-[#F9F7F2] to-transparent rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                            <div className="flex justify-between items-center mb-8 relative z-10">
                                <h2 className="text-2xl font-bold font-serif text-[#2A1F1D] flex items-center">
                                    <User className="w-6 h-6 mr-3 text-[#C06842]" />
                                    Personal Information
                                </h2>
                                {!isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center space-x-2 bg-[#F9F7F2] hover:bg-[#E3DACD] text-[#5D4037] px-5 py-2.5 rounded-xl font-bold transition-all border border-[#E3DACD]"
                                    >
                                        <Pencil className="w-4 h-4" />
                                        <span>Edit Details</span>
                                    </button>
                                )}
                            </div>
                            <form onSubmit={handleProfileSave} className="space-y-6 relative z-10">
                                {/* Profile Picture Upload */}
                                <div className="flex items-center space-x-6 mb-6">
                                    <div className={`relative w-24 h-24 rounded-full bg-[#F9F7F2] border-2 border-[#E3DACD] flex items-center justify-center overflow-hidden group ${isEditing ? 'cursor-pointer' : ''}`}>
                                        {profileData.profilePic ? (
                                            <img src={URL.createObjectURL(profileData.profilePic)} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-10 h-10 text-[#B8AFA5]" />
                                        )}
                                        {isEditing && (
                                            <>
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Upload className="w-6 h-6 text-white" />
                                                </div>
                                                <input
                                                    type="file"
                                                    onChange={(e) => setProfileData({ ...profileData, profilePic: e.target.files[0] })}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#2A1F1D]">Profile Picture</h3>
                                        <p className="text-xs text-[#8C7B70] mt-1">PNG, JPG up to 5MB</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[#8C7B70] uppercase tracking-wider">Full Name</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={profileData.name}
                                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                                disabled={!isEditing}
                                                className={`w-full pl-12 pr-4 py-3.5 border rounded-xl outline-none transition-all text-[#2A1F1D] font-bold shadow-sm placeholder:text-[#B8AFA5]/80 placeholder:font-medium ${isEditing
                                                    ? 'bg-[#FDFCF8] border-[#E3DACD] focus:ring-4 focus:ring-[#C06842]/10 focus:border-[#C06842]'
                                                    : 'bg-[#F9F7F2] border-transparent text-[#8C7B70] cursor-not-allowed'}`}
                                            />
                                            <User className="w-5 h-5 text-[#8C7B70] absolute left-4 top-3.5" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[#8C7B70] uppercase tracking-wider">Email Address</label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                value={profileData.email}
                                                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                                disabled={!isEditing}
                                                className={`w-full pl-12 pr-4 py-3.5 border rounded-xl outline-none transition-all text-[#2A1F1D] font-bold shadow-sm placeholder:text-[#B8AFA5]/80 placeholder:font-medium ${isEditing
                                                    ? 'bg-[#FDFCF8] border-[#E3DACD] focus:ring-4 focus:ring-[#C06842]/10 focus:border-[#C06842]'
                                                    : 'bg-[#F9F7F2] border-transparent text-[#8C7B70] cursor-not-allowed'}`}
                                            />
                                            <Mail className="w-5 h-5 text-[#8C7B70] absolute left-4 top-3.5" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[#8C7B70] uppercase tracking-wider">Phone Number</label>
                                        <div className="relative">
                                            <input
                                                type="tel"
                                                value={profileData.phone}
                                                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                                disabled={!isEditing}
                                                className={`w-full pl-12 pr-4 py-3.5 border rounded-xl outline-none transition-all text-[#2A1F1D] font-bold shadow-sm placeholder:text-[#B8AFA5]/80 placeholder:font-medium ${isEditing
                                                    ? 'bg-[#FDFCF8] border-[#E3DACD] focus:ring-4 focus:ring-[#C06842]/10 focus:border-[#C06842]'
                                                    : 'bg-[#F9F7F2] border-transparent text-[#8C7B70] cursor-not-allowed'}`}
                                            />
                                            <Phone className="w-5 h-5 text-[#8C7B70] absolute left-4 top-3.5" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[#8C7B70] uppercase tracking-wider">Location</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={profileData.location}
                                                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                                                disabled={!isEditing}
                                                className={`w-full pl-12 pr-4 py-3.5 border rounded-xl outline-none transition-all text-[#2A1F1D] font-bold shadow-sm placeholder:text-[#B8AFA5]/80 placeholder:font-medium ${isEditing
                                                    ? 'bg-[#FDFCF8] border-[#E3DACD] focus:ring-4 focus:ring-[#C06842]/10 focus:border-[#C06842]'
                                                    : 'bg-[#F9F7F2] border-transparent text-[#8C7B70] cursor-not-allowed'}`}
                                            />
                                            <MapPin className="w-5 h-5 text-[#8C7B70] absolute left-4 top-3.5" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[#8C7B70] uppercase tracking-wider">Birthdate</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={profileData.birthdate}
                                                onChange={(e) => setProfileData({ ...profileData, birthdate: e.target.value })}
                                                disabled={!isEditing}
                                                className={`w-full pl-12 pr-4 py-3.5 border rounded-xl outline-none transition-all text-[#2A1F1D] font-bold shadow-sm placeholder:text-[#B8AFA5]/80 placeholder:font-medium ${isEditing
                                                    ? 'bg-[#FDFCF8] border-[#E3DACD] focus:ring-4 focus:ring-[#C06842]/10 focus:border-[#C06842]'
                                                    : 'bg-[#F9F7F2] border-transparent text-[#8C7B70] cursor-not-allowed'}`}
                                            />
                                            <User className="w-5 h-5 text-[#8C7B70] absolute left-4 top-3.5" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[#8C7B70] uppercase tracking-wider">Aadhar Card Proof</label>
                                        <div className="relative">
                                            <label className="w-full flex items-center justify-between px-4 py-3 bg-white border border-[#E3DACD] border-dashed rounded-xl cursor-pointer hover:bg-[#F9F7F2] transition-colors">
                                                <span className="text-sm font-medium text-[#8C7B70]">
                                                    {profileData.aadhar ? profileData.aadhar.name : 'Upload Document'}
                                                </span>
                                                <Upload className="w-4 h-4 text-[#C06842]" />
                                                <input
                                                    disabled={!isEditing}
                                                    className="hidden"
                                                    onChange={(e) => setProfileData({ ...profileData, aadhar: e.target.files[0] })}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[#8C7B70] uppercase tracking-wider">Bio</label>
                                    <textarea
                                        rows="4"
                                        value={profileData.bio}
                                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                        disabled={!isEditing}
                                        className={`w-full p-4 border rounded-xl outline-none transition-all resize-none text-[#2A1F1D] font-medium placeholder:text-[#B8AFA5] ${isEditing
                                            ? 'bg-white border-[#E3DACD] focus:ring-2 focus:ring-[#C06842]/20 focus:border-[#C06842]'
                                            : 'bg-[#F9F7F2] border-transparent text-[#8C7B70] cursor-not-allowed'}`}
                                    ></textarea>
                                </div>
                                {isEditing && (
                                    <div className="flex justify-end pt-6 border-t border-[#E3DACD]/50 space-x-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(false)}
                                            className="px-6 py-3 rounded-xl font-bold text-[#8C7B70] hover:bg-[#F9F7F2] border border-transparent hover:border-[#E3DACD] transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button type="submit" className="flex items-center space-x-2 bg-[#2A1F1D] hover:bg-[#C06842] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#2A1F1D]/20 hover:shadow-[#C06842]/30 active:scale-95 transition-all">
                                            <Save className="w-5 h-5" />
                                            <span>Save Changes</span>
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="glass-card rounded-[2.5rem] shadow-sm border border-[#E3DACD]/50 p-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C06842]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                            <h2 className="text-2xl font-bold font-serif text-[#2A1F1D] mb-8 flex items-center relative z-10">
                                <Shield className="w-6 h-6 mr-3 text-[#C06842]" />
                                Password & Security
                            </h2>
                            <form onSubmit={handlePasswordChange} className="max-w-md space-y-6 relative z-10">
                                {passwordMessage && (
                                    <div className={`p-4 rounded-xl flex items-center shadow-sm ${passwordMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                                        {passwordMessage.type === 'error' ? <AlertCircle className="w-5 h-5 mr-3" /> : <Check className="w-5 h-5 mr-3" />}
                                        <p className="text-sm font-bold">{passwordMessage.text}</p>
                                    </div>
                                )}

                                {['current', 'new', 'confirm'].map((field) => (
                                    <div key={field} className="space-y-2">
                                        <label className="text-xs font-bold text-[#8C7B70] uppercase tracking-wider capitalize">
                                            {field === 'new' ? 'New Password' : field === 'confirm' ? 'Confirm New Password' : 'Current Password'}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword[field] ? "text" : "password"}
                                                value={passwordData[field]}
                                                onChange={(e) => setPasswordData({ ...passwordData, [field]: e.target.value })}
                                                className="w-full pl-5 pr-10 py-3 bg-white border border-[#E3DACD] rounded-xl focus:ring-2 focus:ring-[#C06842]/20 focus:border-[#C06842] outline-none transition-all text-[#2A1F1D] font-medium placeholder:text-[#B8AFA5]"
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility(field)}
                                                className="absolute right-3 top-3 text-[#B8AFA5] hover:text-[#5D4037]"
                                            >
                                                {showPassword[field] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <div className="pt-6 border-t border-[#E3DACD]/50">
                                    <button type="submit" className="flex items-center space-x-2 bg-[#2A1F1D] hover:bg-[#C06842] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#2A1F1D]/20 hover:shadow-[#C06842]/30 active:scale-95 transition-all">
                                        <Save className="w-5 h-5" />
                                        <span>Update Password</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'documents' && (
                        <div className="glass-card rounded-[2.5rem] shadow-sm border border-[#E3DACD]/50 p-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C06842]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <h2 className="text-2xl font-bold font-serif text-[#2A1F1D] flex items-center">
                                    <FileText className="w-6 h-6 mr-3 text-[#C06842]" />
                                    My Documents
                                </h2>
                                <button className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#C06842] bg-[#C06842]/10 hover:bg-[#C06842]/20 px-4 py-2 rounded-lg transition-colors border border-[#C06842]/20">
                                    <Upload className="w-4 h-4" />
                                    <span>Upload New</span>
                                </button>
                            </div>

                            <div className="overflow-hidden rounded-2xl border border-[#E3DACD]/50 relative z-10">
                                <table className="w-full text-left">
                                    <thead className="bg-[#F9F7F2] border-b border-[#E3DACD]">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-bold text-[#8C7B70] uppercase tracking-wider">Document Name</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-[#8C7B70] uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-[#8C7B70] uppercase tracking-wider">Date Added</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-[#8C7B70] uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-[#8C7B70] uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E3DACD]/40 bg-white/60">
                                        {documents.map((doc) => (
                                            <tr key={doc.id} className="hover:bg-[#F9F7F2] transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center">
                                                        <div className="p-2 bg-[#F9F7F2] text-[#5D4037] rounded-lg mr-3 group-hover:bg-white border border-[#E3DACD]/50">
                                                            <FileText className="w-4 h-4" />
                                                        </div>
                                                        <span className="font-bold text-[#2A1F1D] text-sm">{doc.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-[#F9F7F2] text-[#8C7B70] border border-[#E3DACD]">
                                                        {doc.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-sm text-[#5D4037] font-medium">{doc.date}</td>
                                                <td className="px-6 py-5">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${doc.status === 'Verified' ? 'bg-green-50 text-green-700 border-green-100' :
                                                        doc.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                            'bg-red-50 text-red-700 border-red-100'
                                                        }`}>
                                                        {doc.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <button className="text-[#8C7B70] hover:text-[#C06842] transition-colors font-bold text-xs uppercase tracking-wider hover:underline">View</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
