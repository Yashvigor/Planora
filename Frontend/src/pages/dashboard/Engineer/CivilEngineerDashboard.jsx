import React, { useState } from 'react';
import {
    Building2, Calendar, ClipboardCheck, Layout, HardHat,
    TrendingUp, AlertTriangle, CheckCircle, FileText,
    Hammer, Ruler, ChevronRight, Menu, Bell, Truck,
    AlertOctagon, FileWarning
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useMockApp } from '../../../hooks/useMockApp';

// --- Card Component ---
const Card = ({ children, className = "" }) => (
    <div className={`glass-card p-6 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all ${className}`}>
        {children}
    </div>
);

// --- Civil Engineer Dashboard ---
const CivilEngineerDashboard = () => {
    const { currentUser } = useMockApp();
    const [activeQCTab, setActiveQCTab] = useState('checklists');

    // Mock Data
    const projectInfo = {
        name: 'Skyline Heights (Block A)',
        type: 'Residential High-Rise',
        phase: 'RCC Structure - 4th Floor',
        progress: 65,
        nextMilestone: 'Feb 15',
        daysAhead: 2
    };

    const materials = [
        { name: 'Cement', stock: '120 Bags', req: '150 Bags', issued: '30 Bags', status: 'warning' },
        { name: 'Steel (TMT)', stock: '5 Tons', req: '4 Tons', issued: '0.5 Tons', status: 'good' },
        { name: 'River Sand', stock: '800 cft', req: '1000 cft', issued: '200 cft', status: 'critical' },
    ];

    const qcData = {
        checklists: [
            { task: 'Foundation Rebar Check', status: 'Passed', date: 'Today, 10:00 AM' },
            { task: 'Concrete Slump Test', status: 'Pending', date: 'Today, 02:00 PM' },
        ],
        reports: [
            { task: 'Cube Test Report (7 Days)', status: 'Passed', date: 'Yesterday' },
            { task: 'Steel Tensile Strength', status: 'Passed', date: 'Jan 28' },
        ],
        ncr: [
            { task: 'Brickwork Alignment (Wall 4)', status: 'Open', date: 'Jan 30', action: 'Re-do required' }
        ]
    };

    const documents = [
        { name: 'Structural Layout.pdf', ver: 'v2.4', date: 'Jan 28', type: 'Approved Drawing' },
        { name: 'Block_A_BOQ_Rev3.xlsx', ver: 'v3.0', date: 'Jan 15', type: 'BOQ & Specs' },
        { name: 'Method_Statement_Slab.pdf', ver: 'v1.0', date: 'Jan 10', type: 'Method Statement' },
    ];

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in font-sans pb-20 text-[#2A1F1D]">

            {/* 1. HEADER SECTION */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[#FDFCF8] p-8 rounded-[2.5rem] border border-[#E3DACD] shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#C06842]/5 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none"></div>
                <div className="relative z-10">
                    <div className="flex items-center space-x-2 text-[#8C7B70] mb-2">
                        <div className="p-1.5 bg-[#E3DACD]/30 rounded-lg">
                            <HardHat size={16} className="text-[#C06842]" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-widest">Civil Engineer Board</span>
                    </div>
                    <h1 className="text-4xl font-bold text-[#2A1F1D] font-serif mb-4">Welcome, {currentUser?.name || "Eng. Rajesh"}</h1>

                    <div className="flex flex-wrap gap-3 mt-2">
                        <div className="px-3 py-1.5 bg-[#F9F7F2] rounded-xl border border-[#E3DACD]/50 flex items-center gap-2 text-sm text-[#5D4037] shadow-sm">
                            <Building2 size={14} className="text-[#C06842]" />
                            <span>Project: <strong className="text-[#2A1F1D]">{projectInfo.name}</strong></span>
                        </div>
                        <div className="px-3 py-1.5 bg-[#F9F7F2] rounded-xl border border-[#E3DACD]/50 flex items-center gap-2 text-sm text-[#5D4037] shadow-sm">
                            <Layout size={14} className="text-[#E68A2E]" />
                            <span>Type: <strong className="text-[#2A1F1D]">{projectInfo.type}</strong></span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6 relative z-10">
                    <div className="text-right hidden md:block">
                        <p className="text-xs text-[#8C7B70] uppercase tracking-widest font-bold mb-1">Current Phase</p>
                        <p className="text-xl font-bold text-[#C06842]">{projectInfo.phase}</p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-[#2A1F1D] to-[#4A342E] text-white rounded-2xl flex items-center justify-center font-serif font-bold text-2xl shadow-lg shadow-[#2A1F1D]/20 transform group-hover:scale-105 transition-transform">
                        {currentUser?.name?.[0] || "E"}
                    </div>
                </div>
            </header>

            {/* 2. SITE PROGRESS OVERVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="flex flex-col justify-between group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[#8C7B70] text-[10px] font-bold uppercase tracking-widest">Overall Progress</p>
                            <h3 className="text-4xl font-serif font-medium text-[#2A1F1D] mt-2 group-hover:text-[#C06842] transition-colors">{projectInfo.progress}%</h3>
                        </div>
                        <CircularProgress value={projectInfo.progress} />
                    </div>
                    <div className="mt-4 pt-4 border-t border-[#E3DACD]/40">
                        <div className="flex justify-between text-xs">
                            <span className="text-[#8C7B70] font-medium">Current Stage</span>
                            <span className="font-bold text-[#2A1F1D]">Foundation</span>
                        </div>
                    </div>
                </Card>

                <Card className="flex flex-col justify-center items-center text-center bg-gradient-to-br from-[#FDFCF8] to-[#F9F7F2]">
                    <p className="text-[#8C7B70] text-[10px] font-bold uppercase tracking-widest">Planned vs Actual</p>
                    <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-4xl font-serif font-medium text-green-600">+{projectInfo.daysAhead}</span>
                        <span className="text-sm font-bold text-green-600">Days Ahead</span>
                    </div>
                    <p className="text-xs text-[#B8AFA5] mt-2 font-medium">Keep it up!</p>
                </Card>

                <Card className="md:col-span-2">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-sm font-bold text-[#2A1F1D] uppercase tracking-wide flex items-center gap-2">
                            <Truck size={18} className="text-[#C06842]" /> Material Management
                        </h3>
                        <span className="text-[10px] font-bold bg-[#F9F7F2] px-3 py-1 rounded-full text-[#8C7B70] border border-[#E3DACD]/50 hover:bg-[#E3DACD] transition-colors cursor-pointer">Daily Report</span>
                    </div>
                    <div className="space-y-3">
                        <div className="grid grid-cols-4 text-[10px] uppercase font-bold text-[#8C7B70] px-2 tracking-wider">
                            <span>Item</span>
                            <span>Stock</span>
                            <span>Issued Today</span>
                            <span>Status</span>
                        </div>
                        {materials.map((m, i) => (
                            <div key={i} className="grid grid-cols-4 items-center p-3 bg-[#FDFCF8] rounded-xl border border-[#E3DACD]/40 text-sm hover:border-[#C06842]/30 hover:shadow-sm transition-all">
                                <span className="font-bold text-[#2A1F1D]">{m.name}</span>
                                <span className="text-[#5D4037]">{m.stock}</span>
                                <span className="text-[#5D4037]">{m.issued}</span>
                                <div>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase ${m.status === 'good' ? 'bg-green-50 text-green-700' :
                                        m.status === 'warning' ? 'bg-amber-50 text-amber-700' :
                                            'bg-red-50 text-red-700'
                                        }`}>
                                        {m.status === 'good' ? 'OK' : m.status === 'warning' ? 'Low' : 'Shortage'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 4. QUALITY CONTROL & INSPECTION */}
                <Card className="lg:col-span-1 h-fit bg-[#FDFCF8]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-[#2A1F1D] flex items-center gap-2 font-serif">
                            <ClipboardCheck size={20} className="text-[#C06842]" /> Quality Control
                        </h3>
                    </div>

                    <div className="flex space-x-1 bg-[#F9F7F2] p-1.5 rounded-xl mb-6 border border-[#E3DACD]/30">
                        {['checklists', 'reports', 'ncr'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveQCTab(tab)}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeQCTab === tab ? 'bg-white text-[#2A1F1D] shadow-sm text-[#C06842]' : 'text-[#8C7B70] hover:text-[#5D4037]'
                                    }`}
                            >
                                {tab === 'ncr' ? 'NCR' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-3 min-h-[200px]">
                        {qcData[activeQCTab].map((item, i) => (
                            <div key={i} className="p-4 border border-[#E3DACD]/40 rounded-2xl hover:bg-[#F9F7F2] transition-all hover:border-[#C06842]/20 cursor-default">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${item.status === 'Passed' ? 'bg-green-50 text-green-700' :
                                        item.status === 'Pending' ? 'bg-amber-50 text-amber-700' :
                                            'bg-red-50 text-red-700'
                                        }`}>{item.status}</span>
                                    <span className="text-[10px] text-[#B8AFA5] font-medium">{item.date}</span>
                                </div>
                                <p className="text-sm font-bold text-[#2A1F1D] mb-1">{item.task}</p>
                                {item.action && <p className="text-xs text-red-600 mt-1.5 font-bold flex items-center gap-1"><AlertTriangle size={10} /> Action: {item.action}</p>}
                            </div>
                        ))}
                        {qcData[activeQCTab].length === 0 && <p className="text-center text-xs text-[#B8AFA5] py-4">No records found.</p>}
                    </div>
                </Card>

                {/* 5. DRAWINGS & TECH DOCUMENTS */}
                <Card className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-[#2A1F1D] flex items-center gap-2 font-serif">
                            <FileText size={20} className="text-[#E68A2E]" /> Technical Documents
                        </h3>
                        <button className="px-4 py-2 bg-[#2A1F1D] text-white text-xs font-bold rounded-xl hover:bg-[#C06842] transition-colors shadow-lg shadow-[#2A1F1D]/10">
                            View All Docs
                        </button>
                    </div>

                    <div className="space-y-3">
                        {documents.map((doc, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-[#F9F7F2]/50 rounded-2xl border border-[#E3DACD]/40 group hover:border-[#C06842]/30 hover:bg-white transition-all shadow-sm hover:shadow-md cursor-pointer">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#C06842] shadow-sm border border-[#E3DACD]/30 group-hover:scale-105 transition-transform">
                                        {doc.type.includes('BOQ') ? <Layout size={22} /> : <FileText size={22} />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[#2A1F1D] text-sm group-hover:text-[#C06842] transition-colors">{doc.name}</h4>
                                        <p className="text-xs text-[#8C7B70] mt-1 font-medium">{doc.type} • {doc.date}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="bg-[#E3DACD]/30 text-[#5D4037] text-xs font-bold px-2.5 py-1 rounded-lg">{doc.ver}</span>
                                    <button className="p-2 hover:bg-[#F9F7F2] rounded-lg text-[#8C7B70] hover:text-[#C06842] transition-colors"><ChevronRight size={20} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

// Simple Circular Progress for UI
const CircularProgress = ({ value }) => {
    const data = [{ value: value }, { value: 100 - value }];
    return (
        <div className="w-16 h-16 relative">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={data} innerRadius={22} outerRadius={32} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                        <Cell fill="#4CAF50" />
                        <Cell fill="#E3DACD" />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#2A1F1D]">
                {value}%
            </div>
        </div>
    );
};

export default CivilEngineerDashboard;
