import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Save, Shield, FileText, AlertCircle, Eye, EyeOff, Upload, Check, Pencil, Clock, Trash2 } from 'lucide-react';
import { useMockApp } from '../../../hooks/useMockApp';
import { useActivityLog } from '../../../hooks/useActivityLog';

const Settings = () => {
    const { currentUser, updateProfile, updatePassword, setAuthUser } = useMockApp();
    const { history, logAction, clearHistory } = useActivityLog();
    const [activeTab, setActiveTab] = useState('profile');
    const [isEditing, setIsEditing] = useState(false);

    // Profile State
    const [profileData, setProfileData] = useState({
        birthdate: '',
        aadhar: null, // File object for upload
        aadharUrl: null, // URL for display
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        bio: 'Construction enthusiast and project manager.' // Keeping as mock/placeholder if not in DB
    });

    // Fetch Profile Data
    React.useEffect(() => {
        const fetchProfile = async () => {
            const userId = currentUser?.user_id || currentUser?.id;
            if (!userId) return;
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/${userId}`);
                if (response.ok) {
                    const data = await response.json();
                    setProfileData(prev => ({
                        ...prev,
                        name: data.name || '',
                        email: data.email || '',
                        phone: data.mobile_number || '',
                        birthdate: data.birthdate ? data.birthdate.split('T')[0] : '', // Format date
                        address: data.address || '',
                        city: data.city || '',
                        state: data.state || '',
                        zip_code: data.zip_code || '',
                        aadharUrl: data.personal_id_document_path ? `${import.meta.env.VITE_API_URL}/${data.personal_id_document_path}` : null,
                        bio: data.bio || prev.bio // Preserve bio if not in DB
                    }));

                    if (data.personal_id_document_path) {
                        setDocuments([{
                            id: 'aadhar_doc',
                            name: 'Aadhar Card',
                            type: 'Identity Proof',
                            date: data.updated_at ? data.updated_at.split('T')[0] : new Date().toISOString().split('T')[0],
                            status: 'Verified',
                            fileUrl: `${import.meta.env.VITE_API_URL}/${data.personal_id_document_path}`
                        }]);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch profile", error);
            }
        };
        fetchProfile();
    }, [currentUser]);

    // Password State
    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
    const [passwordMessage, setPasswordMessage] = useState(null);

    // Mock Documents State (Keep as is for now or link to backend later)
    const [documents, setDocuments] = useState([]);
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);
    const [newDoc, setNewDoc] = useState({ name: '', type: 'Identity Proof', file: null });

    const handleProfileSave = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', profileData.name);
            formData.append('mobile_number', profileData.phone);
            formData.append('birthdate', profileData.birthdate);
            formData.append('address', profileData.address);
            formData.append('city', profileData.city);
            formData.append('state', profileData.state);
            formData.append('zip_code', profileData.zip_code);

            if (profileData.aadhar) {
                formData.append('aadhar_card', profileData.aadhar);
            }

            const userId = currentUser.user_id || currentUser.id;
            let response;
            if (profileData.aadhar) {
                // If there's a file, we must use FormData
                response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/${userId}`, {
                    method: 'PUT',
                    body: formData,
                });
            } else {
                // If no file, use the new profile sync route which handles geocoding
                response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}/profile`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phone: profileData.phone,
                        address: profileData.address,
                        city: profileData.city,
                        state: profileData.state,
                        zip_code: profileData.zip_code,
                        birthdate: profileData.birthdate,
                        bio: profileData.bio
                    }),
                });
            }

            if (response.ok) {
                const updatedUser = await response.json();
                alert('Profile updated successfully!');

                // Log Activity
                logAction('Profile Update', 'Updated personal details');
                if (profileData.aadhar) {
                    logAction('Document Upload', `Uploaded new Aadhar card: ${profileData.aadhar.name}`);
                }

                setIsEditing(false);
                // Update local context if needed
                if (setAuthUser) {
                    // Merge updated fields into current user
                    setAuthUser(prev => ({ ...prev, ...updatedUser.user }));
                }
                // Update Aadhar URL display if new file uploaded
                if (updatedUser.user.personal_id_document_path) {
                    setProfileData(prev => ({
                        ...prev,
                        aadharUrl: `${import.meta.env.VITE_API_URL}/${updatedUser.user.personal_id_document_path}`,
                        aadhar: null // Reset file input
                    }));
                }
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('Profile update failed:', errorData);
                throw new Error(errorData.error || errorData.details || 'Failed to update');
            }
        } catch (error) {
            console.error("Profile Update Failed", error);
            alert(`Failed to update profile: ${error.message}`);
        }
    };

    const handlePasswordChange = (e) => {
        e.preventDefault();
        // ... (existing password logic)
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
                                { id: 'activity', label: 'Activity History', icon: Clock, desc: 'Track your work' },
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
                                {/* Profile Picture Upload - Placeholder for now as DB schema doesn't have it yet, or use generic */}
                                <div className="flex items-center space-x-6 mb-6">
                                    <div className={`relative w-24 h-24 rounded-full bg-[#F9F7F2] border-2 border-[#E3DACD] flex items-center justify-center overflow-hidden group ${isEditing ? 'cursor-pointer' : ''}`}>
                                        <User className="w-10 h-10 text-[#B8AFA5]" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#2A1F1D]">{profileData.name}</h3>
                                        <p className="text-xs text-[#8C7B70] mt-1">{currentUser?.role?.replace('_', ' ').toUpperCase()}</p>
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
                                                disabled={true} // Email usually not editable directly
                                                className="w-full pl-12 pr-4 py-3.5 border bg-[#F9F7F2] border-transparent text-[#8C7B70] cursor-not-allowed rounded-xl font-bold shadow-sm"
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
                                    {/* Address Fields */}
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-bold text-[#8C7B70] uppercase tracking-wider">Address</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={profileData.address}
                                                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                                                disabled={!isEditing}
                                                placeholder="Street Address"
                                                className={`w-full pl-12 pr-4 py-3.5 border rounded-xl outline-none transition-all text-[#2A1F1D] font-bold shadow-sm placeholder:text-[#B8AFA5]/80 placeholder:font-medium ${isEditing
                                                    ? 'bg-[#FDFCF8] border-[#E3DACD] focus:ring-4 focus:ring-[#C06842]/10 focus:border-[#C06842]'
                                                    : 'bg-[#F9F7F2] border-transparent text-[#8C7B70] cursor-not-allowed'}`}
                                            />
                                            <MapPin className="w-5 h-5 text-[#8C7B70] absolute left-4 top-3.5" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[#8C7B70] uppercase tracking-wider">City</label>
                                        <input
                                            type="text"
                                            value={profileData.city}
                                            onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                                            disabled={!isEditing}
                                            className={`w-full px-4 py-3.5 border rounded-xl outline-none transition-all text-[#2A1F1D] font-bold shadow-sm ${isEditing ? 'bg-[#FDFCF8] border-[#E3DACD]' : 'bg-[#F9F7F2] border-transparent text-[#8C7B70]'}`}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[#8C7B70] uppercase tracking-wider">State</label>
                                        <input
                                            type="text"
                                            value={profileData.state}
                                            onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                                            disabled={!isEditing}
                                            className={`w-full px-4 py-3.5 border rounded-xl outline-none transition-all text-[#2A1F1D] font-bold shadow-sm ${isEditing ? 'bg-[#FDFCF8] border-[#E3DACD]' : 'bg-[#F9F7F2] border-transparent text-[#8C7B70]'}`}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[#8C7B70] uppercase tracking-wider">Zip Code</label>
                                        <input
                                            type="text"
                                            value={profileData.zip_code}
                                            onChange={(e) => setProfileData({ ...profileData, zip_code: e.target.value })}
                                            disabled={!isEditing}
                                            className={`w-full px-4 py-3.5 border rounded-xl outline-none transition-all text-[#2A1F1D] font-bold shadow-sm ${isEditing ? 'bg-[#FDFCF8] border-[#E3DACD]' : 'bg-[#F9F7F2] border-transparent text-[#8C7B70]'}`}
                                        />
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-bold text-[#8C7B70] uppercase tracking-wider">Aadhar Card Proof</label>
                                        <div className="relative">
                                            <label className={`w-full flex items-center justify-between px-4 py-3 bg-white border border-[#E3DACD] border-dashed rounded-xl transition-colors ${isEditing ? 'cursor-pointer hover:bg-[#F9F7F2]' : 'cursor-default'}`}>
                                                <span className="text-sm font-medium text-[#8C7B70] truncate max-w-[200px]">
                                                    {profileData.aadhar ? profileData.aadhar.name : (profileData.aadharUrl ? 'Aadhar Card Uploaded' : 'Upload Aadhar Document')}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {profileData.aadharUrl && (
                                                        <a href={profileData.aadharUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#C06842] hover:underline z-10 p-1">View Current</a>
                                                    )}
                                                    {isEditing && <Upload className="w-4 h-4 text-[#C06842]" />}
                                                </div>
                                                <input
                                                    type="file"
                                                    disabled={!isEditing}
                                                    className="hidden"
                                                    accept=".pdf, .jpg, .jpeg, .png"
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
                                <button
                                    onClick={() => setIsUploadingDoc(!isUploadingDoc)}
                                    className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#C06842] bg-[#C06842]/10 hover:bg-[#C06842]/20 px-4 py-2 rounded-lg transition-colors border border-[#C06842]/20"
                                >
                                    <Upload className="w-4 h-4" />
                                    <span>{isUploadingDoc ? 'Cancel Upload' : 'Upload New'}</span>
                                </button>
                            </div>

                            <div className="overflow-hidden rounded-2xl border border-[#E3DACD]/50 relative z-10">
                                <table className="w-full text-left">
                                    <thead className="bg-[#F9F7F2] border-b border-[#E3DACD]">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-bold text-[#8C7B70] uppercase tracking-wider">Document Name</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-[#8C7B70] uppercase tracking-wider">Type</th>
                                            {!isUploadingDoc && (
                                                <>
                                                    <th className="px-6 py-4 text-[10px] font-bold text-[#8C7B70] uppercase tracking-wider">Date Added</th>
                                                    <th className="px-6 py-4 text-[10px] font-bold text-[#8C7B70] uppercase tracking-wider text-right">Actions</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E3DACD]/40 bg-white/60">
                                        {isUploadingDoc && (
                                            <tr className="bg-white">
                                                <td className="px-6 py-5">
                                                    <input
                                                        type="text"
                                                        placeholder="Document Name (e.g. License)"
                                                        value={newDoc.name}
                                                        onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                                                        className="w-full px-3 py-2 border border-[#E3DACD] rounded-lg text-sm outline-none focus:border-[#C06842] font-medium"
                                                    />
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <select
                                                            value={newDoc.type}
                                                            onChange={(e) => setNewDoc({ ...newDoc, type: e.target.value })}
                                                            className="w-full px-3 py-2 border border-[#E3DACD] rounded-lg text-sm outline-none focus:border-[#C06842] font-medium bg-white"
                                                        >
                                                            <option value="Identity Proof">Identity Proof</option>
                                                            <option value="Professional License">Professional License</option>
                                                            <option value="Certification">Certification</option>
                                                            <option value="Other">Other</option>
                                                        </select>
                                                        <input
                                                            type="file"
                                                            onChange={(e) => setNewDoc({ ...newDoc, file: e.target.files[0] })}
                                                            className="text-sm w-full max-w-[200px]"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                if (newDoc.name && newDoc.file) {
                                                                    setDocuments([...documents, {
                                                                        id: Date.now(),
                                                                        name: newDoc.name,
                                                                        type: newDoc.type,
                                                                        date: new Date().toISOString().split('T')[0],
                                                                        status: 'Pending',
                                                                        fileUrl: URL.createObjectURL(newDoc.file)
                                                                    }]);
                                                                    logAction('Document Upload', `Uploaded new ${newDoc.type.toLowerCase()}: ${newDoc.file.name}`);
                                                                    setIsUploadingDoc(false);
                                                                    setNewDoc({ name: '', type: 'Identity Proof', file: null });
                                                                }
                                                            }}
                                                            disabled={!newDoc.name || !newDoc.file}
                                                            className="bg-[#2A1F1D] text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-50 min-w-[100px]"
                                                        >
                                                            Save
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        {documents.length === 0 && !isUploadingDoc ? (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-8 text-center text-[#8C7B70] text-sm">
                                                    No documents uploaded yet.
                                                </td>
                                            </tr>
                                        ) : documents.map((doc) => (
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
                                                {!isUploadingDoc && (
                                                    <>
                                                        <td className="px-6 py-5 text-sm text-[#5D4037] font-medium">{doc.date}</td>
                                                        <td className="px-6 py-5 text-right">
                                                            {doc.fileUrl ? (
                                                                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[#8C7B70] hover:text-[#C06842] transition-colors font-bold text-xs uppercase tracking-wider hover:underline">View</a>
                                                            ) : (
                                                                <span className="text-gray-300 text-xs uppercase font-bold tracking-wider">No File</span>
                                                            )}
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'activity' && (
                        <div className="glass-card rounded-[2.5rem] shadow-sm border border-[#E3DACD]/50 p-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C06842]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <h2 className="text-2xl font-bold font-serif text-[#2A1F1D] flex items-center">
                                    <Clock className="w-6 h-6 mr-3 text-[#C06842]" />
                                    Activity History
                                </h2>
                                <button
                                    onClick={clearHistory}
                                    className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors border border-red-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Clear History</span>
                                </button>
                            </div>

                            <div className="space-y-4 relative z-10">
                                {history.length === 0 ? (
                                    <div className="text-center py-10 text-[#8C7B70]">
                                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm font-medium">No activity recorded yet.</p>
                                    </div>
                                ) : (
                                    history.map((item) => (
                                        <div key={item.id} className="glass-card p-4 rounded-xl border border-[#E3DACD]/30 flex items-start gap-4 hover:bg-[#F9F7F2] transition-colors">
                                            <div className="p-2 bg-[#F9F7F2] rounded-lg mt-1 border border-[#E3DACD]/50 text-[#C06842]">
                                                {item.action === 'Profile Update' ? <User size={16} /> : <FileText size={16} />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-[#2A1F1D] text-sm">{item.action}</h4>
                                                    <span className="text-[10px] text-[#8C7B70] uppercase tracking-wider font-bold">
                                                        {new Date(item.timestamp).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-[#5D4037] mt-1">{item.details}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
