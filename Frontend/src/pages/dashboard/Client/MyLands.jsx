import React, { useState, useEffect } from 'react';
// import { useMockApp } from '../../../hooks/useMockApp';
import { MapPin, Upload, Plus } from 'lucide-react';

const MyLands = () => {
    const [lands, setLands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        area: '',
        type: 'Residential',
    });

    const storedUser = localStorage.getItem('planora_current_user') || localStorage.getItem('user');
    const userData = storedUser ? JSON.parse(storedUser) : null;
    const userId = userData ? (userData.user_id || userData.id) : null;

    useEffect(() => {
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
        fetchLands();
    }, [userId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userId) {
            alert("User not found. Please log in.");
            return;
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/lands`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    owner_id: userId,
                    name: formData.name,
                    location: formData.location,
                    area: formData.area,
                    type: formData.type,
                    // Optional: Geocode logic could go here or in backend
                    latitude: null,
                    longitude: null
                }),
            });

            if (res.ok) {
                const newLand = await res.json();
                setLands([newLand, ...lands]);
                setIsAdding(false);
                setFormData({ name: '', location: '', area: '', type: 'Residential' });
            } else {
                alert("Failed to add land.");
            }
        } catch (err) {
            console.error("Error adding land:", err);
            alert("Error adding land.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">My Lands</h1>
                <button
                    onClick={() => setIsAdding(!isAdding)}
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

                        <div className="md:col-span-2 flex justify-end space-x-3 mt-4">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
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
                        <div className="h-40 bg-gray-200 relative">
                            {/* Mock Map Placeholder */}
                            <img
                                src={`https://placehold.co/600x400/e2e8f0/94a3b8?text=Map+View+${land.location}`}
                                alt="Map Location"
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                            />
                            <div className="absolute top-4 right-4 bg-white px-2 py-1 rounded text-xs font-semibold shadow-sm">
                                {land.type}
                            </div>
                        </div>
                        <div className="p-5">
                            <h3 className="font-bold text-lg text-gray-900">{land.name}</h3>
                            <div className="flex items-center text-gray-500 mt-2 space-x-4 text-sm">
                                <span className="flex items-center"><MapPin size={14} className="mr-1" /> {land.location}</span>
                                <span>{land.area} sq.ft</span>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                <button className="text-blue-600 text-sm font-medium hover:text-blue-700">View Documents</button>
                                <button className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200">Edit</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

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
