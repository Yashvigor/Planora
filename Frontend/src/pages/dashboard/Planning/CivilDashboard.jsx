import React from 'react';
import { useMockApp } from '../../../hooks/useMockApp';
import {
    Truck, Package, ClipboardCheck, AlertOctagon,
    BarChart2, FileText, CheckSquare, Activity
} from 'lucide-react';

/**
 * 👷 Civil Engineer Dashboard
 * 
 * Target Persona: Civil Engineers executing site work on Planora projects.
 * 
 * Purpose: Provides a role-specific view focusing on ground-level execution,
 * structural integrity tracking, material inventory alerts, and quality control (QC)
 * testing results (e.g., Slump tests, Cube tests).
 */
const CivilDashboard = () => {
    const { currentUser } = useMockApp();

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in font-sans pb-20 text-[#2A1F1D]">
            {/* 1. Header Section */}
            <div className="glass-panel rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#C06842]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div>
                        <div className="flex items-center space-x-3 mb-2 opacity-80">
                            <div className="p-2 bg-[#C06842]/10 rounded-lg text-[#C06842]">
                                <Activity size={18} />
                            </div>
                            <span className="text-sm font-bold tracking-widest uppercase text-[#8C7B70]">Civil Engineer Workspace</span>
                        </div>
                        <h1 className="text-5xl font-serif font-bold mb-4 text-[#2A1F1D]">Welcome, {currentUser?.name || "Civil Engineer"}</h1>
                        <p className="text-[#8C7B70] font-medium text-lg">Site: Green Valley • Phase: RCC Structure</p>
                    </div>
                </div>
            </div>

            {/* 2. Site Progress & Materials */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-[2rem] border border-[#E3DACD]/40 shadow-sm hover:shadow-md transition-all group hover:border-[#C06842]/30">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-[#F9F7F2] rounded-xl text-[#2A1F1D] group-hover:bg-[#2A1F1D] group-hover:text-white transition-colors">
                            <BarChart2 size={20} />
                        </div>
                        <h3 className="font-bold text-[#2A1F1D]">Construction Progress</h3>
                    </div>
                    <div className="text-4xl font-serif font-bold text-[#2A1F1D] mb-2">42%</div>
                    <div className="w-full bg-[#E3DACD]/30 h-2 rounded-full overflow-hidden mb-2">
                        <div className="bg-[#C06842] h-full rounded-full w-[42%]"></div>
                    </div>
                    <p className="text-xs text-green-600 font-bold flex items-center gap-1.5 bg-green-50 px-2.5 py-1 rounded-lg w-fit border border-green-100">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        On Schedule
                    </p>
                </div>

                <div className="glass-card p-6 rounded-[2rem] border border-[#E3DACD]/40 shadow-sm hover:shadow-md transition-all group hover:border-[#C06842]/30">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-[#F9F7F2] rounded-xl text-[#2A1F1D] group-hover:bg-[#2A1F1D] group-hover:text-white transition-colors">
                            <Package size={20} />
                        </div>
                        <h3 className="font-bold text-[#2A1F1D]">Material Stock</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm font-bold text-[#5D4037]">
                                <span>Cement (Bags)</span>
                                <span>120 / 500</span>
                            </div>
                            <div className="w-full bg-[#E3DACD]/30 h-2 rounded-full">
                                <div className="bg-red-500 h-full rounded-full w-[24%]"></div>
                            </div>
                        </div>
                        <p className="text-xs text-red-600 font-bold bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 flex items-center gap-2">
                            <AlertOctagon size={12} /> Low Stock Alert!
                        </p>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-[2rem] border border-[#E3DACD]/40 shadow-sm hover:shadow-md transition-all group hover:border-[#C06842]/30">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-[#F9F7F2] rounded-xl text-[#2A1F1D] group-hover:bg-[#2A1F1D] group-hover:text-white transition-colors">
                            <ClipboardCheck size={20} />
                        </div>
                        <h3 className="font-bold text-[#2A1F1D]">Quality Control</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-[#F9F7F2] rounded-xl border border-[#E3DACD]/30">
                            <span className="text-sm font-bold text-[#5D4037]">Cube Test</span>
                            <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded-md border border-green-100">Passed</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-[#F9F7F2] rounded-xl border border-[#E3DACD]/30">
                            <span className="text-sm font-bold text-[#5D4037]">Slump Test</span>
                            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">Pending</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Drawings & Technical Docs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-card p-8 rounded-[2rem] border border-[#E3DACD]/40 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-[#C06842]/10 rounded-lg text-[#C06842]">
                            <FileText size={20} />
                        </div>
                        <h3 className="text-xl font-serif font-bold text-[#2A1F1D]">Technical Documents</h3>
                    </div>
                    <div className="space-y-3">
                        {['Struct_Drawings_R2.pdf', 'Method_Statement_Foundations.pdf', 'BOQ_Civil_Works_v4.xlsx'].map((doc, i) => (
                            <div key={i} className="flex items-center justify-between p-4 border border-[#E3DACD]/40 rounded-2xl hover:bg-[#F9F7F2] hover:border-[#C06842]/30 cursor-pointer transition-all group">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#8C7B70] shadow-sm border border-[#E3DACD]/30 group-hover:scale-105 transition-transform">
                                        <FileText size={18} />
                                    </div>
                                    <span className="font-bold text-[#2A1F1D] text-sm group-hover:text-[#C06842] transition-colors">{doc}</span>
                                </div>
                                <span className="text-[10px] font-bold text-[#C06842] uppercase tracking-wider bg-[#C06842]/10 px-2.5 py-1 rounded-lg">View</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card p-8 rounded-[2rem] border border-[#E3DACD]/40 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-[#C06842]/10 rounded-lg text-[#C06842]">
                            <CheckSquare size={20} />
                        </div>
                        <h3 className="text-xl font-serif font-bold text-[#2A1F1D]">Daily Checklist</h3>
                    </div>
                    <div className="space-y-3">
                        {['Check formwork alignment', 'Verify steel reinforcement spacing', 'Curing of previous slab'].map((task, i) => (
                            <label key={i} className="flex items-center space-x-3 p-4 bg-[#F9F7F2] rounded-2xl cursor-pointer hover:bg-[#E3DACD]/30 transition-colors border border-transparent hover:border-[#E3DACD]">
                                <input type="checkbox" className="w-5 h-5 ml-1 text-[#C06842] rounded focus:ring-[#C06842] border-[#8C7B70]" />
                                <span className="text-[#5D4037] font-bold text-sm">{task}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CivilDashboard;
