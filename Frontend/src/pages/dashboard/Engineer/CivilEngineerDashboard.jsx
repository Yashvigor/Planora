import React, { useState, useEffect, useCallback } from 'react';
import {
    Building2, Layout, HardHat, TrendingUp, AlertTriangle,
    CheckCircle, FileText, ChevronRight, Bell, Truck
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useMockApp } from '../../../hooks/useMockApp';
import ProjectWorkManager from '../Common/ProjectWorkManager';

// --- Civil Engineer Dashboard ---
const CivilEngineerDashboard = () => {
    const { currentUser } = useMockApp();
    const [loading, setLoading] = useState(false);


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
                            <span>Professional Mode: <strong className="text-[#2A1F1D]">Active</strong></span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6 relative z-10">
                    <div className="text-right hidden md:block">
                        <p className="text-xs text-[#8C7B70] uppercase tracking-widest font-bold mb-1">Status</p>
                        <p className="text-xl font-bold text-green-600">Verified</p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-[#2A1F1D] to-[#4A342E] text-white rounded-2xl flex items-center justify-center font-serif font-bold text-2xl shadow-lg shadow-[#2A1F1D]/20 transform group-hover:scale-105 transition-transform">
                        {currentUser?.name?.[0] || "E"}
                    </div>
                </div>
            </header>

            {/* 2. PROJECT WORK MANAGER */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-[#2A1F1D] font-serif flex items-center gap-2">
                    <TrendingUp className="text-[#C06842]" /> Project Updates & Submissions
                </h2>
                <ProjectWorkManager currentUser={currentUser} />
            </div>

        </div>
    );
};

export default CivilEngineerDashboard;
