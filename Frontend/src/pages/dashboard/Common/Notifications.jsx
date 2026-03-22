import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useMockApp } from '../../../hooks/useMockApp';
import {
    Bell, CheckCheck, Clock, Upload, XCircle, 
    ExternalLink, Info, CheckCircle2, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import socket from '../../../utils/socket';
import { format, isToday, isYesterday } from 'date-fns';

// Shared Components
import Card from '../../../components/Common/Card';
import Button from '../../../components/Common/Button';
import SectionHeader from '../../../components/Common/SectionHeader';

const NotificationCardItem = ({ n, onRead, onResponse, onNavigate }) => {
    const getIcon = (type) => {
        const iconBaseStyle = "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm border-2";
        switch (type) {
            case 'invitation': return <div className={`${iconBaseStyle} bg-blue-50 border-blue-100 text-blue-600`}><Bell size={22} /></div>;
            case 'invitation_response': return <div className={`${iconBaseStyle} bg-indigo-50 border-indigo-100 text-indigo-600`}><CheckCheck size={22} /></div>;
            case 'task_assignment': return <div className={`${iconBaseStyle} bg-amber-50 border-amber-100 text-amber-600`}><Clock size={22} /></div>;
            case 'task_completion': return <div className={`${iconBaseStyle} bg-emerald-50 border-emerald-100 text-emerald-600`}><Upload size={22} /></div>;
            case 'task_approval': return <div className={`${iconBaseStyle} bg-green-50 border-green-100 text-green-600`}><CheckCircle2 size={22} /></div>;
            case 'task_rejection': return <div className={`${iconBaseStyle} bg-rose-50 border-rose-100 text-rose-600`}><XCircle size={22} /></div>;
            default: return <div className={`${iconBaseStyle} bg-[#FDFCF8] border-[#E3DACD] text-[#C06842]`}><Info size={22} /></div>;
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full"
        >
            <Card variant={n.is_read ? 'flat' : 'glass'} className={`group relative flex gap-8 p-6 lg:p-10 transition-all duration-500 border-2 ${n.is_read ? 'opacity-70 grayscale-[0.5] border-transparent' : 'border-[#C06842]/10 ring-4 ring-[#C06842]/5'}`}>
                <div className="shrink-0">{getIcon(n.type)}</div>
                
                <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C06842]">
                            {format(new Date(n.created_at), 'p')} • {n.type?.replace(/_/g, ' ')}
                        </span>
                        {!n.is_read && <div className="w-2.5 h-2.5 bg-[#C06842] rounded-full animate-pulse shadow-lg" />}
                    </div>

                    <p className={`text-xl leading-tight mb-6 ${n.is_read ? 'text-[#8C7B70]' : 'font-serif font-black text-[#2A1F1D] tracking-tight'}`}>
                        {n.message}
                    </p>

                    {n.type === 'invitation' && n.related_id && !n.is_read && (
                        <div className="mb-6 p-6 bg-[#FDFCF8] rounded-3xl border border-[#E3DACD]/50 shadow-inner">
                            <h4 className="font-serif font-bold text-lg text-[#2A1F1D]">{n.project_name || 'Project Invitation'}</h4>
                            <p className="text-[11px] text-[#8C7B70] mt-2 font-medium leading-relaxed italic">You have been invited to join this project.</p>
                            <div className="flex flex-wrap gap-4 mt-6">
                                <Button size="sm" onClick={() => onResponse(n.id, n.related_id, 'Accepted')}>Accept Invitation</Button>
                                <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => onResponse(n.id, n.related_id, 'Rejected')}>Decline</Button>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-6">
                        {n.link && (
                            <button onClick={() => onNavigate(n.link)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#C06842] hover:text-[#2A1F1D] transition-colors group/link">
                                View Project <ChevronRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                            </button>
                        )}
                        {!n.is_read && (
                            <button onClick={() => onRead(n.id)} className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8C7B70] hover:text-[#2A1F1D] ml-auto">Mark as Read</button>
                        )}
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};

const Notifications = () => {
    const { currentUser: ctxUser } = useMockApp();
    const currentUser = ctxUser;
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchNotifications = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const uid = currentUser.user_id || currentUser.id;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${uid}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}` }
            });
            if (res.ok) setNotifications(await res.json());
        } catch (err) { console.error("Failed notification hydration:", err); }
        finally { setLoading(false); }
    }, [currentUser]);

    useEffect(() => {
        fetchNotifications();
        if (currentUser) {
            const uid = currentUser.user_id || currentUser.id;
            socket.on('new_notification', (noti) => setNotifications(prev => [noti, ...prev]));
            return () => socket.off('new_notification');
        }
    }, [currentUser, fetchNotifications]);

    const markAsRead = async (id) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}` }
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
                window.dispatchEvent(new CustomEvent('planora_notification_read'));
            }
        } catch (err) { console.error(err); }
    };

    const markAllRead = async () => {
        try {
            const uid = currentUser.user_id || currentUser.id;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/user/${uid}/read-all`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}` }
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                window.dispatchEvent(new CustomEvent('planora_notification_read'));
            }
        } catch (err) { console.error(err); }
    };

    const handleInvitationResponse = async (notificationId, projectId, status) => {
        try {
            const uid = currentUser.user_id || currentUser.id;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}/assign/${uid}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}` },
                body: JSON.stringify({ status })
            });
            if (res.ok) { await markAsRead(notificationId); fetchNotifications(); }
        } catch (err) { console.error(err); }
    };

    const grouped = useMemo(() => {
        const groups = { Today: [], Yesterday: [], Earlier: [] };
        notifications.forEach(n => {
            const d = new Date(n.created_at);
            if (isToday(d)) groups.Today.push(n);
            else if (isYesterday(d)) groups.Yesterday.push(n);
            else groups.Earlier.push(n);
        });
        return groups;
    }, [notifications]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-vh-screen space-y-6 bg-[#FDFCF8]">
            <div className="w-16 h-16 border-4 border-[#C06842]/10 border-t-[#C06842] rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8C7B70] animate-pulse">Loading Notifications...</p>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-24 py-16">
            {/* Intelligence Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-12 text-left">
                <div className="space-y-4">
                    <div className="flex items-center gap-4 text-[#C06842]">
                        <span className="h-[1px] w-10 bg-[#C06842]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Alerts</span>
                    </div>
                    <h1 className="text-7xl font-serif font-black tracking-tighter text-[#2A1F1D] leading-none">Notifications</h1>
                    <p className="text-lg text-[#8C7B70] font-medium leading-relaxed max-w-sm">
                        Stay updated with your latest project activities and alerts.
                    </p>
                </div>
                {notifications.some(n => !n.is_read) && (
                    <Button variant="primary" size="lg" icon={CheckCircle2} onClick={markAllRead}>Mark All Read</Button>
                )}
            </div>

            {/* Notification Groups */}
            <div className="space-y-32">
                {notifications.length === 0 ? (
                    <div className="text-center py-48 bg-white/40 rounded-[5rem] border border-dashed border-[#E3DACD] group">
                        <Bell size={80} className="mx-auto mb-8 text-[#E3DACD] opacity-40 group-hover:scale-110 transition-transform duration-1000" strokeWidth={0.5} />
                        <h3 className="font-serif text-4xl font-black text-[#2A1F1D] mb-4">All Caught Up</h3>
                        <p className="text-[#8C7B70] font-medium max-w-xs mx-auto text-lg leading-relaxed">You have no new notifications at the moment.</p>
                    </div>
                ) : (
                    <div className="space-y-24">
                        {Object.entries(grouped).map(([title, items]) => items.length > 0 && (
                            <div key={title} className="space-y-10">
                                <SectionHeader title={title} className="mb-0" />
                                <div className="space-y-6">
                                    <AnimatePresence mode="popLayout">
                                        {items.map(n => (
                                            <NotificationCardItem 
                                                key={n.id} 
                                                n={n} 
                                                onRead={markAsRead} 
                                                onResponse={handleInvitationResponse} 
                                                onNavigate={(link) => navigate(link)} 
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
