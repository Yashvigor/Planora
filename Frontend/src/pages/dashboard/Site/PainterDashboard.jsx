import React, { useState } from 'react';
import { useMockApp } from '../../../hooks/useMockApp';
import {
    PaintBucket, Palette, Ruler, AlertTriangle,
    CheckCircle2, Camera, Droplet, Layers,
    ClipboardCheck, History, DollarSign, CheckSquare,
    Upload, ArrowUpRight, Brush, Zap
} from 'lucide-react';

const PainterDashboard = () => {
    const { currentUser } = useMockApp();

    // --- Mock Data ---
    const stats = {
        assignedProject: 'Skyline Heights - Block B',
        workZone: 'Interior - 2nd Floor',
        currentStage: '1st Coat',
        overallProgress: 45,
        totalArea: 2500, // sq ft
        areaPainted: 1125,
        coatsCompleted: 2,
        pendingPayment: 8000,
        earnedPayment: 22000
    };

    const tasks = [
        {
            id: 1,
            area: 'Living Room',
            surface: 'Wall',
            brand: 'Asian Paints Royale',
            shade: 'Morning Glory (L123)',
            finish: 'Matte',
            coats: '2 Coats',
            size: 650, // sq ft
            startDate: 'Feb 01',
            deadline: 'Feb 05',
            status: 'In Progress',
            stage: '1st Coat Applied',
            imgProgress: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=200'
        },
        {
            id: 2,
            area: 'Master Bedroom',
            surface: 'Ceiling',
            brand: 'Berger Bison',
            shade: 'White',
            finish: 'Matte',
            coats: '2 Coats',
            size: 400,
            startDate: 'Jan 28',
            deadline: 'Jan 30',
            status: 'Completed',
            stage: 'Final Coat Done',
            imgProgress: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=200'
        }
    ];

    const materialUsage = {
        paintUsed: 40, // liters
        puttyUsed: 15, // kg
        primerUsed: 10, // liters
    };

    const qualityChecklist = [
        { id: 1, label: 'Surface Smoothness (Sanding)', checked: true },
        { id: 2, label: 'Uniform Color / No Patchiness', checked: true },
        { id: 3, label: 'No Paint Drops on Floor', checked: false },
        { id: 4, label: 'Proper Drying Time Observed', checked: true },
    ];

    const payments = [
        { id: 1, desc: 'Bedroom Ceiling', amount: 5000, date: 'Jan 30', status: 'Received' },
        { id: 2, desc: 'Living Room Putty', amount: 3000, date: 'Feb 02', status: 'Pending' },
    ];

    // --- Components ---

    const MetricCard = ({ label, value, sub, icon: Icon, color, iconColor }) => (
        <div className="glass-card p-5 rounded-2xl border border-[#E3DACD]/40 shadow-sm flex items-start justify-between hover:shadow-md transition-all group">
            <div>
                <p className="text-[10px] text-[#8C7B70] uppercase tracking-widest mb-1">{label}</p>
                <div className="flex items-baseline gap-1 mt-1">
                    <h3 className="text-xl md:text-3xl font-bold font-serif text-[#2A1F1D] group-hover:text-[#C06842] transition-colors">{value}</h3>
                    {sub && <span className="text-[10px] text-[#B8AFA5] font-bold">{sub}</span>}
                </div>
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={20} className={iconColor} />
            </div>
        </div>
    );

    const TaskCard = ({ task }) => (
        <div className="glass-card p-5 rounded-2xl border border-[#E3DACD]/40 mb-5 group hover:border-[#C06842]/30 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <span className="text-[10px] font-bold bg-[#F9F7F2] text-[#8C7B70] px-3 py-1 rounded-lg uppercase tracking-wider border border-[#E3DACD]">
                        {task.area}
                    </span>
                    <h4 className="font-bold text-[#2A1F1D] font-serif text-xl mt-2 flex items-center gap-2 group-hover:text-[#C06842] transition-colors">
                        <Brush size={18} className="text-[#C06842]" /> {task.surface}
                    </h4>
                    <p className="text-xs text-[#5D4037] mt-1 font-medium">
                        {task.brand} • <span className="font-bold text-[#2A1F1D]">{task.shade}</span>
                    </p>
                </div>
                <div className="text-right">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide border ${task.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-[#E68A2E]/10 text-[#E68A2E] border-[#E68A2E]/20'
                        }`}>
                        {task.status}
                    </span>
                    <p className="text-[10px] text-[#8C7B70] mt-2 font-bold uppercase">{task.finish}</p>
                </div>
            </div>

            <div className="flex gap-4 mb-5 bg-[#F9F7F2] p-4 rounded-xl border border-[#E3DACD]/50 group-hover:bg-[#F9F7F2]/80 transition-colors">
                <div className="flex-1 space-y-1">
                    <p className="text-[10px] text-[#B8AFA5] uppercase font-bold tracking-wider">Specifications</p>
                    <p className="text-xs font-bold text-[#2A1F1D]">{task.coats}</p>
                    <p className="text-xs text-[#5D4037]">{task.size} sq.ft</p>
                </div>
                <div className="flex-1 space-y-1">
                    <p className="text-[10px] text-[#B8AFA5] uppercase font-bold tracking-wider">Timeline</p>
                    <p className="text-xs font-bold text-[#2A1F1D]">Start: {task.startDate}</p>
                    <p className="text-xs text-red-600 font-bold">Due: {task.deadline}</p>
                </div>
                <img src={task.imgProgress} className="w-16 h-16 object-cover rounded-lg bg-gray-200 shadow-sm border border-white" alt="Progress" />
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-[#5D4037]">
                    <span>Current Stage: <span className="text-[#2A1F1D]">{task.stage}</span></span>
                    <button className="text-[10px] font-bold text-[#C06842] flex items-center gap-1 hover:underline uppercase tracking-wide">
                        <Upload size={10} /> Update Photo
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto font-sans pb-24 md:pb-10 space-y-8 bg-[#FDFCF8] min-h-screen p-4 md:p-8">

            {/* 1. Header Section */}
            <div className="glass-panel p-8 rounded-[2rem] shadow-xl relative overflow-hidden text-white group animate-fade-in">
                {/* Background Gradient & Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#2A1F1D] to-[#4A342E] z-0"></div>
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#E68A2E]/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-[#E68A2E] text-xs font-bold uppercase tracking-widest mb-3">
                            <Palette size={14} /> Painter Workspace
                        </div>
                        <h1 className="text-4xl font-bold font-serif mb-3 text-[#FDFCF8]">Welcome, {currentUser?.name}</h1>
                        <p className="text-sm text-[#B8AFA5] flex items-center gap-2 font-medium">
                            <CheckSquare size={16} className="text-[#C06842]" /> Site: <span className="font-bold text-[#FDFCF8]">{stats.assignedProject}</span>
                        </p>
                    </div>
                    <div className="glass-card bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 min-w-[240px] hover:bg-white/10 transition-colors">
                        <p className="text-[10px] text-[#B8AFA5] uppercase tracking-widest mb-2 font-bold">Work Zone</p>
                        <div className="text-lg font-bold text-[#FDFCF8] mb-3 font-serif">{stats.workZone}</div>

                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] text-[#FCD34D] font-bold bg-[#FCD34D]/10 px-2 py-1 rounded border border-[#FCD34D]/20 uppercase tracking-wide">
                                {stats.currentStage}
                            </span>
                            <span className="text-xs text-[#FDFCF8] font-bold">{stats.overallProgress}% Done</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-[#E68A2E]" style={{ width: `${stats.overallProgress}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in delay-75">
                <MetricCard
                    label="Area Painted"
                    value={stats.areaPainted}
                    sub={`/ ${stats.totalArea} sq.ft`}
                    icon={Ruler}
                    color="bg-[#C06842]/10"
                    iconColor="text-[#C06842]"
                />
                <MetricCard
                    label="Coats Done"
                    value={stats.coatsCompleted}
                    sub="Avg per room"
                    icon={Layers}
                    color="bg-[#E68A2E]/10"
                    iconColor="text-[#E68A2E]"
                />
                <MetricCard
                    label="Pending Pay"
                    value={`₹${stats.pendingPayment.toLocaleString()}`}
                    sub="For recent work"
                    icon={History}
                    color="bg-[#8C7B70]/10"
                    iconColor="text-[#8C7B70]"
                />
                <MetricCard
                    label="Total Earned"
                    value={`₹${stats.earnedPayment.toLocaleString()}`}
                    sub="This Project"
                    icon={DollarSign}
                    color="bg-green-50"
                    iconColor="text-green-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in delay-100">
                {/* 3. Assigned Painting Tasks */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-bold font-serif text-[#2A1F1D]">Assigned Tasks</h3>
                        <button className="text-xs font-bold text-[#C06842] bg-[#C06842]/10 px-4 py-2 rounded-xl hover:bg-[#C06842]/20 transition-colors uppercase tracking-wide">View All</button>
                    </div>
                    {tasks.map(task => <TaskCard key={task.id} task={task} />)}

                    {/* 4. Material Usage */}
                    <div className="glass-card p-6 rounded-[2rem] border border-[#E3DACD]/40 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                            <PaintBucket size={120} className="text-[#C06842]" />
                        </div>
                        <div className="flex justify-between items-center mb-8 relative z-10">
                            <h3 className="text-xl font-bold font-serif text-[#2A1F1D] flex items-center gap-3">
                                <PaintBucket size={24} className="text-[#C06842]" /> Material Usage
                            </h3>
                            <button className="text-xs bg-[#2A1F1D] text-white px-4 py-2.5 rounded-xl shadow-lg shadow-[#2A1F1D]/20 hover:bg-[#C06842] transition-colors font-bold tracking-wide">
                                + Log Daily Usage
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-4 relative z-10">
                            <div className="p-5 bg-[#F9F7F2] rounded-2xl text-center border border-[#E3DACD] hover:border-[#C06842]/50 transition-colors">
                                <div className="text-3xl font-bold font-serif text-[#2A1F1D]">{materialUsage.paintUsed}</div>
                                <div className="text-[10px] text-[#C06842] font-bold uppercase mt-1 tracking-widest">Paint (L)</div>
                            </div>
                            <div className="p-5 bg-[#F9F7F2] rounded-2xl text-center border border-[#E3DACD] hover:border-[#C06842]/50 transition-colors">
                                <div className="text-3xl font-bold font-serif text-[#2A1F1D]">{materialUsage.puttyUsed}</div>
                                <div className="text-[10px] text-[#8C7B70] font-bold uppercase mt-1 tracking-widest">Putty (Kg)</div>
                            </div>
                            <div className="p-5 bg-purple-50 rounded-2xl text-center border border-purple-100 hover:border-purple-200 transition-colors">
                                <div className="text-3xl font-bold font-serif text-purple-900">{materialUsage.primerUsed}</div>
                                <div className="text-[10px] text-purple-600 font-bold uppercase mt-1 tracking-widest">Primer (L)</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Q.C., Payments, Quick Actions */}
                <div className="space-y-6">

                    {/* 5. Quality & Finish Checklist */}
                    <div className="glass-card p-6 rounded-[2rem] border border-[#E3DACD]/40 shadow-sm">
                        <h3 className="text-xl font-bold font-serif text-[#2A1F1D] mb-6 flex items-center gap-2">
                            <CheckCircle2 size={24} className="text-green-600" /> Finish Checklist
                        </h3>
                        <div className="space-y-3">
                            {qualityChecklist.map(item => (
                                <div key={item.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-[#E3DACD]/50 bg-[#F9F7F2] hover:bg-white transition-colors">
                                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${item.checked ? 'bg-green-500 border-green-500' : 'border-[#B8AFA5]'}`}>
                                        {item.checked && <CheckSquare size={14} className="text-white" />}
                                    </div>
                                    <span className={`text-sm font-bold ${item.checked ? 'text-[#2A1F1D]' : 'text-[#8C7B70]'}`}>{item.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 flex gap-3">
                            <button className="flex-1 py-2.5 border border-dashed border-[#C06842] text-[#C06842] rounded-xl text-xs font-bold hover:bg-[#C06842]/5 uppercase tracking-wide transition-colors">
                                Alert Issues
                            </button>
                            <button className="flex-1 py-2.5 bg-[#2A1F1D] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#2A1F1D]/20 hover:bg-[#C06842] uppercase tracking-wide transition-colors">
                                Request Approval
                            </button>
                        </div>
                    </div>

                    {/* 6. Payments */}
                    <div className="glass-card p-6 rounded-[2rem] border border-[#E3DACD]/40 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold font-serif text-[#2A1F1D]">Payments</h3>
                            <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-100 px-3 py-1 rounded-full uppercase tracking-wide">Received: ₹{stats.earnedPayment.toLocaleString()}</span>
                        </div>
                        <div className="space-y-3">
                            {payments.map(p => (
                                <div key={p.id} className="flex justify-between items-center p-4 bg-[#F9F7F2] rounded-xl border border-[#E3DACD]/30">
                                    <div>
                                        <p className="text-xs font-bold text-[#2A1F1D] uppercase tracking-wide">{p.desc}</p>
                                        <p className="text-[10px] text-[#8C7B70] mt-0.5">{p.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-[#2A1F1D] font-serif">₹{p.amount.toLocaleString()}</p>
                                        <p className={`text-[10px] font-bold uppercase tracking-wider ${p.status === 'Received' ? 'text-green-600' : 'text-[#E68A2E]'}`}>{p.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-6 py-3 bg-[#2A1F1D] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#2A1F1D]/20 flex items-center justify-center gap-2 hover:bg-[#C06842] transition-colors uppercase tracking-wide">
                            <DollarSign size={16} /> Request Payment
                        </button>
                    </div>

                    {/* 9. Quick Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <button className="p-5 bg-[#2A1F1D] text-white rounded-2xl shadow-lg shadow-[#2A1F1D]/20 flex flex-col items-center justify-center gap-2 hover:bg-[#C06842] transition-colors active:scale-95 group">
                            <Zap size={24} className="group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold uppercase tracking-wide">Mark Complete</span>
                        </button>
                        <button className="p-5 bg-white border border-[#E3DACD] text-[#5D4037] rounded-2xl shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors active:scale-95 group">
                            <AlertTriangle size={24} className="group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold uppercase tracking-wide">Report Dampness</span>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PainterDashboard;
