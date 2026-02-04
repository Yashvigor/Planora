import React, { useState, useEffect } from 'react';
import { useMockApp } from '../../../hooks/useMockApp';
import {
    Layers, PenTool, CheckCircle, Upload, AlertTriangle,
    MessageCircle, Calendar, Camera, FileText,
    Briefcase, Layout, ArrowRight, Clock, MoreHorizontal,
    Plus, Search, Filter, Eye, Download, Archive, Trash2,
    X, User, AlertOctagon, HelpCircle
} from 'lucide-react';

const StatusBadge = ({ status }) => {
    const styles = {
        'Approved': 'bg-green-100 text-green-800 border-green-200',
        'Pending': 'bg-amber-100 text-amber-800 border-amber-200',
        'In Progress': 'bg-blue-100 text-blue-800 border-blue-200',
        'Not Started': 'bg-gray-100 text-gray-800 border-gray-200',
        'Review': 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || styles['Not Started']}`}>
            {status}
        </span>
    );
};

const SectionHeader = ({ title, action }) => (
    <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-[#3E2B26] flex items-center">
            {title}
        </h3>
        {action}
    </div>
);

const ArchitectDashboard = () => {
    const { currentUser } = useMockApp();
    const [activeTab, setActiveTab] = useState('drawings');
    const [showUploadModal, setShowUploadModal] = useState(false);

    // --- State & Persistence ---
    const initialData = {
        stats: {
            activeProjects: 3,
            selectedProject: 'Skyline Apartments',
            projectType: 'Residential Complex',
            currentPhase: 'Execution'
        },
        designStatus: [
            { id: 1, title: 'Concept Design', status: 'Approved', info: 'Finalized on Jan 15' },
            { id: 2, title: 'Working Drawings', status: 'In Progress', info: 'Struc. coordination ongoing' },
            { id: 3, title: '3D / Elevation', status: 'Pending', info: 'Client feedback awaited' },
            { id: 4, title: 'Structural Coord.', status: 'Review', info: 'Beam clash resolved' },
            { id: 5, title: 'Approval Submission', status: 'Not Started', info: 'Due by Feb 20' },
        ],
        drawings: [
            { id: 1, name: 'Ground Floor Plan.pdf', type: 'Plan', version: 'v3.2', date: 'Today, 10:30 AM', author: 'Ar. Sarah', status: 'Approved' },
            { id: 2, name: 'Section A-A.pdf', type: 'Section', version: 'v2.1', date: 'Yesterday', author: 'Ar. Sarah', status: 'Review' },
            { id: 3, name: 'Front Elevation.jpg', type: 'Elevation', version: 'v1.5', date: 'Jan 28', author: 'Ar. Arjun', status: 'Pending' },
        ],
        coordination: [
            { id: 1, type: 'Structural', message: 'Increase column C4 size to 450x600mm.', from: 'Er. Civil', date: '2h ago', priority: 'High' },
            { id: 2, type: 'MEP', message: 'HVAC duct clash with beam at grid 3-B.', from: 'MEP Consultant', date: '5h ago', priority: 'Medium' },
            { id: 3, type: 'Clash', message: 'Plumbing pipe conflicting with electrical tray in corridor.', from: 'System', date: '1d ago', priority: 'Critical' },
        ],
        siteQueries: [
            { id: 1, from: 'Site Eng.', subject: 'Lintel height clarification', status: 'Pending' },
            { id: 2, from: 'Contractor', subject: 'Tile shade approval', status: 'Resolved' },
        ],
        siteProgress: [
            { id: 1, img: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=300', note: 'Plinth work completed', date: 'Today', alert: null },
            { id: 2, img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=300', note: 'Column shuttering', date: 'Yesterday', alert: 'Rebar spacing deviation noticed' },
        ]
    };

    const [data, setData] = useState(() => {
        const saved = localStorage.getItem('planora_architect_data');
        return saved ? JSON.parse(saved) : initialData;
    });

    useEffect(() => {
        localStorage.setItem('planora_architect_data', JSON.stringify(data));
    }, [data]);

    const handleUpload = () => {
        const newDoc = {
            id: Date.now(),
            name: `Revision_${data.drawings.length + 1}.pdf`,
            type: 'Plan',
            version: 'v1.0',
            date: 'Just Now',
            author: currentUser?.name || 'Architect',
            status: 'Review'
        };
        setData(prev => ({ ...prev, drawings: [newDoc, ...prev.drawings] }));
        setShowUploadModal(false);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in font-sans pb-20 text-[#2A1F1D]">

            {/* 1. HEADER SECTION (Project Snapshot) */}
            <div className="glass-panel rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                <div className="absolute right-0 top-0 w-80 h-80 bg-[#C06842]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div>
                        <div className="flex items-center space-x-3 mb-2 opacity-80">
                            <div className="p-2 bg-[#C06842]/10 rounded-lg text-[#C06842]">
                                <Briefcase size={18} />
                            </div>
                            <span className="text-sm font-bold tracking-widest uppercase text-[#8C7B70]">Architect Workspace</span>
                        </div>
                        <h1 className="text-5xl font-bold mb-4 font-serif text-[#2A1F1D]">Welcome, {currentUser?.name || "Architect"}</h1>
                        <div className="flex flex-wrap gap-4 text-sm mt-6">
                            <div className="px-4 py-2 bg-[#F9F7F2] rounded-xl border border-[#E3DACD] flex items-center space-x-2 text-[#5D4037] shadow-sm">
                                <Layout size={16} className="text-[#C06842]" />
                                <span>Active Projects: <strong className="text-[#2A1F1D] ml-1">{data.stats.activeProjects}</strong></span>
                            </div>
                            <div className="px-4 py-2 bg-[#F9F7F2] rounded-xl border border-[#E3DACD] flex items-center space-x-2 text-[#5D4037] shadow-sm">
                                <Eye size={16} className="text-[#E68A2E]" />
                                <span>Selected: <strong className="text-[#2A1F1D] ml-1">{data.stats.selectedProject}</strong></span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#FDFCF8]/60 backdrop-blur-md p-6 rounded-2xl border border-[#E3DACD]/50 min-w-[220px] shadow-sm group-hover:shadow-md transition-all">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs text-[#8C7B70] font-bold uppercase tracking-widest">Current Phase</span>
                            <MoreHorizontal size={16} className="text-[#B8AFA5]" />
                        </div>
                        <div className="text-2xl font-bold text-[#C06842] flex items-center space-x-3">
                            <span>{data.stats.currentPhase}</span>
                            <div className="h-2.5 w-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                        </div>
                        <p className="text-xs text-[#6E5E56] font-medium mt-1">{data.stats.projectType}</p>
                    </div>
                </div>
            </div>

            {/* 2. DESIGN STATUS OVERVIEW */}
            <section>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {data.designStatus.map((item) => (
                        <div key={item.id} className="glass-card p-5 rounded-2xl border border-[#E3DACD]/40 hover:border-[#C06842]/30 hover:shadow-lg transition-all duration-300 group cursor-default">
                            <div className="flex justify-between items-start mb-3 h-10">
                                <h4 className="font-bold text-[#2A1F1D] text-sm leading-tight group-hover:text-[#C06842] transition-colors">{item.title}</h4>
                            </div>
                            <StatusBadge status={item.status} />
                            <p className="text-[10px] text-[#8C7B70] mt-4 border-t border-dashed border-[#E3DACD] pt-3 truncate font-medium">{item.info}</p>
                        </div>
                    ))}
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 3. DRAWINGS & DESIGN MANAGEMENT */}
                <div className="lg:col-span-2 glass-card rounded-[2rem] border border-[#E3DACD]/40 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                    <div className="p-8 border-b border-[#E3DACD]/30 flex flex-wrap justify-between items-center gap-4 bg-[#F9F7F2]/30">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-[#C06842]/10 rounded-xl text-[#C06842]"><Layers size={22} /></div>
                            <h3 className="text-xl font-serif font-bold text-[#2A1F1D]">Drawings & Design</h3>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="flex items-center space-x-2 bg-[#2A1F1D] hover:bg-[#C06842] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl active:scale-95"
                            >
                                <Upload size={18} /> <span>Upload New</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="space-y-4">
                            {data.drawings.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between p-4 rounded-2xl border border-[#E3DACD]/40 hover:border-[#C06842]/30 bg-[#FDFCF8] hover:bg-white hover:shadow-md transition-all group">
                                    <div className="flex items-center space-x-5">
                                        <div className="h-12 w-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center font-bold text-xs uppercase shadow-sm group-hover:scale-105 transition-transform">PDF</div>
                                        <div>
                                            <h5 className="font-bold text-[#2A1F1D] text-lg group-hover:text-[#C06842] transition-colors">{doc.name}</h5>
                                            <div className="flex items-center space-x-3 text-xs text-[#8C7B70] mt-1 font-medium">
                                                <span className="bg-[#E3DACD]/30 px-2 py-0.5 rounded text-[#5D4037]">{doc.version}</span>
                                                <span>•</span>
                                                <span>{doc.type}</span>
                                                <span>•</span>
                                                <span>{doc.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="text-right hidden sm:block">
                                            <StatusBadge status={doc.status} />
                                            <p className="text-[10px] text-[#8C7B70] mt-1 font-bold uppercase tracking-wider">by {doc.author}</p>
                                        </div>
                                        <button className="p-2 text-[#B8AFA5] hover:text-[#C06842] hover:bg-[#F9F7F2] rounded-lg transition-colors">
                                            <MoreHorizontal size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 4. COORDINATION & 5. SITE PROGRESS */}
                <div className="space-y-8">
                    {/* Coordination Panel */}
                    <div className="glass-card rounded-[2rem] border border-[#E3DACD]/40 shadow-sm p-8">
                        <SectionHeader
                            title="Coordination"
                            action={<AlertOctagon className="text-amber-500 animate-pulse" size={24} />}
                        />

                        <div className="space-y-4 mb-8">
                            {data.coordination.map((note) => (
                                <div key={note.id} className="p-4 bg-[#F9F7F2] rounded-2xl border border-[#E3DACD]/50 relative hover:border-[#C06842]/30 transition-colors group">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wide ${note.type === 'Structural' ? 'bg-blue-50 text-blue-700' :
                                            note.type === 'Clash' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'
                                            }`}>{note.type}</span>
                                        <span className="text-[10px] text-[#B8AFA5] font-medium">{note.date}</span>
                                    </div>
                                    <p className="text-sm font-semibold text-[#2A1F1D] leading-snug group-hover:text-[#C06842] transition-colors">"{note.message}"</p>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-[#E3DACD]/50 pt-6">
                            <h4 className="text-sm font-bold text-[#2A1F1D] mb-4 flex items-center gap-2 uppercase tracking-wider">
                                <HelpCircle size={18} className="text-[#A65D3B]" /> Site Queries
                            </h4>
                            <div className="space-y-3">
                                {data.siteQueries.map(q => (
                                    <div key={q.id} className="flex justify-between items-center text-sm p-3 bg-[#FDFCF8] border border-[#E3DACD]/30 rounded-xl hover:shadow-sm transition-shadow">
                                        <span className="text-[#5D4037] truncate flex-1 font-medium">{q.subject}</span>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${q.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>{q.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Site Progress */}
                    <div className="glass-card rounded-[2rem] border border-[#E3DACD]/40 shadow-sm p-8">
                        <SectionHeader
                            title="Site Progress"
                            action={<button className="p-2 bg-[#F9F7F2] rounded-full text-[#8C7B70] hover:text-[#C06842] transition-colors"><Camera size={20} /></button>}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            {data.siteProgress.map((photo) => (
                                <div key={photo.id} className="relative group rounded-2xl overflow-hidden aspect-square border border-[#E3DACD] shadow-sm hover:shadow-md transition-all">
                                    <img src={photo.img} alt="Site" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                                    {photo.alert && (
                                        <div className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full animate-pulse shadow-md tooltip-trigger z-10">
                                            <AlertTriangle size={14} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#2A1F1D]/90 via-transparent to-transparent flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        {photo.alert && <p className="text-red-300 text-[10px] font-bold mb-1 flex items-center gap-1"><AlertTriangle size={10} /> Deviation</p>}
                                        <p className="text-white text-xs font-bold leading-tight drop-shadow-md">{photo.note}</p>
                                        <p className="text-white/70 text-[10px] font-medium mt-0.5">{photo.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 6. QUICK ACTIONS */}
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-[#2A1F1D]/90 backdrop-blur-md text-white p-2.5 rounded-full shadow-2xl flex items-center space-x-2 z-50 scale-90 sm:scale-100 border border-white/10 ring-1 ring-white/20">
                {[
                    { icon: Upload, label: 'Upload Drawing', action: () => setShowUploadModal(true) },
                    { icon: MessageCircle, label: 'Respond to Site', action: () => { } },
                    { icon: CheckCircle, label: 'Approve Work', action: () => { } },
                    { icon: Calendar, label: 'Schedule Visit', action: () => { } },
                ].map((action, i) => (
                    <button
                        key={i}
                        onClick={action.action}
                        className="p-3.5 rounded-full hover:bg-[#C06842] transition-all tooltip-trigger relative group"
                    >
                        <action.icon size={22} />
                        <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#2A1F1D] text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none shadow-xl -translate-y-2 group-hover:translate-y-0">
                            {action.label}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#2A1F1D] rotate-45"></div>
                        </span>
                    </button>
                ))}
            </div>

            {/* Upload Modal (Simulation) */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-[#2A1F1D]/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-[#FDFCF8] rounded-[2rem] p-10 max-w-lg w-full shadow-2xl animate-scale-up border border-[#E3DACD]">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-3xl font-serif font-bold text-[#2A1F1D]">Upload Drawing</h3>
                            <button onClick={() => setShowUploadModal(false)} className="bg-[#F9F7F2] p-2.5 rounded-full hover:bg-[#E3DACD] transition-colors"><X size={24} className="text-[#5D4037]" /></button>
                        </div>
                        <div className="space-y-6">
                            <div className="border-3 border-dashed border-[#E3DACD] rounded-3xl p-10 text-center bg-[#F9F7F2]/50 hover:bg-[#F9F7F2] hover:border-[#C06842] transition-all cursor-pointer group">
                                <div className="w-16 h-16 bg-[#E3DACD]/30 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    <Upload className="text-[#8C7B70] group-hover:text-[#C06842] transition-colors" size={32} />
                                </div>
                                <p className="text-[#5D4037] font-bold text-lg">Click to browse</p>
                                <p className="text-[#8C7B70] text-sm mt-1">or drag files here</p>
                            </div>
                            <button
                                onClick={handleUpload}
                                className="w-full py-4 bg-[#2A1F1D] text-white rounded-2xl font-bold text-lg shadow-xl shadow-[#2A1F1D]/20 hover:bg-[#C06842] hover:shadow-[#C06842]/30 hover:-translate-y-1 active:scale-95 transition-all"
                            >
                                Upload & Notify Team
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArchitectDashboard;
