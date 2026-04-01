import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Star, MapPin, User, Briefcase, Phone, Mail, Award, Clock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Fix for default marker icons in Leaflet + React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Marker Creator
const createCustomMarker = (category) => {
    const color = category === 'Contractor' ? '#b96a41' : 
                  category === 'Architect' ? '#3E2B26' : 
                  category === 'Planning' ? '#E68A2E' : '#8C7B70';
    
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 10px; display: flex; items-center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.2); transform: rotate(45deg);"><div style="transform: rotate(-45deg); display: flex;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

// Component to handle map centering
const RecenterMap = ({ lat, lon }) => {
    const map = useMap();
    useEffect(() => {
        if (lat && lon) {
            map.setView([lat, lon], 13, {
                animate: true,
                duration: 1
            });
        }
    }, [lat, lon, map]);
    return null;
};

const MapProfessionals = ({ professionals, userLocation, onViewProfile, onInvite, assignedUserIds, selectedProjectId }) => {
    const center = userLocation ? [userLocation.lat, userLocation.lon] : [20.5937, 78.9629]; // Default to India center
    const [activePro, setActivePro] = useState(null);

    return (
        <div className="w-full h-full rounded-3xl overflow-hidden border border-[#E3DACD]/50 shadow-inner relative bg-[#f8f5f0]">
            <MapContainer 
                center={center} 
                zoom={12} 
                className="w-full h-full z-0" 
                zoomControl={false}
                style={{ background: '#e5e3df' }}
            >
                {/* Google Maps Style Tiles */}
                <TileLayer
                    url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                    attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
                />
                
                <ZoomControl position="bottomright" />
                <RecenterMap lat={userLocation?.lat} lon={userLocation?.lon} />

                {/* User Location Marker */}
                {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lon]} icon={L.divIcon({
                        className: 'user-location-marker',
                        html: `<div class="relative flex items-center justify-center">
                                <div class="absolute w-8 h-8 bg-[#b96a41]/20 rounded-full animate-ping"></div>
                                <div class="relative w-4 h-4 bg-[#b96a41] border-2 border-white rounded-full shadow-lg"></div>
                               </div>`,
                        iconSize: [32, 32],
                        iconAnchor: [16, 16]
                    })}>
                        <Popup className="premium-popup">
                            <div className="p-1 font-bold text-[#3E2B26]">You are here</div>
                        </Popup>
                    </Marker>
                )}

                {/* Professional Markers */}
                {professionals.map((pro) => (
                    pro.latitude && pro.longitude && (
                        <Marker 
                            key={pro.user_id} 
                            position={[parseFloat(pro.latitude), parseFloat(pro.longitude)]}
                            icon={createCustomMarker(pro.category)}
                            eventHandlers={{
                                click: () => setActivePro(pro)
                            }}
                        >
                            <Popup className="premium-popup custom-leaflet-popup" minWidth={280}>
                                <div className="p-2">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FDFCF8] to-[#F9F7F2] border border-[#E3DACD] flex items-center justify-center text-[#3E2B26] font-serif font-black text-xl shadow-sm">
                                            {pro.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-[#2A1F1D] leading-tight">{pro.name}</h4>
                                            <span className="text-[10px] font-black text-[#b96a41] uppercase tracking-widest bg-[#b96a41]/10 px-2 py-0.5 rounded-full border border-[#b96a41]/10">
                                                {pro.sub_category || pro.category}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center text-xs text-[#5D4037] bg-[#F9F7F2] p-2 rounded-lg border border-[#E3DACD]/30">
                                            <MapPin size={14} className="text-[#b96a41] mr-2 shrink-0" />
                                            <span className="truncate">{pro.city || 'Available Nearby'}</span>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-1.5 rounded-lg border border-amber-100">
                                                <Star size={12} className="fill-amber-400 text-amber-400" />
                                                <span className="text-xs font-bold text-amber-700">{pro.rating || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-[#FDFCF8] px-2 py-1.5 rounded-lg border border-[#E3DACD]/50 text-[#8C7B70]">
                                                <Award size={12} />
                                                <span className="text-[10px] font-bold uppercase">{pro.experience_years ? pro.experience_years + 'y Exp' : 'New'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => onViewProfile(pro)}
                                            className="flex-1 py-2 bg-white border border-[#E3DACD] hover:border-[#b96a41]/50 text-[#5D4037] text-[11px] font-bold rounded-lg transition-all"
                                        >
                                            View Profile
                                        </button>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onInvite(e, pro);
                                            }}
                                            disabled={!selectedProjectId || assignedUserIds.has(pro.user_id)}
                                            className="flex-1 py-2 bg-[#3E2B26] text-white text-[11px] font-bold rounded-lg hover:bg-[#b96a41] transition-all disabled:opacity-50"
                                        >
                                            {assignedUserIds.has(pro.user_id) ? 'Invited' : 'Invite'}
                                        </button>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    )
                ))}
            </MapContainer>

            {/* Map Legend / Overlay Controls */}
            <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-3">
                <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-[#E3DACD]/50 shadow-xl max-w-[200px]">
                    <h5 className="text-[10px] font-black text-[#5D4037] uppercase tracking-[0.2em] mb-3 opacity-60">Map Legend</h5>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-[#b96a41] rounded-full ring-2 ring-[#b96a41]/20"></div>
                            <span className="text-[11px] font-bold text-[#2A1F1D]">Contractors</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-[#3E2B26] rounded-full ring-2 ring-[#3E2B26]/20"></div>
                            <span className="text-[11px] font-bold text-[#2A1F1D]">Architects</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-[#E68A2E] rounded-full ring-2 ring-[#E68A2E]/20"></div>
                            <span className="text-[11px] font-bold text-[#2A1F1D]">Designers</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-[#8C7B70] rounded-full ring-2 ring-[#8C7B70]/20"></div>
                            <span className="text-[11px] font-bold text-[#2A1F1D]">Field Workers</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Selected Professional Card (Quick View) */}
            <AnimatePresence>
                {activePro && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="absolute bottom-10 left-10 right-10 md:left-auto md:right-10 md:w-96 z-[1000] bg-white rounded-3xl border border-[#E3DACD] shadow-2xl overflow-hidden"
                    >
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-[#FDFCF8] border border-[#E3DACD] flex items-center justify-center text-[#b96a41] font-serif font-black text-2xl">
                                        {activePro.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#2A1F1D] text-lg">{activePro.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-[#b96a41] uppercase tracking-widest bg-[#b96a41]/10 px-2.5 py-1 rounded-full">{activePro.sub_category || activePro.category}</span>
                                            <div className="flex items-center gap-1 text-amber-500">
                                                <Star size={12} className="fill-current" />
                                                <span className="text-xs font-bold">{activePro.rating || 'New'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setActivePro(null)}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                                >
                                    <Briefcase size={20} />
                                </button>
                            </div>

                            <p className="text-sm text-[#8C7B70] line-clamp-2 mb-5 italic">"{activePro.specialization || activePro.bio || 'Professional expert ready for your project.'}"</p>

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => onViewProfile(activePro)}
                                    className="flex-1 py-3 bg-[#FDFCF8] border border-[#E3DACD] text-[#5D4037] rounded-xl text-sm font-bold hover:bg-white transition-all shadow-sm"
                                >
                                    Full Details
                                </button>
                                <button 
                                    onClick={(e) => onInvite(e, activePro)}
                                    disabled={!selectedProjectId || assignedUserIds.has(activePro.user_id)}
                                    className="flex-[1.5] py-3 bg-[#3E2B26] text-white rounded-xl text-sm font-bold hover:bg-[#b96a41] transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    {assignedUserIds.has(activePro.user_id) ? 'Pending Approval' : 'Invite to Project'}
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="h-1.5 bg-gradient-to-r from-[#b96a41] via-[#d48c66] to-[#b96a41]"></div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MapProfessionals;
