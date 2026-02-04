import React, { useState } from 'react';
import { useMockApp } from '../../../hooks/useMockApp';
import { FileText, CheckCircle, XCircle, Search, Clock, Shield, Filter } from 'lucide-react';

const DocumentVerification = () => {
    const { documents, verifyDocument } = useMockApp();
    const [filter, setFilter] = useState('Pending'); // 'Pending', 'Verified', 'Rejected'
    const [searchTerm, setSearchTerm] = useState('');

    const filteredDocs = documents.filter(doc =>
        (filter === 'All' || doc.status === filter) &&
        (doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || doc.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleVerify = (id, status) => {
        // Add a small delay to simulate processing
        setTimeout(() => {
            verifyDocument(id, status);
        }, 500);
    };

    return (
        <div className="space-y-6 animate-fade-in-up font-sans text-[#2C2420]">
            {/* Header */}
            <div className="bg-[#2C2420] rounded-2xl p-8 text-[#F5F2EB] shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-[#A65D3B] text-xs font-bold uppercase tracking-widest mb-2">
                        <Shield size={14} /> Admin Console
                    </div>
                    <h1 className="text-3xl font-serif font-bold mb-2">Document Verification</h1>
                    <p className="text-[#D4C5B5]">Review user uploaded documents for compliance.</p>
                </div>
                <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-[#A65D3B]/20 to-transparent"></div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border border-[#D4C5B5]/30 shadow-sm gap-4">
                <div className="flex space-x-2 bg-[#F5F2EB] p-1 rounded-lg">
                    {['Pending', 'Verified', 'Rejected', 'All'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${filter === status
                                    ? 'bg-white text-[#A65D3B] shadow-sm'
                                    : 'text-[#8C7060] hover:text-[#5D4037]'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7060] w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search by name or user..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-[#D4C5B5]/50 rounded-lg text-sm focus:outline-none focus:border-[#A65D3B] text-[#2C2420]"
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-[#D4C5B5]/30 overflow-hidden min-h-[400px]">
                {filteredDocs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-[#8C7060]">
                        <FileText size={48} strokeWidth={1} className="mb-4 opacity-30" />
                        <p className="font-serif text-lg">No documents found.</p>
                        <p className="text-sm">Try adjusting filters or checking back later.</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-[#F5F2EB] text-[#5D4037] uppercase text-xs font-bold border-b border-[#D4C5B5]/30">
                            <tr>
                                <th className="px-6 py-4">Document Details</th>
                                <th className="px-6 py-4">Uploaded By</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D4C5B5]/20">
                            {filteredDocs.map(doc => (
                                <tr key={doc.id} className="hover:bg-[#F5F2EB]/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-[#F5F2EB] p-2.5 rounded-lg border border-[#D4C5B5]/30 text-[#A65D3B]">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#2C2420]">{doc.name}</p>
                                                <p className="text-xs text-[#8C7060] uppercase tracking-wide">{doc.type || 'General'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-[#5D4037]">
                                        {doc.uploadedBy}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[#8C7060] font-mono">
                                        {doc.date}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${doc.status === 'Verified' ? 'bg-green-50 text-green-700 border-green-100' :
                                                doc.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                                                    'bg-amber-50 text-amber-700 border-amber-100'
                                            }`}>
                                            {doc.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {doc.status === 'Pending' && (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleVerify(doc.id, 'Verified')}
                                                    className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors border border-green-100"
                                                    title="Approve"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleVerify(doc.id, 'Rejected')}
                                                    className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                                                    title="Reject"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            </div>
                                        )}
                                        {doc.status !== 'Pending' && (
                                            <span className="text-xs text-[#D4C5B5] font-bold uppercase">Processed</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default DocumentVerification;
