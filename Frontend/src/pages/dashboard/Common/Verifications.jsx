import React, { useState } from 'react';
import { Shield, User, FileText, CheckCircle, XCircle, Clock, Search, Filter } from 'lucide-react';

const Verifications = () => {
    const [activeTab, setActiveTab] = useState('users');
    const [searchTerm, setSearchTerm] = useState('');

    // Static data for user verifications
    const userVerifications = [
        { id: 1, name: 'Rajesh Kumar', type: 'Land Owner', document: 'Aadhaar Card', status: 'pending', submittedDate: '2026-02-01' },
        { id: 2, name: 'BuildWell Constructions', type: 'Contractor', document: 'License', status: 'approved', submittedDate: '2026-01-30' },
        { id: 3, name: 'Amit Sharma', type: 'Architect', document: 'Professional Certificate', status: 'pending', submittedDate: '2026-02-02' },
        { id: 4, name: 'Priya Patel', type: 'Civil Engineer', document: 'Degree Certificate', status: 'rejected', submittedDate: '2026-01-28' },
    ];

    const professionalVerifications = [
        { id: 1, name: 'Arjun Mehta', profession: 'Architect', license: 'ARCH-2024-1234', status: 'approved', experience: '8 years' },
        { id: 2, name: 'Sneha Reddy', profession: 'Interior Designer', license: 'ID-2023-5678', status: 'pending', experience: '5 years' },
        { id: 3, name: 'Vikram Singh', profession: 'Structural Engineer', license: 'SE-2025-9012', status: 'pending', experience: '12 years' },
    ];

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-amber-50 text-amber-700 border-amber-100',
            approved: 'bg-green-50 text-green-700 border-green-100',
            rejected: 'bg-red-50 text-red-700 border-red-100'
        };
        const icons = {
            pending: <Clock size={12} />,
            approved: <CheckCircle size={12} />,
            rejected: <XCircle size={12} />
        };

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${styles[status]}`}>
                {icons[status]}
                {status}
            </span>
        );
    };

    return (
        <div className="space-y-8 animate-fade-in font-sans text-[#2A1F1D]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-serif font-bold text-[#2A1F1D]">Verifications</h1>
                    <p className="text-[#8C7B70] mt-2 font-medium">Manage user and professional verification requests</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-4 py-2 bg-[#F9F7F2] text-[#C06842] border border-[#E3DACD] rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm">
                        {userVerifications.filter(v => v.status === 'pending').length + professionalVerifications.filter(v => v.status === 'pending').length} Pending Requests
                    </span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-[#E3DACD] pb-1">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-6 py-3 font-bold text-sm transition-all rounded-t-xl border-b-2 flex items-center gap-2 ${activeTab === 'users'
                        ? 'border-[#C06842] text-[#C06842] bg-[#F9F7F2]'
                        : 'border-transparent text-[#8C7B70] hover:text-[#5D4037] hover:bg-white/50'
                        }`}
                >
                    <User size={18} />
                    User Verification
                </button>
                <button
                    onClick={() => setActiveTab('professionals')}
                    className={`px-6 py-3 font-bold text-sm transition-all rounded-t-xl border-b-2 flex items-center gap-2 ${activeTab === 'professionals'
                        ? 'border-[#C06842] text-[#C06842] bg-[#F9F7F2]'
                        : 'border-transparent text-[#8C7B70] hover:text-[#5D4037] hover:bg-white/50'
                        }`}
                >
                    <Shield size={18} />
                    Professional Verification
                </button>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C7B70]" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#E3DACD] rounded-xl text-[#2A1F1D] focus:border-[#C06842] focus:ring-2 focus:ring-[#C06842]/20 outline-none transition-all placeholder:text-[#B8AFA5] font-medium shadow-sm"
                    />
                </div>
                <button className="px-6 py-3.5 bg-white border border-[#E3DACD] rounded-xl text-[#5D4037] hover:bg-[#F9F7F2] transition-all flex items-center gap-2 font-bold shadow-sm">
                    <Filter size={20} className="text-[#C06842]" />
                    <span>Filter</span>
                </button>
            </div>

            {/* Content */}
            {activeTab === 'users' ? (
                <div className="grid gap-6">
                    {userVerifications.map((verification) => (
                        <div key={verification.id} className="glass-card border border-[#E3DACD]/50 rounded-[2rem] p-6 hover:shadow-lg transition-all hover:border-[#C06842]/30 group bg-white/60">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-14 h-14 bg-[#2A1F1D] rounded-2xl flex items-center justify-center text-white font-serif font-bold text-xl shadow-md">
                                            {verification.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-[#2A1F1D] group-hover:text-[#C06842] transition-colors">{verification.name}</h3>
                                            <p className="text-xs font-bold text-[#8C7B70] uppercase tracking-wider">{verification.type}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6 mt-4 pl-1">
                                        <div>
                                            <p className="text-[10px] text-[#8C7B70] uppercase tracking-wider font-bold mb-1">Document Type</p>
                                            <p className="text-sm font-bold text-[#5D4037] flex items-center gap-2 bg-[#F9F7F2] px-3 py-1.5 rounded-lg border border-[#E3DACD]/50 w-fit">
                                                <FileText size={14} className="text-[#C06842]" />
                                                {verification.document}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-[#8C7B70] uppercase tracking-wider font-bold mb-1">Submitted Date</p>
                                            <p className="text-sm font-bold text-[#5D4037] px-1 py-1.5">{verification.submittedDate}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-3">
                                    {getStatusBadge(verification.status)}
                                    {verification.status === 'pending' && (
                                        <div className="flex gap-2 mt-2">
                                            <button className="px-4 py-2 bg-[#2A1F1D] text-white rounded-lg hover:bg-[#059669] transition-all font-bold text-xs uppercase tracking-wider shadow-md">
                                                Approve
                                            </button>
                                            <button className="px-4 py-2 bg-white text-[#2A1F1D] border border-[#E3DACD] rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all font-bold text-xs uppercase tracking-wider shadow-sm">
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid gap-6">
                    {professionalVerifications.map((verification) => (
                        <div key={verification.id} className="glass-card border border-[#E3DACD]/50 rounded-[2rem] p-6 hover:shadow-lg transition-all hover:border-[#C06842]/30 group bg-white/60">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-14 h-14 bg-[#C06842] rounded-2xl flex items-center justify-center text-white font-serif font-bold text-xl shadow-md">
                                            {verification.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-[#2A1F1D] group-hover:text-[#C06842] transition-colors">{verification.name}</h3>
                                            <p className="text-xs font-bold text-[#8C7B70] uppercase tracking-wider">{verification.profession}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6 mt-4 pl-1">
                                        <div>
                                            <p className="text-[10px] text-[#8C7B70] uppercase tracking-wider font-bold mb-1">License Number</p>
                                            <p className="text-sm font-bold text-[#5D4037] bg-[#F9F7F2] px-3 py-1.5 rounded-lg border border-[#E3DACD]/50 w-fit">{verification.license}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-[#8C7B70] uppercase tracking-wider font-bold mb-1">Experience</p>
                                            <p className="text-sm font-bold text-[#5D4037] px-1 py-1.5">{verification.experience}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-3">
                                    {getStatusBadge(verification.status)}
                                    {verification.status === 'pending' && (
                                        <div className="flex gap-2 mt-2">
                                            <button className="px-4 py-2 bg-[#2A1F1D] text-white rounded-lg hover:bg-[#059669] transition-all font-bold text-xs uppercase tracking-wider shadow-md">
                                                Approve
                                            </button>
                                            <button className="px-4 py-2 bg-white text-[#2A1F1D] border border-[#E3DACD] rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all font-bold text-xs uppercase tracking-wider shadow-sm">
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Verifications;
