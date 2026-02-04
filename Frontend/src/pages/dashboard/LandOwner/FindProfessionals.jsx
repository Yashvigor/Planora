import React, { useState } from 'react';
import { useMockApp } from '../../../hooks/useMockApp';
import { MapPin, Star, Filter, Heart, MessageSquare, Phone } from 'lucide-react';

const FindProfessionals = () => {
    const { professionals } = useMockApp();
    const [selectedRole, setSelectedRole] = useState('all');
    const [selectedPro, setSelectedPro] = useState(null);

    const filteredPros = selectedRole === 'all'
        ? professionals
        : professionals.filter(p => p.role === selectedRole);

    const roles = [
        { id: 'all', label: 'All Professionals' },
        { id: 'contractor', label: 'Contractors' },
        { id: 'architect', label: 'Architects' },
        { id: 'designer', label: 'Designers' },
        { id: 'engineer', label: 'Engineers' },
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            {/* Header & Filter */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm">
                <h1 className="text-xl font-bold text-gray-800 mb-4 sm:mb-0">Find Professionals</h1>
                <div className="flex space-x-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
                    {roles.map(role => (
                        <button
                            key={role.id}
                            onClick={() => setSelectedRole(role.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedRole === role.id
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {role.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* Map View (Mock) */}
                <div className="flex-1 bg-gray-200 rounded-2xl relative hidden lg:block overflow-hidden shadow-inner group">
                    <img
                        src="https://placehold.co/1200x800/e2e8f0/94a3b8?text=Interactive+Map+View"
                        className="w-full h-full object-cover opacity-80"
                        alt="Map"
                    />
                    <div className="absolute top-4 left-4 bg-white p-2 rounded-lg shadow-lg">
                        <p className="text-xs font-bold text-gray-500 mb-1">NEARBY</p>
                        <p className="text-sm font-semibold">{filteredPros.length} Professionals found</p>
                    </div>

                    {/* Mock Pins */}
                    {filteredPros.map((pro, index) => (
                        <div
                            key={pro.id}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform"
                            style={{ top: `${30 + (index * 15)}%`, left: `${40 + (index * 10)}%` }}
                            onClick={() => setSelectedPro(pro)}
                        >
                            <div className="bg-white p-1 rounded-full shadow-lg border-2 border-blue-500">
                                <span className="text-xl">{pro.avatar}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* List View */}
                <div className="w-full lg:w-[400px] overflow-y-auto pr-2">
                    <div className="space-y-4">
                        {filteredPros.map(pro => (
                            <div
                                key={pro.id}
                                className={`bg-white p-4 rounded-xl border transition-all cursor-pointer ${selectedPro?.id === pro.id ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' : 'border-gray-100 shadow-sm hover:shadow-md'
                                    }`}
                                onClick={() => setSelectedPro(pro)}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-2xl">
                                            {pro.avatar}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{pro.name}</h3>
                                            <p className="text-xs text-blue-600 font-semibold bg-blue-50 inline-block px-2 py-0.5 rounded uppercase mt-1">
                                                {pro.role}
                                            </p>
                                        </div>
                                    </div>
                                    <button className="text-gray-400 hover:text-red-500">
                                        <Heart size={18} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                    <span className="flex items-center bg-yellow-50 text-yellow-700 px-2 py-1 rounded">
                                        <Star size={14} className="fill-yellow-500 text-yellow-500 mr-1" />
                                        {pro.rating}
                                    </span>
                                    <span className="flex items-center">
                                        <MapPin size={14} className="mr-1" />
                                        {pro.distance} away
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <button className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                                        Shortlist
                                    </button>
                                    <button className="flex items-center justify-center px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                                        View Profile
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FindProfessionals;
