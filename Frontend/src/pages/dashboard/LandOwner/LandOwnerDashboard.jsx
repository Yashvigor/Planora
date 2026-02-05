import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useMockApp } from '../../../hooks/useMockApp';
import {
    AlertTriangle, Bell, Calendar, ChevronRight, Download,
    FileText, Hammer, MessageSquare, Phone, PieChart,
    Plus, TrendingUp, User, Users, XCircle, CheckCircle,
    ArrowUpRight, Clock, ShieldCheck, HardHat, ExternalLink,
    Banknote, Coins
} from 'lucide-react';
import { Link } from 'react-router-dom';

// --- Reusable UI Components ---

const Card = ({ children, className = "" }) => (
    <div className={`glass-card rounded-[2rem] p-8 shadow-sm ${className}`}>
        {children}
    </div>
);

const SectionHeader = ({ title, action }) => (
    <div className="flex justify-between items-end mb-6 px-1">
        <h3 className="text-xl font-serif font-bold text-[#2A1F1D]">{title}</h3>
        {action}
    </div>
);

// --- Charts & Visuals ---

const DonutChart = ({ percentage, color = "text-[#C06842]", label, subt }) => {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex items-center space-x-6">
            <div className="relative w-28 h-28">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 70 70">
                    {/* Background Circle */}
                    <circle
                        className="text-[#E3DACD]"
                        strokeWidth="6"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="35"
                        cy="35"
                    />
                    {/* Progress Circle */}
                    <circle
                        className={`${color} transition-all duration-1000 ease-out`}
                        strokeWidth="6"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="35"
                        cy="35"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#2A1F1D]">
                    <span className="text-2xl font-serif font-bold">{percentage}%</span>
                </div>
            </div>
            <div>
                <p className="text-lg font-bold text-[#2A1F1D]">{label}</p>
                <p className="text-sm text-[#6E5E56]">{subt}</p>
            </div>
        </div>
    );
};

const BudgetBar = ({ label, value, max, color = "bg-[#C06842]" }) => {
    const widthPC = Math.min((value / max) * 100, 100);
    return (
        <div className="mt-4">
            <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-[#6E5E56] uppercase tracking-wider">{label}</span>
                <span className="text-[#2A1F1D]">₹ {(value / 100000).toFixed(1)}L</span>
            </div>
            <div className="w-full bg-[#E3DACD]/30 h-2 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full ${color} transition-all duration-1000`}
                    style={{ width: `${widthPC}%` }}
                ></div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, subtext, trend, icon: Icon }) => (
    <div className="glass-card p-6 rounded-[1.5rem] hover:-translate-y-1 duration-300 group">
        <div className="flex justify-between items-start mb-3">
            <p className="text-[#8C7B70] text-[10px] font-bold uppercase tracking-widest">{label}</p>
            {Icon && <Icon size={18} className="text-[#C06842] group-hover:scale-110 transition-transform" />}
        </div>
        <div className="flex justify-between items-end">
            <h4 className="text-3xl font-serif font-medium text-[#2A1F1D] mb-1">{value}</h4>
            {trend && (
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full mb-1 flex items-center ${trend === 'up' ? 'bg-[#FDFCF8] text-green-700 border border-green-100' : 'bg-red-50 text-red-700'
                    }`}>
                    {trend === 'up' ? <TrendingUp size={10} className="mr-1" /> : <ArrowUpRight size={10} className="mr-1 rotate-90" />}
                    {trend === 'up' ? 'High' : 'Low'}
                </span>
            )}
        </div>
        {subtext && <p className="text-xs text-[#6E5E56] font-medium mt-1">{subtext}</p>}
    </div>
);

const DocumentItem = ({ name, type, status, onDownload }) => (
    <div className="flex items-center justify-between p-4 bg-[#FDFCF8]/80 backdrop-blur-sm rounded-2xl hover:bg-white transition-all group cursor-pointer border border-[#E3DACD]/50 hover:border-[#C06842]/30 shadow-sm hover:shadow-md">
        <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${status === 'Approved' ? 'bg-green-50 text-green-700' :
                type === 'img' ? 'bg-[#F9F7F2] text-[#C06842]' : 'bg-[#E3DACD]/20 text-[#5D4037]'
                }`}>
                <FileText size={20} />
            </div>
            <div>
                <p className="font-bold text-[#2A1F1D] text-sm">{name}</p>
                <p className="text-[10px] text-[#8C7B70] font-bold uppercase tracking-wide">Updated just now</p>
            </div>
        </div>
        <div className="flex items-center space-x-2">
            {status ? (
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${status === 'Approved' ? 'bg-green-50 text-green-700 border border-green-100' :
                    'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>{status}</span>
            ) : (
                <span className="text-[10px] font-bold text-[#A65D3B] px-2 opacity-0 group-hover:opacity-100 transition-opacity">VIEW</span>
            )}
            <button
                onClick={(e) => { e.stopPropagation(); onDownload(); }}
                className="p-2 text-[#8C7B70] hover:text-[#C06842] hover:bg-[#F9F7F2] rounded-lg transition-all opacity-0 group-hover:opacity-100"
            >
                <Download size={18} />
            </button>
        </div>
    </div>
);

const NotificationItem = ({ title, time, type }) => (
    <div className="flex items-start space-x-4 p-4 border-b border-[#E3DACD]/30 last:border-0 hover:bg-[#F9F7F2] rounded-xl transition-colors group">
        <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${type === 'alert' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-[#C06842]'
            }`} />
        <div className="flex-1">
            <p className="text-sm font-bold text-[#2A1F1D] leading-tight group-hover:text-[#C06842] transition-colors">{title}</p>
            <p className="text-xs text-[#8C7B70] mt-1">{time}</p>
        </div>
        <ChevronRight size={14} className="text-[#D8CFC4] group-hover:text-[#A65D3B] mt-1 transition-colors" />
    </div>
);

const LandOwnerDashboard = () => {
    const { currentUser } = useMockApp();
    const [projectData, setProjectData] = useState({
        name: "Sharma Residence",
        type: "Duplex Villa",
        location: "Plot #42, Green Valley",
        status: "Construction",
        progress: 67,
        budget: "5000000",
        marketValue: "7500000",
        paid: "3450000",
        balance: "1550000",
        expectedCompletion: "Dec 10, 2026",
        daysDelayed: 0
    });

    useEffect(() => {
        const storedData = localStorage.getItem('landOwnerProjectData');
        if (storedData) {
            setProjectData(JSON.parse(storedData));
        } else {
            localStorage.setItem('landOwnerProjectData', JSON.stringify(projectData));
        }
    }, []);

    // ROI Calculations
    const calculations = useMemo(() => {
        const investment = parseInt(projectData.budget);
        const marketVal = parseInt(projectData.marketValue);
        const netProfit = marketVal - investment;
        const roi = investment > 0 ? (netProfit / investment) * 100 : 0;

        return {
            netProfit,
            roi: roi.toFixed(1)
        };
    }, [projectData.budget, projectData.marketValue]);

    const handleDownload = (docName) => {
        console.log(`Downloading ${docName}`);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 font-sans text-[#2A1F1D]">

            {/* 1. Header Section (At a Glance) */}
            <div className="glass-panel rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                <div className="absolute right-0 top-0 w-80 h-80 bg-[#C06842]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                    <div className="flex items-center space-x-8">
                        <div className="relative group cursor-pointer">
                            <div className="w-24 h-24 rounded-2xl p-1 bg-gradient-to-br from-[#E3DACD] to-[#C06842]">
                                <img
                                    src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
                                    alt="Profile"
                                    className="w-full h-full rounded-xl object-cover border-2 border-[#FDFCF8]"
                                />
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-[#4A342E] border-4 border-[#FDFCF8] w-8 h-8 rounded-full flex items-center justify-center shadow-md">
                                <ShieldCheck size={14} className="text-[#FDFCF8]" />
                            </div>
                        </div>
                        <div>
                            <p className="text-[#8C7B70] text-sm font-bold tracking-wide uppercase mb-2 flex items-center">
                                Welcome back <span className="w-2 h-2 bg-green-500 rounded-full ml-2 animate-pulse"></span>
                            </p>
                            <h1 className="text-4xl font-serif font-medium text-[#2A1F1D] leading-tight mb-2">{currentUser?.name || "Land Owner"}</h1>
                            <div className="flex items-center space-x-3 text-sm text-[#6E5E56] font-medium">
                                <span className="bg-[#E3DACD]/30 px-3 py-1 rounded-full text-xs font-bold text-[#5D4037] border border-[#E3DACD]/50">OWNER</span>
                                <span>•</span>
                                <span>{projectData.name}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full lg:w-auto bg-[#FDFCF8]/60 backdrop-blur-md rounded-2xl p-6 border border-[#E3DACD]/40 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="font-bold text-lg text-[#2A1F1D]">Current Phase</h2>
                                <p className="text-xs text-[#C06842] font-bold uppercase tracking-wide mt-1">{projectData.status}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-[#8C7B70] font-bold uppercase tracking-widest">Target</p>
                                <p className="text-sm font-bold text-[#2A1F1D]">{projectData.expectedCompletion}</p>
                            </div>
                        </div>
                        <div className="relative pt-2">
                            <div className="flex justify-between mb-2">
                                <span className="text-xs font-bold text-[#6E5E56]">Completion</span>
                                <span className="text-sm font-bold text-[#C06842]">{projectData.progress}%</span>
                            </div>
                            <div className="w-full bg-[#D8CFC4]/30 h-2.5 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-[#C06842] to-[#E68A2E] rounded-full shadow-[0_0_10px_rgba(192,104,66,0.3)]" style={{ width: `${projectData.progress}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column - Metrics & Graphs */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Key Metrics Row */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <Card className="col-span-2 md:col-span-1 bg-gradient-to-br from-[#2A1F1D] to-[#4A342E] text-white border-none relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-32 h-32 bg-[#C06842]/20 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-[#C06842]/30 transition-colors"></div>
                            <p className="text-[#E3DACD] text-xs font-bold uppercase tracking-wider mb-6">Proj. ROI</p>
                            <div className="flex flex-col items-start">
                                <h4 className="text-5xl font-serif mb-2">{calculations.roi}%</h4>
                                <p className="text-[#D8CFC4] text-xs font-medium">Profit: ₹{(calculations.netProfit / 100000).toFixed(1)}L</p>
                            </div>
                            <div className="mt-6 flex items-center text-[10px] font-bold bg-white/10 backdrop-blur-sm w-fit px-3 py-1.5 rounded-lg border border-white/10">
                                <TrendingUp size={12} className="mr-1.5" /> Excellent
                            </div>
                        </Card>

                        <StatCard
                            label="Total Investment"
                            value={`₹ ${(parseInt(projectData.budget) / 100000).toFixed(1)}L`}
                            subtext="Allocated Budget"
                            icon={Banknote}
                        />
                        <StatCard
                            label="Est. Market Value"
                            value={`₹ ${(parseInt(projectData.marketValue) / 100000).toFixed(1)}L`}
                            subtext="Post-Completion"
                            trend="up"
                            icon={Coins}
                        />
                    </div>

                    {/* Financial Overview (Charts) */}
                    <Card>
                        <SectionHeader title="Financial Overview" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                            {/* Donut Chart - ROI */}
                            <div className="flex flex-col items-center justify-center p-6 bg-[#FDFCF8] rounded-3xl border border-[#E3DACD]/30 shadow-inner">
                                <DonutChart
                                    percentage={calculations.roi}
                                    label="Return on Inv."
                                    subt="+12% from last est."
                                />
                                <p className="text-xs text-center text-[#8C7B70] mt-6 px-4 w-full leading-relaxed">
                                    ROI is calculated based on current market trends in <span className="font-bold text-[#C06842]">Green Valley</span>.
                                </p>
                            </div>

                            {/* Budget Bars */}
                            <div className="space-y-8">
                                <div>
                                    <h4 className="text-sm font-bold text-[#2A1F1D] mb-6 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#C06842]"></div>
                                        Budget Utilization
                                    </h4>
                                    <BudgetBar
                                        label="Total Paid"
                                        value={parseInt(projectData.paid)}
                                        max={parseInt(projectData.budget)}
                                        color="bg-[#5D4037]"
                                    />
                                    <BudgetBar
                                        label="Balance Payable"
                                        value={parseInt(projectData.balance)}
                                        max={parseInt(projectData.budget)}
                                        color="bg-[#D97706]"
                                    />
                                    <div className="mt-6 p-4 bg-[#F9F7F2] rounded-2xl flex items-start gap-4 border border-[#E3DACD]/50">
                                        <div className="bg-white p-2 rounded-xl shadow-sm text-[#C06842]">
                                            <TrendingUp size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-[#2A1F1D]">Budget Analysis</p>
                                            <p className="text-[10px] text-[#6E5E56] leading-relaxed mt-1">You are currently 5% under budget for this phase.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* 3. Approvals & Documents */}
                    <Card>
                        <SectionHeader
                            title="Approvals & Documents"
                            action={<button className="text-[#C06842] text-xs font-bold bg-[#F9F7F2] px-4 py-2 rounded-xl hover:bg-[#C06842] hover:text-white transition-all duration-300">View All Files</button>}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DocumentItem name="Building Plan" type="pdf" status="Approved" onDownload={() => handleDownload('Plan')} />
                            <DocumentItem name="Structural Draw." type="img" status="Pending" onDownload={() => handleDownload('Structural')} />
                            <DocumentItem name="Land Agreement" type="doc" status="Signed" onDownload={() => handleDownload('Agreement')} />
                            <DocumentItem name="3D Elevation" type="img" onDownload={() => handleDownload('Elevation')} />
                        </div>
                    </Card>

                    {/* Quick Actions Grid */}
                    <div className="grid grid-cols-4 gap-4">
                        {[
                            { icon: CheckCircle, label: 'Approve', color: 'bg-[#5D4037]' },
                            { icon: TrendingUp, label: 'Track', color: 'bg-[#C06842]' },
                            { icon: Download, label: 'Report', color: 'bg-[#A65D3B]' },
                            { icon: AlertTriangle, label: 'Issue', color: 'bg-amber-600' },
                        ].map((action, i) => (
                            <button
                                key={i}
                                className="glass-card p-5 rounded-2xl hover:-translate-y-1 transition-all flex flex-col items-center justify-center group bg-white/70"
                            >
                                <div className={`p-3.5 rounded-xl ${action.color} text-white mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                                    <action.icon size={20} />
                                </div>
                                <span className="text-xs font-bold text-[#5D4037]">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Column - Team & Timeline */}
                <div className="space-y-8">

                    {/* Team Section */}
                    <Card>
                        <SectionHeader title="My Team" action={<button className="w-9 h-9 flex items-center justify-center bg-[#2A1F1D] text-white rounded-full hover:bg-[#C06842] transition-colors shadow-lg"><Plus size={18} /></button>} />
                        <div className="space-y-5">
                            {[
                                { name: 'Dhruv Singh', role: 'Architect', avatar: 'https://i.pravatar.cc/150?u=12' },
                                { name: 'Mohit Contractor', role: 'Civil Contractor', avatar: 'https://i.pravatar.cc/150?u=18' },
                                { name: 'Ritika Design', role: 'Interior Designer', avatar: 'https://i.pravatar.cc/150?u=22' },
                            ].map((member, i) => (
                                <div key={i} className="flex items-center justify-between group p-2 hover:bg-[#F9F7F2] rounded-xl transition-colors -mx-2">
                                    <div className="flex items-center space-x-4">
                                        <div className="relative">
                                            <img src={member.avatar} alt={member.name} className="w-11 h-11 rounded-full border-2 border-[#E3DACD]" />
                                            {i === 0 && <div className="absolute -bottom-1 -right-1 bg-[#C06842] w-3.5 h-3.5 rounded-full border-2 border-white"></div>}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-[#2A1F1D]">{member.name}</p>
                                            <p className="text-[10px] text-[#8C7B70] uppercase font-bold tracking-wide">{member.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 bg-white text-[#2A1F1D] shadow-sm rounded-lg hover:text-[#C06842]"><Phone size={14} /></button>
                                        <button className="p-2 bg-white text-[#2A1F1D] shadow-sm rounded-lg hover:text-[#C06842]"><MessageSquare size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-8 py-3.5 bg-[#FDFCF8] hover:bg-[#F9F7F2] text-[#5D4037] rounded-xl font-bold text-sm transition-colors flex items-center justify-center border border-[#E3DACD]/50">
                            View All Members
                        </button>
                    </Card>

                    {/* Timeline */}
                    <Card className="bg-[#2A1F1D] text-white border-none shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#C06842] opacity-10 blur-3xl rounded-full"></div>
                        <div className="flex justify-between items-center mb-8 relative z-10">
                            <h3 className="font-serif font-bold text-xl">Timeline</h3>
                            <span className="bg-[#FFFFFF]/10 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold border border-white/10 text-[#E3DACD]">Phase 2</span>
                        </div>
                        <div className="relative pl-5 space-y-10 before:absolute before:left-[13px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-[#C06842] before:to-[#4A342E]">
                            {[
                                { title: "Foundation", date: "Jan 15", status: "completed" },
                                { title: "Structure 1st Flr", date: "Feb 20", status: "active" },
                                { title: "Brick Work", date: "Mar 05", status: "pending" },
                            ].map((item, i) => (
                                <div key={i} className="relative pl-8 group">
                                    <div className={`absolute left-[4px] top-1.5 w-5 h-5 rounded-full border-4 border-[#2A1F1D] z-10 transition-transform group-hover:scale-125 ${item.status === 'completed' ? 'bg-[#C06842]' :
                                        item.status === 'active' ? 'bg-[#E68A2E] shadow-[0_0_10px_rgba(230,138,46,0.6)]' : 'bg-[#4A342E]'
                                        }`}></div>

                                    <p className={`text-sm font-bold tracking-wide ${item.status === 'pending' ? 'text-[#8C7B70]' : 'text-white'}`}>{item.title}</p>
                                    <p className="text-xs text-[#8C7B70] font-medium mt-0.5">{item.date}</p>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Notifications */}
                    <Card>
                        <SectionHeader title="Alerts" action={<span className="bg-[#C06842] w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(192,104,66,0.6)]"></span>} />
                        <div className="space-y-2">
                            <NotificationItem title="Project phase deadline approaching" time="2 hours ago" type="alert" />
                            <NotificationItem title="New drawing uploaded" time="Yesterday" type="info" />
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default LandOwnerDashboard;
