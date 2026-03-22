import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
    Hammer, Camera, PencilRuler, Briefcase, Home, UserCheck, Activity, Bell,
    Gavel, LayoutDashboard, Users, Building, DollarSign, CheckSquare, Map, 
    FolderPlus, Package, Palette, FileText, Settings, LogOut, ChevronRight
} from 'lucide-react';
import { useMockApp } from '../../hooks/useMockApp';
import PlanoraLogo from '../common/PlanoraLogo';
import socket from '../../utils/socket';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ isOpen, onClose }) => {
    const { currentUser, logout } = useMockApp();
    const [counts, setCounts] = useState({ lands: 0, accounts: 0, auctions: 0, tasks: 0, notifications: 0 });

    const getToken = () => localStorage.getItem('planora_token') || localStorage.getItem('token') || '';

    useEffect(() => {
        if (!currentUser) return;
        const fetchCounts = async () => {
            try {
                const uid = currentUser.user_id || currentUser.id;
                // Admin counts
                if (currentUser.role === 'admin') {
                    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/pending-counts`);
                    if (res.ok) setCounts(prev => ({ ...prev, ...(res.json()) }));
                }
                // Professional Task counts
                const resTask = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/pending-count/${uid}`, {
                    headers: { 'Authorization': `Bearer ${getToken()}` }
                });
                if (resTask.ok) {
                    const data = await resTask.json();
                    setCounts(prev => ({ ...prev, tasks: data.count }));
                }
                // Notification counts
                const resNotify = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${uid}`, {
                    headers: { 'Authorization': `Bearer ${getToken()}` }
                });
                if (resNotify.ok) {
                    const data = await resNotify.json();
                    setCounts(prev => ({ ...prev, notifications: data.filter(n => !n.is_read).length }));
                }
            } catch (err) { console.warn("Search sidebar counts error:", err); }
        };
        fetchCounts();
        const interval = setInterval(fetchCounts, 60000);
        socket.on('new_notification', fetchCounts);
        window.addEventListener('planora_notification_read', fetchCounts);
        return () => { clearInterval(interval); socket.off('new_notification'); window.removeEventListener('planora_notification_read', fetchCounts); };
    }, [currentUser]);

    const getMenuItems = () => {
        const role = (currentUser?.role || '').toLowerCase().replace(/ /g, '_') || (currentUser?.sub_category || '').toLowerCase().replace(/ /g, '_') || (currentUser?.category || '').toLowerCase().replace(/ /g, '_');
        if (role === 'admin') return [
            { icon: Home, label: 'Land Verification', path: '/dashboard/verify-land', badge: counts.lands },
            { icon: UserCheck, label: 'Account Verification', path: '/dashboard/verify-accounts', badge: counts.accounts },
            { icon: Users, label: 'Professionals', path: '/dashboard/professionals' },
            { icon: Building, label: 'Land Owners', path: '/dashboard/land-owners' },
            { icon: Briefcase, label: 'Projects', path: '/dashboard/projects' }
        ];

        const base = [
            { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
            { icon: Gavel, label: 'Auctions', path: '/dashboard/bidding' },
            { icon: DollarSign, label: 'Payments', path: '/dashboard/payments' },
        ];
        const shared = [
            { icon: Bell, label: 'Notifications', path: '/dashboard/notifications', badge: counts.notifications },
            { icon: CheckSquare, label: 'Tasks', path: '/dashboard/tasks', badge: counts.tasks }
        ];

        switch (role) {
            case 'land_owner': return [...base, ...shared, { icon: Map, label: 'My Lands', path: '/dashboard/lands' }, { icon: FolderPlus, label: 'My Projects', path: '/dashboard/projects' }, { icon: Users, label: 'Find Professionals', path: '/dashboard/find-pros' }];
            case 'architect':
            case 'civil_engineer': return [...base, ...shared, { icon: PencilRuler, label: 'Drawings', path: '/dashboard/drawings' }, { icon: Package, label: 'Materials', path: '/dashboard/materials' }];
            case 'contractor':
            case 'interior_designer': return [...base, ...shared, { icon: Camera, label: 'Reports', path: '/dashboard/reports' }, { icon: FileText, label: 'Quotations', path: '/dashboard/quotations' }, { icon: Users, label: 'Find Professionals', path: '/dashboard/find-pros' }];
            default: return base;
        }
    };

    return (
        <aside className={`h-full bg-white border-r border-[#E3DACD]/50 shadow-[20px_0_60px_-15px_rgba(42,31,29,0.04)] flex flex-col transition-all duration-500 ease-in-out font-sans ${isOpen ? 'w-72' : 'w-24'}`}>
            {/* Logo Section */}
            <div className={`shrink-0 h-20 flex items-center ${isOpen ? 'justify-start px-8' : 'justify-center'} border-b border-[#E3DACD]/20 overflow-hidden`}>
                <PlanoraLogo className={isOpen ? "w-10 h-10" : "w-12 h-12"} iconOnly={!isOpen} />
                {isOpen && (
                    <div className="ml-4 truncate">
                        <span className="font-serif font-black text-2xl tracking-tighter block text-[#2A1F1D]">Plan<span className="text-[#C06842]">ora</span></span>
                        <span className="text-[10px] font-black uppercase text-[#8C7B70] tracking-[0.3em] block">Workspace</span>
                    </div>
                )}
            </div>

            {/* Nav Menu */}
            <nav className="flex-1 py-10 px-5 space-y-2 overflow-y-auto custom-scrollbar no-scrollbar text-left">
                {getMenuItems().map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/dashboard'}
                        onClick={() => window.innerWidth < 1024 && onClose()}
                        className={({ isActive }) =>
                            `flex items-center px-4 py-4 rounded-2xl transition-all duration-500 relative group truncate ${isActive
                                ? 'bg-[#2A1F1D] text-white shadow-2xl shadow-[#2A1F1D]/20'
                                : 'text-[#8C7B70] hover:bg-[#F9F7F2] hover:text-[#2A1F1D]'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className="shrink-0 relative">
                                    <item.icon className={`w-5 h-5 transition-transform duration-500 ${isActive ? 'rotate-3 scale-110' : 'group-hover:scale-110 group-hover:text-[#C06842]'} ${isOpen ? '' : 'mx-auto'}`} strokeWidth={isActive ? 2.5 : 2} />
                                    {!isOpen && item.badge > 0 && <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#C06842] rounded-full ring-2 ring-white animate-pulse" />}
                                </div>
                                {isOpen && (
                                    <div className="flex-1 flex justify-between items-center ml-5 overflow-hidden animate-fade-in text-left">
                                        <span className={`text-[12px] font-black uppercase tracking-widest ${isActive ? 'translate-x-1' : ''} transition-transform duration-500`}>{item.label}</span>
                                        {item.badge > 0 && <span className="text-[10px] font-black bg-[#C06842] text-white px-2 py-0.5 rounded-full shadow-lg">{item.badge}</span>}
                                    </div>
                                )}
                                {isActive && isOpen && <motion.div layoutId="activeBar" className="absolute left-0 w-1 h-6 bg-[#C06842] rounded-r-full" />}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* User Profile Base */}
            <div className="shrink-0 p-5 border-t border-[#E3DACD]/20 space-y-4 bg-[#FDFCF8]/50 text-left">
                <NavLink to="/dashboard/settings" onClick={() => window.innerWidth < 1024 && onClose()} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-[#E3DACD]/40 text-[#8C7B70] hover:text-[#2A1F1D] hover:border-[#C06842] transition-all group">
                    <div className="flex items-center gap-3">
                        <Settings size={20} className="group-hover:rotate-45 transition-transform duration-500" />
                        {isOpen && <span className="text-xs font-black uppercase tracking-widest">Controls</span>}
                    </div>
                    {isOpen && <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />}
                </NavLink>

                <div className={`p-3 rounded-2.5xl bg-white border border-[#E3DACD]/40 shadow-sm flex items-center ${isOpen ? 'gap-3' : 'justify-center'}`}>
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-[#2A1F1D] to-[#4A342E] flex items-center justify-center text-white font-serif font-black shadow-lg">
                        {currentUser?.name?.[0]}
                    </div>
                    {isOpen && (
                        <div className="flex-1 min-w-0 pointer-events-none">
                            <p className="text-[11px] font-black text-[#2A1F1D] tracking-tight truncate uppercase">{currentUser?.name}</p>
                            <p className="text-[9px] text-[#C06842] font-black uppercase tracking-[0.2em] truncate">{currentUser?.role?.replace('_', ' ')}</p>
                        </div>
                    )}
                    {isOpen && (
                        <button onClick={logout} className="p-2 text-[#8C7B70] hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                            <LogOut size={16} />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
