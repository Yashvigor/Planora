import React, { useState } from 'react';
import { useMockApp } from '../../../hooks/useMockApp';
import {
    LayoutGrid, DollarSign, Ruler, AlertTriangle,
    Camera, ChevronRight, Droplet, Layers,
    ClipboardCheck, History, Phone, Bell, CheckSquare,
    Upload, X, ArrowUpRight, Search, Filter
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const TileWorkerDashboard = () => {
    const { currentUser } = useMockApp();
    const [activeTab, setActiveTab] = useState('tasks');

    // --- Mock Data ---
    const stats = {
        assignedProject: 'Skyline Heights - Block B',
        workArea: 'Master Bathroom',
        currentPhase: 'Wall Tiling',
        overallProgress: 65,
        totalArea: 1200, // sq ft
        areaCompleted: 780,
        pendingPayment: 15400,
        earnedPayment: 35000
    };

    const tasks = [
        {
            id: 1,
            area: 'Master Bathroom',
            type: 'Vitrified (Antiskid)',
            pattern: 'Diagonal',
            size: 120, // sq ft
            startDate: 'Feb 01',
            endDate: 'Feb 03',
            progress: 40,
            status: 'In Progress',
            imgBefore: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=200',
            imgAfter: null
        },
        {
            id: 2,
            area: 'Kitchen Splashback',
            type: 'Ceramic Mosaic',
            pattern: 'Straight',
            size: 45,
            startDate: 'Jan 28',
            endDate: 'Jan 30',
            progress: 100,
            status: 'Completed',
            imgBefore: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=200',
            imgAfter: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=200'
        }
    ];

    const materialUsage = {
        tilesIssued: 150, // boxes
        adhesiveUsed: 25, // bags
        wastage: 2, // boxes
    };

    const qualityChecklist = [
        { id: 1, label: 'Surface Leveling', checked: true },
        { id: 2, label: 'Uniform Spacing (Spacers Used)', checked: true },
        { id: 3, label: 'Hollow Sound Check', checked: false },
        { id: 4, label: 'Grouting Finish', checked: false },
    ];

    const payments = [
        { id: 1, desc: 'Kitchen Flooring', amount: 12000, date: 'Jan 15', status: 'Received' },
        { id: 2, desc: 'Guest Room', amount: 8500, date: 'Jan 25', status: 'Pending' },
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
        <div className="glass-card p-5 rounded-2xl border border-[#D8CFC4] mb-5 group hover:border-[#C06842]/30 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <span className="text-[10px] font-bold bg-[#F9F7F2] text-[#8C7B70] px-3 py-1 rounded-lg uppercase tracking-wider border border-[#E3DACD]">
                        {task.area}
                    </span>
                    <h4 className="font-bold text-[#2A1F1D] font-serif text-xl mt-2 group-hover:text-[#C06842] transition-colors">{task.type}</h4>
                    <p className="text-xs text-[#5D4037] flex items-center gap-1 mt-1 font-medium">
                        <LayoutGrid size={12} className="text-[#C06842]" /> {task.pattern} Pattern • <span className="text-[#2A1F1D] font-bold">{task.size} sq.ft</span>
                    </p>
                </div>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide border ${task.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-[#E68A2E]/10 text-[#E68A2E] border-[#E68A2E]/20'
                    }`}>
                    {task.status}
                </span>
            </div>

            <div className="flex gap-4 mb-4">
                <div className="flex-1">
                    <p className="text-[10px] text-[#B8AFA5] mb-2 uppercase font-bold tracking-wider">Before</p>
                    <img src={task.imgBefore} className="w-full h-24 object-cover rounded-xl bg-[#F9F7F2] shadow-sm border border-[#E3DACD]" />
                </div>
                <div className="flex-1">
                    <p className="text-[10px] text-[#B8AFA5] mb-2 uppercase font-bold tracking-wider">After</p>
                    {task.imgAfter ? (
                        <img src={task.imgAfter} className="w-full h-24 object-cover rounded-xl shadow-sm border border-[#E3DACD]" />
                    ) : (
                        <div className="w-full h-24 bg-[#F9F7F2] border-2 border-dashed border-[#D8CFC4] rounded-xl flex items-center justify-center text-[#B8AFA5] cursor-pointer hover:border-[#C06842] hover:text-[#C06842] transition-colors group/upload">
                            <span className="flex flex-col items-center gap-1">
                                <Camera size={20} className="group-hover/upload:scale-110 transition-transform" />
                                <span className="text-[9px] font-bold uppercase">Upload</span>
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-[#5D4037]">
                    <span>Progress</span>
                    <span>{task.progress}%</span>
                </div>
                <div className="h-2 bg-[#E3DACD]/50 rounded-full overflow-hidden">
                    <div className="h-full bg-[#C06842]" style={{ width: `${task.progress}%` }}></div>
                </div>
                <div className="flex justify-between text-[10px] text-[#B8AFA5] mt-1 font-bold">
                    <span>Start: {task.startDate}</span>
                    <span>Target: {task.endDate}</span>
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
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#C06842]/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-[#E68A2E] text-xs font-bold uppercase tracking-widest mb-3">
                            <Layers size={14} /> Tile Fixer Workspace
                        </div>
                        <h1 className="text-4xl font-bold font-serif mb-3 text-[#FDFCF8]">Welcome, {currentUser?.name}</h1>
                        <p className="text-sm text-[#B8AFA5] flex items-center gap-2 font-medium">
                            <CheckSquare size={16} className="text-[#C06842]" /> Project: <span className="font-bold text-[#FDFCF8]">{stats.assignedProject}</span>
                        </p>
                    </div>
                    <div className="glass-card bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 min-w-[240px] hover:bg-white/10 transition-colors">
                        <p className="text-[10px] text-[#B8AFA5] uppercase tracking-widest mb-2 font-bold">Current Area</p>
                        <div className="text-lg font-bold text-[#FDFCF8] mb-2 font-serif">{stats.workArea}</div>
                        <div className="flex items-center gap-2 text-xs text-[#E68A2E] font-bold bg-[#E68A2E]/10 px-3 py-1 rounded-lg border border-[#E68A2E]/20 inline-block uppercase tracking-wide">
                            {stats.currentPhase}
                        </div>
                        <div className="mt-4">
                            <div className="flex justify-between text-[10px] text-[#B8AFA5] mb-1 font-bold">
                                <span>Overall Completion</span>
                                <span>{stats.overallProgress}%</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500" style={{ width: `${stats.overallProgress}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in delay-75">
                <MetricCard
                    label="Area Completed"
                    value={stats.areaCompleted}
                    sub={`/ ${stats.totalArea} sq.ft`}
                    icon={Ruler}
                    color="bg-[#C06842]/10"
                    iconColor="text-[#C06842]"
                />
                <MetricCard
                    label="Tasks Done"
                    value="12"
                    sub="Past 30 days"
                    icon={ClipboardCheck}
                    color="bg-[#E68A2E]/10"
                    iconColor="text-[#E68A2E]"
                />
                <MetricCard
                    label="Pending Pay"
                    value={`₹${stats.pendingPayment.toLocaleString()}`}
                    sub="Due for 2 tasks"
                    icon={History}
                    color="bg-[#8C7B70]/10"
                    iconColor="text-[#8C7B70]"
                />
                <MetricCard
                    label="Total Earned"
                    value={`₹${stats.earnedPayment.toLocaleString()}`}
                    sub="This Project"
                    icon={DollarSign}
                    color="bg-purple-50"
                    iconColor="text-purple-700"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in delay-100">
                {/* 3. Assigned Work Breakdown (Tasks) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-bold font-serif text-[#2A1F1D]">Assigned Tasks</h3>
                        <button className="text-xs font-bold text-[#C06842] bg-[#C06842]/10 px-4 py-2 rounded-xl hover:bg-[#C06842]/20 transition-colors uppercase tracking-wide">View All</button>
                    </div>
                    {tasks.map(task => <TaskCard key={task.id} task={task} />)}

                    {/* 4. Material Usage */}
                    <div className="glass-card p-6 rounded-[2rem] border border-[#E3DACD]/40 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold font-serif text-[#2A1F1D]">Material Usage</h3>
                            <button className="text-xs bg-[#2A1F1D] text-white px-4 py-2.5 rounded-xl shadow-lg shadow-[#2A1F1D]/20 hover:bg-[#C06842] transition-colors font-bold tracking-wide">
                                + Update Daily
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-5 bg-[#F9F7F2] rounded-2xl text-center border border-[#E3DACD] hover:border-[#C06842]/50 transition-colors">
                                <Layers className="mx-auto text-[#C06842] mb-3" size={28} />
                                <div className="text-2xl font-bold font-serif text-[#2A1F1D]">{materialUsage.tilesIssued}</div>
                                <div className="text-[10px] text-[#8C7B70] uppercase tracking-widest font-bold">Boxes Issued</div>
                            </div>
                            <div className="p-5 bg-[#F9F7F2] rounded-2xl text-center border border-[#E3DACD] hover:border-[#C06842]/50 transition-colors">
                                <Droplet className="mx-auto text-blue-500 mb-3" size={28} />
                                <div className="text-2xl font-bold font-serif text-[#2A1F1D]">{materialUsage.adhesiveUsed}</div>
                                <div className="text-[10px] text-[#8C7B70] uppercase tracking-widest font-bold">Bags Used</div>
                            </div>
                            <div className="p-5 bg-red-50 rounded-2xl text-center border border-red-100 hover:border-red-200 transition-colors">
                                <AlertTriangle className="mx-auto text-red-500 mb-3" size={28} />
                                <div className="text-2xl font-bold font-serif text-red-700">{materialUsage.wastage}</div>
                                <div className="text-[10px] text-red-600 uppercase tracking-widest font-bold">Boxes Wasted</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Q.C., Payments, Quick Actions */}
                <div className="space-y-6">

                    {/* 5. Quality Checklist */}
                    <div className="glass-card p-6 rounded-[2rem] border border-[#E3DACD]/40 shadow-sm">
                        <h3 className="text-xl font-bold font-serif text-[#2A1F1D] mb-6 flex items-center gap-2">
                            <CheckSquare size={24} className="text-green-600" /> Quality Checklist
                        </h3>
                        <div className="space-y-3">
                            {qualityChecklist.map(item => (
                                <div key={item.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-[#E3DACD]/50 bg-[#F9F7F2] hover:bg-white transition-colors">
                                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${item.checked ? 'bg-green-500 border-green-500' : 'border-[#B8AFA5]'}`}>
                                        {item.checked && <span className="text-white text-xs">✓</span>}
                                    </div>
                                    <span className={`text-sm font-bold ${item.checked ? 'text-[#2A1F1D]' : 'text-[#8C7B70]'}`}>{item.label}</span>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-6 py-3 border border-dashed border-[#C06842] text-[#C06842] rounded-xl text-xs font-bold hover:bg-[#C06842]/5 uppercase tracking-wide transition-colors">
                            Request Inspection
                        </button>
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
                            <Camera size={24} className="group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold uppercase tracking-wide">Upload Photos</span>
                        </button>
                        <button className="p-5 bg-white border border-[#E3DACD] text-[#5D4037] rounded-2xl shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors active:scale-95 group">
                            <AlertTriangle size={24} className="group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold uppercase tracking-wide">Report Issue</span>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TileWorkerDashboard;
