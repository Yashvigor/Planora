import React from 'react';
import { useMockApp } from '../../../hooks/useMockApp';
import { HardHat, Clock, CheckCircle, AlertCircle, FileText } from 'lucide-react';

const ContractorOverview = () => {
    // Mock Assigned Projects for the demo
    const assignedProjects = [
        { id: 101, name: 'Oceanview Villa', location: 'Miami, FL', status: 'In Progress', progress: 65, deadline: '2024-12-01' },
        { id: 102, name: 'Downtown Office Renovation', location: 'Austin, TX', status: 'Planning', progress: 15, deadline: '2025-01-15' },
    ];

    return (
        <div className="space-y-8 max-w-7xl mx-auto animate-fade-in font-sans pb-20 text-[#2A1F1D]">
            {/* Header */}
            <div className="glass-panel rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-500 border border-[#E3DACD]">
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-10 pointer-events-none">
                    <HardHat size={200} className="text-[#C06842]" />
                </div>
                <div className="relative z-10">
                    <h1 className="text-5xl font-bold text-[#2A1F1D] mb-3 font-serif">Contractor Dashboard</h1>
                    <p className="text-[#8C7B70] font-medium text-lg max-w-md">Track your sites, manage labor, and upload daily progress reports efficiently.</p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-8 rounded-2xl shadow-sm border border-l-4 border-l-[#C06842] border-t border-r border-b border-[#E3DACD]/50 hover:shadow-lg transition-all group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-[#8C7B70] uppercase tracking-wider">Active Sites</p>
                            <h3 className="text-4xl font-serif font-bold text-[#2A1F1D] mt-2">2</h3>
                        </div>
                        <div className="bg-[#C06842]/10 p-4 rounded-2xl group-hover:scale-110 transition-transform"><HardHat className="text-[#C06842]" size={32} /></div>
                    </div>
                </div>
                <div className="glass-card p-8 rounded-2xl shadow-sm border border-l-4 border-l-[#E68A2E] border-t border-r border-b border-[#E3DACD]/50 hover:shadow-lg transition-all group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-[#8C7B70] uppercase tracking-wider">Pending Reports</p>
                            <h3 className="text-4xl font-serif font-bold text-[#2A1F1D] mt-2">1</h3>
                        </div>
                        <div className="bg-[#E68A2E]/10 p-4 rounded-2xl group-hover:scale-110 transition-transform"><FileText className="text-[#E68A2E]" size={32} /></div>
                    </div>
                </div>
                <div className="glass-card p-8 rounded-2xl shadow-sm border border-l-4 border-l-green-500 border-t border-r border-b border-[#E3DACD]/50 hover:shadow-lg transition-all group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-[#8C7B70] uppercase tracking-wider">Completed Jobs</p>
                            <h3 className="text-4xl font-serif font-bold text-[#2A1F1D] mt-2">14</h3>
                        </div>
                        <div className="bg-green-100 p-4 rounded-2xl group-hover:scale-110 transition-transform"><CheckCircle className="text-green-600" size={32} /></div>
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-[#2A1F1D] mt-10 font-serif flex items-center gap-3">
                <span className="w-2 h-8 bg-[#2A1F1D] rounded-full"></span>
                Assigned Projects
            </h2>
            <div className="space-y-6">
                {assignedProjects.map(project => (
                    <div key={project.id} className="glass-card p-8 rounded-3xl shadow-sm border border-[#E3DACD]/40 hover:shadow-xl transition-all hover:border-[#C06842]/30 group">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h3 className="font-bold text-2xl text-[#2A1F1D] group-hover:text-[#C06842] transition-colors font-serif">{project.name}</h3>
                                <p className="text-sm text-[#8C7B70] font-medium flex items-center gap-2 mt-1">
                                    <span className="w-1.5 h-1.5 bg-[#C06842] rounded-full"></span>
                                    {project.location}
                                </p>
                            </div>
                            <div className="flex items-center gap-8">
                                <div className="text-center">
                                    <span className="block text-[10px] uppercase text-[#B8AFA5] font-bold tracking-widest mb-1">Deadline</span>
                                    <span className="text-sm font-bold text-[#5D4037] flex items-center gap-1 bg-[#F9F7F2] px-2 py-1 rounded-lg border border-[#E3DACD]">
                                        <Clock size={12} /> {project.deadline}
                                    </span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-[10px] uppercase text-[#B8AFA5] font-bold tracking-widest mb-1">Status</span>
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${project.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                        {project.status}
                                    </span>
                                </div>
                                <button className="px-6 py-3 bg-[#2A1F1D] text-white rounded-xl font-bold hover:bg-[#C06842] transition-all shadow-lg hover:shadow-[#C06842]/30 active:scale-95">
                                    View Workspace
                                </button>
                            </div>
                        </div>
                        <div className="mt-6">
                            <div className="flex justify-between text-xs text-[#8C7B70] mb-2 font-bold uppercase tracking-wider">
                                <span>Progress</span>
                                <span>{project.progress}%</span>
                            </div>
                            <div className="h-2.5 w-full bg-[#E3DACD]/30 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-[#2A1F1D] to-[#C06842] rounded-full relative overflow-hidden" style={{ width: `${project.progress}%` }}>
                                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ContractorOverview;
