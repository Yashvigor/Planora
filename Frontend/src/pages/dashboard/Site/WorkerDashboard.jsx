import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMockApp } from '../../../hooks/useMockApp';
import {
    CheckSquare, Camera, Clock, AlertTriangle,
    MapPin, User, Phone, Star, Briefcase, Calendar,
    Activity, Shield, Construction,
    Home, Bell, ArrowRight, Wrench, AlertOctagon, ClipboardList,
    Upload, CheckCircle, XCircle, ChevronRight, LayoutGrid, ExternalLink, FileText, Download, PencilRuler
} from 'lucide-react';

// --- Utility Components ---
const SectionHeader = ({ title }) => (
    <h3 className="text-lg font-bold font-serif text-[#2A1F1D] mb-4 flex items-center gap-2">
        {title}
    </h3>
);

const Card = ({ children, className = "" }) => (
    <div className={`glass-card p-5 rounded-2xl border border-[#E3DACD]/40 shadow-sm hover:shadow-md transition-all ${className}`}>
        {children}
    </div>
);

// --- Sub-Components ---

const WorkerProfile = ({ currentUser }) => {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            const uid = currentUser?.user_id || currentUser?.id;
            if (!uid) return;
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/${uid}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}` }
                });
                if (res.ok) {
                    setProfileData(await res.json());
                }
            } catch (err) {
                console.error('Error fetching worker profile:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [currentUser]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <div className="w-10 h-10 border-4 border-[#C06842]/20 border-t-[#C06842] rounded-full animate-spin" />
            <p className="text-[#8C7B70] font-bold text-xs uppercase tracking-widest">Loading Profile...</p>
        </div>
    );

    if (!profileData) return (
        <Card className="text-center py-10">
            <AlertOctagon size={40} className="mx-auto text-red-400 mb-4" />
            <p className="text-[#8C7B70] font-bold">Failed to load profile data.</p>
        </Card>
    );

    const profile = {
        fullName: profileData.name || currentUser?.name || 'Worker Name',
        role: profileData.sub_category || currentUser?.role?.replace('_', ' ') || 'Site Worker',
        mobile: profileData.mobile_number || 'Not Provided',
        altContact: 'See Settings',
        address: profileData.address ? `${profileData.address}, ${profileData.city || ''} ${profileData.state || ''}` : 'Not Provided',
        idStatus: profileData.status || 'Pending',
        experience: profileData.experience_years ? `${profileData.experience_years} Years` : 'Not Specified',
        primarySkill: profileData.specialization || profileData.sub_category || 'General',
        subSkills: profileData.bio ? [profileData.bio.substring(0, 50)] : [],
        tools: ['Managed via Settings'],
        availableFrom: 'Immediately',
        portfolioUrl: profileData.portfolio_url || '',
        resumePath: profileData.resume_path || '',
        degreePath: profileData.degree_path || '',
        bio: profileData.bio || ''
    };

    return (
        <div className="space-y-6">
            <Card className="flex flex-col items-center bg-gradient-to-b from-white to-[#F9F7F2]">
                <div className="w-24 h-24 bg-[#2A1F1D] text-white rounded-full flex items-center justify-center text-3xl font-bold mb-4 border-4 border-[#FDFCF8] shadow-lg">
                    {profile.fullName[0]}
                </div>
                <h2 className="text-2xl font-bold font-serif text-[#2A1F1D]">{profile.fullName}</h2>
                <p className="text-[#8C7B70] font-medium capitalize flex items-center gap-1 mt-1">
                    <Construction size={16} /> {profile.role}
                </p>
                <div className="flex items-center gap-1 text-[#E68A2E] mt-3 bg-[#E68A2E]/10 px-4 py-1.5 rounded-full border border-[#E68A2E]/20">
                    <Star size={16} fill="currentColor" />
                    <span className="font-bold text-sm">
                        {profileData.avg_rating > 0 ? `${profileData.avg_rating} Avg Rating` : 'Not Rated'}
                    </span>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <SectionHeader title="Basic Identity" />
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between border-b border-[#E3DACD]/40 pb-3">
                            <span className="text-[#8C7B70] flex items-center gap-2 font-medium"><Phone size={14} /> Mobile</span>
                            <span className="font-bold text-[#2A1F1D]">{profile.mobile}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#E3DACD]/40 pb-3">
                            <span className="text-[#8C7B70] flex items-center gap-2 font-medium"><MapPin size={14} /> Location</span>
                            <span className="font-bold text-[#2A1F1D] text-right max-w-[50%]">{profile.address}</span>
                        </div>
                        <div className="flex justify-between pt-1">
                            <span className="text-[#8C7B70] flex items-center gap-2 font-medium"><Shield size={14} /> ID Status</span>
                            <span className="font-bold text-green-600 flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-lg border border-green-100"><CheckSquare size={14} /> {profile.idStatus}</span>
                        </div>
                    </div>
                </Card>

                <Card>
                    <SectionHeader title="Skills & Availability" />
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between border-b border-[#E3DACD]/40 pb-3">
                            <span className="text-[#8C7B70] flex items-center gap-2 font-medium"><Briefcase size={14} /> Experience</span>
                            <span className="font-bold text-[#2A1F1D]">{profile.experience}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#E3DACD]/40 pb-3">
                            <span className="text-[#8C7B70] flex items-center gap-2 font-medium"><Wrench size={14} /> Main Skill</span>
                            <span className="font-bold text-[#2A1F1D]">{profile.primarySkill}</span>
                        </div>
                    </div>
                </Card>
            </div>

            <Card>
                <SectionHeader title="Professional Documents" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.portfolioUrl && (
                        <a 
                            href={profile.portfolioUrl.startsWith('http') ? profile.portfolioUrl : `https://${profile.portfolioUrl}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-4 bg-white border border-[#E3DACD]/50 rounded-xl flex items-center justify-between hover:border-[#C06842] transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Star size={18} /></div>
                                <span className="text-sm font-bold text-[#2A1F1D]">Project Portfolio</span>
                            </div>
                            <ExternalLink size={16} className="text-[#8C7B70] group-hover:text-[#C06842]" />
                        </a>
                    )}
                    {profile.resumePath && (
                        <a 
                            href={`${import.meta.env.VITE_API_URL}/${profile.resumePath}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-4 bg-white border border-[#E3DACD]/50 rounded-xl flex items-center justify-between hover:border-[#C06842] transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><FileText size={18} /></div>
                                <span className="text-sm font-bold text-[#2A1F1D]">Updated Resume</span>
                            </div>
                            <Download size={16} className="text-[#8C7B70] group-hover:text-[#C06842]" />
                        </a>
                    )}
                     {profile.degreePath && (
                        <a 
                            href={`${import.meta.env.VITE_API_URL}/${profile.degreePath}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-4 bg-white border border-[#E3DACD]/50 rounded-xl flex items-center justify-between hover:border-[#C06842] transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-50 text-green-600 rounded-lg"><FileText size={18} /></div>
                                <span className="text-sm font-bold text-[#2A1F1D]">Qualifying Degree</span>
                            </div>
                            <Download size={16} className="text-[#8C7B70] group-hover:text-[#C06842]" />
                        </a>
                    )}
                </div>
            </Card>

            <Card>
                <SectionHeader title="Expertise & Bio" />
                <div className="space-y-4">
                    <p className="text-sm text-[#6E5E56] italic leading-relaxed bg-[#F9F7F2] p-4 rounded-xl border border-[#E3DACD]/30">
                        {profile.bio || "No professional bio provided yet. Update your details in Settings."}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {profile.subSkills.map((skill, i) => (
                            <span key={i} className="px-3 py-1.5 bg-white text-[#5D4037] text-xs font-bold rounded-xl border border-[#D8CFC4] hover:border-[#C06842] transition-colors">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );
};

import ProjectWorkManager from '../Common/ProjectWorkManager';
import SiteWorkerWorkboard from './SiteWorkerWorkboard';
import ArchitectWorkboard from '../Planning/ArchitectWorkboard';

const statusStyle = {
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Submitted: 'bg-blue-50 text-blue-700 border-blue-200',
    Approved: 'bg-green-50 text-green-700 border-green-200',
    Rejected: 'bg-red-50 text-red-700 border-red-200',
};

const WorkerHome = ({ currentUser, roleType }) => {
    const isArchitectural = ['architect', 'civil_engineer', 'interior_designer'].includes(roleType?.toLowerCase());
    const [invitations, setInvitations] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [submittingTaskId, setSubmittingTaskId] = useState(null);
    const [previewTask, setPreviewTask] = useState(null);
    const [hasCompletedSafetyCheck, setHasCompletedSafetyCheck] = useState(localStorage.getItem('safety_check_done') === new Date().toDateString());
    const fileInputRef = useRef(null);

    const uid = currentUser?.user_id || currentUser?.id;

    const fetchInvitations = useCallback(async () => {
        if (!uid) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/professionals/${uid}/projects`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setInvitations(data.filter(p => p.assignment_status === 'Pending'));
            }
        } catch (err) {
            console.error('Error fetching invitations:', err);
        }
    }, [uid]);

    const fetchTasks = useCallback(async () => {
        if (!uid) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/user/${uid}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` }
            });
            if (res.ok) setTasks(await res.json());
        } catch (err) {
            console.error('Error fetching tasks:', err);
        }
    }, [uid]);

    const handleInvitation = async (projectId, status) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}/assign/${uid}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('planora_token')}`
                },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                fetchInvitations();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to update status');
            }
        } catch (err) {
            console.error('Error handling invitation:', err);
        }
    };

    useEffect(() => {
        fetchInvitations();
        fetchTasks();

        const handleGlobalSearch = (e) => {
            setSearchQuery(e.detail);
        };
        window.addEventListener('planora_search', handleGlobalSearch);
        return () => {
            window.removeEventListener('planora_search', handleGlobalSearch);
        };
    }, [fetchInvitations, fetchTasks]);



    const handleSubmitTask = async (task, file) => {
        if (!file) return;
        setSubmittingTaskId(task.task_id);
        const formData = new FormData();
        formData.append('file', file); // Use generic 'file' field
        formData.append('user_id', uid);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${task.task_id}/submit`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` },
                body: formData
            });
            if (res.ok) {
                setPreviewTask(null);
                fetchTasks();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to submit task');
            }
        } catch (err) {
            console.error('Error submitting task:', err);
        } finally {
            setSubmittingTaskId(null);
        }
    };

    const pendingTasks = tasks.filter(t => t.status === 'Pending' || t.status === 'Rejected');
    const completedTasks = tasks.filter(t => t.status === 'Approved');

    return (
        <div className="space-y-6">


            {/* Header Banner */}
            <div className="glass-panel p-6 rounded-[2rem] shadow-xl relative overflow-hidden text-white">
                <div className={`absolute inset-0 ${isArchitectural ? 'bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A]' : 'bg-gradient-to-br from-[#2A1F1D] to-[#4A342E]'} z-0`} />
                <div className={`absolute top-0 right-0 w-48 h-48 ${isArchitectural ? 'bg-blue-500/10' : 'bg-[#C06842]/20'} rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none`} />
            {/* Project Invitations Section */}
            {invitations.length > 0 && (
                <div className={`rounded-[2rem] p-8 animate-slide-up ${isArchitectural ? 'bg-[#FDFCF8] border-2 border-[#E3DACD]/50 shadow-lg' : 'bg-amber-50/50 border border-amber-100'}`}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className={`${isArchitectural ? 'bg-[#2A1F1D] text-white' : 'bg-amber-100 text-amber-600'} p-3 rounded-2xl shadow-md`}>
                                <Briefcase size={22} />
                            </div>
                            <div>
                                <h3 className="font-bold text-[#2A1F1D] text-lg font-serif">{isArchitectural ? 'Design Proposals' : 'Project Invitations'}</h3>
                                <p className={`text-[10px] uppercase font-black tracking-widest ${isArchitectural ? 'text-[#C06842]' : 'text-amber-600'}`}>New requests to join engineering team</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-white border border-[#E3DACD] rounded-full text-[10px] font-black uppercase text-[#8C7B70] tracking-widest">{invitations.length} Pending</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {invitations.map(inv => (
                            <div key={inv.project_id} className={`p-5 rounded-2xl border transition-all duration-300 group hover:shadow-xl ${isArchitectural ? 'bg-[#F9F7F2]/50 border-[#E3DACD] hover:border-[#C06842]/30' : 'bg-white border-amber-100'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-bold text-[#2A1F1D] text-base group-hover:text-[#C06842] transition-colors">{inv.name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <MapPin size={10} className="text-[#8C7B70]" />
                                            <p className="text-[10px] text-[#8C7B70] font-bold uppercase tracking-widest">{inv.location || 'Site Location'}</p>
                                        </div>
                                    </div>
                                    <div className="text-[8px] bg-red-50 text-red-600 px-2.5 py-1 rounded-lg font-black uppercase tracking-tighter border border-red-100">Action Required</div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleInvitation(inv.project_id, 'Rejected')}
                                        className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 rounded-xl transition-all border border-red-100"
                                    >
                                        Decline
                                    </button>
                                    <button
                                        onClick={() => handleInvitation(inv.project_id, 'Accepted')}
                                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 ${isArchitectural ? 'bg-[#2A1F1D] text-white hover:bg-[#C06842]' : 'bg-[#C06842] text-white hover:bg-[#A65D3B]'}`}
                                    >
                                        Accept Proposal
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
                <div className="relative z-10">
                    <p className={`${isArchitectural ? 'text-blue-400' : 'text-[#E68A2E]'} text-[10px] font-black uppercase tracking-[0.2em] mb-2`}>{currentUser?.role?.replace(/_/g, ' ') || roleType?.replace(/_/g, ' ')}</p>
                    <h1 className="text-3xl font-bold font-serif text-[#FDFCF8]">{isArchitectural ? 'Design Studio' : 'Hello'}, {currentUser?.name?.split(' ')[0]}</h1>
                    <div className="mt-3 flex gap-4 text-[10px] font-black uppercase tracking-widest text-white/40">
                        <span className="flex items-center gap-1.5"><Clock size={12} /> {isArchitectural ? 'Creative Mode' : 'On-Site Mode'}</span>
                        <span className="flex items-center gap-1.5"><Calendar size={12} /> {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="glass-card p-5 rounded-2xl border border-[#E3DACD]/40 shadow-sm text-center group cursor-default">
                    <p className="text-[10px] font-bold uppercase text-[#8C7B70] tracking-widest mb-1">{isArchitectural ? 'Studio Portfolio' : 'My Tasks'}</p>
                    <p className="text-3xl font-bold text-[#2A1F1D] font-serif transition-transform group-hover:scale-110">{isArchitectural ? '12' : tasks.length}</p>
                    {isArchitectural && <p className="text-[8px] font-black text-green-600 mt-1 uppercase tracking-tighter">98% Success score</p>}
                </div>
                <div className="glass-card p-5 rounded-2xl border border-[#E3DACD]/40 shadow-sm text-center group cursor-default">
                    <p className="text-[10px] font-bold uppercase text-[#8C7B70] tracking-widest mb-1">{isArchitectural ? 'Pending Briefs' : 'Queue'}</p>
                    <p className={`text-3xl font-bold ${isArchitectural ? 'text-[#2A1F1D]' : 'text-amber-600'} font-serif transition-transform group-hover:scale-110`}>{pendingTasks.length}</p>
                </div>
                <div className="glass-card p-5 rounded-2xl border border-[#E3DACD]/40 shadow-sm text-center group cursor-default">
                    <p className="text-[10px] font-bold uppercase text-[#8C7B70] tracking-widest mb-1">{isArchitectural ? 'Active Designs' : 'Done'}</p>
                    <p className="text-3xl font-bold text-green-600 font-serif transition-transform group-hover:scale-110">{isArchitectural ? projects.length : completedTasks.length}</p>
                </div>
            </div>

            {/* MY TASKS SECTION */}
            <div className="glass-card p-6 rounded-2xl border border-[#E3DACD]/40">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold font-serif text-[#2A1F1D] flex items-center gap-2">
                        <ClipboardList size={20} className="text-[#C06842]" /> My Assigned Tasks
                    </h3>
                    {tasks.filter(t => t.status === 'Submitted').length > 0 && (
                        <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                            {tasks.filter(t => t.status === 'Submitted').length} Submitted
                        </span>
                    )}
                </div>

                {tasks.length === 0 ? (
                    <div className="text-center py-12 opacity-40">
                        <ClipboardList size={36} className="mx-auto mb-3 text-[#8C7B70]" />
                        <p className="font-bold text-sm">No tasks assigned yet</p>
                        <p className="text-xs mt-1">Your contractor will assign tasks to you</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tasks.filter(t => !searchQuery || t.title?.toLowerCase().includes(searchQuery.toLowerCase()) || t.project_name?.toLowerCase().includes(searchQuery.toLowerCase())).map(task => (
                            <div key={task.task_id} className={`rounded-2xl border p-4 transition-all ${task.status === 'Rejected' ? 'bg-red-50/40 border-red-200' : task.status === 'Approved' ? 'bg-green-50/40 border-green-200' : task.status === 'Submitted' ? 'bg-blue-50/40 border-blue-200' : 'bg-[#FDFCF8] border-[#E3DACD]/50'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-[#2A1F1D] text-sm">{task.title}</h4>
                                            {(task.status === 'Pending' || task.status === 'Rejected') && (
                                                <span className="flex items-center gap-1 text-[7px] font-black uppercase bg-[#C06842]/10 text-[#C06842] px-2 py-0.5 rounded-full border border-[#C06842]/20"><Camera size={8} /> Evidence Required</span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-[#C06842] font-bold uppercase tracking-widest mt-0.5">{task.project_name} • {task.location || 'Site'}</p>
                                        <p className="text-[10px] text-[#8C7B70] font-bold mt-1">Assigner: {task.assigner_name}</p>
                                        {task.description && <p className="text-xs text-[#6E5E56] mt-1.5 italic">"{task.description}"</p>}
                                        {task.due_date && (
                                            <p className="text-xs text-[#8C7B70] mt-1 flex items-center gap-1">
                                                <Calendar size={11} /> Due: {new Date(task.due_date).toLocaleDateString()}
                                            </p>
                                        )}
                                        {task.rejection_reason && (
                                            <p className="text-xs text-red-600 mt-2 bg-red-50 rounded-lg px-3 py-1.5 border border-red-100">❌ Rejection note: {task.rejection_reason}</p>
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ml-3 shrink-0 ${statusStyle[task.status]}`}>{task.status}</span>
                                </div>

                                {task.image_path && task.status !== 'Pending' && (
                                    <div className="mt-3 rounded-xl overflow-hidden border border-[#E3DACD] shadow-sm mb-3 group/img cursor-pointer relative">
                                        <img src={`${import.meta.env.VITE_API_URL}/${task.image_path}`} alt="Submitted" className="w-full h-48 object-cover transition-transform group-hover/img:scale-105" />
                                        <div className="absolute bottom-0 left-0 right-0 bg-[#F9F7F2]/90 backdrop-blur-sm py-1.5 border-t border-[#E3DACD]">
                                            <p className="text-[10px] text-[#8C7B70] font-bold uppercase text-center tracking-widest">Site photo submitted</p>
                                        </div>
                                    </div>
                                )}

                                {/* Submit button - only for Pending or Rejected tasks */}
                                {(task.status === 'Pending' || task.status === 'Rejected') && (
                                    <div>
                                        {!hasCompletedSafetyCheck && (
                                            <div className="mb-2 p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-3 animate-pulse">
                                                <AlertTriangle size={14} />
                                                <span className="text-[9px] font-black uppercase tracking-tight text-left">Safety Check Required before submission</span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            className="hidden"
                                            id={`file-${task.task_id}`}
                                            disabled={!hasCompletedSafetyCheck}
                                            onChange={(e) => {
                                                if (e.target.files[0]) {
                                                    setPreviewTask({ task, file: e.target.files[0] });
                                                }
                                            }}
                                        />
                                        <label
                                            htmlFor={`file-${task.task_id}`}
                                            className={`w-full mt-2 flex items-center justify-center gap-2 py-2.5 bg-[#2A1F1D] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#C06842] transition-all cursor-pointer shadow-md ${!hasCompletedSafetyCheck ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                                        >
                                            <Camera size={16} /> {task.status === 'Rejected' ? 'Resubmit with Photo' : 'Mark Complete + Upload Photo'}
                                        </label>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ProjectWorkManager */}
            <ProjectWorkManager currentUser={currentUser} />

            {/* Safety */}
            <Card className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-red-100 transition-colors">
                <div className="flex items-center gap-3">
                    <AlertTriangle size={24} className="group-hover:scale-110 transition-transform" />
                    <div>
                        <p className="font-bold text-xs uppercase tracking-widest">Safety or Technical Issue?</p>
                        <p className="text-[10px] opacity-70">Report emergencies or conflicts immediately</p>
                    </div>
                </div>
                <ChevronRight size={18} />
            </Card>

            {/* Photo Submission Preview Modal */}
            {previewTask && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#2A1F1D]/80 backdrop-blur-lg">
                    <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-xl font-serif text-[#2A1F1D]">Confirm Submission</h3>
                            <button onClick={() => setPreviewTask(null)} className="p-2 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"><XCircle size={22} /></button>
                        </div>
                        <div className="rounded-2xl overflow-hidden border border-[#E3DACD] shadow mb-4">
                            <img src={URL.createObjectURL(previewTask.file)} alt="Preview" className="w-full h-48 object-cover" />
                        </div>
                        <p className="text-sm font-bold text-[#2A1F1D] mb-1">{previewTask.task.title}</p>
                        <p className="text-xs text-[#8C7B70] mb-6">This photo will be sent to your contractor for approval.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setPreviewTask(null)} className="flex-1 py-3 border border-[#E3DACD] text-[#8C7B70] rounded-xl font-bold hover:bg-[#F9F7F2] transition-colors">Cancel</button>
                            <button
                                onClick={() => handleSubmitTask(previewTask.task, previewTask.file)}
                                disabled={submittingTaskId === previewTask.task.task_id}
                                className="flex-1 py-3 bg-[#C06842] text-white rounded-xl font-bold hover:bg-[#A65D3B] transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Upload size={16} />
                                {submittingTaskId === previewTask.task.task_id ? 'Submitting...' : 'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Safety Declaration Modal */}
            {!hasCompletedSafetyCheck && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-[#2A1F1D]/90 backdrop-blur-md">
                    <motion.div 
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-white rounded-[4rem] w-full max-w-lg p-12 shadow-3xl text-center"
                    >
                        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce">
                            <Shield size={40} />
                        </div>
                        <h2 className="text-3xl font-serif font-black text-[#2A1F1D] mb-4 uppercase tracking-tighter">Daily Safety Protocol</h2>
                        <p className="text-[#8C7B70] text-sm mb-8 leading-relaxed font-medium capitalize">
                            Before proceeding to site tasks as a <span className="text-[#C06842] font-black">{currentUser?.sub_category || 'Professional'}</span>, please verify compliance:
                        </p>
                        <div className="space-y-4 mb-10">
                            {[
                                'I am equipped with mandatory trade-specific PPE.',
                                'I have inspected tools and they are in safe working order.',
                                'I am aware of today\'s site-specific hazards & fire exits.'
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 bg-[#F9F7F2] p-5 rounded-2xl border border-[#E3DACD]/40 text-left">
                                    <div className="w-6 h-6 rounded-full bg-[#C06842] flex items-center justify-center text-white shrink-0"><Check size={14} /></div>
                                    <p className="text-[11px] font-black text-[#2A1F1D] uppercase tracking-wide leading-tight">{item}</p>
                                </div>
                            ))}
                        </div>
                        <Button 
                            variant="primary" 
                            size="lg" 
                            className="w-full py-6 text-base" 
                            onClick={() => {
                                setHasCompletedSafetyCheck(true);
                                localStorage.setItem('safety_check_done', new Date().toDateString());
                            }}
                        >
                            Confirm & Access Workboard
                        </Button>
                        <p className="mt-6 text-[9px] text-[#8C7B70] font-black uppercase tracking-widest opacity-60">Compliance data is logged with headquarters.</p>
                    </motion.div>
                </div>
            )}
        </div>
    );
};



const WorkerDashboard = ({ roleType }) => {
    const { currentUser } = useMockApp();
    const [activeTab, setActiveTab] = useState('workboard');

    return (
        <div className="max-w-md mx-auto md:max-w-4xl font-sans pb-24 min-h-screen bg-[#FDFCF8]">

            <div className="p-4 md:p-6 animate-fade-in">
                {activeTab === 'home' && <WorkerHome currentUser={currentUser} roleType={roleType} />}
                {activeTab === 'workboard' && (
                    roleType === 'architect' 
                    ? <ArchitectWorkboard currentUser={currentUser} /> 
                    : <SiteWorkerWorkboard currentUser={currentUser} />
                )}
                {activeTab === 'profile' && <WorkerProfile currentUser={currentUser} />}
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-[#E3DACD] p-2 pb-5 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] z-50 md:hidden">
                <div className="flex justify-around items-center">
                    <button
                        onClick={() => setActiveTab('home')}
                        className={`flex flex-col items-center p-2 rounded-xl transition-all w-16 ${activeTab === 'home' ? 'text-[#C06842] bg-[#C06842]/10' : 'text-[#B8AFA5] hover:bg-[#F9F7F2]'}`}
                    >
                        <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
                        <span className="text-[10px] font-bold mt-1">Home</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('workboard')}
                        className={`flex flex-col items-center p-2 rounded-xl transition-all w-16 ${activeTab === 'workboard' ? 'text-[#C06842] bg-[#C06842]/10' : 'text-[#B8AFA5] hover:bg-[#F9F7F2]'}`}
                    >
                        <LayoutGrid size={24} strokeWidth={activeTab === 'workboard' ? 2.5 : 2} />
                        <span className="text-[10px] font-bold mt-1">WorkBoard</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex flex-col items-center p-2 rounded-xl transition-all w-16 ${activeTab === 'profile' ? 'text-[#C06842] bg-[#C06842]/10' : 'text-[#B8AFA5] hover:bg-[#F9F7F2]'}`}
                    >
                        <User size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
                        <span className="text-[10px] font-bold mt-1">Profile</span>
                    </button>
                </div>
            </div>

        </div>
    );
};

export default WorkerDashboard;
