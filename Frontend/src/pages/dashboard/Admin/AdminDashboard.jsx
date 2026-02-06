import React, { useState, useEffect, useCallback } from 'react';
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

const AdminDashboard = ({ initialSection = 'overview' }) => {
    const { currentUser } = useMockApp();
    const [activeSection, setActiveSection] = useState(initialSection);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Real Data State
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeProjects: 0,
        pendingVerifications: 0,
        systemHealth: '100%',
        owners: 0,
        professionals: 0,
        pendingDocs: 0
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch Users
            const userRes = await fetch('http://localhost:5000/api/users');
            const userData = await userRes.json();
            setUsers(userData);

            // Fetch Projects for count (optional, can add route or just count if manageable)
            // For now, let's just count from data we have if available, or keep mock if no specific route

            // Calculate stats
            const owners = userData.filter(u => u.category === 'Land Owner').length;
            const professionals = userData.filter(u => u.category !== 'Land Owner' && u.category !== 'Admin').length;
            const pending = userData.filter(u => u.status === 'Pending').length;

            setStats(prev => ({
                ...prev,
                totalUsers: userData.length,
                owners,
                professionals,
                pendingVerifications: pending
            }));

        } catch (error) {
            console.error("Failed to fetch admin data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleVerifyUser = async (id, status) => {
        try {
            const response = await fetch(`http://localhost:5000/api/users/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (response.ok) {
                alert(`User ${status} successfully`);
                fetchData(); // Refresh all
            } else {
                alert("Failed to update status");
            }
        } catch (error) {
            console.error("Error verifying user", error);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
        try {
            const response = await fetch(`http://localhost:5000/api/admin/user/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                alert("User deleted successfully");
                fetchUsers();
            } else {
                alert("Failed to delete user");
            }
        } catch (error) {
            console.error("Error deleting user", error);
        }
    };

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
                <span className="bg-[#C06842]/10 text-[#C06842] text-[10px] uppercase px-3 py-1 rounded-full font-bold border border-[#C06842]/20">{data.filter(u => u.status === 'Pending').length} Pending</span>
            </div>
            <table className="w-full text-sm text-left">
                <thead className="bg-[#F9F7F2]/30 text-[#8C7B70] uppercase text-[10px] font-bold border-b border-[#E3DACD]/30">
                    <tr>
                        <th className="px-5 py-4 tracking-wider">Name</th>
                        <th className="px-5 py-4 tracking-wider">Details</th>
                        <th className="px-5 py-4 tracking-wider">Status</th>
                        <th className="px-5 py-4 tracking-wider">Document</th>
                        <th className="px-5 py-4 text-right tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#E3DACD]/30 text-[#5D4037]">
                    {data.length === 0 ? (
                        <tr><td colSpan="5" className="px-5 py-4 text-center text-[#B8AFA5] italic">No users found.</td></tr>
                    ) : (data.map(item => (
                        <tr key={item.user_id} className="hover:bg-white transition-colors">
                            <td className="px-5 py-4 font-bold text-[#2A1F1D]">{item.name}<br /><span className="text-[10px] text-[#B8AFA5] font-light lowercase">{item.email}</span></td>
                            <td className="px-5 py-4">
                                {item.sub_category || item.category}
                                <span className="block text-[10px] text-[#B8AFA5] font-bold uppercase mt-1">Joined: {new Date(item.created_at).toLocaleDateString()}</span>
                            </td>
                            <td className="px-5 py-4">
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase border ${item.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-100' :
                                    item.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                                        'bg-amber-50 text-amber-700 border-amber-100'
                                    }`}>{item.status}</span>
                            </td>
                            <td className="px-5 py-4">
                                {item.personal_id_document_path ? (
                                    <a href={`http://localhost:5000/${item.personal_id_document_path}`} target="_blank" rel="noopener noreferrer" className="text-[#C06842] bg-[#C06842]/5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-[#C06842]/10 flex items-center w-max gap-2 border border-[#C06842]/10 transition-colors">
                                        <FileText size={12} /> View Doc
                                    </a>
                                ) : (
                                    <span className="text-[#B8AFA5] text-xs italic">No Doc</span>
                                )}
                            </td>
                            <td className="px-5 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                    {item.status === 'Pending' && (
                                        <>
                                            <button onClick={() => handleVerifyUser(item.user_id, 'Approved')} className="p-2 text-green-700 bg-green-50 hover:bg-green-100 rounded-xl transition-colors border border-green-100" title="Approve"><CheckCircle size={16} /></button>
                                            <button onClick={() => handleVerifyUser(item.user_id, 'Rejected')} className="p-2 text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-100" title="Reject"><XCircle size={16} /></button>
                                        </>
                                    )}
                                    <button onClick={() => handleDeleteUser(item.user_id)} className="p-2 text-[#8C7B70] hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100" title="Delete"><Ban size={16} /></button>
                                </div>
                            </td>
                        </tr>
                    )))}
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
                <StatCard label="Pending Verifications" value={stats.pendingVerifications} icon={UserCheck} color="bg-[#8C7B70]/10" iconColor="text-[#8C7B70]" />
                <StatCard label="System Health" value={stats.systemHealth} icon={Activity} color="bg-green-50" iconColor="text-green-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <VerificationTable data={users.filter(u => u.category === 'Land Owner').slice(0, 5)} type="Land Owner" />
                <VerificationTable data={users.filter(u => u.category !== 'Land Owner' && u.category !== 'Admin').slice(0, 5)} type="Professional" />
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-6 rounded-[1.5rem] border border-[#E3DACD]/40 shadow-sm">
                <h3 className="font-bold text-[#2A1F1D] mb-4 font-serif text-lg">Quick Actions</h3>
                <div className="flex gap-4 flex-wrap">
                    <button onClick={() => setActiveSection('verify_users')} className="flex items-center gap-2 px-5 py-3 bg-[#2A1F1D] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#2A1F1D]/20 hover:bg-[#C06842] transition-all hover:scale-105 active:scale-95">
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
                                <button className="px-5 py-2.5 bg-[#2A1F1D] text-white rounded-xl text-sm font-bold hover:bg-[#C06842] transition-colors shadow-lg">
                                    {users.filter(u => u.status === 'Pending').length} Pending Requests
                                </button>
                            </div>
                        </div>
                        <div className="grid gap-8">
                            <VerificationTable data={users.filter(u => u.category === 'Land Owner')} type="Land Owner" />
                            <VerificationTable data={users.filter(u => u.category !== 'Land Owner' && u.category !== 'Admin')} type="Professional" />
                        </div>
                    </div>
                )}

                {/* ... existing other sections ... (Simplified for this update, but keeping logic structure) */}
                {/* To ensure we don't lose the other sections, I will just keep the placeholders and 'verify_projects' */}

                {activeSection === 'verify_projects' && (
                    <div className="space-y-8 animate-fade-in">
                        <h2 className="text-3xl font-bold font-serif text-[#2A1F1D]">Project Verification</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Mock Data for Projects still */}
                            {[
                                { id: 1, name: 'Skyline Heights', owner: 'Rajesh Kumar', contractor: 'BuildWell', status: 'Pending Review', docs: 85 },
                                { id: 2, name: 'Green Valley Villa', owner: 'Anita Desai', contractor: 'Pending', status: 'In Progress', docs: 40 }
                            ].map(p => (
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

                {['documents', 'payments', 'qc', 'access', 'reports', 'notifications'].includes(activeSection) && (
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
