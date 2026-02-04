import React, { useState } from 'react';
import { Scale, AlertTriangle, CheckCircle, Clock, MessageSquare, FileText, User, Filter, AlertOctagon } from 'lucide-react';

const Disputes = () => {
    const [filter, setFilter] = useState('all');

    // Static dispute data
    const disputes = [
        {
            id: 1,
            title: 'Payment Delay for Phase 2',
            category: 'Payment',
            status: 'open',
            priority: 'high',
            raisedBy: 'Rajesh Kumar',
            raisedAgainst: 'BuildWell Constructions',
            date: '2026-02-01',
            description: 'Payment for completed Phase 2 work has been delayed by 15 days.',
            messages: 3
        },
        {
            id: 2,
            title: 'Quality Issue in Tile Work',
            category: 'Quality',
            status: 'in_progress',
            priority: 'medium',
            raisedBy: 'Amit Sharma',
            raisedAgainst: 'Tile Master Services',
            date: '2026-01-30',
            description: 'Tiles installed in bathroom have uneven spacing and alignment issues.',
            messages: 7
        },
        {
            id: 3,
            title: 'Delay in Structural Approval',
            category: 'Timeline',
            status: 'resolved',
            priority: 'low',
            raisedBy: 'Priya Patel',
            raisedAgainst: 'City Planning Office',
            date: '2026-01-25',
            description: 'Structural approval documents pending for 3 weeks.',
            messages: 12
        },
    ];

    const getStatusBadge = (status) => {
        const styles = {
            open: 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20',
            in_progress: 'bg-[#F59E0B]/10 text-[#D97706] border-[#F59E0B]/20',
            resolved: 'bg-[#059669]/10 text-[#059669] border-[#059669]/20'
        };
        const icons = {
            open: <AlertTriangle size={14} />,
            in_progress: <Clock size={14} />,
            resolved: <CheckCircle size={14} />
        };
        const labels = {
            open: 'Open',
            in_progress: 'In Progress',
            resolved: 'Resolved'
        };

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${styles[status]}`}>
                {icons[status]}
                {labels[status]}
            </span>
        );
    };

    const getPriorityBadge = (priority) => {
        const styles = {
            high: 'bg-[#DC2626] text-white shadow-md shadow-red-500/20',
            medium: 'bg-[#F59E0B] text-white shadow-md shadow-amber-500/20',
            low: 'bg-[#8C7B70] text-white shadow-md shadow-stone-500/20'
        };

        return (
            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${styles[priority]}`}>
                {priority}
            </span>
        );
    };

    const filteredDisputes = filter === 'all'
        ? disputes
        : disputes.filter(d => d.status === filter);

    return (
        <div className="space-y-8 animate-fade-in font-sans text-[#2A1F1D]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-serif font-bold text-[#2A1F1D]">Disputes</h1>
                    <p className="text-[#8C7B70] mt-2 font-medium">Track and resolve project disputes efficiently</p>
                </div>
                <button className="px-6 py-3 bg-[#C06842] hover:bg-[#A65D3B] text-white rounded-xl font-bold shadow-lg shadow-[#C06842]/30 active:scale-95 transition-all flex items-center gap-2">
                    <Scale size={18} />
                    Raise New Dispute
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-[2rem] border border-[#E3DACD]/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-[#8C7B70] text-xs font-bold uppercase tracking-wider mb-1">Open Disputes</p>
                            <p className="text-4xl font-serif font-bold text-[#2A1F1D]">{disputes.filter(d => d.status === 'open').length}</p>
                        </div>
                        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
                            <AlertOctagon size={24} />
                        </div>
                    </div>
                    <div className="w-full bg-[#E3DACD]/30 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-red-500 h-full rounded-full w-[30%]"></div>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-[2rem] border border-[#E3DACD]/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-[#8C7B70] text-xs font-bold uppercase tracking-wider mb-1">In Progress</p>
                            <p className="text-4xl font-serif font-bold text-[#2A1F1D]">{disputes.filter(d => d.status === 'in_progress').length}</p>
                        </div>
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                            <Clock size={24} />
                        </div>
                    </div>
                    <div className="w-full bg-[#E3DACD]/30 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full w-[70%]"></div>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-[2rem] border border-[#E3DACD]/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-[#8C7B70] text-xs font-bold uppercase tracking-wider mb-1">Resolved</p>
                            <p className="text-4xl font-serif font-bold text-[#2A1F1D]">{disputes.filter(d => d.status === 'resolved').length}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-500">
                            <CheckCircle size={24} />
                        </div>
                    </div>
                    <div className="w-full bg-[#E3DACD]/30 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-green-500 h-full rounded-full w-[100%]"></div>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b border-[#E3DACD] pb-1">
                {['all', 'open', 'in_progress', 'resolved'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-6 py-3 font-bold text-sm transition-all rounded-t-xl border-b-2 ${filter === status
                            ? 'border-[#C06842] text-[#C06842] bg-[#F9F7F2]'
                            : 'border-transparent text-[#8C7B70] hover:text-[#5D4037] hover:bg-white/50'
                            }`}
                    >
                        {status === 'all' ? 'All Disputes' : status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </button>
                ))}
            </div>

            {/* Disputes List */}
            <div className="space-y-4">
                {filteredDisputes.map((dispute) => (
                    <div key={dispute.id} className="glass-card border border-[#E3DACD]/50 rounded-[2rem] p-8 hover:shadow-lg transition-all hover:border-[#C06842]/30 group">
                        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-4">
                                    <span className="w-10 h-10 rounded-xl bg-[#F9F7F2] flex items-center justify-center text-[#2A1F1D] font-bold border border-[#E3DACD] shadow-sm">#{dispute.id}</span>
                                    <h3 className="font-bold text-xl font-serif text-[#2A1F1D] group-hover:text-[#C06842] transition-colors">{dispute.title}</h3>
                                    {getPriorityBadge(dispute.priority)}
                                </div>
                                <p className="text-[#5D4037] text-base leading-relaxed pl-14">{dispute.description}</p>

                                <div className="flex flex-wrap items-center gap-6 mt-4 pl-14 pt-2">
                                    <div className="flex items-center gap-2 text-sm bg-[#F9F7F2] px-3 py-1.5 rounded-lg border border-[#E3DACD]/50">
                                        <User size={14} className="text-[#C06842]" />
                                        <span className="text-[#5D4037] font-medium">
                                            <span className="font-bold">{dispute.raisedBy}</span>
                                            <span className="text-[#8C7B70] mx-1">vs</span>
                                            <span className="font-bold">{dispute.raisedAgainst}</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-[#8C7B70] font-bold">
                                        <FileText size={14} />
                                        <span>{dispute.category}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-[#8C7B70] font-bold">
                                        <MessageSquare size={14} />
                                        <span>{dispute.messages} messages</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-row md:flex-col items-center md:items-end gap-3 w-full md:w-auto pl-14 md:pl-0 border-t md:border-t-0 md:border-l border-[#E3DACD]/30 pt-4 md:pt-0 md:ml-4">
                                {getStatusBadge(dispute.status)}
                                <span className="text-xs font-bold text-[#8C7B70] uppercase tracking-wider">{dispute.date}</span>
                                <button className="px-5 py-2.5 bg-[#F9F7F2] text-[#2A1F1D] border border-[#E3DACD] rounded-xl hover:bg-[#2A1F1D] hover:text-white transition-all font-bold text-xs uppercase tracking-wider w-full md:w-auto mt-2">
                                    View Details
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Disputes;
