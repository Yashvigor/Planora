import React, { useState } from 'react';
import { useMockApp } from '../../../hooks/useMockApp';
import {
    Grid, Ruler, AlertTriangle, FileCheck,
    Activity, Clock, Download, Layers, Calculator,
    FileText, ChevronRight, XCircle, CheckCircle,
    Building2, Eye, Layout
} from 'lucide-react';

const StructuralDashboard = () => {
    const { currentUser } = useMockApp();
    const [activeTab, setActiveTab] = useState('foundation');

    // Mock Data
    const designStatus = [
        { title: 'Foundation Design', status: 'Approved', progress: 100 },
        { title: 'Column–Beam–Slab', status: 'In Progress', progress: 65 },
        { title: 'Staircase & Lift Core', status: 'Pending', progress: 30 },
        { title: 'Retaining Structures', status: 'Not Started', progress: 0 },
    ];

    const drawings = {
        foundation: [
            { name: 'FDN-01_Footing_Layout.pdf', ver: 'R2', date: 'Jan 15', status: 'AFC' },
            { name: 'FDN-02_Sections.pdf', ver: 'R2', date: 'Jan 15', status: 'AFC' },
        ],
        framing: [
            { name: 'GB-01_Grade_Slab.pdf', ver: 'R1', date: 'Jan 20', status: 'Review' },
            { name: 'L1-01_Beam_Layout.pdf', ver: 'R0', date: 'Jan 22', status: 'Draft' },
        ],
        bbs: [
            { name: 'BBS_Foundation_Zone_A.xlsx', ver: 'v1', date: 'Jan 18', status: 'Approved' },
        ],
        calcs: [
            { name: 'STAAD_Output_Rev3.pdf', ver: 'v3', date: 'Jan 10', status: 'Reference' },
            { name: 'Load_Combinations.xlsx', ver: 'v1', date: 'Dec 20', status: 'Approved' },
        ]
    };

    const changes = [
        {
            id: 1,
            title: 'Cantilever Extension (Balcony 2)',
            reason: 'Architectural Requirement',
            safetyImpact: 'High - Moment capacity exceeded by 15%',
            costTime: '+ $5000 / + 1 Week',
            status: 'Analysis Required',
            color: 'red'
        },
        {
            id: 2,
            title: 'Column Grid C4 Shift',
            reason: 'Parking Driveway Clearance',
            safetyImpact: 'Low - Within redistribution limits',
            costTime: 'Negligible',
            status: 'Approved',
            color: 'green'
        }
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in font-sans pb-20 text-[#2A1F1D]">
            {/* 1. HEADER SECTION */}
            <div className="glass-panel rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#C06842]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div>
                        <div className="flex items-center space-x-3 mb-2 opacity-80">
                            <div className="p-2 bg-[#C06842]/10 rounded-lg text-[#C06842]">
                                <Activity size={18} />
                            </div>
                            <span className="text-sm font-bold tracking-widest uppercase text-[#8C7B70]">Structural Engineer Workspace</span>
                        </div>
                        <h1 className="text-5xl font-bold mb-4 font-serif text-[#2A1F1D]">Welcome, {currentUser?.name || "Structural Eng."}</h1>
                        <div className="flex flex-wrap gap-4 text-sm mt-6">
                            <div className="px-4 py-2 bg-[#F9F7F2] rounded-xl border border-[#E3DACD] flex items-center space-x-2 text-[#5D4037] shadow-sm">
                                <Layout size={16} className="text-[#C06842]" />
                                <span>Active Projects: <strong className="text-[#2A1F1D] ml-1">2</strong></span>
                            </div>
                            <div className="px-4 py-2 bg-[#F9F7F2] rounded-xl border border-[#E3DACD] flex items-center space-x-2 text-[#5D4037] shadow-sm">
                                <Building2 size={16} className="text-[#E68A2E]" />
                                <span>Selected: <strong className="text-[#2A1F1D] ml-1">Skyline Heights</strong></span>
                            </div>
                            <div className="px-4 py-2 bg-[#F9F7F2] rounded-xl border border-[#E3DACD] flex items-center space-x-2 text-[#5D4037] shadow-sm">
                                <Grid size={16} className="text-[#8C7B70]" />
                                <span>System: <strong className="text-[#2A1F1D] ml-1">RCC Frame</strong></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. STRUCTURAL DESIGN STATUS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {designStatus.map((item, i) => (
                    <div key={i} className="glass-card p-6 rounded-2xl border border-[#E3DACD]/40 shadow-sm hover:shadow-md transition-all group hover:border-[#C06842]/30">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-[#2A1F1D] text-sm h-10 flex items-center group-hover:text-[#C06842] transition-colors">{item.title}</h3>
                            <span className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-lg border ${item.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-100' :
                                item.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                    'bg-gray-50 text-gray-500 border-gray-100'
                                }`}>
                                {item.status}
                            </span>
                        </div>
                        <div className="w-full bg-[#E3DACD]/30 h-2 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${item.status === 'Approved' ? 'bg-green-500' :
                                    item.status === 'In Progress' ? 'bg-[#C06842]' : 'bg-[#B8AFA5]'
                                    }`}
                                style={{ width: `${item.progress}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 3. DRAWINGS & CALCULATIONS */}
                <div className="lg:col-span-2 glass-card rounded-[2rem] border border-[#E3DACD]/40 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                    <div className="p-8 border-b border-[#E3DACD]/30 flex justify-between items-center bg-[#F9F7F2]/30">
                        <h3 className="text-xl font-bold font-serif text-[#2A1F1D] flex items-center gap-3">
                            <div className="p-2 bg-[#C06842]/10 rounded-lg text-[#C06842]">
                                <Layers size={20} />
                            </div>
                            Structural Drawings & Calcs
                        </h3>
                        <button className="flex items-center space-x-2 text-sm font-bold text-white bg-[#2A1F1D] hover:bg-[#C06842] px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95">
                            <Download size={16} /> <span>Download Package</span>
                        </button>
                    </div>

                    <div className="flex border-b border-[#E3DACD]/30 px-6 pt-2">
                        {['Foundation', 'Framing', 'BBS', 'Calcs'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab.toLowerCase())}
                                className={`px-6 py-4 text-sm font-bold transition-all border-b-2 relative top-[2px] ${activeTab === tab.toLowerCase()
                                    ? 'border-[#C06842] text-[#C06842]'
                                    : 'border-transparent text-[#8C7B70] hover:text-[#5D4037]'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="p-6">
                        <div className="space-y-3">
                            {drawings[activeTab]?.length > 0 ? (
                                drawings[activeTab].map((doc, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-[#E3DACD]/40 hover:border-[#C06842]/30 bg-[#FDFCF8] hover:bg-white hover:shadow-md transition-all group cursor-pointer">
                                        <div className="flex items-center space-x-5">
                                            <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-[#8C7B70] shadow-sm border border-[#E3DACD]/30 group-hover:scale-105 transition-transform">
                                                {activeTab === 'calcs' || activeTab === 'bbs' ? <Calculator size={22} className="group-hover:text-[#C06842] transition-colors" /> : <Ruler size={22} className="group-hover:text-[#C06842] transition-colors" />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-[#2A1F1D] text-sm group-hover:text-[#C06842] transition-colors">{doc.name}</h4>
                                                <p className="text-xs text-[#8C7B70] mt-1 font-medium">Updated: {doc.date}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="px-2.5 py-1 bg-[#F9F7F2] border border-[#E3DACD] text-[#5D4037] text-xs font-bold rounded-lg">
                                                {doc.ver}
                                            </span>
                                            <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${doc.status === 'AFC' || doc.status === 'Approved' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                                                }`}>
                                                {doc.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-[#B8AFA5] text-sm font-medium">No documents found for this section.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. DESIGN CHANGE ANALYSIS */}
                <div className="glass-card rounded-[2rem] border border-[#E3DACD]/40 shadow-sm p-8 h-fit">
                    <h3 className="text-xl font-bold font-serif text-[#2A1F1D] mb-6 flex items-center gap-3">
                        <AlertTriangle className="text-[#C06842] animate-pulse" />
                        Impact Analysis
                    </h3>

                    <div className="space-y-4">
                        {changes.map((change) => (
                            <div key={change.id} className="p-5 rounded-2xl border border-[#E3DACD]/50 hover:shadow-lg transition-all relative overflow-hidden bg-[#FDFCF8] group hover:border-[#C06842]/30">
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${change.color === 'red' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                <div className="pl-2">
                                    <h4 className="font-bold text-[#2A1F1D] text-sm group-hover:text-[#C06842] transition-colors">{change.title}</h4>
                                    <p className="text-xs text-[#8C7B70] mt-1 font-medium italic">Reason: {change.reason}</p>

                                    <div className="mt-4 space-y-2 border-t border-[#E3DACD]/30 pt-3">
                                        <div className="flex items-start gap-2">
                                            <Activity size={14} className="text-[#B8AFA5] mt-0.5" />
                                            <span className="text-xs text-[#5D4037] font-medium">Safety: <span className={change.color === 'red' ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>{change.safetyImpact}</span></span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Clock size={14} className="text-[#B8AFA5] mt-0.5" />
                                            <span className="text-xs text-[#5D4037] font-medium">Cost/Time: {change.costTime}</span>
                                        </div>
                                    </div>

                                    <div className="mt-5 flex gap-3">
                                        {change.status === 'Analysis Required' ? (
                                            <>
                                                <button className="flex-1 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors border border-red-100">Reject</button>
                                                <button className="flex-1 py-2 bg-[#2A1F1D] text-white text-xs font-bold rounded-xl hover:bg-[#C06842] transition-colors shadow-md">Approve</button>
                                            </>
                                        ) : (
                                            <div className="w-full py-2 bg-green-50 text-green-700 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-2 border border-green-100">
                                                <CheckCircle size={14} /> Approved
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StructuralDashboard;
