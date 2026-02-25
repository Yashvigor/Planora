import React, { useState, useEffect } from 'react';
import { MapPin, Star, Filter, Heart, Search, User, FileText, X, Briefcase, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FindProfessionals = () => {
    const [professionals, setProfessionals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('All');
    const [userLocation, setUserLocation] = useState(null);
    const [selectedPro, setSelectedPro] = useState(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [currentUserCategory, setCurrentUserCategory] = useState('');

    // New state for projects and assignments
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [assignedUserIds, setAssignedUserIds] = useState(new Set());
    const [isInviting, setIsInviting] = useState(false);

    // Categories for filter
    const roles = [
        { id: 'All', label: 'All' },
        { id: 'Contractor', label: 'Contractors' },
        { id: 'Architect', label: 'Architects' },
        { id: 'Interior Designer', label: 'Designers' },
        { id: 'Structural Engineer', label: 'Engineers' },
        { id: 'Mason', label: 'Masons' },
        { id: 'Plumber', label: 'Plumbers' },
        { id: 'Electrician', label: 'Electricians' },
    ];

    // 1. Get User Location & Projects
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const storedUser = localStorage.getItem('planora_current_user') || localStorage.getItem('user');
                const userData = storedUser ? JSON.parse(storedUser) : null;
                const userId = userData ? (userData.user_id || userData.id) : null;
                let category = '';
                if (userData) {
                    category = (userData.category || userData.role || userData.user_type || '').toUpperCase();
                    setCurrentUserCategory(category);
                }

                // Fetch Location
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            setUserLocation({
                                lat: position.coords.latitude,
                                lon: position.coords.longitude
                            });
                        },
                        async () => {
                            // Fallback to profile location
                            if (userId) {
                                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/${userId}`);
                                const data = await res.json();
                                if (data.latitude && data.longitude) {
                                    setUserLocation({ lat: data.latitude, lon: data.longitude });
                                }
                            }
                        }
                    );
                }

                // Fetch Projects based on Role
                if (userId) {
                    const isLandOwner = category === 'LAND OWNER' || category === 'LANDOWNER' || category === 'LAND_OWNER';
                    const endpoint = isLandOwner
                        ? `/api/projects/user/${userId}`
                        : `/api/professionals/${userId}/projects`;

                    const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`);
                    if (res.ok) {
                        const data = await res.json();
                        // For professionals, only allow sending invites for projects they have Accepted
                        const activeProjects = isLandOwner
                            ? data
                            : data.filter(p => !p.assignment_status || p.assignment_status === 'Accepted');

                        setProjects(activeProjects);
                        if (activeProjects.length > 0) {
                            setSelectedProjectId(activeProjects[0].project_id || activeProjects[0].id);
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching user data:", err);
            }
        };
        fetchUserData();
    }, []);

    // 2. Fetch Assigned Professionals for Selected Project
    useEffect(() => {
        const fetchAssignments = async () => {
            if (!selectedProjectId) return;
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${selectedProjectId}/team`);
                if (res.ok) {
                    const data = await res.json();
                    const ids = new Set(data.map(member => member.user_id));
                    setAssignedUserIds(ids);
                } else {
                    setAssignedUserIds(new Set());
                }
            } catch (err) {
                console.error("Error fetching assignments:", err);
            }
        };

        fetchAssignments();
    }, [selectedProjectId]);

    // 3. Fetch Professionals (Nearby)
    useEffect(() => {
        const fetchPros = async () => {
            if (!userLocation) return;

            setLoading(true);
            try {
                let url = `${import.meta.env.VITE_API_URL}/api/professionals/nearby`;
                const params = new URLSearchParams();
                params.append('lat', userLocation.lat);
                params.append('lon', userLocation.lon);
                params.append('radius', 100);

                if (selectedRole !== 'All') {
                    params.append('sub_category', selectedRole);
                }

                const res = await fetch(`${url}?${params.toString()}`);
                const data = await res.json();

                if (res.ok) {
                    setProfessionals(data);
                } else {
                    setProfessionals([]);
                }
            } catch (err) {
                console.error("Error fetching professionals:", err);
                setProfessionals([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPros();
    }, [userLocation, selectedRole]);

    // 4. Invite Handler
    const handleInvite = async (e, pro) => {
        e.stopPropagation(); // Prevent opening profile modal if button clicked there

        if (!selectedProjectId) {
            alert("Please select or create a project first.");
            return;
        }

        setIsInviting(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${selectedProjectId}/assign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: pro.user_id,
                    role: pro.sub_category || pro.category // Default role
                }),
            });

            if (res.ok) {
                // Immediately hide from list by adding to assigned set
                setAssignedUserIds(prev => new Set(prev).add(pro.user_id));
                alert(`Invited ${pro.name} to the project!`);
                if (isProfileOpen) setIsProfileOpen(false); // Close modal if open
            } else {
                alert("Failed to invite professional.");
            }
        } catch (err) {
            console.error("Invite error:", err);
            alert("Error sending invite.");
        } finally {
            setIsInviting(false);
        }
    };

    // 5. Filter Logic (Search + Assignments)
    const filteredPros = professionals.filter(pro => {
        // Exclude if already assigned to selected project
        if (assignedUserIds.has(pro.user_id)) return false;

        const proCat = (pro.category || '').toUpperCase();
        const proSubCat = (pro.sub_category || '').toUpperCase();

        // Hide Land Owners from discovery
        if (proCat === 'LAND OWNER' || proCat === 'LANDOWNER') return false;

        // Hide Contractors if current user is Contractor
        if (currentUserCategory === 'CONTRACTOR' && (proCat === 'CONTRACTOR' || proSubCat === 'CONTRACTOR')) {
            return false;
        }

        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            pro.name?.toLowerCase().includes(query) ||
            pro.sub_category?.toLowerCase().includes(query) ||
            pro.category?.toLowerCase().includes(query) ||
            pro.specialization?.toLowerCase().includes(query)
        );
    });

    const handleViewProfile = (pro) => {
        setSelectedPro(pro);
        setIsProfileOpen(true);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] relative">
            {/* Header & Controls */}
            <div className="mb-8 space-y-6">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white/50 backdrop-blur-md p-6 rounded-3xl border border-[#E3DACD]/50 shadow-sm">
                    <div>
                        <h1 className="text-3xl font-serif font-black text-[#2A1F1D] tracking-tight">Find Professionals</h1>
                        <p className="text-sm font-medium text-[#8C7B70] mt-1">Discover & connect with premium experts in your area</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                        {/* Project Selector */}
                        <div className="relative min-w-[220px] group">
                            <select
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                                className="w-full pl-5 pr-10 py-3.5 bg-white border border-[#E3DACD] rounded-2xl appearance-none focus:outline-none focus:ring-2 focus:ring-[#b96a41]/50 focus:border-[#b96a41] cursor-pointer text-sm font-bold text-[#5D4037] shadow-sm transition-all group-hover:border-[#b96a41]/50"
                            >
                                {projects.length === 0 ? (
                                    <option value="" disabled>No Projects Found</option>
                                ) : (
                                    projects.map(p => (
                                        <option key={p.project_id || p.id} value={p.project_id || p.id}>
                                            {p.name}
                                        </option>
                                    ))
                                )}
                            </select>
                            <div className="absolute right-4 top-3.5 pointer-events-none text-[#b96a41]">
                                <Briefcase size={18} />
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative w-full sm:w-80 lg:w-96 group">
                            <input
                                type="text"
                                placeholder="Search experts by name or role..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-5 py-3.5 bg-white border border-[#E3DACD] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#b96a41]/50 focus:border-[#b96a41] shadow-sm transition-all font-medium text-sm text-[#2A1F1D] placeholder-[#8C7B70] group-hover:border-[#b96a41]/50"
                            />
                            <Search className="absolute left-4 top-[14px] text-[#b96a41]" size={18} />
                        </div>
                    </div>
                </div>

                {/* Categories */}
                <div className="flex space-x-3 overflow-x-auto pb-4 pt-1 px-1 custom-scrollbar">
                    {roles.map(role => (
                        <button
                            key={role.id}
                            onClick={() => setSelectedRole(role.id)}
                            className={`px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-300 border ${selectedRole === role.id
                                ? 'bg-[#3E2B26] text-white border-[#3E2B26] shadow-[0_8px_16px_-6px_rgba(62,43,38,0.4)] transform -translate-y-0.5'
                                : 'bg-white text-[#5D4037] border-[#E3DACD]/80 hover:bg-[#F9F7F2] hover:border-[#b96a41]/40 hover:text-[#b96a41] shadow-sm'
                                }`}
                        >
                            {role.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <div className="w-12 h-12 border-4 border-[#C06842] border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-gray-500 font-medium">Searching nearby...</p>
                    </div>
                ) : filteredPros.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
                        <div className="bg-[#FDFCF8] p-6 rounded-3xl mb-6 shadow-inner border border-[#E3DACD]/50 relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-[#b96a41]/5 to-transparent rounded-3xl"></div>
                            <Search size={40} className="text-[#b96a41] relative z-10" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-2xl font-serif font-black text-[#2A1F1D] tracking-tight">No experts found</h3>
                        <p className="text-[#8C7B70] max-w-sm mt-3 font-medium leading-relaxed">
                            {assignedUserIds.size > 0
                                ? "Already invited professionals are hidden from this view. Try adjusting your filters."
                                : "Try adjusting your search criteria or category filters to discover more professionals."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-24 px-1">
                        {filteredPros.map(pro => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={pro.user_id}
                                className="group relative bg-white rounded-3xl border border-[#E3DACD]/50 hover:border-[#b96a41]/30 overflow-hidden transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(185,106,65,0.15)] flex flex-col h-full"
                            >
                                {/* Decorative Gradient Top */}
                                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#b96a41] via-[#d48c66] to-[#b96a41] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                <div className="p-7 flex-1 flex flex-col">
                                    {/* Header Section */}
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            {/* Avatar/Initials Box */}
                                            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FDFCF8] to-[#F9F7F2] border border-[#E3DACD]/80 flex items-center justify-center shadow-inner group-hover:from-[#b96a41] group-hover:to-[#8a4d2f] transition-all duration-500 overflow-hidden">
                                                <span className="text-2xl font-black font-serif text-[#3E2B26] group-hover:text-white transition-colors duration-500 z-10">
                                                    {pro.name.charAt(0).toUpperCase()}
                                                </span>
                                                {/* Decorative inner circle */}
                                                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#E3DACD]/30 group-hover:bg-white/10 blur-sm"></div>
                                            </div>

                                            <div className="space-y-1">
                                                <h3 className="font-bold text-gray-900 line-clamp-1 text-xl tracking-tight group-hover:text-[#b96a41] transition-colors">{pro.name}</h3>
                                                <div className="inline-flex items-center">
                                                    <span className="text-[11px] font-bold text-[#b96a41] bg-[#b96a41]/10 px-2.5 py-1 rounded-full uppercase tracking-widest border border-[#b96a41]/20">
                                                        {pro.sub_category || pro.category}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats & Info Container */}
                                    <div className="space-y-4 mb-8 flex-1">
                                        {/* Location Banner */}
                                        <div className="flex items-center text-sm text-[#5D4037] bg-gradient-to-r from-[#F9F7F2] to-transparent p-3 rounded-xl border border-[#F9F7F2]">
                                            <MapPin size={16} className="text-[#b96a41] mr-3 shrink-0" />
                                            <span className="font-medium truncate flex-1">{pro.city || "Location details hidden"}</span>
                                            {pro.distance && (
                                                <span className="text-xs font-bold text-[#b96a41] bg-white px-2 py-1 rounded-lg border border-[#E3DACD]/50 shadow-sm">
                                                    {parseFloat(pro.distance).toFixed(1)} km
                                                </span>
                                            )}
                                        </div>

                                        {/* Ratings & Experience Grid */}
                                        <div className="grid grid-cols-2 gap-3">
                                            {pro.rating ? (
                                                <div className="flex items-center justify-center gap-2 bg-amber-50/80 border border-amber-100/50 py-2.5 rounded-xl">
                                                    <Star size={16} className="fill-amber-400 text-amber-400" />
                                                    <span className="font-bold text-amber-700">{pro.rating}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center bg-gray-50/80 border border-gray-100 py-2.5 rounded-xl text-gray-400 text-sm font-medium">
                                                    Unrated
                                                </div>
                                            )}

                                            <div className="flex items-center justify-center bg-[#FDFCF8] border border-[#E3DACD]/50 py-2.5 rounded-xl">
                                                <span className="text-xs font-bold text-[#8C7B70] uppercase">
                                                    {pro.experience_years ? (
                                                        <><span className="text-sm text-[#3E2B26] mr-1">{pro.experience_years}y</span>Exp.</>
                                                    ) : 'Exp. N/A'}
                                                </span>
                                            </div>
                                        </div>

                                        {pro.specialization && (
                                            <div className="mt-4 px-1">
                                                <p className="text-sm text-[#8C7B70] line-clamp-2 leading-relaxed italic">
                                                    "{pro.specialization}"
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-[#E3DACD]/30">
                                        <button
                                            onClick={() => handleViewProfile(pro)}
                                            className="group/btn relative flex items-center justify-center px-4 py-3 bg-[#FDFCF8] text-[#5D4037] rounded-xl text-sm font-bold hover:bg-white transition-all overflow-hidden border border-[#E3DACD] hover:border-[#b96a41]/30 hover:shadow-md"
                                        >
                                            <span className="relative z-10">View Profile</span>
                                        </button>

                                        <button
                                            onClick={(e) => handleInvite(e, pro)}
                                            disabled={!selectedProjectId}
                                            className="group/invite flex items-center justify-center px-4 py-3 bg-gradient-to-br from-[#3E2B26] to-[#2A1F1D] text-white rounded-xl text-sm font-bold hover:from-[#b96a41] hover:to-[#8a4d2f] shadow-md shadow-[#3E2B26]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-[#3E2B26] hover:border-[#b96a41]"
                                        >
                                            {selectedProjectId ? (
                                                <span className="flex items-center gap-2">
                                                    Invite <Plus size={16} className="group-hover/invite:rotate-90 transition-transform duration-300" />
                                                </span>
                                            ) : 'Select Project'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Profile Modal */}
            <AnimatePresence>
                {isProfileOpen && selectedPro && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                            onClick={() => setIsProfileOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl border-l border-[#E3DACD] flex flex-col"
                        >
                            <div className="p-6 bg-[#FDFCF8] border-b border-[#E3DACD] flex justify-between items-center">
                                <h3 className="font-serif font-bold text-[#3E2B26] text-lg">Professional Profile</h3>
                                <button onClick={() => setIsProfileOpen(false)} className="text-[#8C7B70] hover:text-[#3E2B26] p-1 hover:bg-gray-100 rounded-full transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                                <div className="text-center relative">
                                    <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#F9F7F2] to-transparent -mx-6 -mt-6"></div>
                                    <div className="w-28 h-28 mx-auto rounded-3xl bg-gradient-to-br from-[#FDFCF8] to-[#F9F7F2] border-2 border-[#E3DACD] flex items-center justify-center text-[#b96a41] shadow-lg shadow-[#E3DACD]/50 mb-5 relative z-10 transition-transform hover:scale-105 duration-300">
                                        <User size={54} strokeWidth={1.5} />
                                        {selectedPro.rating && (
                                            <div className="absolute -bottom-3 bg-white px-4 py-1.5 rounded-full shadow-md border border-[#E3DACD] text-xs font-black text-[#8C7B70] flex items-center gap-1.5 ring-4 ring-[#FDFCF8]">
                                                <Star size={14} className="fill-amber-400 text-amber-400" /> {selectedPro.rating}
                                            </div>
                                        )}
                                    </div>
                                    <h4 className="text-2xl font-serif font-black text-[#2A1F1D] mb-2 tracking-tight">{selectedPro.name}</h4>
                                    <div className="inline-block mt-1">
                                        <span className="text-[11px] font-black uppercase tracking-widest text-[#b96a41] bg-[#b96a41]/10 px-4 py-1.5 rounded-full border border-[#b96a41]/20">
                                            {selectedPro.sub_category || selectedPro.category}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-8 mt-6">
                                    {/* About Section */}
                                    <div className="space-y-3 bg-[#F9F7F2]/50 p-5 rounded-3xl border border-[#E3DACD]/50">
                                        <label className="text-[10px] font-black text-[#b96a41] uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-4 h-[1px] bg-[#b96a41]"></span> About Professional
                                        </label>
                                        <p className="text-[15px] text-[#5D4037] leading-relaxed font-medium">
                                            {selectedPro.bio || `Experienced ${selectedPro.sub_category || 'expert'} dedicated to delivering high-quality results for your construction and development needs.`}
                                        </p>
                                    </div>

                                    {/* Quick Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-5 bg-gradient-to-br from-white to-[#F9F7F2] rounded-3xl border border-[#E3DACD] text-center shadow-sm relative overflow-hidden group/stat">
                                            <div className="absolute inset-0 bg-[#b96a41]/5 transform translate-y-full group-hover/stat:translate-y-0 transition-transform duration-300"></div>
                                            <span className="block text-3xl font-black text-[#2A1F1D] tracking-tighter relative z-10">{selectedPro.experience_years || '1+'}</span>
                                            <span className="text-[10px] font-black text-[#8C7B70] uppercase tracking-wider relative z-10">Years Exp</span>
                                        </div>
                                        <div className="p-5 bg-gradient-to-br from-white to-[#F9F7F2] rounded-3xl border border-[#E3DACD] text-center shadow-sm relative overflow-hidden group/stat">
                                            <div className="absolute inset-0 bg-[#b96a41]/5 transform translate-y-full group-hover/stat:translate-y-0 transition-transform duration-300"></div>
                                            <span className="block text-3xl font-black text-[#2A1F1D] truncate px-1 tracking-tighter relative z-10">
                                                {selectedPro.distance ? parseFloat(selectedPro.distance).toFixed(1) : '?'}
                                            </span>
                                            <span className="text-[10px] font-black text-[#8C7B70] uppercase tracking-wider relative z-10">Km Away</span>
                                        </div>
                                    </div>

                                    {/* Documents & Links */}
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-[#b96a41] uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-4 h-[1px] bg-[#b96a41]"></span> Contact & Portfolio
                                        </label>

                                        <div className="grid grid-cols-1 gap-3">
                                            {selectedPro.resume_path ? (
                                                <a href={`${import.meta.env.VITE_API_URL}/${selectedPro.resume_path}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 bg-white border border-[#E3DACD] rounded-2xl hover:border-[#b96a41] hover:shadow-md hover:-translate-y-0.5 transition-all text-[#5D4037] group">
                                                    <div className="w-12 h-12 bg-[#F9F7F2] flex items-center justify-center rounded-xl text-[#b96a41] group-hover:bg-[#b96a41] group-hover:text-white transition-colors duration-300">
                                                        <FileText size={22} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className="block text-base font-bold text-[#2A1F1D] group-hover:text-[#b96a41] transition-colors">Resume & CV</span>
                                                        <span className="text-xs font-medium text-[#8C7B70]">View credentials</span>
                                                    </div>
                                                </a>
                                            ) : (
                                                <div className="flex items-center gap-4 p-4 bg-gray-50 border border-dashed border-[#E3DACD] rounded-2xl opacity-70">
                                                    <div className="w-12 h-12 bg-gray-100 flex items-center justify-center rounded-xl text-gray-400">
                                                        <FileText size={22} />
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-500">Resume Not Available</span>
                                                </div>
                                            )}

                                            {selectedPro.portfolio_url && (
                                                <a href={selectedPro.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 bg-white border border-[#E3DACD] rounded-2xl hover:border-[#b96a41] hover:shadow-md hover:-translate-y-0.5 transition-all text-[#5D4037] group">
                                                    <div className="w-12 h-12 bg-[#F9F7F2] flex items-center justify-center rounded-xl text-[#b96a41] group-hover:bg-[#b96a41] group-hover:text-white transition-colors duration-300">
                                                        <Briefcase size={22} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className="block text-base font-bold text-[#2A1F1D] group-hover:text-[#b96a41] transition-colors">Portfolio Link</span>
                                                        <span className="text-xs font-medium text-[#8C7B70]">View past work</span>
                                                    </div>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-white border-t border-[#E3DACD]">
                                <button
                                    onClick={(e) => handleInvite(e, selectedPro)}
                                    disabled={!selectedProjectId || isInviting}
                                    className="w-full py-4 bg-[#3E2B26] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#2A1F1D] shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isInviting ? 'Sending Invite...' : (selectedProjectId ? 'Invite to Project' : 'Select Project First')}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FindProfessionals;
