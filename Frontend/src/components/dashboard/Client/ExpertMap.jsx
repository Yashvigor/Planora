import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, LayersControl } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { User, Briefcase, MapPin, Star, Phone, MessageSquare, Plus, X, FileText, ArrowLeft } from 'lucide-react';

// Fix Leaflet marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom function to animate map movements
const SetViewOnClick = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
        if (coords) map.setView(coords, map.getZoom(), { animate: true });
    }, [coords, map]);
    return null;
};

const ExpertMap = ({ currentProjectId, category, subCategory, onAssign, onClose }) => {
    const [professionals, setProfessionals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
    const [selectedPro, setSelectedPro] = useState(null);
    const [activeCategory, setActiveCategory] = useState(category || 'All');
    const [activeSubCategory, setActiveSubCategory] = useState(subCategory || 'All');
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const categories = ['All', 'Planning', 'Design and Finish', 'SiteWork'];
    const subCategories = {
        'All': ['All'],
        'Planning': ['All', 'Architect', 'Structural Engineer', 'Civil Engineer'],
        'Design and Finish': ['All', 'Interior Designer', 'False Ceiling Worker', 'Fabrication Worker'],
        'SiteWork': ['All', 'Mason', 'Electrician', 'Plumber', 'Carpenter', 'Tile Worker', 'Painter']
    };

    const [userLocation, setUserLocation] = useState(null);

    // Fetch current user's location
    useEffect(() => {
        let watchId = null;

        const fetchUserLocation = async () => {
            setLoading(true);

            // 1. Try Browser Geolocation with watchPosition for Realtime Updates
            if (navigator.geolocation) {
                watchId = navigator.geolocation.watchPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        // (removed)
                        setUserLocation({ lat: latitude, lon: longitude });

                        // Only center map initially if default
                        setMapCenter(prev => (prev[0] === 20.5937 && prev[1] === 78.9629) ? [latitude, longitude] : prev);
                        setLoading(false);
                    },
                    (error) => {
                        console.warn('[ExpertMap] Realtime location denied/error:', error.message);
                        // If watch fails, fall back to profile data
                        fetchProfileLocation();
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    }
                );
            } else {
                fetchProfileLocation();
            }
        };

        const fetchProfileLocation = async () => {
            try {
                const storedUser = localStorage.getItem('planora_current_user') || localStorage.getItem('user');
                const userData = storedUser ? JSON.parse(storedUser) : null;
                const userId = userData ? (userData.user_id || userData.id) : null;

                if (!userId) {
                    console.error('[ExpertMap] No user found in localStorage');
                    setLoading(false);
                    return;
                }

                // Get User Profile
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/${userId}`);
                const data = await res.json();
                // (removed)

                let lat = data.latitude;
                let lon = data.longitude;

                // Geocode city if lat/lon missing
                if ((!lat || !lon) && data.city) {
                    console.log(`[ExpertMap] Coordinates missing. Geocoding city: ${data.city}`);
                    try {
                        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(data.city)}&limit=1`, {
                            headers: { 'User-Agent': 'PlanoraApp/1.0' }
                        });
                        const geoData = await geoRes.json();
                        if (geoData && geoData.length > 0) {
                            lat = parseFloat(geoData[0].lat);
                            lon = parseFloat(geoData[0].lon);
                            console.log(`[ExpertMap] Geocoded ${data.city} to:`, lat, lon);
                        }
                    } catch (geoErr) {
                        console.error('[ExpertMap] Geocoding failed:', geoErr);
                    }
                }

                if (lat && lon) {
                    setUserLocation({ lat, lon });
                    setMapCenter([lat, lon]);
                } else {
                    console.warn('[ExpertMap] Could not determine location.');
                    // alert("We couldn't get your location from your browser or profile. Please enable location services or update your profile city.");
                }

            } catch (err) {
                console.error('Error fetching user location fallback:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserLocation();

        return () => {
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        };
    }, []);

    const fetchProfessionals = async () => {
        if (!userLocation) {
            console.log('[ExpertMap] Waiting for user location...');
            return;
        }

        setLoading(true);
        try {
            // New endpoint with radius parameter (default 50km)
            let url = `${import.meta.env.VITE_API_URL}/api/professionals/nearby`;
            const params = new URLSearchParams();
            params.append('lat', userLocation.lat);
            params.append('lon', userLocation.lon);
            params.append('radius', 50); // 50km radius
            if (activeCategory !== 'All') params.append('category', activeCategory);
            if (activeSubCategory !== 'All') params.append('sub_category', activeSubCategory);

            url += `?${params.toString()}`;

            const res = await fetch(url);
            const data = await res.json();

            if (res.ok) {
                setProfessionals(data);
                // (removed)
            } else {
                console.error('[ExpertMap] API Error:', data.error);
                setProfessionals([]);
            }
        } catch (err) {
            console.error('Error fetching professionals:', err);
            setProfessionals([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfessionals();
    }, [activeCategory, activeSubCategory, userLocation]);

    const handleAssign = async (proId, proName, proRole) => {
        if (!currentProjectId) {
            alert("Please select or create a project first.");
            return;
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${currentProjectId}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: proId, role: proRole })
            });

            if (res.ok) {
                alert(`${proName} assigned to your project successfully!`);
                if (onAssign) onAssign();
                setIsProfileOpen(false);
            }
        } catch (err) {
            alert("Failed to assign professional.");
        }
    };

    return (
        <div className="relative w-full h-full rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl bg-[#F9F7F2]">
            {loading && (
                <div className="absolute inset-0 z-[1001] bg-white/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-[#C06842] border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 font-bold text-[#8C7B70] animate-pulse uppercase tracking-widest text-xs">Mapping Professionals...</p>
                    </div>
                </div>
            )}



            <MapContainer center={mapCenter} zoom={18} maxZoom={19} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
                <LayersControl position="bottomright">
                    <LayersControl.BaseLayer checked name="Google Maps">
                        <TileLayer
                            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                            attribution='&copy; Google Maps'
                            maxZoom={20}
                        />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Satellite (Hybrid)">
                        <TileLayer
                            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                            attribution='&copy; Google Maps'
                            maxZoom={20}
                        />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Satellite (Clean)">
                        <TileLayer
                            url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                            attribution='&copy; Google Maps'
                            maxZoom={20}
                        />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Terrain">
                        <TileLayer
                            url="https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}"
                            attribution='&copy; Google Maps'
                            maxZoom={20}
                        />
                    </LayersControl.BaseLayer>
                </LayersControl>

                <SetViewOnClick coords={mapCenter} />

                {/* User Location Marker */}
                {userLocation && (
                    <>
                        <Circle
                            center={[userLocation.lat, userLocation.lon]}
                            pathOptions={{ color: '#C06842', fillColor: '#C06842', fillOpacity: 0.15, weight: 2, dashArray: '10, 10' }}
                            radius={50000}
                        />
                        <Marker
                            position={[userLocation.lat, userLocation.lon]}
                            icon={L.divIcon({
                                className: 'custom-user-marker',
                                html: `<div style="background-color: #3E2B26; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 4px rgba(192, 104, 66, 0.4);"></div>`,
                                iconSize: [20, 20],
                                iconAnchor: [10, 10]
                            })}
                            zIndexOffset={1000}
                        >
                            <Popup closeButton={false} offset={[0, -10]} className="custom-popup-minimal">
                                <div className="px-3 py-1 bg-[#3E2B26] text-white text-[10px] font-bold rounded-full shadow-lg">
                                    You are here
                                </div>
                            </Popup>
                        </Marker>
                    </>
                )}

                {professionals.map((pro) => (
                    <Marker
                        key={pro.user_id}
                        position={[pro.latitude, pro.longitude]}
                        eventHandlers={{
                            click: () => setSelectedPro(pro),
                        }}
                    >
                        <Popup className="custom-popup">
                            <div className="p-1 min-w-[200px]">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-[#fceee0] border border-[#C06842]/20 flex items-center justify-center text-[#C06842]">
                                        <Briefcase size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-[#2A1F1D]">{pro.name}</h4>
                                        <p className="text-[10px] text-[#8C7B70] uppercase font-bold">{pro.sub_category || pro.category}</p>
                                    </div>
                                </div>
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-[10px] text-[#6E5E56]">
                                        <MapPin size={12} className="text-[#C06842]" />
                                        <span className="truncate max-w-[150px]">{pro.address || 'Location Verified'}</span>
                                    </div>
                                    {pro.experience_years && (
                                        <div className="flex items-center gap-2 text-[10px] text-[#6E5E56]">
                                            <Star size={12} className="text-yellow-500" />
                                            <span>{pro.experience_years} Years Experience</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setSelectedPro(pro); setIsProfileOpen(true); }}
                                        className="flex-1 py-1.5 bg-[#2A1F1D] text-white rounded-lg text-[10px] font-bold hover:bg-[#C06842] transition-colors flex items-center justify-center gap-1"
                                    >
                                        <User size={10} /> View Profile
                                    </button>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Controls moved after MapContainer to ensure visibility */}

            {/* Internal Filter Bar - kept at top, increased z-index */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[2000] flex gap-2 bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-[#E3DACD]/50">
                <select
                    value={activeCategory}
                    onChange={(e) => { setActiveCategory(e.target.value); setActiveSubCategory('All'); }}
                    className="bg-transparent text-xs font-bold text-[#3E2B26] outline-none px-4 py-2 border-r border-[#E3DACD]"
                >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <select
                    value={activeSubCategory}
                    onChange={(e) => setActiveSubCategory(e.target.value)}
                    className="bg-transparent text-xs font-bold text-[#3E2B26] outline-none px-4 py-2"
                >
                    {subCategories[activeCategory].map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
            </div>

            {/* Recenter Button */}
            <button
                onClick={() => userLocation && setMapCenter([userLocation.lat, userLocation.lon])}
                className="absolute bottom-6 left-6 z-[2000] p-3 bg-white text-[#3E2B26] rounded-full shadow-xl hover:bg-[#F9F7F2] hover:scale-110 transition-all border border-[#E3DACD]"
                title="Recenter on Me"
            >
                <MapPin size={20} className="fill-[#C06842] text-[#C06842]" />
            </button>


            {/* Profile Sidebar/Modal */}
            <AnimatePresence>
                {isProfileOpen && selectedPro && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        className="absolute top-0 right-0 h-full w-80 bg-white z-[1001] shadow-2xl border-l border-[#E3DACD] flex flex-col"
                    >
                        <div className="p-6 bg-[#FDFCF8] border-b border-[#E3DACD] flex justify-between items-center">
                            <h3 className="font-serif font-bold text-[#3E2B26]">Professional Details</h3>
                            <button onClick={() => setIsProfileOpen(false)} className="text-[#8C7B70] hover:text-[#3E2B26]"><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                            <div className="text-center">
                                <div className="w-20 h-20 mx-auto rounded-3xl bg-[#F9F7F2] border-2 border-[#E3DACD] flex items-center justify-center text-[#A65D3B] shadow-inner mb-4">
                                    <User size={40} />
                                </div>
                                <h4 className="text-lg font-serif font-bold text-[#3E2B26]">{selectedPro.name}</h4>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#A65D3B]">{selectedPro.sub_category}</span>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-[#8C7B70] uppercase tracking-widest block">Bio</label>
                                    <p className="text-xs text-[#5D4037] leading-relaxed italic">"{selectedPro.bio || 'Professional building the future with Planora.'}"</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-[#F9F7F2] rounded-xl border border-[#E3DACD]/50 text-center">
                                        <span className="block text-xl font-bold text-[#3E2B26]">{selectedPro.experience_years || '5+'}</span>
                                        <span className="text-[9px] font-black text-[#8C7B70] uppercase">Experience</span>
                                    </div>
                                    <div className="p-3 bg-[#F9F7F2] rounded-xl border border-[#E3DACD]/50 text-center">
                                        <span className="block text-xl font-bold text-[#3E2B26] truncate" title={selectedPro.specialization || 'General'}>{selectedPro.specialization || 'Expert'}</span>
                                        <span className="text-[9px] font-black text-[#8C7B70] uppercase">Specialty</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-[#8C7B70] uppercase tracking-widest block">Credentials</label>
                                {selectedPro.resume_path ? (
                                    <a href={`${import.meta.env.VITE_API_URL}/${selectedPro.resume_path}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 border-2 border-[#E3DACD] rounded-xl hover:border-[#A65D3B] text-[#5D4037] transition-all">
                                        <FileText size={16} />
                                        <span className="text-xs font-bold">View Resume</span>
                                    </a>
                                ) : (
                                    <div className="p-3 border-2 border-dashed border-[#E3DACD] rounded-xl text-center text-[#8C7B70]">
                                        <span className="text-[10px] font-bold">Resume Not Available</span>
                                    </div>
                                )}
                                {selectedPro.portfolio_url && (
                                    <a href={selectedPro.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 border-2 border-[#E3DACD] rounded-xl hover:border-[#A65D3B] text-[#5D4037] transition-all">
                                        <Star size={16} />
                                        <span className="text-xs font-bold">Portfolio Link</span>
                                    </a>
                                )}
                            </div>
                        </div>
                        <div className="p-6 bg-white border-t border-[#E3DACD]">
                            <button
                                onClick={() => handleAssign(selectedPro.user_id, selectedPro.name, selectedPro.sub_category)}
                                className="w-full py-4 bg-[#3E2B26] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#2A1F1D] shadow-xl transition-all"
                            >
                                Hire for Project
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ExpertMap;
