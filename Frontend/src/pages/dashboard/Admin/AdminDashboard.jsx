import React, { useState, useEffect, useCallback } from 'react';
import { useMockApp } from '../../../hooks/useMockApp';
import {
    Shield, Users, AlertCircle, CheckCircle, XCircle, Search, FileText,
    Activity, AlertTriangle, Home, Briefcase, DollarSign, Bell,
    Settings, BarChart3, Lock, Eye, Download, MessageSquare,
    UserCheck, Building, Gavel, Ban, Flag, Send, Layout, Menu, Award, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const AdminDashboard = ({ initialSection = 'verify_land' }) => {
    const { currentUser } = useMockApp();
    const [activeSection, setActiveSection] = useState(initialSection);

    // Sync state if navigation changes from the global Sidebar
    useEffect(() => {
        setActiveSection(initialSection);
    }, [initialSection]);

    // Real Data State
    const [users, setUsers] = useState([]);
    const [lands, setLands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState([]);
    const [auctions, setAuctions] = useState([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeProjects: 0,
        pendingVerifications: 0,
        systemHealth: '100%',
        owners: 0,
        professionals: 0,
        pendingDocs: 0
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    // 🕊️ Modal Global State (Replaces professional-unfriendly alerts/prompts)
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'confirm', // 'confirm', 'prompt', 'alert', 'detailed'
        inputValue: '',
        onConfirm: null,
        onCancel: null,
        confirmText: 'Continue',
        cancelText: 'Cancel',
        icon: Shield,
        iconColor: 'text-[#C06842]'
    });

    const openModal = (config) => setModal({ ...config, isOpen: true });
    const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            // Fetch Users
            const userRes = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`);
            const userData = await userRes.json();

            if (Array.isArray(userData)) {
                setUsers(userData);

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
            }

            // Fetch Lands
            try {
                const landRes = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/lands`);
                if (landRes.ok) setLands(await landRes.json());
            } catch (e) { console.error('Failed to fetch lands', e); }

            // Fetch Admin Projects
            try {
                const projRes = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/projects`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}` }
                });
                if (projRes.ok) {
                    const projData = await projRes.json();
                    setProjects(projData);
                }
            } catch (err) {
                console.error("Failed to fetch projects", err);
            }

            // Fetch Auctions (Market Requests)
            try {
                const auctionRes = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/auctions/pending`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}` }
                });
                if (auctionRes.ok) {
                    const auctionData = await auctionRes.json();
                    setAuctions(auctionData);
                }
            } catch (e) {
                console.error('Failed to fetch auctions', e);
            }

        } catch (error) {
            console.error("Failed to fetch admin data", error);
            setUsers([]);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const poll = setInterval(() => fetchData(true), 30000);

        // Listen for global search events from the Navbar
        const handleGlobalSearch = (e) => {
            setSearchQuery(e.detail);
        };
        window.addEventListener('planora_search', handleGlobalSearch);

        return () => {
            clearInterval(poll);
            window.removeEventListener('planora_search', handleGlobalSearch);
        };
    }, [fetchData]);

    const executeVerifyUser = async (id, status, reason = '') => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/verify/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status, rejection_reason: reason })
            });

            if (response.ok) {
                openModal({
                    title: 'Action Successful',
                    message: `Entity status has been officially updated to ${status}.`,
                    type: 'alert',
                    icon: CheckCircle,
                    iconColor: 'text-green-500'
                });
                fetchData(true);
            } else {
                const err = await response.json();
                openModal({
                    title: 'Strategic Failure',
                    message: err.error || 'Failed to sync status with repository.',
                    type: 'alert',
                    icon: XCircle,
                    iconColor: 'text-red-500'
                });
            }
        } catch (error) {
            console.error("Error verifying user", error);
        }
    };

    const handleVerifyUser = (id, status) => {
        if (status === 'Rejected') {
            openModal({
                title: 'Suspension / Rejection',
                message: 'Confirm the formal reason for rejecting this professional identity. This will be transmitted via official communication.',
                type: 'prompt',
                inputValue: 'Uploaded documents are unclear or invalid.',
                confirmText: 'Reject Account',
                icon: AlertTriangle,
                iconColor: 'text-red-500',
                onConfirm: (reason) => executeVerifyUser(id, status, reason)
            });
        } else {
            openModal({
                title: 'Grant Platform Access',
                message: 'Are you sure you want to approve this entity and grant them operational access to the workspace?',
                type: 'confirm',
                confirmText: 'Approve User',
                icon: CheckCircle,
                iconColor: 'text-green-600',
                onConfirm: () => executeVerifyUser(id, status)
            });
        }
    };

    const handleToggleDisableUser = (id, currentStatus) => {
        const action = currentStatus === 'Disabled' ? 'enable' : 'disable';

        if (action === 'disable') {
            openModal({
                title: 'Enforce Account Deactivation',
                message: 'Specify the security reason for restricting this workspace. An automated notification will be dispatched to the user.',
                type: 'prompt',
                inputValue: 'Unusual account activity detected. Please contact support.',
                confirmText: 'Restrict Access',
                icon: Ban,
                iconColor: 'text-red-600',
                onConfirm: (reason) => executeUserToggle(id, action, reason)
            });
        } else {
            openModal({
                title: 'Restore Operational Access',
                message: 'Are you sure you want to reinstate this entity to full platform functionality?',
                type: 'confirm',
                confirmText: 'Restore Account',
                icon: UserCheck,
                iconColor: 'text-green-600',
                onConfirm: () => executeUserToggle(id, action)
            });
        }
    };

    const executeUserToggle = async (id, action, reason = '') => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/user/${id}/${action}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}`
                },
                body: action === 'disable' ? JSON.stringify({ rejection_reason: reason }) : undefined
            });
            if (response.ok) {
                openModal({
                    title: 'Database Updated',
                    message: `Account access has been successfully ${action === 'enable' ? 'reinstated' : 'restricted'}.`,
                    type: 'alert',
                    icon: CheckCircle,
                    iconColor: 'text-green-500'
                });
                fetchData(true);
            } else {
                const err = await response.json();
                openModal({
                    title: 'Action Blocked',
                    message: err.error || 'The system was unable to commit the access change.',
                    type: 'alert',
                    icon: XCircle,
                    iconColor: 'text-red-500'
                });
            }
        } catch (error) {
            console.error(`Error ${action}ing user`, error);
        }
    };

    const handleVerifyAuction = async (id, status) => {
        if (status === 'Rejected') {
            openModal({
                title: 'Reject Market Request',
                message: 'Please provide a justification for declining this auction authorization.',
                type: 'prompt',
                icon: AlertTriangle,
                iconColor: 'text-red-600',
                confirmText: 'Confirm Rejection',
                onConfirm: async (reason) => {
                    if (!reason) return;
                    try {
                        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/auctions/${id}/verify`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}`
                            },
                            body: JSON.stringify({ status: 'rejected', rejection_reason: reason })
                        });
                        if (response.ok) {
                            openModal({
                                title: 'Auction Rejected',
                                message: 'The request has been removed from the live queue.',
                                type: 'alert',
                                icon: XCircle,
                                iconColor: 'text-red-500'
                            });
                            fetchData(true);
                        }
                    } catch (e) { console.error(e); }
                }
            });
            return;
        }

        openModal({
            title: 'Authorize Auction',
            message: 'Are you sure you want to permit this land parcel to enter the live bidding market?',
            type: 'confirm',
            icon: Gavel,
            iconColor: 'text-blue-600',
            confirmText: 'Authorize Entry',
            onConfirm: async () => {
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/auctions/${id}/verify`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({ status: 'active' })
                    });
                    if (response.ok) {
                        openModal({
                            title: 'Auction Authorized',
                            message: 'The land is now live on the marketplace.',
                            type: 'alert',
                            icon: CheckCircle,
                            iconColor: 'text-green-500'
                        });
                        fetchData(true);
                    }
                } catch (e) { console.error(e); }
            }
        });
    };

    const handleVerifyLand = (landId, status) => {
        if (status === 'Rejected') {
            openModal({
                title: 'Reject Land Document',
                message: 'Provide a reason for rejecting this land verification request.',
                type: 'prompt',
                inputValue: 'Documents are unclear or invalid.',
                confirmText: 'Confirm Rejection',
                icon: AlertTriangle,
                iconColor: 'text-red-500',
                onConfirm: (reason) => executeVerifyLand(landId, status, reason)
            });
        } else {
            openModal({
                title: 'Verify Land Authority',
                message: 'Are you sure you want to verify this land and its ownership documents?',
                type: 'confirm',
                confirmText: 'Verify Land',
                icon: CheckCircle,
                iconColor: 'text-green-600',
                onConfirm: () => executeVerifyLand(landId, status)
            });
        }
    };

    const executeVerifyLand = async (landId, status, reason = '') => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/lands/${landId}/verify`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, rejection_reason: reason })
            });
            if (res.ok) {
                openModal({
                    title: 'Land Records Updated',
                    message: `Land status has been officially updated to ${status}.`,
                    type: 'alert',
                    icon: CheckCircle,
                    iconColor: 'text-green-500'
                });
                fetchData(true);
            } else {
                const err = await res.json();
                openModal({
                    title: 'Verification Failed',
                    message: err.error || 'Unable to update land records.',
                    type: 'alert',
                    icon: XCircle,
                    iconColor: 'text-red-500'
                });
            }
        } catch (err) {
            console.error('Error verifying land:', err);
        }
    };



    // Sub-components
    const PhaseTick = ({ active, label }) => (
        <div className={`flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-black transition-all ${
            active 
                ? 'bg-[#C06842] text-white shadow-sm border border-[#C06842]' 
                : 'bg-[#F9F7F2] text-[#B8AFA5] border border-[#E3DACD]'
        }`}>
            {label}
        </div>
    );

    const StatCard = ({ label, value, icon: Icon, color }) => (
        <div className="bg-white p-5 rounded-2xl border border-[#E3DACD]/40 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            <div className="flex justify-between items-start relative z-10">
                <div className="space-y-1">
                    <p className="text-[9px] font-black text-[#8C7B70] uppercase tracking-wider">{label}</p>
                    <p className="text-3xl font-black font-serif text-[#2A1F1D] tracking-tight">{value}</p>
                </div>
                <div className={`p-3 rounded-xl ${color} bg-opacity-5 border border-opacity-10 flex items-center justify-center transition-transform group-hover:scale-105`}>
                    <Icon size={20} className={color} />
                </div>
            </div>
            <div className="absolute -bottom-4 -right-4 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity">
                <Icon size={100} strokeWidth={1} />
            </div>
        </div>
    );

    const UserManagementTable = ({ data, title, subtitle, badge, isProfessional = false }) => {
        const professionalCategories = [
            'All', 'Architect', 'Civil Engineer', 'Interior Designer',
            'False Ceiling Worker', 'Fabrication Worker', 'Mason',
            'Contractor', 'Electrician', 'Plumber', 'Carpenter',
            'Tile Worker', 'Painter'
        ];

        const filteredData = data.filter(user => {
            const matchesSearch = user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = categoryFilter === 'All' || user.category === categoryFilter || user.sub_category === categoryFilter;
            return matchesSearch && matchesCategory;
        });

        return (
            <div className="bg-white rounded-2xl border border-[#E3DACD]/40 shadow-sm overflow-hidden">
                {/* Header Bar */}
                <div className="px-6 py-5 border-b border-[#E3DACD]/30 bg-[#FDFCF8] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-[#2A1F1D] tracking-tight">{title}</h3>
                        {badge && (
                            <span className="bg-[#F9F7F2] text-[#8C7B70] text-[10px] uppercase px-3 py-1 rounded-lg font-bold border border-[#E3DACD]/50 tracking-wider">
                                TOTAL: {filteredData.length}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B8AFA5]" size={14} />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                className="pl-9 pr-4 py-2.5 bg-white border border-[#E3DACD] rounded-xl text-xs focus:border-[#C06842] outline-none transition-all w-full md:w-56"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {isProfessional && (
                            <select
                                className="px-3 py-2.5 bg-white border border-[#E3DACD] rounded-xl text-xs font-semibold text-[#5D4037] outline-none cursor-pointer focus:border-[#C06842] appearance-none pr-8"
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                {professionalCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="bg-[#FDFCF8]/50 text-[#8C7B70] uppercase text-[10px] font-bold tracking-wider border-b border-[#E3DACD]/30">
                                <th className="px-6 py-3.5">User</th>
                                <th className="px-6 py-3.5">Category / Role</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5">Verification</th>
                                <th className="px-6 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E3DACD]/20 text-[#2A1F1D]">
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3 text-[#B8AFA5]">
                                            <Search size={36} strokeWidth={1} />
                                            <p className="text-sm text-[#8C7B70]">No entries found matching your search.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredData.map((user, index) => {
                                const isAppeal = user.appeal_reason || user.rejection_reason?.startsWith('[APPEAL SUBMITTED]');
                                const joinedDate = user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }) : '';
                                const isProfessional = !['Admin', 'Land Owner'].includes(user.category) && user.sub_category !== 'Land Owner';
 
                                return (
                                    <tr key={user.user_id || index} className="hover:bg-[#FDFCF8]/60 transition-colors duration-200 group">
                                        {/* USER Column */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#C06842]/10 flex items-center justify-center font-bold text-[#C06842] text-sm border border-[#C06842]/20 shrink-0">
                                                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-[#2A1F1D] text-sm truncate">{user.name}</p>
                                                    <p className="text-[11px] text-[#8C7B70] truncate">{user.email}</p>
                                                    {joinedDate && (
                                                        <p className="text-[10px] text-[#B8AFA5] mt-0.5">JOINED: {joinedDate}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
 
                                        {/* CATEGORY / ROLE Column */}
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-[#2A1F1D] text-sm">{user.category || 'Unassigned'}</p>
                                            {user.sub_category && user.sub_category !== user.category && (
                                                <p className="text-[11px] text-[#8C7B70] mt-0.5">{user.sub_category}</p>
                                            )}
                                        </td>
 
                                        {/* STATUS Column */}
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                                                user.status === 'Approved' ? 'text-[#166534] bg-transparent' :
                                                user.status === 'Rejected' ? 'text-[#991B1B] bg-transparent' :
                                                user.status === 'Disabled' ? 'text-[#475569] bg-transparent' :
                                                'text-[#92400E] bg-transparent'
                                            }`}>
                                                {user.status}
                                            </span>
                                            {user.rejection_reason && !isAppeal && (
                                                <p className="text-[9px] text-[#B8AFA5] italic mt-1 max-w-[120px] truncate" title={user.rejection_reason}>
                                                    {user.rejection_reason}
                                                </p>
                                            )}
                                            {isAppeal && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#C06842] animate-pulse"></div>
                                                    <span className="text-[9px] font-bold text-[#C06842] uppercase tracking-tighter">Appeal Pending</span>
                                                </div>
                                            )}
                                        </td>
 
                                        {/* VERIFICATION Column */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {/* Resume Icon */}
                                                {user.resume_path ? (
                                                    <button 
                                                        onClick={() => window.open(`${import.meta.env.VITE_API_URL}/api/documents/view/${user.resume_path.split('/').pop()}`, '_blank')} 
                                                        className="p-2 text-[#8C7B70] hover:text-[#C06842] hover:bg-[#C06842]/5 rounded-lg transition-colors" 
                                                        title="View Resume"
                                                    >
                                                        <FileText size={18} strokeWidth={1.5} />
                                                    </button>
                                                ) : (isProfessional && user.category !== 'Land Owner') && (
                                                    <div className="p-2 text-[#E3DACD]" title="No Resume">
                                                        <FileText size={18} strokeWidth={1.5} />
                                                    </div>
                                                )}
                                                
                                                {/* Degree Icon */}
                                                {user.degree_path ? (
                                                    <button 
                                                        onClick={() => window.open(`${import.meta.env.VITE_API_URL}/api/documents/view/${user.degree_path.split('/').pop()}`, '_blank')} 
                                                        className="p-2 text-[#8C7B70] hover:text-[#C06842] hover:bg-[#C06842]/5 rounded-lg transition-colors" 
                                                        title="View Degree"
                                                    >
                                                        <Award size={18} strokeWidth={1.5} />
                                                    </button>
                                                ) : (isProfessional && user.category !== 'Land Owner') && (
                                                    <div className="p-2 text-[#E3DACD]" title="No Degree">
                                                        <Award size={18} strokeWidth={1.5} />
                                                    </div>
                                                )}

                                                {/* Identity Proof Icon (Aadhar) */}
                                                {user.personal_id_document_path ? (
                                                    <button 
                                                        onClick={() => window.open(`${import.meta.env.VITE_API_URL}/api/documents/view/${user.personal_id_document_path.split('/').pop()}`, '_blank')} 
                                                        className="p-2 text-[#8C7B70] hover:text-[#C06842] hover:bg-[#C06842]/5 rounded-lg transition-colors" 
                                                        title="View Identity Proof"
                                                    >
                                                        <ShieldCheck size={18} strokeWidth={1.5} />
                                                    </button>
                                                ) : (isProfessional && user.category !== 'Land Owner') && (
                                                    <div className="p-2 text-[#E3DACD]" title="No Identity Proof">
                                                        <ShieldCheck size={18} strokeWidth={1.5} />
                                                    </div>
                                                )}
 
                                                {/* Appeal Indicator */}
                                                {isAppeal && (
                                                    <button
                                                        onClick={() => {
                                                            const detail = user.appeal_reason || (user.rejection_reason?.replace('[APPEAL SUBMITTED]', '').split('| DOC:')[0].trim());
                                                            const doc = user.appeal_document_path || (user.rejection_reason?.includes('| DOC:') ? user.rejection_reason.split('| DOC:')[1].trim() : null);
                                                            openModal({
                                                                title: 'Review Account Appeal',
                                                                message: detail || 'No formal statement provided.',
                                                                type: 'detailed',
                                                                icon: MessageSquare,
                                                                iconColor: 'text-[#C06842]',
                                                                extraContent: doc && (
                                                                    <div className="space-y-4">
                                                                        <div className="text-[10px] font-black text-[#8C7B70] uppercase tracking-widest border-b border-[#E3DACD]/30 pb-2">Supporting Evidence</div>
                                                                        <button
                                                                            onClick={() => window.open(doc.startsWith('http') ? doc : `${import.meta.env.VITE_API_URL}${doc.startsWith('/') ? '' : '/'}${doc}`, '_blank')}
                                                                            className="flex items-center gap-3 p-4 bg-white border border-[#E3DACD] rounded-2xl w-full hover:border-[#C06842] transition-all group"
                                                                        >
                                                                            <div className="p-2 bg-[#F9F7F2] text-[#C06842] rounded-xl group-hover:bg-[#C06842] group-hover:text-white transition-colors">
                                                                                <Download size={16} />
                                                                            </div>
                                                                            <div className="text-left">
                                                                                <p className="text-xs font-bold text-[#2A1F1D]">View Appeal Document</p>
                                                                                <p className="text-[10px] text-[#B8AFA5]">Official attachment provided by user</p>
                                                                            </div>
                                                                        </button>
                                                                    </div>
                                                                )
                                                            });
                                                        }}
                                                        className="p-2 text-[#C06842] hover:bg-[#C06842]/10 rounded-lg transition-colors bg-[#C06842]/5 border border-[#C06842]/20"
                                                        title="Review Appeal"
                                                    >
                                                        <Flag size={18} strokeWidth={1.5} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>

                                        {/* ACTIONS Column */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                {user.status !== 'Approved' && (
                                                    <button 
                                                        onClick={() => handleVerifyUser(user.user_id, 'Approved')} 
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-100" 
                                                        title="Approve"
                                                    >
                                                        <CheckCircle size={16} strokeWidth={2} />
                                                    </button>
                                                )}
                                                {user.status !== 'Rejected' && (
                                                    <button 
                                                        onClick={() => handleVerifyUser(user.user_id, 'Rejected')} 
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100" 
                                                        title="Reject"
                                                    >
                                                        <XCircle size={16} strokeWidth={2} />
                                                    </button>
                                                )}
                                                
                                                <div className="h-6 w-px bg-[#E3DACD]/20 mx-1" />

                                                <button
                                                    onClick={() => handleToggleDisableUser(user.user_id, user.status)}
                                                    className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                                                        user.status === 'Disabled'
                                                            ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                                                            : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                                    }`}
                                                >
                                                    {user.status === 'Disabled' ? 'ENABLE' : 'DISABLE'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    if (loading) return (
        <div className="flex-1 h-screen flex flex-col items-center justify-center bg-[#FDFCF8] gap-6">
            <div className="w-16 h-16 border-4 border-[#C06842]/10 border-t-[#C06842] rounded-full animate-spin"></div>
            <p className="font-serif italic text-[#8C7B70] animate-pulse">Synchronizing secure repository...</p>
        </div>
    );

    return (
        <div className="flex-1 w-full p-4 md:p-8 bg-[#FDFCF8] font-sans text-[#2A1F1D]">
            {activeSection === 'overview' && (
                <div className="space-y-10 animate-fade-in max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-[#E3DACD]/20 pb-8">
                        <div className="space-y-1">
                            <span className="text-[9px] text-[#C06842] uppercase font-black tracking-widest">Operational Intelligence</span>
                            <h2 className="text-4xl font-black font-serif text-[#2A1F1D] tracking-tight">Admin Dashboard</h2>
                        </div>
                        <div className="flex items-center gap-3 text-[#8C7B70] text-[10px] font-black uppercase tracking-widest bg-white px-5 py-3 rounded-xl border border-[#E3DACD]">
                            <Activity size={14} className="text-green-500" />
                            System Health: <span className="text-green-600">Optimal</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard label="Total Entities" value={stats.totalUsers} icon={Users} color="text-blue-600" />
                        <StatCard label="Land Owners" value={stats.owners} icon={Home} color="text-[#C06842]" />
                        <StatCard label="Professionals" value={stats.professionals} icon={Briefcase} color="text-indigo-600" />
                        <StatCard label="Pending Action" value={stats.pendingVerifications} icon={AlertCircle} color="text-amber-600" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="bg-white p-8 rounded-2xl border border-[#E3DACD]/40 shadow-sm relative overflow-hidden group">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-xl font-black font-serif text-[#2A1F1D] tracking-tight">User Acquisition</h3>
                                    <p className="text-[9px] text-[#8C7B70] font-black uppercase tracking-widest mt-0.5">Monthly Onboarding Velocity</p>
                                </div>
                                <BarChart3 className="text-[#C06842]/30 group-hover:text-[#C06842] transition-colors" size={24} />
                            </div>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[
                                        { name: 'Jan', value: 40 }, { name: 'Feb', value: 70 }, { name: 'Mar', value: 55 },
                                        { name: 'Apr', value: 90 }, { name: 'May', value: 120 }, { name: 'Jun', value: 85 }
                                    ]}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1EAE0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8C7B70', fontWeight: 'black', fontSize: 10 }} dy={10} />
                                        <Tooltip cursor={{ fill: '#FDFCF8' }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontFamily: 'serif' }} />
                                        <Bar dataKey="value" fill="#C06842" radius={[10, 10, 10, 10]} barSize={30} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-2xl border border-[#E3DACD]/40 shadow-sm relative overflow-hidden group">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-xl font-black font-serif text-[#2A1F1D] tracking-tight">Platform Demographic</h3>
                                    <p className="text-[9px] text-[#8C7B70] font-black uppercase tracking-widest mt-0.5">Role Distribution Analysis</p>
                                </div>
                                <PieChart size={24} className="text-[#4F46E5]/30 group-hover:text-[#4F46E5] transition-colors" strokeWidth={1.5} />
                            </div>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Owners', value: stats.owners },
                                                { name: 'Professionals', value: stats.professionals },
                                            ]}
                                            cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={8} dataKey="value" stroke="none"
                                        >
                                            <Cell fill="#C06842" />
                                            <Cell fill="#4F46E5" />
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeSection === 'verify_accounts' && (
                <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
                    <div className="flex justify-between items-center pb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-[#2A1F1D]">Account Verifications</h2>
                            <p className="text-sm text-[#8C7B70] mt-1">Review and manage user registrations</p>
                        </div>
                        <span className="text-xs font-semibold text-[#C06842] bg-[#C06842]/5 px-4 py-2 rounded-lg border border-[#C06842]/10">
                            {users.filter(u => u.status === 'Pending').length} Pending
                        </span>
                    </div>
                    <UserManagementTable
                        data={users.filter(u => 
                            u.status === 'Pending' && 
                            u.category !== 'Admin' && 
                            u.sub_category !== 'Land Owner' && 
                            u.sub_category !== 'Contractor'
                        )}
                        title="Pending Reviews"
                        badge={`${users.filter(u => u.status === 'Pending' && u.sub_category !== 'Land Owner' && u.sub_category !== 'Contractor').length}`}
                    />
                </div>
            )}

            {activeSection === 'professionals' && (
                <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
                    <div className="flex justify-between items-center pb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-[#2A1F1D]">Professionals</h2>
                            <p className="text-sm text-[#8C7B70] mt-1">All registered professionals on the platform</p>
                        </div>
                        <span className="text-xs font-semibold text-[#8C7B70] bg-[#F9F7F2] px-4 py-2 rounded-lg border border-[#E3DACD]/50">
                            {users.filter(u => u.sub_category !== 'Land Owner' && u.category !== 'Admin').length} Total
                        </span>
                    </div>
                    <UserManagementTable
                        data={users.filter(u => u.sub_category !== 'Land Owner' && u.category !== 'Admin')}
                        title="Professional Directory"
                        badge={`${users.filter(u => u.sub_category !== 'Land Owner' && u.category !== 'Admin').length}`}
                        isProfessional={true}
                    />
                </div>
            )}

            {activeSection === 'land_owners' && (
                <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
                    <div className="flex justify-between items-center pb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-[#2A1F1D]">Land Owners</h2>
                            <p className="text-sm text-[#8C7B70] mt-1">Registered land owners on the platform</p>
                        </div>
                        <span className="text-xs font-semibold text-[#8C7B70] bg-[#F9F7F2] px-4 py-2 rounded-lg border border-[#E3DACD]/50">
                            {users.filter(u => u.sub_category === 'Land Owner').length} Total
                        </span>
                    </div>
                    <UserManagementTable
                        data={users.filter(u => u.sub_category === 'Land Owner')}
                        title="Owner Directory"
                        badge={`${users.filter(u => u.sub_category === 'Land Owner').length}`}
                    />
                </div>
            )}

            {activeSection === 'verify_land' && (
                <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
                    <div className="flex justify-between items-center pb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-[#2A1F1D]">Land Verification</h2>
                            <p className="text-sm text-[#8C7B70] mt-1">Verify and approve land ownership documents</p>
                        </div>
                        <span className="text-xs font-semibold text-[#C06842] bg-[#C06842]/5 px-4 py-2 rounded-lg border border-[#C06842]/10">
                            {lands.filter(l => !l.verification_status || l.verification_status === 'Pending').length} Pending
                        </span>
                    </div>
                    <div className="bg-white rounded-2xl border border-[#E3DACD]/40 overflow-hidden shadow-sm">
                        <div className="px-6 py-5 border-b border-[#E3DACD]/30 bg-[#FDFCF8] flex justify-between items-center">
                            <h3 className="text-lg font-bold text-[#2A1F1D]">Verification Queue</h3>
                            <span className="text-[10px] text-[#8C7B70] bg-[#F9F7F2] px-3 py-1 rounded-lg font-bold border border-[#E3DACD]/50 uppercase tracking-wider">
                                TOTAL: {lands.length}
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[#FDFCF8]/50 text-[#8C7B70] uppercase text-[10px] font-bold tracking-wider border-b border-[#E3DACD]/30">
                                    <tr>
                                        <th className="px-6 py-3.5">Land Details</th>
                                        <th className="px-6 py-3.5">Location / Type</th>
                                        <th className="px-6 py-3.5">Document</th>
                                        <th className="px-6 py-3.5 text-center">Status</th>
                                        <th className="px-6 py-3.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E3DACD]/20 text-[#5D4037]">
                                    {lands.length === 0 ? (
                                        <tr><td colSpan="5" className="px-5 py-8 text-center text-[#B8AFA5] italic">No lands submitted yet.</td></tr>
                                    ) : lands.map(land => (
                                        <tr key={land.land_id} className="hover:bg-white transition-colors">
                                            <td className="px-5 py-4">
                                                <p className="font-bold text-[#2A1F1D]">{land.name}</p>
                                                <p className="text-[10px] text-[#B8AFA5] mt-0.5">{land.owner_name}</p>
                                                <p className="text-[10px] text-[#B8AFA5]">{land.owner_email}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="text-sm">{land.location || '—'}</p>
                                                <span className="text-[10px] font-bold uppercase text-[#8C7B70] mt-1 block">{land.type} · {land.area} sq.ft</span>
                                            </td>
                                            <td className="px-5 py-4">
                                                {land.documents_path ? (
                                                    <a
                                                        href={`${import.meta.env.VITE_API_URL}${land.documents_path.startsWith('/') ? '' : '/'}${land.documents_path.replace(/\\/g, '/')}`}
                                                        target="_blank" rel="noopener noreferrer"
                                                        className="text-[#C06842] bg-[#C06842]/5 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-[#C06842]/10 flex items-center gap-2 border border-[#C06842]/10 transition-colors w-fit"
                                                    >
                                                        <FileText size={11} /> View Document
                                                    </a>
                                                ) : (
                                                    <span className="text-[#B8AFA5] text-[10px] italic">No document uploaded</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase border ${land.verification_status === 'Verified' ? 'bg-green-50 text-green-700 border-green-100' :
                                                    land.verification_status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                                                        'bg-amber-50 text-amber-700 border-amber-100'
                                                    }`}>{land.verification_status || 'Pending'}</span>
                                                {land.rejection_reason && (
                                                    <p className="text-[9px] text-red-400 mt-1 italic max-w-[150px] leading-tight">"{land.rejection_reason}"</p>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {(!land.verification_status || land.verification_status === 'Pending' || land.verification_status === 'Rejected') && (
                                                        <button onClick={() => handleVerifyLand(land.land_id, 'Verified')} className="p-2 text-green-700 bg-green-50 hover:bg-green-100 rounded-xl transition-colors border border-green-100" title="Verify"><CheckCircle size={16} /></button>
                                                    )}
                                                    {(!land.verification_status || land.verification_status === 'Pending' || land.verification_status === 'Verified') && (
                                                        <button onClick={() => handleVerifyLand(land.land_id, 'Rejected')} className="p-2 text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-100" title="Reject"><XCircle size={16} /></button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeSection === 'verify_auctions' && (
                <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
                    <div className="flex justify-between items-center pb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-[#2A1F1D]">Market Authorization</h2>
                            <p className="text-sm text-[#8C7B70] mt-1">Review pending auction requests for land parcels</p>
                        </div>
                        <span className="text-xs font-semibold text-[#8C7B70] bg-[#F9F7F2] px-4 py-2 rounded-lg border border-[#E3DACD]/50 text-right">
                            {auctions.length} Pending
                        </span>
                    </div>

                    <div className="bg-white rounded-2xl border border-[#E3DACD]/40 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[#FDFCF8]/50 text-[#8C7B70] uppercase text-[10px] font-bold tracking-wider border-b border-[#E3DACD]/30">
                                    <tr>
                                        <th className="px-6 py-3.5">Land Title</th>
                                        <th className="px-6 py-3.5">Owner Info</th>
                                        <th className="px-6 py-3.5">Target Value</th>
                                        <th className="px-8 py-3.5 text-right">Market Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E3DACD]/20">
                                    {auctions.length === 0 ? (
                                        <tr><td colSpan="4" className="px-8 py-24 text-center text-[#B8AFA5] italic font-serif text-xl border-none">No pending auction requests in queue.</td></tr>
                                    ) : auctions.map((auction, index) => (
                                        <tr key={auction.auction_id || index} className="hover:bg-[#FDFCF8]/40 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-[#2A1F1D]">{auction.land_title}</div>
                                                <div className="text-[10px] text-[#A65D3B] font-bold uppercase tracking-widest mt-1">Location: {auction.location}</div>
                                            </td>
                                            <td className="px-6 py-4 text-[#5D4037]">
                                                <div className="font-semibold text-xs">{auction.owner_name}</div>
                                                <div className="text-[10px] opacity-70 truncate max-w-[150px]">{auction.owner_email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-black text-[#2A1F1D]">₹ {auction.base_price?.toLocaleString() || '---'}</div>
                                                <div className="text-[9px] text-[#8C7B70] font-bold uppercase mt-1">Base Price Protocol</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleVerifyAuction(auction.auction_id, 'Approved')} 
                                                        className="p-2 text-green-700 bg-green-50 hover:bg-green-100 rounded-xl transition-colors border border-green-100" 
                                                        title="Authorize Market Entry"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleVerifyAuction(auction.auction_id, 'Rejected')} 
                                                        className="p-2 text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-100" 
                                                        title="Deny Access"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}



            {activeSection === 'projects' && (
                <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
                    <div className="flex justify-between items-center pb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-[#2A1F1D]">Projects</h2>
                            <p className="text-sm text-[#8C7B70] mt-1">Overview of all projects on the platform</p>
                        </div>
                        <span className="text-xs font-semibold text-[#8C7B70] bg-[#F9F7F2] px-4 py-2 rounded-lg border border-[#E3DACD]/50">
                            {projects.length} Total
                        </span>
                    </div>

                    <div className="bg-white rounded-2xl border border-[#E3DACD]/40 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[#FDFCF8]/50 text-[#8C7B70] uppercase text-[10px] font-bold tracking-wider border-b border-[#E3DACD]/30">
                                    <tr>
                                        <th className="px-6 py-3.5">Project</th>
                                        <th className="px-6 py-3.5">Land / Location</th>
                                        <th className="px-6 py-3.5">Team</th>
                                        <th className="px-6 py-3.5">Progress</th>
                                        <th className="px-8 py-3.5 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E3DACD]/20 text-[#5D4037]">
                                    {projects.filter(p => !searchQuery || p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || p.owner_name?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                                        <tr><td colSpan="5" className="px-8 py-24 text-center text-[#B8AFA5] italic font-serif text-xl border-none">No matching project cycles detected.</td></tr>
                                    ) : projects
                                        .filter(p => !searchQuery || p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || p.owner_name?.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .map((project, index) => (
                                        <tr key={project.project_id || index} className="hover:bg-[#FDFCF8]/40 transition-all duration-300">
                                            <td className="px-6 py-4">
                                                <div className="font-black text-lg text-[#2A1F1D] tracking-tight">{project.title}</div>
                                                <div className="text-[11px] text-[#A65D3B] font-bold uppercase tracking-widest mt-1.5 opacity-80">Origin: {project.owner_name}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-black text-[#4A342E]">{project.land_name || 'Assigned Territory'}</div>
                                                <div className="text-[10px] text-[#B8AFA5] font-black uppercase mt-1 tracking-wider">{project.location}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {project.team && project.team.length > 0 ? (
                                                    <div className="flex flex-col gap-1.5">
                                                        {project.team.map((member, index) => (
                                                            <div key={member.id || index} className="flex gap-3 items-center text-[10px] bg-[#FDFCF8] border border-[#E3DACD]/40 px-3 py-1.5 rounded-xl">
                                                                <span className="font-black text-[#8C7B70] uppercase tracking-tighter opacity-70 w-20">{member.sub_category || member.category}:</span>
                                                                <span className="text-[#2A1F1D] font-black tracking-tight">{member.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] uppercase font-black tracking-[0.2em] text-[#B8AFA5] italic">Deployment Queueing...</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-3 w-full max-w-[180px]">
                                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest mb-1">
                                                        <span className="text-[#8C7B70]">Site Progress: <span className="text-[#C06842]">{project.progress?.percentage || 0}%</span></span>
                                                        <div className="flex gap-1">
                                                            <PhaseTick active={project.progress?.planning} label="P" />
                                                            <PhaseTick active={project.progress?.design} label="D" />
                                                            <PhaseTick active={project.progress?.execution} label="E" />
                                                        </div>
                                                    </div>
                                                    <div className="w-full h-2 bg-[#F9F7F2] rounded-full overflow-hidden border border-[#E3DACD]/50 shadow-inner">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-[#D98B6C] via-[#C06842] to-[#8C4A32] rounded-full transition-all duration-1000 ease-out"
                                                            style={{ width: `${project.progress?.percentage || 0}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border-2 ${project.status === 'Completed' ? 'bg-[#F0FDF4] text-[#166534] border-[#DCFCE7]' :
                                                    project.status === 'Planning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                        project.status === 'Execution' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            'bg-gray-50 text-gray-700 border-gray-200'
                                                    }`}>
                                                    {project.status?.replace('_', ' ')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeSection === 'settings' && (
                <div className="space-y-4 animate-fade-in max-w-4xl mx-auto py-6 text-center">
                    <div className="space-y-2">
                        <div className="inline-flex p-4 rounded-2xl bg-[#C06842]/10 text-[#C06842] mb-2 border border-[#C06842]/20 shadow-sm">
                            <Settings size={28} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-3xl font-black font-serif text-[#2A1F1D] tracking-tight">System Configuration</h2>
                        <p className="text-[11px] text-[#8C7B70] max-w-sm mx-auto font-bold uppercase tracking-widest leading-relaxed">Platform protocols and administrative credentials</p>
                    </div>

                    <div className="bg-white p-10 rounded-2xl border border-[#E3DACD]/40 shadow-sm text-left">
                        <h3 className="font-black text-[#2A1F1D] mb-6 font-serif text-xl tracking-tight border-b border-[#E3DACD]/20 pb-4 flex items-center gap-3">
                            <Lock className="text-[#C06842]" size={20} /> Identity Management
                        </h3>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-[#A65D3B] uppercase tracking-widest block ml-1">Administrative Email</label>
                                <input
                                    type="text"
                                    readOnly
                                    value={currentUser?.email || 'admin@planora.com'}
                                    className="w-full bg-[#FDFCF8] border border-[#E3DACD] rounded-xl px-6 py-4 text-sm font-black text-[#2A1F1D] focus:outline-none"
                                />
                            </div>
                            <div className="pt-4">
                                <button className="w-full py-4 bg-[#2A1F1D] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-[#C06842] transition-all">
                                    Apply Security Updates
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex items-center justify-between text-left">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white text-red-600 flex items-center justify-center shadow-sm">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h4 className="font-black text-red-900 text-base tracking-tight">Emergency Halt</h4>
                                <p className="text-red-700/60 text-[9px] font-bold uppercase tracking-widest mt-0.5">Authorized Protocols Only</p>
                            </div>
                        </div>
                        <button className="px-6 py-3 bg-red-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-red-100">
                            Lockdown
                        </button>
                    </div>
                </div>
            )}

            {/* 🔥 Modern Global Modal: Replaces window.alert, window.confirm, window.prompt */}
            <AnimatePresence>
                {modal.isOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeModal}
                            className="absolute inset-0 bg-[#2A1F1D]/60 backdrop-blur-md"
                        ></motion.div>

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white max-w-lg w-full rounded-[2.5rem] shadow-[0_45px_100px_rgba(0,0,0,0.25)] border border-[#E3DACD]/50 overflow-hidden relative z-10"
                        >
                            <div className="p-10">
                                <div className="flex flex-col items-center text-center">
                                    <div className={`w-20 h-20 rounded-[2rem] bg-gray-50 flex items-center justify-center mb-6 shadow-sm border border-gray-100 text-3xl`}>
                                        <modal.icon size={36} className={modal.iconColor} />
                                    </div>
                                    <h3 className="text-2xl font-black font-serif text-[#2A1F1D] mb-3">{modal.title}</h3>
                                    <p className="text-[#8C7B70] leading-relaxed text-sm mb-8 font-medium">{modal.message}</p>

                                    {modal.type === 'prompt' && (
                                        <textarea
                                            value={modal.inputValue}
                                            onChange={(e) => setModal({ ...modal, inputValue: e.target.value })}
                                            className="w-full bg-[#FDFCF8] border-2 border-[#E3DACD]/50 p-4 rounded-2xl text-sm focus:border-[#C06842] outline-none mb-8 h-24 resize-none font-medium transition-colors"
                                            placeholder="Enter detailed reason..."
                                        ></textarea>
                                    )}

                                    {modal.type === 'detailed' && modal.extraContent && (
                                        <div className="w-full mb-8 bg-[#FDFCF8] p-6 rounded-3xl border-2 border-[#E3DACD]/50 text-left overflow-hidden">
                                            {modal.extraContent}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 w-full">
                                        {(modal.type === 'confirm' || modal.type === 'prompt') && (
                                            <button
                                                onClick={closeModal}
                                                className="flex-1 py-4 bg-[#F9F7F2] text-[#8C7B70] font-black text-xs uppercase tracking-widest rounded-3xl hover:bg-[#E3DACD]/30 transition-all border border-[#E3DACD]/40"
                                            >
                                                {modal.cancelText || 'Cancel'}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                if (modal.onConfirm) modal.onConfirm(modal.inputValue);
                                                closeModal();
                                            }}
                                            className={`flex-1 py-4 font-black text-xs uppercase tracking-widest rounded-3xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] ${modal.iconColor.includes('red') ? 'bg-red-600 text-white shadow-red-100' : 'bg-[#2A1F1D] text-white shadow-gray-200'
                                                }`}
                                        >
                                            {modal.confirmText || (modal.type === 'alert' || modal.type === 'detailed' ? 'Acknowledge' : 'Continue')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminDashboard;
