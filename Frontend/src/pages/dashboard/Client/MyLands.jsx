import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import { useMockApp } from '../../../hooks/useMockApp';
import { MapPin, Upload, Plus, Gavel, Clock, DollarSign } from 'lucide-react';

const MyLands = () => {
    const [lands, setLands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingLandId, setEditingLandId] = useState(null);
    const [isAuctioning, setIsAuctioning] = useState(false);
    const [auctionLand, setAuctionLand] = useState(null);
    const [auctionData, setAuctionData] = useState({
        base_price: '',
        duration_hours: '24'
    });
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        area: '',
        type: 'Residential',
        document: null
    });

    const storedUser = localStorage.getItem('planora_current_user') || localStorage.getItem('user');
    const userData = storedUser ? JSON.parse(storedUser) : null;
    const userId = userData ? (userData.user_id || userData.id) : null;

    const fetchLands = async () => {
        if (!userId) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/lands/user/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setLands(data);
            }
        } catch (err) {
            console.error("Error fetching lands:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLands();
        const poll = setInterval(fetchLands, 30000);
        return () => clearInterval(poll);
    }, [userId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userId) {
            alert("User not found. Please log in.");
            return;
        }

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('owner_id', userId);
            formDataToSend.append('name', formData.name);
            formDataToSend.append('location', formData.location);
            formDataToSend.append('area', formData.area);
            formDataToSend.append('type', formData.type);
            if (formData.document) {
                formDataToSend.append('document', formData.document);
            }

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/lands`, {
                method: 'POST',
                body: formDataToSend,
            });

            if (res.ok) {
                await fetchLands();
                setIsAdding(false);
                setFormData({ name: '', location: '', area: '', type: 'Residential', document: null });
            } else {
                alert("Failed to add land.");
            }
        } catch (err) {
            console.error("Error adding land:", err);
            alert("Error adding land.");
        }
    };

    const handleEditSubmit = async (e, landId) => {
        e.preventDefault();
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('location', formData.location);
            formDataToSend.append('area', formData.area);
            formDataToSend.append('type', formData.type);
            if (formData.document) {
                formDataToSend.append('document', formData.document);
            }

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/lands/${landId}`, {
                method: 'PUT',
                body: formDataToSend,
            });

            if (res.ok) {
                await fetchLands();
                setEditingLandId(null);
                setFormData({ name: '', location: '', area: '', type: 'Residential', document: null });
            } else {
                alert("Failed to update land.");
            }
        } catch (err) {
            console.error("Error updating land:", err);
            alert("Error updating land.");
        }
    };

    const startEditing = (land) => {
        setFormData({
            name: land.name,
            location: land.location,
            area: land.area,
            type: land.type,
            document: null
        });
        setEditingLandId(land.land_id || land.id);
        setIsAdding(false);
    };

    const handleDelete = async (landId) => {
        if (!window.confirm("Are you sure you want to delete this land? This action cannot be undone.")) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/lands/${landId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                await fetchLands();
            } else {
                alert("Failed to delete land.");
            }
        } catch (err) {
            console.error("Error deleting land:", err);
            alert("Error deleting land.");
        }
    };

    const cancelEditing = () => {
        setEditingLandId(null);
        setFormData({ name: '', location: '', area: '', type: 'Residential', document: null });
    };

    const handleAuctionSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auctions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    land_id: auctionLand.land_id || auctionLand.id,
                    owner_id: userId,
                    base_price: auctionData.base_price,
                    duration_hours: auctionData.duration_hours
                })
            });

            if (res.ok) {
                alert("Land listed for auction successfully!");
                setIsAuctioning(false);
                setAuctionLand(null);
            } else {
                const err = await res.json();
                alert(err.error || "Failed to list for auction.");
            }
        } catch (err) {
            console.error("Error creating auction:", err);
            alert("Error creating auction.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">My Lands</h1>
                <button
                    onClick={() => {
                        cancelEditing();
                        setIsAdding(!isAdding);
                        if (!isAdding) {
                            setFormData({ name: '', location: '', area: '', type: 'Residential', document: null });
                        }
                    }}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="w-5 h-5 mr-2" /> Add New Land
                </button>
            </div>

            {/* Add Land Form Modal/Panel */}
            {isAdding && (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 animate-in fade-in slide-in-from-top-4">
                    <h2 className="text-lg font-semibold mb-4">Register New Land</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Land Name / Title</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="e.g. Green Valley Plot"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <div className="flex">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                                    <MapPin size={18} />
                                </span>
                                <input
                                    type="text"
                                    className="flex-1 px-4 py-2 border rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="City, Address"
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Area (sq.ft)</label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="5000"
                                value={formData.area}
                                onChange={e => setFormData({ ...formData, area: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option>Residential</option>
                                <option>Commercial</option>
                                <option>Industrial</option>
                                <option>Agricultural</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Land Proof (Optional)</label>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                onChange={e => setFormData({ ...formData, document: e.target.files[0] })}
                            />
                        </div>

                        <div className="md:col-span-2 flex justify-end space-x-3 mt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAdding(false);
                                    setFormData({ name: '', location: '', area: '', type: 'Residential', document: null });
                                }}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Save Land
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Lands Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lands.map(land => (
                    <div key={land.land_id || land.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                        {editingLandId === (land.land_id || land.id) ? (
                            <form onSubmit={(e) => handleEditSubmit(e, land.land_id || land.id)} className="p-5 space-y-4">
                                <h3 className="font-bold text-lg text-gray-900 mb-2">Edit Land Details</h3>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-1.5 border rounded focus:ring-1 focus:ring-blue-500 text-sm"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-1.5 border rounded focus:ring-1 focus:ring-blue-500 text-sm"
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Area</label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-1.5 border rounded focus:ring-1 focus:ring-blue-500 text-sm"
                                            value={formData.area}
                                            onChange={e => setFormData({ ...formData, area: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                                        <select
                                            className="w-full px-3 py-1.5 border rounded focus:ring-1 focus:ring-blue-500 text-sm"
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        >
                                            <option>Residential</option>
                                            <option>Commercial</option>
                                            <option>Industrial</option>
                                            <option>Agricultural</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Update Document (Optional)</label>
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        className="w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700"
                                        onChange={e => setFormData({ ...formData, document: e.target.files[0] })}
                                    />
                                </div>
                                <div className="flex justify-end space-x-2 pt-2 border-t mt-4">
                                    <button
                                        type="button"
                                        onClick={cancelEditing}
                                        className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <div className="h-40 bg-gray-200 relative overflow-hidden">
                                    <iframe
                                        title={`Map view for ${land.location}`}
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        loading="lazy"
                                        allowFullScreen
                                        referrerPolicy="no-referrer-when-downgrade"
                                        src={`https://maps.google.com/maps?q=${encodeURIComponent(land.location)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                                    ></iframe>
                                    <div className="absolute top-4 right-4 bg-white px-2 py-1 rounded text-xs font-semibold shadow-sm overflow-hidden z-[1]">
                                        {land.type}
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h3 className="font-bold text-lg text-gray-900">{land.name}</h3>
                                    <div className="flex items-center text-gray-500 mt-2 space-x-4 text-sm">
                                        <span className="flex items-center"><MapPin size={14} className="mr-1" /> {land.location}</span>
                                        <span>{land.area} sq.ft</span>
                                    </div>
                                    {land.auction_status === 'rejected' && land.auction_rejection_reason && (
                                        <p className="mt-2 text-[10px] text-red-500 font-medium italic bg-red-50 p-2 rounded-lg">
                                            Rejection Reason: {land.auction_rejection_reason}
                                        </p>
                                    )}

                                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                        {land.documents_path ? (
                                            <a
                                                href={`${import.meta.env.VITE_API_URL}/${land.documents_path}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 text-sm font-medium hover:text-blue-700"
                                            >
                                                View Documents
                                            </a>
                                        ) : (
                                            <span className="text-gray-400 text-sm italic">No docs attached</span>
                                        )}
                                        <div className="flex space-x-2">
                                            {land.auction_status ? (
                                                <div className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex flex-col items-end ${
                                                    land.auction_status === 'active' ? 'bg-green-50 text-green-600' :
                                                    land.auction_status === 'pending_verification' ? 'bg-blue-50 text-blue-600' :
                                                    land.auction_status === 'completed' ? 'bg-green-50 text-green-700 border border-green-100' :
                                                    land.auction_status === 'closed' ? 'bg-gray-50 text-gray-500 border border-gray-100' :
                                                    'bg-red-50 text-red-600'
                                                }`}>
                                                    <span>{
                                                        land.auction_status === 'pending_verification' ? 'Auction Pending' : 
                                                        land.auction_status === 'active' ? 'Auction Live' : 
                                                        land.auction_status === 'completed' ? 'Auction Completed' :
                                                        land.auction_status === 'closed' ? 'Auction Closed' :
                                                        'Auction Rejected'
                                                    }</span>
                                                    {(land.auction_status === 'active' || land.auction_status === 'completed') && land.current_highest_bid && (
                                                        <span className={`${land.auction_status === 'completed' ? 'text-green-800' : 'text-green-700'} text-[9px] font-black mt-0.5`}>
                                                            {land.auction_status === 'completed' ? 'Final:' : 'High:'} ₹{parseFloat(land.current_highest_bid).toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setAuctionLand(land);
                                                        setIsAuctioning(true);
                                                    }}
                                                    className="px-3 py-1 bg-orange-50 text-orange-600 border border-orange-100 text-xs rounded hover:bg-orange-100 flex items-center"
                                                >
                                                    <Gavel size={12} className="mr-1" /> Auction
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(land.land_id || land.id)}
                                                className="px-3 py-1 bg-red-50 text-red-600 border border-red-100 text-xs rounded hover:bg-red-100"
                                            >
                                                Delete
                                            </button>
                                            <button
                                                onClick={() => startEditing(land)}
                                                className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Auction Modal */}
            {isAuctioning && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-8 relative"
                    >
                        <button 
                            onClick={() => setIsAuctioning(false)}
                            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
                        >
                            <Plus size={24} className="rotate-45" />
                        </button>

                        <div className="flex items-center space-x-3 text-orange-600 mb-2">
                            <Gavel size={24} />
                            <span className="text-xs font-black uppercase tracking-widest">List for Auction</span>
                        </div>
                        <h2 className="text-3xl font-serif font-black text-[#2A1F1D] mb-2">{auctionLand?.name}</h2>
                        <p className="text-[#8C7B70] text-sm mb-8">Set your starting price and auction duration. Once listed, the property will be visible in the live Auction House.</p>

                        <form onSubmit={handleAuctionSubmit} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#8C7B70] mb-2">Starting Bid (₹)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C7B70]"><DollarSign size={18} /></span>
                                    <input 
                                        type="number" 
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-[#F9F7F2] border border-[#E3DACD]/50 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none font-bold text-[#2A1F1D]"
                                        placeholder="e.g. 5000000"
                                        value={auctionData.base_price}
                                        onChange={e => setAuctionData({...auctionData, base_price: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#8C7B70] mb-2">Duration</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['24', '48', '72'].map(h => (
                                        <button
                                            key={h}
                                            type="button"
                                            onClick={() => setAuctionData({...auctionData, duration_hours: h})}
                                            className={`py-3 rounded-xl border font-bold text-xs transition-all ${
                                                auctionData.duration_hours === h 
                                                ? 'bg-[#2A1F1D] text-white border-[#2A1F1D] shadow-lg shadow-[#2A1F1D]/20' 
                                                : 'bg-white text-[#8C7B70] border-[#E3DACD]'
                                            }`}
                                        >
                                            {h} Hours
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button 
                                type="submit"
                                className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-orange-600/20 hover:bg-orange-700 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-3"
                            >
                                <Gavel size={18} />
                                <span>Start Live Auction</span>
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}

            {!loading && lands.length === 0 && (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300 col-span-full">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No lands registered</h3>
                    <p className="text-gray-500 mb-6">Register your land to start a project.</p>
                </div>
            )}
        </div>
    );
};

export default MyLands;
