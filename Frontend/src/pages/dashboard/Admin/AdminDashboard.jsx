import React, { useState } from 'react';
import { useMockApp } from '../../../hooks/useMockApp';
import {
    Shield, Users, AlertCircle, CheckCircle, XCircle, Search, FileText,
    Activity, AlertTriangle, Home, Briefcase, DollarSign, Bell,
    Settings, BarChart3, Lock, Eye, Download, MessageSquare,
    UserCheck, Building, Gavel, Ban, Flag, Send, Layout, Menu
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const AdminDashboard = () => {
    const { currentUser } = useMockApp();
    const [activeSection, setActiveSection] = useState('overview');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // --- MOCK DATA ---
    const stats = {
        totalUsers: 1450,
        activeProjects: 32,
        pendingVerifications: 12,
        systemHealth: '98%',
        owners: 850,
        professionals: 600,
        pendingDocs: 45,
        reportedIssues: 8,
        disputesOpen: 3
    };

    const verifications = {
        owners: [
            { id: 1, name: 'Rajesh Kumar', type: 'Land Owner', doc: 'Aadhaar Card', status: 'Pending', date: 'Feb 01' },
            { id: 2, name: 'Anita Desai', type: 'Land Owner', doc: 'Property Deed', status: 'Pending', date: 'Feb 02' }
        ],
        professionals: [
            { id: 3, name: 'BuildWell Constructions', role: 'Contractor', doc: 'License', status: 'Pending', exp: '10 Yrs' },
            { id: 4, name: 'Ar. Vikram Singh', role: 'Architect', doc: 'COA Certificate', status: 'Pending', exp: '8 Yrs' }
        ]
    };

    const projects = [
        { id: 1, name: 'Skyline Heights', owner: 'Rajesh Kumar', contractor: 'BuildWell', status: 'Pending Review', docs: 85 },
        { id: 2, name: 'Green Valley Villa', owner: 'Anita Desai', contractor: 'Pending', status: 'In Progress', docs: 40 }
    ];

    const disputes = [
        { id: 101, raisedBy: 'Rajesh Kumar', against: 'BuildWell', issue: 'Material Delay', status: 'Open', priority: 'High' },
        { id: 102, raisedBy: 'Ar. Vikram', against: 'Anita Desai', issue: 'Payment Hold', status: 'In Review', priority: 'Medium' }
    ];

    // --- SUB-COMPONENTS ---

    const SidebarItem = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => { setActiveSection(id); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeSection === id
                ? 'bg-[#2A1F1D] text-white shadow-lg shadow-[#2A1F1D]/20'
                : 'text-[#8C7B70] hover:bg-[#F9F7F2] hover:text-[#5D4037]'
                }`}
        >
            <Icon size={18} className={activeSection === id ? "text-[#C06842]" : ""} />
            <span>{label}</span>
        </button>
    );

    const StatCard = ({ label, value, icon: Icon, color, iconColor }) => (
        <div className="glass-card p-5 rounded-2xl border border-[#E3DACD]/40 shadow-sm flex items-start justify-between hover:shadow-md transition-all group">
            <div>
                <p className="text-[10px] text-[#8C7B70] uppercase font-bold tracking-widest mb-1">{label}</p>
                <h3 className="text-3xl font-serif font-bold text-[#2A1F1D] group-hover:text-[#C06842] transition-colors">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={20} className={iconColor} />
            </div>
        </div>
    );

    const VerificationTable = ({ data, type }) => (
        <div className="glass-card rounded-[1.5rem] border border-[#E3DACD]/40 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-[#E3DACD]/30 bg-[#F9F7F2]/50 flex justify-between items-center">
                <h3 className="font-bold text-[#2A1F1D] font-serif">{type} Verification Queue</h3>
                <span className="bg-[#C06842]/10 text-[#C06842] text-[10px] uppercase px-3 py-1 rounded-full font-bold border border-[#C06842]/20">{data.length} Pending</span>
            </div>
            <table className="w-full text-sm text-left">
                <thead className="bg-[#F9F7F2]/30 text-[#8C7B70] uppercase text-[10px] font-bold border-b border-[#E3DACD]/30">
                    <tr>
                        <th className="px-5 py-4 tracking-wider">Name</th>
                        <th className="px-5 py-4 tracking-wider">Details</th>
                        <th className="px-5 py-4 tracking-wider">Document</th>
                        <th className="px-5 py-4 text-right tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#E3DACD]/30 text-[#5D4037]">
                    {data.map(item => (
                        <tr key={item.id} className="hover:bg-white transition-colors">
                            <td className="px-5 py-4 font-bold text-[#2A1F1D]">{item.name}</td>
                            <td className="px-5 py-4">
                                {item.role || item.type}
                                {item.exp && <span className="block text-[10px] text-[#B8AFA5] font-bold uppercase mt-1">{item.exp} Experience</span>}
                            </td>
                            <td className="px-5 py-4">
                                <span className="text-[#C06842] bg-[#C06842]/5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-[#C06842]/10 flex items-center w-max gap-2 border border-[#C06842]/10 transition-colors">
                                    <FileText size={12} /> {item.doc}
                                </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <button className="p-2 text-green-700 bg-green-50 hover:bg-green-100 rounded-xl transition-colors border border-green-100"><CheckCircle size={16} /></button>
                                    <button className="p-2 text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-100"><XCircle size={16} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    // --- SECTIONS ---

    const renderOverview = () => (
        <div className="space-y-6">
            {/* Header */}
            <div className="glass-panel rounded-[2rem] p-8 shadow-xl relative overflow-hidden text-white group">
                {/* Background Gradient & Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#2A1F1D] to-[#4A342E] z-0"></div>
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#C06842]/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <div className="relative z-10 flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-2 text-[#E68A2E] text-xs font-bold uppercase tracking-widest mb-3">
                            <Shield size={14} /> Admin Control Center
                        </div>
                        <h1 className="text-4xl font-bold font-serif mb-3 text-[#FDFCF8]">Welcome, {currentUser?.name || 'Admin'}</h1>
                        <p className="text-[#B8AFA5] text-sm flex items-center gap-2">
                            System Health: <span className="text-green-400 font-bold bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20">{stats.systemHealth} Optimized</span>
                        </p>
                    </div>
                    <div className="space-y-4 text-right hidden md:block">
                        <div className="flex gap-6">
                            <div className="text-center group-hover:-translate-y-1 transition-transform duration-300">
                                <p className="text-3xl font-bold text-[#FDFCF8]">{stats.totalUsers}</p>
                                <p className="text-[10px] uppercase text-[#B8AFA5] font-bold tracking-widest mt-1">Total Users</p>
                            </div>
                            <div className="w-px bg-white/10"></div>
                            <div className="text-center group-hover:-translate-y-1 transition-transform duration-300 delay-75">
                                <p className="text-3xl font-bold text-[#FDFCF8]">{stats.activeProjects}</p>
                                <p className="text-[10px] uppercase text-[#B8AFA5] font-bold tracking-widest mt-1">Active Projects</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Land Owners" value={stats.owners} icon={Home} color="bg-[#C06842]/10" iconColor="text-[#C06842]" />
                <StatCard label="Professionals" value={stats.professionals} icon={Briefcase} color="bg-[#E68A2E]/10" iconColor="text-[#E68A2E]" />
                <StatCard label="Pending Docs" value={stats.pendingDocs} icon={FileText} color="bg-[#8C7B70]/10" iconColor="text-[#8C7B70]" />
                <StatCard label="Open Disputes" value={stats.disputesOpen} icon={Gavel} color="bg-red-50" iconColor="text-red-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <VerificationTable data={verifications.owners} type="Land Owner" />
                <VerificationTable data={verifications.professionals} type="Professional" />
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-6 rounded-[1.5rem] border border-[#E3DACD]/40 shadow-sm">
                <h3 className="font-bold text-[#2A1F1D] mb-4 font-serif text-lg">Quick Actions</h3>
                <div className="flex gap-4 flex-wrap">
                    <button className="flex items-center gap-2 px-5 py-3 bg-[#2A1F1D] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#2A1F1D]/20 hover:bg-[#C06842] transition-all hover:scale-105 active:scale-95">
                        <UserCheck size={16} /> Verify New User
                    </button>
                    <button className="flex items-center gap-2 px-5 py-3 bg-[#F9F7F2] border border-[#E3DACD] text-[#5D4037] rounded-xl text-sm font-bold hover:bg-white hover:border-[#C06842] transition-colors">
                        <Building size={16} /> Review Project
                    </button>
                    <button className="flex items-center gap-2 px-5 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors">
                        <Ban size={16} /> Suspend Account
                    </button>
                    <button className="flex items-center gap-2 px-5 py-3 bg-[#8C7B70]/10 text-[#5D4037] border border-[#E3DACD] rounded-xl text-sm font-bold hover:bg-[#E3DACD] transition-colors">
                        <Bell size={16} /> Broadcast Alert
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-[#FDFCF8] font-sans text-[#2A1F1D] overflow-hidden">

            {/* Mobile Nav Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>
            )}

            {/* Sidebar Navigation */}
            <div className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-[#F9F7F2]/80 backdrop-blur-xl border-r border-[#E3DACD] p-5 space-y-2 flex-shrink-0 z-50 transform transition-transform duration-300 md:transform-none ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="px-2 py-4 mb-2 flex justify-between items-center">
                    <h2 className="text-2xl font-bold font-serif text-[#2A1F1D] flex items-center gap-3">
                        <div className="p-2 bg-[#2A1F1D] rounded-xl text-white">
                            <Shield size={20} />
                        </div>
                        Admin
                    </h2>
                    <button onClick={() => setMobileMenuOpen(false)} className="md:hidden p-2 text-[#8C7B70] hover:text-[#C06842]">
                        <XCircle size={24} />
                    </button>
                </div>

                <div className="overflow-y-auto h-[calc(100vh-100px)] scrollbar-hide space-y-1">
                    <p className="px-4 text-[10px] font-bold text-[#B8AFA5] uppercase tracking-widest mt-6 mb-3">Verification</p>
                    <SidebarItem id="overview" label="Dashboard" icon={Activity} />
                    <SidebarItem id="verify_users" label="User Verification" icon={UserCheck} />
                    <SidebarItem id="verify_projects" label="Project & Site" icon={Building} />

                    <p className="px-4 text-[10px] font-bold text-[#B8AFA5] uppercase tracking-widest mt-6 mb-3">Management</p>
                    <SidebarItem id="documents" label="Documents" icon={FileText} />
                    <SidebarItem id="disputes" label="Disputes" icon={Gavel} />
                    <SidebarItem id="payments" label="Payments" icon={DollarSign} />

                    <p className="px-4 text-[10px] font-bold text-[#B8AFA5] uppercase tracking-widest mt-6 mb-3">Platform</p>
                    <SidebarItem id="qc" label="Quality Control" icon={Flag} />
                    <SidebarItem id="access" label="Roles & Access" icon={Lock} />
                    <SidebarItem id="reports" label="Reports" icon={BarChart3} />
                    <SidebarItem id="notifications" label="Notifications" icon={Bell} />
                </div>
            </div>

            {/* Mobile Nav Header */}
            <div className="md:hidden bg-[#F9F7F2]/90 backdrop-blur-md border-b border-[#E3DACD] p-4 flex justify-between items-center sticky top-0 z-30">
                <h2 className="text-lg font-bold font-serif text-[#2A1F1D] flex items-center gap-2">
                    <Shield size={20} className="text-[#C06842]" /> Admin Panel
                </h2>
                <button onClick={() => setMobileMenuOpen(true)} className="text-[#5D4037] p-2 hover:bg-[#E3DACD]/50 rounded-lg transition-colors">
                    <Menu size={24} />
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-4 md:p-10 overflow-y-auto h-screen scrollbar-hide">
                {activeSection === 'overview' && renderOverview()}

                {activeSection === 'verify_users' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <h2 className="text-3xl font-bold font-serif text-[#2A1F1D]">User Verification</h2>
                            <div className="flex gap-2">
                                <button className="px-5 py-2.5 bg-[#2A1F1D] text-white rounded-xl text-sm font-bold hover:bg-[#C06842] transition-colors shadow-lg">Verify Pending (12)</button>
                            </div>
                        </div>
                        <div className="grid gap-8">
                            <VerificationTable data={verifications.owners} type="Land Owner" />
                            <VerificationTable data={verifications.professionals} type="Professional" />
                        </div>
                    </div>
                )}

                {activeSection === 'verify_projects' && (
                    <div className="space-y-8 animate-fade-in">
                        <h2 className="text-3xl font-bold font-serif text-[#2A1F1D]">Project Verification</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map(p => (
                                <div key={p.id} className="glass-card p-6 rounded-2xl border border-[#E3DACD]/40 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all hover:border-[#C06842]/30">
                                    <div className={`absolute top-0 right-0 p-2 rounded-bl-xl text-[10px] uppercase font-bold tracking-wider ${p.status === 'In Progress' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                        }`}>{p.status}</div>

                                    <h3 className="text-xl font-bold text-[#2A1F1D] mb-1 font-serif group-hover:text-[#C06842] transition-colors">{p.name}</h3>
                                    <p className="text-sm text-[#8C7B70] mb-5 font-medium">{p.owner}</p>

                                    <div className="space-y-3 mb-6 bg-[#F9F7F2] p-3 rounded-xl border border-[#E3DACD]/30">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-[#8C7B70] font-bold uppercase">Contractor</span>
                                            <span className="font-bold text-[#5D4037]">{p.contractor}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-[#8C7B70] font-bold uppercase">Legal Docs</span>
                                            <span className={`font-bold ${p.docs < 100 ? 'text-[#E68A2E]' : 'text-green-600'}`}>{p.docs}% Verified</span>
                                        </div>
                                    </div>
                                    <button className="w-full py-2.5 border border-[#E3DACD] text-[#5D4037] rounded-xl text-xs font-bold hover:bg-[#2A1F1D] hover:text-white hover:border-[#2A1F1D] transition-all">Review Details</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeSection === 'disputes' && (
                    <div className="space-y-8 animate-fade-in">
                        <h2 className="text-3xl font-bold font-serif text-[#2A1F1D]">Disputes & Resolution</h2>
                        <div className="glass-card rounded-[2rem] border border-[#E3DACD]/40 overflow-hidden shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[#F9F7F2]/50 text-[#8C7B70] uppercase text-[10px] font-bold border-b border-[#E3DACD]/30">
                                    <tr>
                                        <th className="px-6 py-5 tracking-wider">ID</th>
                                        <th className="px-6 py-5 tracking-wider">Issue</th>
                                        <th className="px-6 py-5 tracking-wider">Parties</th>
                                        <th className="px-6 py-5 tracking-wider">Status</th>
                                        <th className="px-6 py-5 text-right tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E3DACD]/30">
                                    {disputes.map(d => (
                                        <tr key={d.id} className="hover:bg-white transition-colors">
                                            <td className="px-6 py-5 font-mono text-[#B8AFA5] text-xs">#{d.id}</td>
                                            <td className="px-6 py-5">
                                                <span className="font-bold block text-[#2A1F1D] text-base">{d.issue}</span>
                                                <span className={`text-[10px] font-bold uppercase tracking-wide mt-1 inline-block px-2 py-0.5 rounded ${d.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>{d.priority} Priority</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col text-xs space-y-1">
                                                    <span className="text-[#5D4037] font-medium"><span className="text-[#B8AFA5] uppercase text-[10px] font-bold w-8 inline-block">By:</span> {d.raisedBy}</span>
                                                    <span className="text-[#5D4037] font-medium"><span className="text-[#B8AFA5] uppercase text-[10px] font-bold w-8 inline-block">Agst:</span> {d.against}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5"><span className="bg-red-50 text-red-700 border border-red-100 px-3 py-1 rounded-full text-xs font-bold">{d.status}</span></td>
                                            <td className="px-6 py-5 text-right">
                                                <button className="text-[#C06842] font-bold text-xs hover:underline uppercase tracking-wider">Mediate</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeSection === 'reports' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <h2 className="text-3xl font-bold font-serif text-[#2A1F1D]">Platform Analytics</h2>
                            <button className="flex items-center gap-2 px-5 py-2.5 bg-[#F9F7F2] text-[#5D4037] border border-[#E3DACD] rounded-xl text-xs font-bold hover:bg-white hover:border-[#C06842] transition-all">
                                <Download size={14} /> Export Report
                            </button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="glass-card p-8 rounded-[2rem] border border-[#E3DACD]/40 shadow-sm h-96">
                                <h4 className="font-bold text-[#2A1F1D] mb-6 font-serif text-lg">User Growth</h4>
                                <ResponsiveContainer width="100%" height="90%">
                                    <LineChart data={[
                                        { name: 'Jan', users: 400 }, { name: 'Feb', users: 600 },
                                        { name: 'Mar', users: 800 }, { name: 'Apr', users: 1450 }
                                    ]}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E3DACD" vertical={false} />
                                        <XAxis dataKey="name" stroke="#8C7B70" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                        <YAxis stroke="#8C7B70" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                                        <Tooltip contentStyle={{ backgroundColor: '#FFF', borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)' }} />
                                        <Line type="monotone" dataKey="users" stroke="#C06842" strokeWidth={4} dot={{ r: 4, fill: '#2A1F1D', strokeWidth: 2, stroke: '#FFF' }} activeDot={{ r: 8, fill: '#C06842' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="glass-card p-8 rounded-[2rem] border border-[#E3DACD]/40 shadow-sm h-96">
                                <h4 className="font-bold text-[#2A1F1D] mb-6 font-serif text-lg">Project Status Distribution</h4>
                                <ResponsiveContainer width="100%" height="90%">
                                    <PieChart>
                                        <Pie data={[
                                            { name: 'Planning', value: 10 }, { name: 'Construction', value: 15 },
                                            { name: 'Finishing', value: 5 }, { name: 'Completed', value: 2 }
                                        ]} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                                            {['#8C7B70', '#C06842', '#E68A2E', '#2A1F1D'].map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#FFF', borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)' }} itemStyle={{ color: '#2A1F1D', fontWeight: 'bold' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === 'access' && (
                    <div className="space-y-8 animate-fade-in">
                        <h2 className="text-3xl font-bold font-serif text-[#2A1F1D]">Role & Access Management</h2>
                        <div className="bg-amber-50/50 border border-amber-200/60 p-5 rounded-2xl flex gap-4 text-amber-900">
                            <div className="p-2 bg-amber-100 rounded-lg h-min text-amber-600">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm uppercase tracking-wide">Critical Security Zone</h4>
                                <p className="text-sm mt-1 opacity-80 leading-relaxed">Updates to roles will immediately affect user permissions across the platform. Please proceed with caution.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {['Admin', 'Project Manager', 'Site Supervisor', 'Viewer'].map((role, i) => (
                                <div key={i} className="glass-card p-5 rounded-2xl border border-[#E3DACD]/40 flex justify-between items-center group hover:border-[#C06842]/30 cursor-pointer hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-[#F9F7F2] p-3 rounded-xl text-[#8C7B70] group-hover:bg-[#C06842]/10 group-hover:text-[#C06842] transition-colors"><Lock size={18} /></div>
                                        <span className="font-bold text-[#2A1F1D] text-lg">{role}</span>
                                    </div>
                                    <button className="text-xs text-[#C06842] font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">Edit</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Placeholders for other sections */}
                {['documents', 'payments', 'qc', 'notifications'].includes(activeSection) && (
                    <div className="h-full flex flex-col items-center justify-center text-center pb-20 animate-fade-in">
                        <div className="bg-[#F9F7F2] p-8 rounded-full mb-6 border border-[#E3DACD] shadow-inner">
                            <Briefcase size={48} className="text-[#C06842]/40" />
                        </div>
                        <h3 className="text-2xl font-bold font-serif text-[#2A1F1D] mb-3 capitalize">{activeSection.replace('_', ' ')} Management</h3>
                        <p className="text-[#8C7B70] max-w-md leading-relaxed">This module is under verified active development. Complete integration with the specific {activeSection} microservices is pending.</p>
                    </div>
                )}

            </div>
        </div>
    );
};

export default AdminDashboard;
