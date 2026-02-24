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
                    category = (userData.category || userData.user_type || '').toUpperCase();
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
                    const endpoint = category === 'LAND_OWNER'
                        ? `/api/projects/user/${userId}`
                        : `/api/professionals/${userId}/projects`;

                    const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`);
                    if (res.ok) {
                        const data = await res.json();
                        // For professionals, only allow sending invites for projects they have Accepted
                        const activeProjects = category === 'LAND_OWNER'
                            ? data
                            : data.filter(p => !p.assignment_status || p.assignment_status === 'Accepted');

                        setProjects(activeProjects);
                        if (activeProjects.length > 0) {
                            setSelectedProjectId(activeProjects[0].project_id);
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
            <div className="mb-6 space-y-4">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-gray-800">Find Professionals</h1>
                        <p className="text-sm text-gray-500">Connect with top-rated experts nearby</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                        {/* Project Selector */}
                        <div className="relative min-w-[200px]">
                            <select
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                                className="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-[#C06842] cursor-pointer text-sm font-medium"
                            >
                                {projects.length === 0 ? (
                                    <option value="" disabled>No Projects Found</option>
                                ) : (
                                    projects.map(p => (
                                        <option key={p.project_id} value={p.project_id}>
                                            {p.name}
                                        </option>
                                    ))
                                )}
                            </select>
                            <div className="absolute right-3 top-3.5 pointer-events-none text-gray-500">
                                <Briefcase size={16} />
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative w-full sm:w-96">
                            <input
                                type="text"
                                placeholder="Search by name, role (e.g. Plumber)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C06842] focus:border-transparent shadow-sm transition-all"
                            />
                            <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                        </div>
                    </div>
                </div>

                {/* Categories */}
                <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                    {roles.map(role => (
                        <button
                            key={role.id}
                            onClick={() => setSelectedRole(role.id)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${selectedRole === role.id
                                ? 'bg-[#3E2B26] text-white border-[#3E2B26] shadow-lg transform scale-105'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
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
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="bg-gray-100 p-4 rounded-full mb-4">
                            <Search size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-700">No professionals found</h3>
                        <p className="text-gray-500 max-w-sm mt-1">
                            {assignedUserIds.size > 0
                                ? "Invited professionals are hidden. Try clearing filters."
                                : "Try adjusting your search or category filters. Ensure location services are enabled."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                        {filteredPros.map(pro => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={pro.user_id}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group"
                            >
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-[#F9F7F2] rounded-2xl flex items-center justify-center text-[#C06842] group-hover:bg-[#C06842] group-hover:text-white transition-colors border border-[#E3DACD]">
                                                <span className="text-xl font-black font-serif">
                                                    {pro.name.charAt(0)}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 line-clamp-1 text-lg">{pro.name}</h3>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs font-bold text-[#C06842] bg-[#F9F7F2] px-2 py-0.5 rounded uppercase tracking-wider">
                                                        {pro.sub_category || pro.category}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                                            <MapPin size={16} className="text-gray-400 mr-2 shrink-0" />
                                            <span className="truncate">{pro.city || "Location details hidden"}</span>
                                            <span className="mx-2 text-gray-300">|</span>
                                            <span className="font-medium text-[#C06842] whitespace-nowrap">
                                                {pro.distance ? `${parseFloat(pro.distance).toFixed(1)} km away` : 'Distance unknown'}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            {pro.rating ? (
                                                <div className="flex items-center gap-1.5 bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-md font-medium">
                                                    <Star size={14} className="fill-yellow-500 text-yellow-500" />
                                                    <span>{pro.rating}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 bg-gray-50 text-gray-400 px-2.5 py-1 rounded-md font-medium text-xs">
                                                    <span>Unrated</span>
                                                </div>
                                            )}
                                            <div className="text-gray-500 font-medium">
                                                {pro.experience_years ? `${pro.experience_years} Years Exp.` : 'Experience N/A'}
                                            </div>
                                        </div>

                                        {pro.specialization && (
                                            <p className="text-xs text-gray-500 line-clamp-1 italic">
                                                "{pro.specialization}"
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => handleViewProfile(pro)}
                                            className="flex items-center justify-center px-4 py-2.5 bg-gray-50 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                                        >
                                            View Profile
                                        </button>
                                        <button
                                            onClick={(e) => handleInvite(e, pro)}
                                            disabled={!selectedProjectId}
                                            className="flex items-center justify-center px-4 py-2.5 bg-[#3E2B26] text-white rounded-xl text-sm font-bold hover:bg-[#2A1F1D] shadow-lg shadow-gray-200 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {selectedProjectId ? 'Invite' : 'Select Project'}
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
                                <div className="text-center">
                                    <div className="w-24 h-24 mx-auto rounded-3xl bg-[#F9F7F2] border-2 border-[#E3DACD] flex items-center justify-center text-[#A65D3B] shadow-inner mb-4 relative">
                                        <User size={48} />
                                        {selectedPro.rating && (
                                            <div className="absolute -bottom-2 bg-white px-3 py-1 rounded-full shadow-md border border-gray-100 text-xs font-bold text-gray-600 flex items-center gap-1">
                                                <Star size={12} className="fill-yellow-400 text-yellow-400" /> {selectedPro.rating}
                                            </div>
                                        )}
                                    </div>
                                    <h4 className="text-2xl font-serif font-bold text-[#3E2B26] mb-1">{selectedPro.name}</h4>
                                    <span className="text-xs font-black uppercase tracking-widest text-[#A65D3B] bg-[#A65D3B]/10 px-3 py-1 rounded-full">
                                        {selectedPro.sub_category || selectedPro.category}
                                    </span>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#8C7B70] uppercase tracking-widest block">About</label>
                                        <p className="text-sm text-[#5D4037] leading-relaxed">
                                            {selectedPro.bio || `Experienced ${selectedPro.sub_category} dedicated to delivering high-quality results for your construction needs.`}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-[#F9F7F2] rounded-2xl border border-[#E3DACD]/50 text-center">
                                            <span className="block text-2xl font-bold text-[#3E2B26]">{selectedPro.experience_years || '1+'}</span>
                                            <span className="text-[10px] font-black text-[#8C7B70] uppercase tracking-wider">Years Exp</span>
                                        </div>
                                        <div className="p-4 bg-[#F9F7F2] rounded-2xl border border-[#E3DACD]/50 text-center">
                                            <span className="block text-xl font-bold text-[#3E2B26] truncate px-1">
                                                {selectedPro.distance ? parseFloat(selectedPro.distance).toFixed(1) : '?'}
                                            </span>
                                            <span className="text-[10px] font-black text-[#8C7B70] uppercase tracking-wider">Km Away</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-[#8C7B70] uppercase tracking-widest block">Contact & Portfolio</label>

                                        <div className="grid grid-cols-1 gap-3">
                                            {selectedPro.resume_path ? (
                                                <a href={`${import.meta.env.VITE_API_URL}/${selectedPro.resume_path}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 border border-[#E3DACD] rounded-xl hover:border-[#A65D3B] hover:bg-[#F9F7F2] text-[#5D4037] transition-all group">
                                                    <div className="bg-white p-2 rounded-lg text-[#A65D3B] group-hover:scale-110 transition-transform">
                                                        <FileText size={20} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className="block text-sm font-bold text-[#3E2B26]">Resume / CV</span>
                                                        <span className="text-xs text-gray-500">View credentials</span>
                                                    </div>
                                                </a>
                                            ) : (
                                                <div className="flex items-center gap-3 p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50 opacity-60">
                                                    <FileText size={20} />
                                                    <span className="text-sm font-medium">Resume Not Available</span>
                                                </div>
                                            )}

                                            {selectedPro.portfolio_url && (
                                                <a href={selectedPro.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 border border-[#E3DACD] rounded-xl hover:border-[#A65D3B] hover:bg-[#F9F7F2] text-[#5D4037] transition-all group">
                                                    <div className="bg-white p-2 rounded-lg text-[#A65D3B] group-hover:scale-110 transition-transform">
                                                        <Briefcase size={20} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className="block text-sm font-bold text-[#3E2B26]">Portfolio</span>
                                                        <span className="text-xs text-gray-500">View past work</span>
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
