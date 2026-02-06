import React, { useState, useEffect, useCallback } from 'react';
import { Shield, User, FileText, CheckCircle, XCircle, Clock, Search, Filter, Loader2 } from 'lucide-react';

const Verifications = () => {
    const [verifications, setVerifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('users'); // users or professionals (if applicable)

    const fetchVerifications = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/users/verifications');
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to fetch verifications');
            setVerifications(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVerifications();
    }, [fetchVerifications]);

    const handleStatusUpdate = async (userId, newStatus) => {
        try {
            const response = await fetch(`http://localhost:5000/api/users/${userId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to update status');

            // Refresh list
            fetchVerifications();
        } catch (err) {
            alert(err.message);
        }
    };

    const getStatusBadge = (status) => {
        const lowerStatus = status?.toLowerCase();
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

        const currentStyle = styles[lowerStatus] || styles.pending;
        const currentIcon = icons[lowerStatus] || icons.pending;

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${currentStyle}`}>
                {currentIcon}
                {status}
            </span>
        );
    };

    const filteredVerifications = verifications.filter(v =>
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && verifications.length === 0) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-[#C06842]" size={40} />
                <p className="text-[#8C7B70] font-serif italic text-lg">Loading verification requests...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in font-sans text-[#2A1F1D]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-serif font-bold text-[#2A1F1D]">Verifications</h1>
                    <p className="text-[#8C7B70] mt-2 font-medium">Manage user and professional verification requests from the platform</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-4 py-2 bg-[#F9F7F2] text-[#C06842] border border-[#E3DACD] rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm">
                        {verifications.filter(v => v.status === 'Pending').length} Pending Requests
                    </span>
                </div>
            </div>

            {/* Search */}
            <div className="flex gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C7B70]" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#E3DACD] rounded-xl text-[#2A1F1D] focus:border-[#C06842] focus:ring-2 focus:ring-[#C06842]/20 outline-none transition-all placeholder:text-[#B8AFA5] font-medium shadow-sm"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="grid gap-6">
                {filteredVerifications.length > 0 ? filteredVerifications.map((verification) => (
                    <div key={verification.user_id} className="glass-card border border-[#E3DACD]/50 rounded-[2rem] p-6 hover:shadow-lg transition-all hover:border-[#C06842]/30 group bg-white/60">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 bg-[#2A1F1D] rounded-2xl flex items-center justify-center text-white font-serif font-bold text-xl shadow-md">
                                        {verification.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-lg text-[#2A1F1D] group-hover:text-[#C06842] transition-colors">{verification.name}</h3>
                                            <span className="text-[10px] text-[#8C7B70] bg-[#E3DACD]/30 px-2 py-0.5 rounded italic">{verification.category}</span>
                                        </div>
                                        <p className="text-xs text-[#8C7B70] font-medium">{verification.email}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6 mt-4 pl-1">
                                    <div>
                                        <p className="text-[10px] text-[#8C7B70] uppercase tracking-wider font-bold mb-1">Role Type</p>
                                        <p className="text-sm font-bold text-[#5D4037] flex items-center gap-2 bg-[#F9F7F2] px-3 py-1.5 rounded-lg border border-[#E3DACD]/50 w-fit">
                                            <Shield size={14} className="text-[#C06842]" />
                                            {verification.category}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-[#8C7B70] uppercase tracking-wider font-bold mb-1">Registered On</p>
                                        <p className="text-sm font-bold text-[#5D4037] px-1 py-1.5">{new Date(verification.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                {getStatusBadge(verification.status)}
                                {verification.status === 'Pending' && (
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={() => handleStatusUpdate(verification.user_id, 'Approved')}
                                            className="px-4 py-2 bg-[#2A1F1D] text-white rounded-lg hover:bg-[#059669] transition-all font-bold text-xs uppercase tracking-wider shadow-md active:scale-95"
                                        >
                                            Approve User
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(verification.user_id, 'Rejected')}
                                            className="px-4 py-2 bg-white text-[#2A1F1D] border border-[#E3DACD] rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all font-bold text-xs uppercase tracking-wider shadow-sm active:scale-95"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-20 bg-[#F9F7F2]/30 rounded-[2.5rem] border-2 border-dashed border-[#E3DACD]">
                        <p className="text-[#8C7B70] font-serif italic">No verification requests found matching your search.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Verifications;
