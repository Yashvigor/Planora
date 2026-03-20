import React, { useState, useEffect } from 'react';
import { useMockApp } from '../../../hooks/useMockApp';
import {
    Bell, Check, CheckCheck, Trash2, Clock, Upload, XCircle, FileText,
    ExternalLink, AlertCircle, Info, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import socket from '../../../utils/socket';

const Notifications = () => {
    const { currentUser: ctxUser } = useMockApp();
    const currentUser = ctxUser || (() => {
        try {
            const raw = localStorage.getItem('planora_current_user') || localStorage.getItem('user');
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    })();

    const getToken = () => localStorage.getItem('planora_token') || localStorage.getItem('token') || '';
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        if (!currentUser) return;
        try {
            const uid = currentUser.user_id || currentUser.id;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${uid}`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            if (res.ok) {
                setNotifications(await res.json());
            }
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        if (currentUser) {
            const uid = currentUser.user_id || currentUser.id;
            socket.on('connect', () => {
                socket.emit('join', uid);
            });
            if (!socket.connected) socket.connect();
            else socket.emit('join', uid);

            socket.on('new_notification', (noti) => {
                // Add new notification to the top of the list
                setNotifications(prev => [noti, ...prev]);
            });

            return () => {
                socket.off('new_notification');
            };
        }
    }, [currentUser]);

    const markAsRead = async (id) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
                window.dispatchEvent(new CustomEvent('planora_notification_read'));
            }
        } catch (err) {
            console.error("Failed to mark as read:", err);
        }
    };

    const markAllRead = async () => {
        try {
            const uid = currentUser.user_id || currentUser.id;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/user/${uid}/read-all`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                window.dispatchEvent(new CustomEvent('planora_notification_read'));
            }
        } catch (err) {
            console.error("Failed to mark all as read:", err);
        }
    };

    const handleInvitationResponse = async (notificationId, projectId, status) => {
        try {
            const uid = currentUser.user_id || currentUser.id;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}/assign/${uid}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                await markAsRead(notificationId);
                fetchNotifications();
            } else {
                alert(`Failed to ${status.toLowerCase()} invitation.`);
            }
        } catch (err) {
            console.error("Error responding to invite:", err);
        }
    };

    const getIcon = (type) => {
        const iconBaseStyle = "p-3 rounded-2xl transition-all duration-300 shadow-sm ring-1 ring-inset";
        switch (type) {
            case 'invitation': 
                return (
                    <div className={`${iconBaseStyle} bg-blue-50 ring-blue-100 text-blue-600`}>
                        <Bell size={22} strokeWidth={2.5} />
                    </div>
                );
            case 'invitation_response': 
                return (
                    <div className={`${iconBaseStyle} bg-indigo-50 ring-indigo-100 text-indigo-600`}>
                        <CheckCheck size={22} strokeWidth={2.5} />
                    </div>
                );
            case 'task_assignment': 
                return (
                    <div className={`${iconBaseStyle} bg-amber-50 ring-amber-100 text-amber-600`}>
                        <Clock size={22} strokeWidth={2.5} />
                    </div>
                );
            case 'task_completion': 
                return (
                    <div className={`${iconBaseStyle} bg-indigo-50 ring-indigo-100 text-indigo-600`}>
                        <Upload size={22} strokeWidth={2.5} />
                    </div>
                );
            case 'task_approval': 
                return (
                    <div className={`${iconBaseStyle} bg-green-50 ring-green-100 text-green-600`}>
                        <CheckCircle2 size={22} strokeWidth={2.5} />
                    </div>
                );
            case 'task_rejection': 
                return (
                    <div className={`${iconBaseStyle} bg-rose-50 ring-rose-100 text-rose-600`}>
                        <XCircle size={22} strokeWidth={2.5} />
                    </div>
                );
            case 'quotation_review':
                return (
                    <div className={`${iconBaseStyle} bg-rose-50 ring-rose-100 text-rose-600`}>
                        <FileText size={22} strokeWidth={2.5} />
                    </div>
                )
            default: 
                return (
                    <div className={`${iconBaseStyle} bg-[#F9F7F2] ring-[#E3DACD] text-[#C06842]`}>
                        <Info size={22} strokeWidth={2.5} />
                    </div>
                );
        }
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + date.toLocaleDateString();
    };

    return (
        <div className="p-4 md:p-12 bg-[#FDFCF8] min-h-screen font-sans text-[#2A1F1D] selection:bg-[#C06842]/20">
            <div className="max-w-4xl mx-auto space-y-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-[#E3DACD]/40 pb-10">
                    <div className="space-y-4">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 text-[#C06842]"
                        >
                            <span className="h-[2px] w-8 bg-[#C06842]/30" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] font-sans">Intelligence Center</span>
                        </motion.div>
                        <h1 className="text-5xl font-serif font-black tracking-tight text-[#2A1F1D]">Notifications</h1>
                        <p className="text-[#8C7B70] text-lg font-medium max-w-lg leading-relaxed">
                            Stay synchronized with your team and capture every milestone of your project's progression.
                        </p>
                    </div>

                    {notifications.some(n => !n.is_read) && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={markAllRead}
                            className="px-6 py-3 bg-[#2A1F1D] text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-[#C06842] transition-all shadow-xl shadow-[#2A1F1D]/10 hover:shadow-[#C06842]/20"
                        >
                            Mark All As Read
                        </motion.button>
                    )}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <div className="w-12 h-12 border-[3px] border-[#C06842]/10 border-t-[#C06842] rounded-full animate-spin" />
                        <span className="text-xs font-bold text-[#8C7B70] uppercase tracking-widest">Hydrating data...</span>
                    </div>
                ) : notifications.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-32 bg-white rounded-[3rem] border border-[#E3DACD]/50 shadow-sm relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F9F7F2] rounded-full blur-[100px] -mr-32 -mt-32 opacity-50" />
                        <Bell size={64} className="mx-auto mb-6 text-[#E3DACD] group-hover:scale-110 transition-transform duration-500" strokeWidth={1} />
                        <h3 className="font-serif text-3xl font-bold text-[#2A1F1D] mb-2">Absolute Tranquility</h3>
                        <p className="text-[#8C7B70] font-medium">You're caught up with everything. There are no pending updates.</p>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {notifications.map((n) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    key={n.id}
                                    className={`group relative flex flex-col md:flex-row items-start gap-6 p-8 rounded-[2rem] border transition-all duration-500 ${n.is_read
                                        ? 'bg-white/40 border-[#E3DACD]/30 opacity-70 hover:opacity-100 hover:bg-white'
                                        : 'bg-white border-[#C06842]/20 shadow-xl shadow-[#C06842]/5 ring-1 ring-[#C06842]/5'
                                        }`}
                                >
                                    {/* Unread Indicator Dot */}
                                    {!n.is_read && (
                                        <div className="absolute top-8 right-8 w-2 h-2 bg-[#C06842] rounded-full animate-pulse shadow-lg shadow-[#C06842]/50" />
                                    )}

                                    <div className="shrink-0">
                                        {getIcon(n.type)}
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3 text-[10px] font-black text-[#8C7B70] uppercase tracking-widest">
                                                <span className="flex items-center gap-1.5"><Clock size={12} /> {formatTime(n.created_at)}</span>
                                                <span className="w-1 h-1 bg-[#E3DACD] rounded-full" />
                                                <span className={`${n.is_read ? 'text-[#B8AFA5]' : 'text-[#C06842]'}`}>
                                                    {n.type?.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <p className={`text-[17px] leading-relaxed tracking-tight ${n.is_read ? 'text-[#5D4037]' : 'font-bold text-[#2A1F1D] font-serif'}`}>
                                                {n.message}
                                            </p>
                                        </div>

                                        {n.type === 'invitation' && n.related_id && !n.is_read && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="pt-4 space-y-4"
                                            >
                                                {n.project_name && (
                                                    <div className="p-6 bg-[#F9F7F2]/50 rounded-2xl border border-[#E3DACD]/50 backdrop-blur-sm">
                                                        <h3 className="font-serif text-xl font-bold text-[#2A1F1D]">{n.project_name}</h3>
                                                        <p className="text-sm text-[#8C7B70] mt-2 leading-relaxed italic">
                                                            {n.project_description || "Detailed collaborative project environment."}
                                                        </p>
                                                        <div className="flex flex-wrap gap-3 mt-4">
                                                            {n.assigned_role && (
                                                                <span className="text-[9px] uppercase font-black tracking-tighter text-[#C06842] bg-[#C06842]/5 px-3 py-1 rounded-full border border-[#C06842]/10">
                                                                    Role: {n.assigned_role}
                                                                </span>
                                                            )}
                                                            {n.project_location && (
                                                                <span className="text-[9px] uppercase font-black tracking-tighter text-[#8C7B70] bg-white/80 px-3 py-1 rounded-full border border-[#E3DACD]/50">
                                                                    Location: {n.project_location}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => handleInvitationResponse(n.id, n.related_id, 'Accepted')}
                                                        className="px-8 py-3 bg-[#2A1F1D] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#C06842] transition-all shadow-lg hover:shadow-[#C06842]/20 flex items-center gap-2"
                                                    >
                                                        Confirm Participation
                                                    </button>
                                                    <button
                                                        onClick={() => handleInvitationResponse(n.id, n.related_id, 'Rejected')}
                                                        className="px-8 py-3 bg-white text-red-600 border border-red-100 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-50 transition-all"
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}

                                        <div className="flex items-center gap-4 pt-4">
                                            {n.link && (
                                                <button
                                                    onClick={() => navigate(n.link)}
                                                    className="flex items-center gap-2 text-xs font-bold text-[#C06842] hover:text-[#2A1F1D] transition-colors group/link uppercase tracking-tighter"
                                                >
                                                    {n.type?.includes('task') ? 'Manage Tasks Hub' : 'Access Project Portal'} <ExternalLink size={14} className="group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
                                                </button>
                                            )}
                                            
                                            {!n.is_read && (
                                                <button
                                                    onClick={() => markAsRead(n.id)}
                                                    className="text-xs font-bold text-[#8C7B70] hover:text-[#2A1F1D] transition-colors ml-auto uppercase tracking-tighter"
                                                >
                                                    Dismiss
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Aesthetic Background Elements */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#E68A2E]/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-[#C06842]/5 rounded-full blur-[100px]" />
            </div>
        </div>
    );
};

export default Notifications;
