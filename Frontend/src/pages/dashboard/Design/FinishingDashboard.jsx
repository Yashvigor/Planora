import React, { useState } from 'react';
import { useMockApp } from '../../../hooks/useMockApp';
import {
    Layout, Palette, Ruler, FileText, ShoppingBag,
    Camera, CheckCircle, AlertTriangle, MessageSquare,
    Clipboard, BookOpen, Upload, Plus, Download,
    ChevronDown, Filter, Search, Eye, MoreHorizontal,
    CheckSquare, Clock, X, Hammer, ShieldCheck, ArrowRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// --- Utility Components ---
const SectionHeader = ({ title, action }) => (
    <div className="flex justify-between items-end mb-6 border-b border-[#E3DACD]/50 pb-3">
        <h3 className="text-xl font-bold font-serif text-[#2A1F1D] flex items-center gap-2">
            {title}
        </h3>
        {action}
    </div>
);

const Card = ({ children, className = "" }) => (
    <div className={`glass-card p-6 rounded-[2rem] border border-[#E3DACD]/40 shadow-sm transition-all hover:shadow-md ${className}`}>
        {children}
    </div>
);

const FinishingDashboard = () => {
    const { currentUser } = useMockApp();
    const [activeTab, setActiveTab] = useState('overview');

    // --- Role Adaptation ---
    const roleConfig = {
        'interior_designer': {
            title: 'Interior Design Studio',
            phase: 'Design & Styling',
            primaryColor: 'bg-[#2A1F1D]',
            accentColor: 'text-[#C06842]',
            canEdit: true
        },
        'false_ceiling': {
            title: 'False Ceiling & Gypsum',
            phase: 'Installation',
            primaryColor: 'bg-[#5D4037]',
            accentColor: 'text-[#E68A2E]',
            canEdit: false
        },
        'fabrication': {
            title: 'Aluminium & Fabrication',
            phase: 'Fabrication',
            primaryColor: 'bg-[#4A342E]',
            accentColor: 'text-[#8C7B70]',
            canEdit: false
        }
    };

    const config = roleConfig[currentUser?.role] || roleConfig['interior_designer'];

    // --- Mock Data ---
    const stats = {
        project: 'Skyline Heights - Penthouse 401',
        type: 'Luxury Apartment',
        overallProgress: 68,
        plannedProgress: 75,
        status: 'In Progress'
    };

    const scopeItems = [
        { id: 1, task: 'Living Room Ceiling', status: 'Completed', progress: 100 },
        { id: 2, task: 'Master Bedroom Wardrobes', status: 'In Progress', progress: 45 },
        { id: 3, task: 'Kitchen Modular Units', status: 'Pending', progress: 0 },
    ];

    const drawings = [
        { id: 1, name: 'False Ceiling Layout - L1.pdf', ver: 'R2', date: 'Feb 01', status: 'Approved' },
        { id: 2, name: 'Kitchen Elevation - North.pdf', ver: 'R1', date: 'Jan 28', status: 'Pending' },
    ];

    const materials = [
        { id: 1, item: 'Gypsum Board (Saint-Gobain)', qty: '150 Sheets', status: 'Available' },
        { id: 2, item: 'LED Strip Lights (Philips)', qty: '50 Mtrs', status: 'Low Stock' },
    ];

    const qcChecklist = [
        { id: 1, item: 'Channel Spacing (450mm)', status: 'Pass' },
        { id: 2, item: 'Level Checking (Laser)', status: 'Pass' },
        { id: 3, item: 'Screw Fixing (150mm c/c)', status: 'Pending' },
    ];

    return (
        <div className="max-w-7xl mx-auto font-sans pb-24 md:pb-10 space-y-8 bg-[#FDFCF8] min-h-screen p-4 md:p-8">

            {/* 1. Header Section */}
            <header className="glass-panel p-8 rounded-[2rem] shadow-xl relative overflow-hidden text-white group animate-fade-in">
                {/* Background Gradient & Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#2A1F1D] to-[#5D4037] z-0"></div>
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#C06842]/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-[#E68A2E] text-xs font-bold uppercase tracking-widest mb-3">
                            <Palette size={14} /> {config.title}
                        </div>
                        <h1 className="text-4xl font-serif font-bold mb-3 text-[#FDFCF8]">Welcome, {currentUser?.name}</h1>
                        <div className="flex flex-wrap gap-4 text-sm font-medium text-[#B8AFA5]">
                            <span className="flex items-center gap-2 bg-[#FDFCF8]/10 border border-[#FDFCF8]/10 px-4 py-2 rounded-full"><Layout size={14} className="text-[#C06842]" /> {stats.project}</span>
                            <span className="flex items-center gap-2 bg-[#FDFCF8]/10 border border-[#FDFCF8]/10 px-4 py-2 rounded-full"><Plus size={14} className="text-[#E68A2E]" /> {stats.type}</span>
                        </div>
                    </div>

                    <div className="glass-card bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl min-w-[240px] hover:bg-white/10 transition-colors">
                        <p className="text-[10px] uppercase text-[#B8AFA5] mb-2 font-bold tracking-widest">Current Phase</p>
                        <div className="text-xl font-bold font-serif text-[#FDFCF8] flex items-center justify-between mb-3">
                            {config.phase}
                            <span className="text-xs bg-[#E68A2E] text-white px-3 py-1 rounded-full shadow-lg shadow-[#E68A2E]/20">
                                {stats.overallProgress}%
                            </span>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#E68A2E] h-full rounded-full" style={{ width: `${stats.overallProgress}%` }}></div>
                        </div>
                    </div>
                </div>
            </header>

            {/* 2. Scope & Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in delay-75">
                <Card className="md:col-span-2">
                    <SectionHeader title="Work Scope & Progress" action={<span className="text-xs font-bold text-[#8C7B70] bg-[#E3DACD]/30 px-3 py-1 rounded-full uppercase tracking-wide">Week 4</span>} />
                    <div className="space-y-4">
                        {scopeItems.map(item => (
                            <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-[#F9F7F2] transition-colors border border-transparent hover:border-[#E3DACD]/50 group">
                                <div className={`p-3 rounded-xl transition-colors ${item.status === 'Completed' ? 'bg-green-50 text-green-600' : 'bg-[#E3DACD]/20 text-[#8C7B70]'}`}>
                                    {item.status === 'Completed' ? <CheckCircle size={20} /> : <Clock size={20} />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between mb-2">
                                        <h4 className="font-bold text-[#2A1F1D] text-lg font-serif group-hover:text-[#C06842] transition-colors">{item.task}</h4>
                                        <span className="text-xs font-bold text-[#5D4037]">{item.progress}%</span>
                                    </div>
                                    <div className="w-full bg-[#E3DACD]/30 h-2 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${item.status === 'Completed' ? 'bg-green-500' : 'bg-[#C06842]'}`} style={{ width: `${item.progress}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="flex flex-col justify-center items-center text-center bg-[#2A1F1D] border-none shadow-xl text-white relative overflow-hidden group">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#2A1F1D] to-[#4A342E] z-0"></div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#C06842]/20 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative z-10 w-48 h-48 flex items-center justify-center mb-6">
                        <svg className="transform -rotate-90 w-full h-full">
                            <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/5" />
                            <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-[#E68A2E] drop-shadow-[0_0_10px_rgba(230,138,46,0.3)]" strokeDasharray={502} strokeDashoffset={502 - (502 * stats.plannedProgress) / 100} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold font-serif text-[#FDFCF8]">{stats.plannedProgress}%</span>
                            <span className="text-[10px] uppercase tracking-widest text-[#B8AFA5] font-bold mt-1">Planned</span>
                        </div>
                    </div>
                    <p className="text-sm text-[#B8AFA5] font-medium relative z-10 bg-[#FDFCF8]/5 px-4 py-2 rounded-full border border-[#FDFCF8]/10">You are slightly behind schedule.</p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in delay-100">
                {/* Left Column: Technical & Materials */}
                <div className="lg:col-span-2 space-y-8">

                    {/* 3. Drawings & References */}
                    <Card>
                        <SectionHeader
                            title="Drawings & References"
                            action={config.canEdit && <button className="text-xs font-bold bg-[#2A1F1D] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#C06842] transition-colors uppercase tracking-wide shadow-lg shadow-[#2A1F1D]/10">+ Upload</button>}
                        />
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {drawings.map(doc => (
                                <div key={doc.id} className="min-w-[220px] p-5 rounded-2xl border border-[#E3DACD]/50 bg-[#F9F7F2] hover:bg-white hover:border-[#C06842]/30 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between h-[160px]">
                                    <div>
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="bg-[#E3DACD]/20 px-2 py-0.5 rounded-lg text-[10px] font-bold text-[#8C7B70] border border-[#E3DACD]/40 uppercase tracking-wider">{doc.ver}</span>
                                            <MoreHorizontal size={16} className="text-[#B8AFA5]" />
                                        </div>
                                        <FileText className="text-[#C06842] mb-3 group-hover:scale-110 transition-transform" size={28} />
                                        <h4 className="font-bold text-[#2A1F1D] text-sm leading-tight mb-1 line-clamp-2 font-serif group-hover:text-[#C06842] transition-colors">{doc.name}</h4>
                                    </div>
                                    <p className={`text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 ${doc.status === 'Approved' ? 'text-green-600' : 'text-[#E68A2E]'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${doc.status === 'Approved' ? 'bg-green-600' : 'bg-[#E68A2E]'}`}></span>
                                        {doc.status}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* 4. Material Panel */}
                    <Card>
                        <SectionHeader title="Material Specifications" />
                        <div className="space-y-3">
                            {materials.map(mat => (
                                <div key={mat.id} className="flex justify-between items-center p-4 bg-[#F9F7F2] border border-[#E3DACD]/40 rounded-2xl hover:bg-white hover:border-[#C06842]/20 hover:shadow-sm transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-[#E3DACD]/20 flex items-center justify-center text-[#8C7B70] group-hover:bg-[#C06842]/10 group-hover:text-[#C06842] transition-colors">
                                            <ShoppingBag size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-[#2A1F1D] text-sm group-hover:text-[#C06842] transition-colors">{mat.item}</h4>
                                            <p className="text-xs text-[#8C7B70] mt-0.5 font-medium">{mat.qty}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wide border ${mat.status === 'Available' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                        {mat.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* 5. Execution Status */}
                    <Card>
                        <SectionHeader title="Site Execution" action={<Camera className="text-[#8C7B70] hover:text-[#C06842] transition-colors cursor-pointer" size={20} />} />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="aspect-square rounded-2xl bg-[#E3DACD]/20 relative overflow-hidden group shadow-sm border border-[#E3DACD]/50">
                                    <img src={`https://source.unsplash.com/random/200x200?interior,construction&sig=${i}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-[#2A1F1D]/60 hidden group-hover:flex items-center justify-center text-white text-xs font-bold backdrop-blur-sm cursor-pointer animate-fade-in">
                                        View Detail
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                </div>

                {/* Right Column: QC, Changes, Actions */}
                <div className="space-y-8">

                    {/* 6. Quality Control */}
                    <Card className="bg-[#F9F7F2]">
                        <h3 className="text-xl font-bold font-serif text-[#2A1F1D] mb-6 flex items-center gap-2">
                            <ShieldCheck size={20} className="text-green-600" /> Quality Control
                        </h3>
                        <div className="space-y-0.5">
                            {qcChecklist.map(item => (
                                <div key={item.id} className="flex justify-between items-center p-3 hover:bg-white rounded-xl transition-colors border-b border-dashed border-[#E3DACD]/50 last:border-0">
                                    <span className="text-sm font-bold text-[#5D4037]">{item.item}</span>
                                    {item.status === 'Pass' ? (
                                        <div className="bg-green-100 p-1 rounded-full text-green-600"><CheckCircle size={14} /></div>
                                    ) : (
                                        <span className="w-5 h-5 rounded-full border-2 border-[#B8AFA5] flex items-center justify-center text-[8px] text-[#B8AFA5] font-bold"></span>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-6 py-2.5 bg-white border border-[#E3DACD] text-[#2A1F1D] font-bold text-xs rounded-xl shadow-sm hover:bg-[#E3DACD]/20 hover:text-[#C06842] transition-colors uppercase tracking-wide">
                            View Full Checklist
                        </button>
                    </Card>

                    {/* 7. Change Management */}
                    <Card>
                        <SectionHeader title="Changes" action={<span className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded-lg border border-red-100 font-bold uppercase tracking-wider">1 Active</span>} />
                        <div className="bg-red-50 p-4 rounded-2xl border border-red-100 mb-2">
                            <div className="flex gap-3">
                                <AlertTriangle size={20} className="text-red-500 mt-0.5 shrink-0" />
                                <div>
                                    <h5 className="font-bold text-red-900 text-sm font-serif">Ceiling Drop Changed</h5>
                                    <p className="text-xs text-red-700 mt-1 font-medium leading-relaxed">Due to HVAC duct sizing. Increased by 50mm.</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* 11. Quick Actions */}
                    <Card className="bg-[#2A1F1D] text-white border-none relative overflow-hidden">
                        {/* Background Effect */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#C06842]/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                        <SectionHeader title={<span className="text-[#FDFCF8]">Quick Actions</span>} />
                        <div className="grid grid-cols-2 gap-3 relative z-10">
                            <button className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all flex flex-col items-center gap-2 text-xs font-bold uppercase tracking-wide border border-white/5 hover:border-white/20">
                                <Upload size={20} className="text-[#E68A2E]" /> Upload File
                            </button>
                            <button className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all flex flex-col items-center gap-2 text-xs font-bold uppercase tracking-wide border border-white/5 hover:border-white/20">
                                <MessageSquare size={20} className="text-[#E68A2E]" /> Raise RFI
                            </button>
                            <button className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all flex flex-col items-center gap-2 text-xs font-bold uppercase tracking-wide border border-white/5 hover:border-white/20">
                                <CheckSquare size={20} className="text-[#E68A2E]" /> Inspection
                            </button>
                            <button className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all flex flex-col items-center gap-2 text-xs font-bold uppercase tracking-wide border border-white/5 hover:border-white/20">
                                <Camera size={20} className="text-[#E68A2E]" /> Site Photo
                            </button>
                        </div>
                    </Card>

                </div>
            </div>

        </div>
    );
};

export default FinishingDashboard;
