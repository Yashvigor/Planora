import React from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Star, Filter, Heart, Search, User, FileText, X, Briefcase, Plus, Clock, Map, LayoutGrid, Award, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MapProfessionals from './MapProfessionals';

const FindProfessionals = () => {
    const [professionals, setProfessionals] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedRole, setSelectedRole] = React.useState('All');
    const [userLocation, setUserLocation] = React.useState(null);
    const [selectedPro, setSelectedPro] = React.useState(null);
    const [isProfileOpen, setIsProfileOpen] = React.useState(false);
    const [currentUserCategory, setCurrentUserCategory] = React.useState('');
    const [projects, setProjects] = React.useState([]);
    const [selectedProjectId, setSelectedProjectId] = React.useState('');
    const [invitedPros, setInvitedPros] = React.useState([]);
    const [assignedUserIds, setAssignedUserIds] = React.useState(new Set());
    const [isInviting, setIsInviting] = React.useState(false);
    const [viewMode, setViewMode] = React.useState('grid'); // 'grid' or 'map'

    const PHASES = {
        'Planning': ['All', 'Contractor', 'Architect', 'Civil Engineer'],
        'Design': ['All', 'Interior Designer', 'False Ceiling Worker', 'Fabrication Worker'],
        'Execution': ['All', 'Mason', 'Electrician', 'Plumber', 'Carpenter', 'Tile Fixer', 'Painter']
    };

    const [selectedPhase, setSelectedPhase] = React.useState('Planning');

    const roles = [
        { id: 'All', label: 'All Professionals' },
        { id: 'Invited', label: 'My Invited Pros' },
        ...PHASES['Planning'].map(p => ({ id: p, label: p })),
        ...PHASES['Design'].map(p => ({ id: p, label: p })),
        ...PHASES['Execution'].map(p => ({ id: p, label: p }))
    ].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i); // Deduplicate

    // 1. Initial Data Load
    React.useEffect(() => {
        const fetchInitialData = async () => {
            const storedUser = localStorage.getItem('planora_current_user') || localStorage.getItem('user');
            const userData = storedUser ? JSON.parse(storedUser) : null;
            const userId = userData?.user_id || userData?.id;

            if (userData) {
                const category = (userData.category || userData.role || '').toUpperCase();
                setCurrentUserCategory(category);
            }

            // Fetch Projects
            if (userId) {
                try {
                    const isLandOwner = userData.category?.toUpperCase() === 'LAND OWNER' || userData.role?.toUpperCase() === 'LAND_OWNER';
                    const endpoint = isLandOwner ? `/api/projects/user/${userId}` : `/api/professionals/${userId}/projects`;
                    const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setProjects(data);
                        if (data.length > 0) setSelectedProjectId(data[0].project_id || data[0].id);
                    }
                } catch (err) { console.error(err); }
            }

            // 2. Location Logic (Live -> Profile -> Fallback)
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
                        setUserLocation(coords);
                        fetchPros(coords.lat, coords.lon);
                    },
                    async () => {
                        // Fallback to Profile Location
                        try {
                            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/${userId}`);
                            const data = await res.json();
                            if (data.latitude && data.longitude) {
                                const coords = { lat: parseFloat(data.latitude), lon: parseFloat(data.longitude) };
                                setUserLocation(coords);
                                fetchPros(coords.lat, coords.lon);
                            } else {
                                // Last fallback: No coordinates, search globally
                                fetchPros(null, null);
                            }
                        } catch (err) { 
                            console.error("Profile location fetch failed", err);
                            fetchPros(null, null);
                        }
                    }
                );
            } else {
                fetchPros(null, null);
            }
        };
        fetchInitialData();
    }, []);

    // 2. Fetch Professionals Logic
    const fetchPros = async (lat = null, lon = null, silent = false) => {
        if (!silent) setLoading(true);
        try {
            const params = new URLSearchParams();
            if (lat && lon) {
                params.append('lat', lat);
                params.append('lon', lon);
                params.append('radius', 5000); // Massive radius to get "All Professionals" but prioritized by 50km
            }
            if (selectedRole !== 'All' && selectedRole !== 'Invited') {
                params.append('sub_category', selectedRole);
            }

            const storedUser = localStorage.getItem('planora_current_user') || localStorage.getItem('user');
            const userData = storedUser ? JSON.parse(storedUser) : null;
            const userId = userData?.user_id || userData?.id;
            if (userId) params.append('userId', userId);

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/professionals/nearby?${params.toString()}`, {

                headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                console.log(`[Discover] Fetched ${data.length} experts for ${selectedRole}`);
                setProfessionals(Array.isArray(data) ? data : []);
            } else {
                console.error(`[Discover] API Error: ${res.status}`);
            }
        } catch (err) { console.error(err); }
        finally { if (!silent) setLoading(false); }
    };

    React.useEffect(() => {
        fetchPros(userLocation?.lat, userLocation?.lon);
    }, [selectedRole, userLocation]);

    // 3. Filtering Logic
    const filteredPros = professionals.filter(pro => {
        if (assignedUserIds.has(pro.user_id)) return false;
        const proCat = (pro.category || '').toUpperCase();
        if (proCat === 'LAND OWNER' || proCat === 'ADMIN') return false;
        
        // 1. Phase/Category Consistency
        if (selectedRole === 'All') {
            // Only show pros belonging to this phase's role list
            if (!PHASES[selectedPhase].includes(pro.sub_category)) return false;
        }

        // 2. Search Query
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return pro.name?.toLowerCase().includes(q) || pro.sub_category?.toLowerCase().includes(q) || pro.specialization?.toLowerCase().includes(q);
        }
        return true;
    });

    const handleInvite = async (e, pro) => {
        e.stopPropagation();
        if (!selectedProjectId) return alert("Select a project first");
        setIsInviting(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${selectedProjectId}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` },
                body: JSON.stringify({ userId: pro.user_id, role: pro.sub_category || pro.category })
            });
            if (res.ok) {
                setAssignedUserIds(prev => new Set(prev).add(pro.user_id));
                alert("Invite sent!");
            }
        } catch (err) { console.error(err); }
        finally { setIsInviting(false); }
    };

    const handleViewProfile = (pro) => {
        setSelectedPro(pro);
        setIsProfileOpen(true);
    };

    // Component: Profile Modal
    const renderProfileModal = () => (
        <AnimatePresence>
            {isProfileOpen && selectedPro && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#3E2B26]/60 backdrop-blur-md" onClick={() => setIsProfileOpen(false)} />
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden border border-[#E3DACD]">
                        <div className="h-2 bg-gradient-to-r from-[#E68A2E] to-[#C06842]"></div>
                        <div className="p-8 md:p-12 overflow-y-auto max-h-[90vh] custom-scrollbar">
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex gap-6 items-center">
                                    <div className="w-20 h-20 rounded-3xl bg-[#F9F7F2] border border-[#E3DACD] flex items-center justify-center text-2xl font-black text-[#b96a41]">{selectedPro.name.charAt(0).toUpperCase()}</div>
                                    <div>
                                        <h2 className="text-2xl font-black text-[#2A1F1D]">{selectedPro.name}</h2>
                                        <span className="text-[10px] font-black text-white bg-[#b96a41] px-3 py-1 rounded-full uppercase tracking-tighter">{selectedPro.sub_category}</span>
                                    </div>
                                </div>
                                <button onClick={() => setIsProfileOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={24} /></button>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-4 bg-gray-50 rounded-2xl">
                                    <p className="text-[10px] font-bold text-[#8C7B70] uppercase mb-1">Rating</p>
                                    <div className="flex items-center gap-1"><Star size={14} className="fill-amber-400 text-amber-400" /><span className="font-bold">{selectedPro.rating || 'N/A'}</span></div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl">
                                    <p className="text-[10px] font-bold text-[#8C7B70] uppercase mb-1">Distance</p>
                                    <p className="font-bold">{selectedPro.distance ? `${parseFloat(selectedPro.distance).toFixed(1)} km` : 'Near you'}</p>
                                </div>
                            </div>
                            <div className="mb-8">
                                <p className="text-[10px] font-bold text-[#b96a41] uppercase mb-2 leading-none tracking-widest ">Bio & Specialization</p>
                                <p className="text-sm text-[#5D4037] leading-relaxed italic">"{selectedPro.bio || selectedPro.specialization || "Professional expert ready for your project."}"</p>
                            </div>
                            <button onClick={(e) => handleInvite(e, selectedPro)} disabled={assignedUserIds.has(selectedPro.user_id)} className="w-full py-4 bg-[#3E2B26] text-white rounded-2xl font-bold hover:bg-[#b96a41] transition-all disabled:opacity-50">
                                {assignedUserIds.has(selectedPro.user_id) ? 'Already Invited' : 'Invite to Project'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    // Map Mode Overlay (Rendered via Portal to escape standard layout stacking)
    const mapOverlay = viewMode === 'map' ? (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col overflow-hidden">
            {/* Back Button (Independent for focus) */}
            <div className="absolute top-8 left-8 z-[10001]">
                <button 
                    onClick={() => setViewMode('grid')} 
                    className="flex items-center gap-2 px-5 py-3 bg-[#3E2B26] text-white rounded-2xl hover:bg-[#b96a41] transition-all shadow-2xl font-bold uppercase text-[11px] tracking-widest group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    Back
                </button>
            </div>

            {/* Unified Command Center (Based on Provided Image) */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[10000] w-full max-w-xl px-4">
                <div className="bg-white/95 backdrop-blur-xl rounded-[28px] border border-[#E3DACD] shadow-2xl overflow-hidden flex items-center p-1.5 h-14">
                    {/* Left Dropdown: Phase Selection */}
                    <div className="relative flex-1 group h-full">
                        <select 
                            value={selectedPhase} 
                            onChange={(e) => {
                                setSelectedPhase(e.target.value);
                                setSelectedRole('All');
                            }} 
                            className="w-full h-full pl-6 pr-10 bg-transparent border-none focus:ring-0 focus:outline-none appearance-none text-sm font-black text-[#3E2B26] cursor-pointer"
                        >
                            {Object.keys(PHASES).map(phase => (
                                <option key={phase} value={phase}>{phase}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                            <Filter size={14} />
                        </div>
                    </div>
                    
                    {/* Vertical Divider */}
                    <div className="w-[1px] h-8 bg-[#E3DACD]"></div>

                    {/* Right Dropdown: Specialist Selection */}
                    <div className="relative flex-1 group h-full">
                        <select 
                            value={selectedRole} 
                            onChange={(e) => setSelectedRole(e.target.value)} 
                            className="w-full h-full pl-6 pr-12 bg-transparent border-none focus:ring-0 focus:outline-none appearance-none text-sm font-bold text-[#5D4037] cursor-pointer"
                        >
                            {PHASES[selectedPhase].map(role => (
                                <option key={role} value={role}>{role === 'All' ? `All Professionals` : role}</option>
                            ))}
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                            <Plus size={16} />
                        </div>
                    </div>
                </div>

                {/* Sub-label showing count */}
                <div className="mt-3 text-center">
                    <span className="bg-[#3E2B26]/80 text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full backdrop-blur-md shadow-lg border border-white/10">
                        {filteredPros.length} DISCOVERED IN {selectedPhase.toUpperCase()}
                    </span>
                </div>
            </div>

            <div className="flex-1">
                <MapProfessionals 
                    professionals={filteredPros} 
                    userLocation={userLocation} 
                    onViewProfile={handleViewProfile} 
                    onInvite={handleInvite} 
                    assignedUserIds={assignedUserIds} 
                    selectedProjectId={selectedProjectId} 
                />
            </div>
            {renderProfileModal()}
        </div>
    ) : null;

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] relative p-4 lg:p-0">
            {/* GRID ONLY RENDER */}
            {viewMode === 'map' && createPortal(mapOverlay, document.body)}
            
            {/* Grid Mode Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-gradient-to-br from-[#E68A2E] to-[#C06842] text-white rounded-2xl shadow-xl shadow-[#C06842]/20">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-serif font-black text-[#2A1F1D] tracking-tight">Professional Discovery</h1>
                        <p className="text-[11px] font-bold text-[#b96a41] uppercase tracking-[0.2em] mt-1">Premium Local Teams • Verified Experts</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-[#F9F7F2] p-1.5 rounded-2xl border border-[#E3DACD]/50 shadow-inner">
                    <button 
                        onClick={() => setViewMode('grid')} 
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 font-bold uppercase text-[9px] tracking-widest ${viewMode === 'grid' ? 'bg-[#3E2B26] text-white shadow-lg' : 'text-[#8C7B70] hover:bg-white'}`}
                    >
                        <LayoutGrid size={16} />
                        Grid Mode
                    </button>
                    <button 
                        onClick={() => setViewMode('map')} 
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 font-bold uppercase text-[9px] tracking-widest ${viewMode === 'map' ? 'bg-[#3E2B26] text-white shadow-lg' : 'text-[#8C7B70] hover:bg-white'}`}
                    >
                        <Map size={16} />
                        View Map
                    </button>
                </div>
            </div>

            {/* Grid Mode Controls */}
            <div className="flex flex-col lg:flex-row gap-4 mb-8">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b96a41] group-hover:scale-110 transition-transform" size={20} />
                    <input type="text" placeholder="Search experts by name or specialty..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-white border border-[#E3DACD] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#b96a41]/40 shadow-sm font-medium transition-all" />
                </div>
                <div className="flex gap-4">
                    <select 
                        value={selectedPhase} 
                        onChange={(e) => {
                            setSelectedPhase(e.target.value);
                            setSelectedRole('All');
                        }} 
                        className="px-6 py-4 bg-white border border-[#E3DACD] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#b96a41]/40 font-bold text-[#3E2B26] shadow-sm appearance-none min-w-[200px]"
                    >
                        {Object.keys(PHASES).map(phase => (
                            <option key={phase} value={phase}>{phase}</option>
                        ))}
                    </select>
                    <select 
                        value={selectedRole} 
                        onChange={(e) => setSelectedRole(e.target.value)} 
                        className="px-6 py-4 bg-white border border-[#E3DACD] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#b96a41]/40 font-bold text-[#5D4037] shadow-sm appearance-none min-w-[200px]"
                    >
                        {PHASES[selectedPhase].map(role => (
                            <option key={role} value={role}>{role === 'All' ? `All Professionals` : role}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center h-64">
                    <div className="w-14 h-14 border-4 border-[#b96a41] border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-[#8C7B70] font-bold uppercase tracking-widest text-xs">Fetching Nearby Experts...</p>
                </div>
            ) : filteredPros.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white rounded-[40px] border border-dashed border-[#E3DACD]">
                    <div className="p-8 bg-[#FDFCF8] rounded-full mb-6">
                        <User size={48} className="text-[#b96a41] opacity-40" />
                    </div>
                    <h3 className="text-2xl font-serif font-black text-[#2A1F1D] mb-3">No Professionals Found</h3>
                    <p className="text-[#8C7B70] max-w-sm font-medium leading-relaxed">Try adjusting your category filters or search query to find more local experts for your project.</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto px-1 pb-20 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredPros.map(pro => (
                            <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={pro.user_id} className="group bg-white rounded-[32px] border border-[#E3DACD]/60 hover:border-[#b96a41]/40 transition-all duration-500 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-[#b96a41]/10 flex flex-col">
                                <div className="p-8 flex-1">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-16 h-16 rounded-2xl bg-[#F9F7F2] border border-[#E3DACD] flex items-center justify-center text-xl font-black text-[#b96a41] group-hover:bg-[#b96a41] group-hover:text-white transition-all duration-500">{pro.name.charAt(0).toUpperCase()}</div>
                                        <div>
                                            <h3 className="text-xl font-bold text-[#2A1F1D] leading-none mb-2">{pro.name}</h3>
                                            <span className="text-[10px] font-black text-[#b96a41] bg-[#b96a41]/10 px-3 py-1 rounded-full uppercase tracking-tighter group-hover:bg-white group-hover:text-[#b96a41] transition-all">{pro.sub_category || pro.category}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4 mb-8">
                                        <div className="flex items-center text-sm text-[#5D4037] bg-gray-50/80 p-3 rounded-xl border border-gray-100"><MapPin size={16} className="text-[#b96a41] mr-3" /> <span className="font-bold truncate">{pro.city || 'Remote Available'}</span></div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="flex items-center justify-center gap-2 bg-amber-50/60 py-2.5 rounded-xl border border-amber-100/50"><Star size={14} className="fill-amber-400 text-amber-400" /> <span className="font-black text-amber-700 text-sm">{pro.rating || 'N/A'}</span></div>
                                            <div className="flex items-center justify-center gap-2 bg-gray-50/60 py-2.5 rounded-xl border border-gray-100"><Award size={14} className="text-[#8C7B70]" /> <span className="font-black text-[#8C7B70] text-sm uppercase">{pro.experience_years ? `${pro.experience_years}y Exp` : 'New'}</span></div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => handleViewProfile(pro)} className="flex-1 py-3 bg-[#FDFCF8] border border-[#E3DACD] text-[#5D4037] text-xs font-bold rounded-xl hover:bg-white transition-all">Details</button>
                                        <button onClick={(e) => handleInvite(e, pro)} disabled={assignedUserIds.has(pro.user_id)} className="flex-[2] py-3 bg-[#3E2B26] text-white text-xs font-bold rounded-xl hover:bg-[#b96a41] transition-all disabled:opacity-40">Invite</button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
            {renderProfileModal()}
        </div>
    );
};

export default FindProfessionals;
