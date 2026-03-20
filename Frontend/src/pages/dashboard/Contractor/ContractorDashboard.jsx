import React, { useState, useEffect, useCallback } from 'react';
import { useMockApp } from '../../../hooks/useMockApp';
import {
    HardHat, Clock, CheckCircle, FileText,
    MapPin, Plus, ArrowLeft, XCircle, Briefcase,
    TrendingUp, ArrowUpRight, Star, AlertOctagon, Eye, Image as ImageIcon,
    ClipboardList, ChevronDown, Check, X, AlertTriangle, Trash2, Calendar, ExternalLink, PieChart
} from 'lucide-react';
import ExpertMap from '../../../components/dashboard/Client/ExpertMap';
import ProfilePromptModal from '../../../components/dashboard/Common/ProfilePromptModal';

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

const statusColor = {
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Submitted: 'bg-blue-50 text-blue-700 border-blue-200',
    Approved: 'bg-green-50 text-green-700 border-green-200',
    Rejected: 'bg-red-50 text-red-700 border-red-200',
};

const ProgressBar = ({ percent, label }) => (
    <div>
        <div className="flex justify-between mb-2 text-xs font-bold">
            <span className="text-[#6E5E56]">{label}</span>
            <span className="text-[#C06842]">{percent}%</span>
        </div>
        <div className="w-full bg-[#E3DACD]/30 h-3 rounded-full overflow-hidden">
            <div
                className="h-full bg-gradient-to-r from-[#C06842] to-[#E68A2E] rounded-full shadow-[0_0_10px_rgba(192,104,66,0.3)] transition-all duration-1000"
                style={{ width: `${percent}%` }}
            />
        </div>
    </div>
);

const ContractorOverview = () => {
    const { currentUser, setAuthUser } = useMockApp();
    const [projects, setProjects] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [activeProject, setActiveProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [projectTeam, setProjectTeam] = useState([]);
    const [isProfilePromptOpen, setIsProfilePromptOpen] = useState(false);

    // Task state
    const [tasks, setTasks] = useState([]);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [taskForm, setTaskForm] = useState({ assigned_to: '', title: '', description: '', due_date: '' });
    const [isSubmittingTask, setIsSubmittingTask] = useState(false);
    const [reviewingTask, setReviewingTask] = useState(null);
    const [reviewForm, setReviewForm] = useState({ status: '', rejection_reason: '', due_date: '' });

    // Pending reviews (site progress + docs)
    const [pendingReviews, setPendingReviews] = useState({ progress: [], docs: [] });

    // Rating State
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [teamRatings, setTeamRatings] = useState({});
    const [isSubmittingRating, setIsSubmittingRating] = useState(false);

    // -------------------------------------------------------------------------
    // Fetchers
    // -------------------------------------------------------------------------

    const fetchTasks = useCallback(async () => {
        if (!activeProject) { setTasks([]); return; }
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${activeProject.project_id}/tasks`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` }
            });
            if (res.ok) setTasks(await res.json());
        } catch (err) {
            console.error('Error fetching tasks:', err);
        }
    }, [activeProject]);

    const fetchPendingReviews = useCallback(async () => {
        if (!activeProject) { setPendingReviews({ progress: [], docs: [] }); return; }
        try {
            const [progRes, docsRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/api/site-progress/${activeProject.project_id}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` }
                }),
                fetch(`${import.meta.env.VITE_API_URL}/api/documents/project/${activeProject.project_id}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` }
                })
            ]);
            if (progRes.ok && docsRes.ok) {
                const progData = await progRes.json();
                const docsData = await docsRes.json();
                setPendingReviews({
                    progress: progData.filter(p => p.status === 'Pending'),
                    docs: docsData.filter(d => d.status === 'Pending')
                });
            }
        } catch (err) {
            console.error("Error fetching pending reviews:", err);
        }
    }, [activeProject]);

    const fetchData = useCallback(async () => {
        if (!currentUser?.user_id && !currentUser?.id) { setLoading(false); return; }
        const uid = currentUser.user_id || currentUser.id;
        setLoading(true);
        try {
            const projRes = await fetch(`${import.meta.env.VITE_API_URL}/api/professionals/${uid}/projects`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` }
            });
            if (projRes.ok) {
                const projData = await projRes.json();
                const pendingInvs = projData.filter(p => p.assignment_status === 'Pending');
                const activeProjs = projData.filter(p => !p.assignment_status || p.assignment_status === 'Accepted');
                setInvitations(pendingInvs);
                setProjects(activeProjs);
                const projToFetch = activeProject || activeProjs[0];
                if (projToFetch) {
                    if (!activeProject || !activeProjs.find(p => p.project_id === activeProject.project_id)) {
                        setActiveProject(projToFetch);
                    }
                    const teamRes = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${projToFetch.project_id}/team`, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` }
                    });
                    if (teamRes.ok) setProjectTeam(await teamRes.json());
                } else {
                    setActiveProject(null);
                    setProjectTeam([]);
                }
            }

            if (!currentUser.profile_completed && !localStorage.getItem('profile_prompt_dismissed')) {
                setIsProfilePromptOpen(true);
            }
        } catch (err) {
            console.error('Error fetching contractor data:', err);
        } finally {
            setLoading(false);
        }
    }, [currentUser, activeProject]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { fetchPendingReviews(); fetchTasks(); }, [fetchPendingReviews, fetchTasks]);

    // -------------------------------------------------------------------------
    // Handlers
    // -------------------------------------------------------------------------

    const handleAssignTask = async (e) => {
        e.preventDefault();
        if (!taskForm.assigned_to || !taskForm.title) return;
        setIsSubmittingTask(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${activeProject.project_id}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` },
                body: JSON.stringify({
                    assigned_by: currentUser.user_id || currentUser.id,
                    assigned_to: taskForm.assigned_to,
                    title: taskForm.title,
                    description: taskForm.description,
                    due_date: taskForm.due_date
                })
            });
            if (res.ok) {
                setIsAssignModalOpen(false);
                setTaskForm({ assigned_to: '', title: '', description: '', due_date: '' });
                fetchTasks();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to assign task');
            }
        } catch (err) {
            console.error('Error assigning task:', err);
        } finally {
            setIsSubmittingTask(false);
        }
    };

    const handleTaskReview = async () => {
        if (!reviewingTask || !reviewForm.status) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${reviewingTask.task_id}/review`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` },
                body: JSON.stringify({
                    status: reviewForm.status,
                    rejection_reason: reviewForm.rejection_reason,
                    due_date: reviewForm.due_date,
                    reviewer_id: currentUser.user_id || currentUser.id
                })
            });
            if (res.ok) {
                setReviewingTask(null);
                setReviewForm({ status: '', rejection_reason: '', due_date: '' });
                fetchTasks();
                fetchPendingReviews(); // Refresh if site progress was created
            }
            else { const err = await res.json(); alert(err.error || 'Failed to review task'); }
        } catch (err) {
            console.error('Error reviewing task:', err);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Delete this task?')) return;
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${taskId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` }
            });
            fetchTasks();
        } catch (err) {
            console.error('Error deleting task:', err);
        }
    };

    const handleReviewAction = async (sourceType, id, status) => {
        let rejection_reason = '';
        if (status === 'Rejected') {
            rejection_reason = window.prompt("Enter rejection reason:");
            if (rejection_reason === null) return;
        }
        try {
            let url;
            // Use the correct endpoint based on where the item originated
            if (sourceType === 'progress' || sourceType === 'SITE_PHOTO') {
                url = `${import.meta.env.VITE_API_URL}/api/site-progress/${id}/review`;
            } else if (sourceType === 'task' || sourceType === 'TASK_PROOF') {
                url = `${import.meta.env.VITE_API_URL}/api/tasks/${id}/review`;
            } else {
                url = `${import.meta.env.VITE_API_URL}/api/documents/${id}/status`;
            }

            const res = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('planora_token')}`
                },
                body: JSON.stringify({ 
                    status, 
                    rejection_reason, 
                    contractor_id: currentUser.user_id || currentUser.id,
                    reviewer_id: currentUser.user_id || currentUser.id // For task review route
                })
            });
            if (res.ok) {
                fetchPendingReviews();
                if (sourceType === 'task' || sourceType === 'TASK_PROOF') fetchTasks();
            } else { 
                const err = await res.json(); 
                alert(err.error || "Failed to update status"); 
            }
        } catch (err) {
            console.error("Review error:", err);
        }
    };



    const handlePhaseUpdate = async (phase, completed) => {
        if (!activeProject) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${activeProject.project_id}/phases`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}`
                },
                body: JSON.stringify({ phase, completed })
            });

            if (res.ok) {
                const updatedProj = await res.json();
                setActiveProject(updatedProj);
                fetchData();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to update phase');
            }
        } catch (err) {
            console.error('Error updating phase:', err);
        }
    };

    const handleRemoveMember = async (memberId, memberName) => {
        if (!window.confirm(`Remove ${memberName}?`)) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${activeProject.project_id}/team/${memberId}`, { method: 'DELETE' });
            if (res.ok) fetchData();
        } catch (err) { console.error("Error removing team member:", err); }
    };

    const handleRatingChange = (userId, ratingValue) => setTeamRatings(prev => ({ ...prev, [userId]: ratingValue }));

    const handleSubmitRatings = async () => {
        setIsSubmittingRating(true);
        try {
            const raterId = currentUser.user_id || currentUser.id;
            const ratingsArray = Object.entries(teamRatings).filter(([_, r]) => r > 0).map(([userId, rating]) => ({ rated_user_id: userId, rating }));
            if (!ratingsArray.length) { alert("Please provide at least one rating."); setIsSubmittingRating(false); return; }
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${activeProject.project_id}/rate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rater_id: raterId, ratings: ratingsArray })
            });
            if (res.ok) { setIsRatingModalOpen(false); setTeamRatings({}); }
        } catch (error) { console.error("Ratings error:", error); } finally { setIsSubmittingRating(false); }
    };

    const handleInvitationResponse = async (projectId, status) => {
        try {
            const uid = currentUser.user_id || currentUser.id;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}/assign/${uid}/status`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                fetchData();
            } else {
                const err = await res.json();
                alert(err.error || `Failed to ${status} invitation`);
            }
        } catch (err) {
            console.error('Error responding to invitation:', err);
        }
    };

    // -------------------------------------------------------------------------
    // Derived
    // -------------------------------------------------------------------------

    const totalTasks = tasks.length;
    const approvedTasks = tasks.filter(t => t.status === 'Approved').length;
    const submittedTasks = tasks.filter(t => t.status === 'Submitted').length;
    const progress = activeProject ? (
        (activeProject.planning_completed ? 30 : 0) +
        (activeProject.design_completed ? 30 : 0) +
        (activeProject.execution_completed ? 40 : 0)
    ) : 0;
    const totalPendingReviews = pendingReviews.progress.length + pendingReviews.docs.length;

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="w-12 h-12 border-4 border-[#A65D3B]/20 border-t-[#A65D3B] rounded-full animate-spin" />
            <p className="text-[#8C7B70] font-bold tracking-widest uppercase text-xs">Initializing Contractor Workspace...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 font-sans text-[#2A1F1D]">
            {isProfilePromptOpen && (
                <ProfilePromptModal 
                    currentUser={currentUser} 
                    onSave={(updated) => {
                        setAuthUser(updated);
                        setIsProfilePromptOpen(false);
                        window.location.reload(); 
                    }}
                    onCancel={() => {
                        setIsProfilePromptOpen(false);
                        localStorage.setItem('profile_prompt_dismissed', 'true');
                    }}
                />
            )}



            {/* Header */}
            <div className="glass-panel rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-500 border border-[#E3DACD]">
                <div className="absolute right-0 top-0 w-80 h-80 bg-[#C06842]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
                    <div className="flex items-center space-x-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-[#2A1F1D] to-[#C06842] rounded-2xl flex items-center justify-center text-white shadow-lg">
                            <HardHat size={40} />
                        </div>
                        <div>
                            <p className="text-[#8C7B70] text-xs font-bold tracking-widest uppercase mb-1">Contractor Workspace</p>
                            <h1 className="text-4xl font-bold text-[#2A1F1D] font-serif">Welcome, {currentUser?.name || "Contractor"}</h1>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-[#E3DACD] text-center shadow-sm">
                            <p className="text-[10px] text-[#8C7B70] font-bold uppercase tracking-widest">Active Sites</p>
                            <p className="text-2xl font-serif font-bold text-[#2A1F1D]">{projects.length}</p>
                        </div>
                        {activeProject && (
                            <div className="bg-white/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-[#E3DACD] text-center shadow-sm">
                                <p className="text-[10px] text-[#8C7B70] font-bold uppercase tracking-widest">Task Progress</p>
                                <p className="text-2xl font-serif font-bold text-[#C06842]">{progress}%</p>
                            </div>
                        )}
                        {submittedTasks > 0 && (
                            <div className="bg-blue-50 px-6 py-3 rounded-2xl border border-blue-200 text-center shadow-sm animate-pulse">
                                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Awaiting Review</p>
                                <p className="text-2xl font-serif font-bold text-blue-700">{submittedTasks}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left - Projects + Tasks */}
                <div className="lg:col-span-2 space-y-8">

                    {/* QUICK STATS & PORTFOLIO */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-gradient-to-br from-[#FDFCF8] to-[#F9F7F2] border-[#E3DACD]">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                                    <Briefcase size={24} />
                                </div>
                                <h4 className="font-bold text-[#2A1F1D]">Project Portfolio</h4>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[#8C7B70]">Total Projects Managed</span>
                                    <span className="font-black text-[#2A1F1D]">{projects.length}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[#8C7B70]">Completed Sites</span>
                                    <span className="font-black text-green-600">{projects.filter(p => p.status === 'Completed').length}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[#8C7B70]">Active Construction</span>
                                    <span className="font-black text-blue-600">{projects.filter(p => p.status !== 'Completed').length}</span>
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-gradient-to-br from-[#FDFCF8] to-[#F9F7F2] border-[#E3DACD]">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                                    <ClipboardList size={24} />
                                </div>
                                <h4 className="font-bold text-[#2A1F1D]">Quality Oversight</h4>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[#8C7B70]">Critical Submissions</span>
                                    <span className="font-black text-red-600">{totalPendingReviews}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[#8C7B70]">Overall Success Rate</span>
                                    <span className="font-black text-[#C06842]">94%</span>
                                </div>
                                <a href="/dashboard/tasks" className="block w-full py-2 bg-[#2A1F1D] text-white text-[10px] font-black uppercase tracking-widest text-center rounded-lg hover:bg-[#C06842] transition-all">Go to Task Hub</a>
                            </div>
                        </Card>
                    </div>

                    {/* INVITATIONS PENDING */}
                    {invitations.length > 0 && (
                        <Card className="border-blue-100 bg-blue-50/20">
                            <SectionHeader
                                title="Project Invitations"
                                action={<span className="text-[10px] font-black uppercase text-blue-600 bg-blue-100 px-3 py-1 rounded-full">{invitations.length} Pending</span>}
                            />
                            <div className="space-y-4">
                                {invitations.map(inv => (
                                    <div key={inv.project_id} className="p-4 bg-white rounded-2xl border border-blue-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div>
                                            <h3 className="font-bold text-lg font-serif text-[#2A1F1D]">{inv.name}</h3>
                                            <p className="text-xs text-[#8C7B70] mt-1 line-clamp-2">{inv.description || "No description provided."}</p>
                                            <div className="flex gap-2 mt-2">
                                                <span className="text-[10px] uppercase font-black text-[#C06842]">{inv.assigned_role}</span>
                                                {inv.location && <span className="text-[10px] uppercase font-black text-[#8C7B70]">• {inv.location}</span>}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleInvitationResponse(inv.project_id, 'Rejected')} className="py-2 px-4 text-red-600 hover:bg-red-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors border border-transparent hover:border-red-200">Decline</button>
                                            <button onClick={() => handleInvitationResponse(inv.project_id, 'Accepted')} className="py-2 px-6 bg-[#2A1F1D] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#C06842] transition-all shadow-md">Accept</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* PROJECT NAVIGATOR */}
                    <Card>
                        <SectionHeader
                            title="Construction Pipeline"
                            action={
                                <div className="flex items-center gap-4">
                                    <p className="text-[10px] font-black text-[#8C7B70] uppercase">Selected: {activeProject?.name || 'None'}</p>
                                </div>
                            }
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {projects.length === 0 ? (
                                <div className="col-span-2 text-center py-16 opacity-50">
                                    <Briefcase size={40} className="mx-auto mb-2 text-[#8C7B70]" />
                                    <p className="text-sm font-bold">No projects assigned yet</p>
                                </div>
                            ) : projects.map(project => (
                                <div
                                    key={project.project_id}
                                    onClick={() => setActiveProject(project)}
                                    className={`p-6 rounded-3xl border cursor-pointer transition-all ${activeProject?.project_id === project.project_id ? 'bg-[#2A1F1D] text-white border-transparent shadow-xl scale-[1.02]' : 'bg-white border-[#E3DACD]/40 hover:border-[#C06842]/20 hover:bg-[#FDFCF8]'}`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="min-w-0">
                                            <h3 className={`font-bold text-lg font-serif truncate ${activeProject?.project_id === project.project_id ? 'text-white' : 'text-[#2A1F1D]'}`}>{project.name}</h3>
                                            <p className={`text-[10px] flex items-center gap-1 mt-1 font-bold uppercase tracking-wider ${activeProject?.project_id === project.project_id ? 'text-white/60' : 'text-[#8C7B70]'}`}>
                                                <MapPin size={10} className={activeProject?.project_id === project.project_id ? 'text-[#C06842]' : 'text-[#C06842]'} /> {project.location || 'Site Location'}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${activeProject?.project_id === project.project_id ? 'bg-white/10 border-white/20' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                            {project.status || 'Active'}
                                        </span>
                                    </div>

                                    {activeProject?.project_id === project.project_id && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                                                <div className="flex justify-between mb-1.5 items-center">
                                                    <span className="text-[10px] font-bold uppercase text-white/60">Construction Phases</span>
                                                    <div className="flex gap-1">
                                                        <div className={`w-2 h-2 rounded-full ${project.planning_completed ? 'bg-green-500' : 'bg-white/20'}`}></div>
                                                        <div className={`w-2 h-2 rounded-full ${project.design_completed ? 'bg-green-500' : 'bg-white/20'}`}></div>
                                                        <div className={`w-2 h-2 rounded-full ${project.execution_completed ? 'bg-green-500' : 'bg-white/20'}`}></div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between mb-1.5">
                                                    <span className="text-[10px] font-bold uppercase text-white/60">Site Progress</span>
                                                    <span className="text-[10px] font-black text-[#C06842]">{progress}%</span>
                                                </div>
                                                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#C06842] rounded-full" style={{ width: `${progress}%` }} />
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-3 gap-1">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handlePhaseUpdate('planning', !project.planning_completed); }}
                                                    className={`py-1 rounded text-[8px] font-black uppercase ${project.planning_completed ? 'bg-green-600' : 'bg-white/10 hover:bg-white/20'}`}
                                                >
                                                    Planning
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handlePhaseUpdate('design', !project.design_completed); }}
                                                    disabled={!project.planning_completed}
                                                    className={`py-1 rounded text-[8px] font-black uppercase ${project.design_completed ? 'bg-green-600' : 'bg-white/10 hover:bg-white/20'} ${!project.planning_completed ? 'opacity-30 cursor-not-allowed' : ''}`}
                                                >
                                                    Design
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handlePhaseUpdate('execution', !project.execution_completed); }}
                                                    disabled={!project.design_completed}
                                                    className={`py-1 rounded text-[8px] font-black uppercase ${project.execution_completed ? 'bg-green-600' : 'bg-white/10 hover:bg-white/20'} ${!project.design_completed ? 'opacity-30 cursor-not-allowed' : ''}`}
                                                >
                                                    Execution
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between text-[10px] font-black uppercase border-t border-white/10 pt-2 mt-2">
                                                <span className="text-white/60">Team Size: {projectTeam.length}</span>
                                                {project.execution_completed && project.status !== 'Completed' && (
                                                    <button onClick={(e) => { e.stopPropagation(); handleCompleteProject(); }} className="text-[#C06842] hover:text-white transition-colors">Mark Project Complete</button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Pending Site Progress & Doc Reviews */}
                    {totalPendingReviews > 0 && (
                        <Card className="border-amber-100 bg-amber-50/20">
                            <SectionHeader
                                title="Pending Team Submissions"
                                action={<span className="text-[10px] font-black uppercase text-amber-600 bg-amber-100 px-3 py-1 rounded-full">{totalPendingReviews} Awaiting Review</span>}
                            />
                            <div className="space-y-4">
                                {pendingReviews.progress.map(p => (
                                    <div key={p.progress_id} className="p-4 bg-white rounded-2xl border border-amber-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex gap-4 items-start">
                                            <div className="w-16 h-16 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 overflow-hidden border border-amber-200 relative group/img">
                                                {p.image_path ? (
                                                    <>
                                                        <img src={`${import.meta.env.VITE_API_URL}/${p.image_path}`} alt="Progress" className="w-full h-full object-cover" />
                                                        <a
                                                            href={`${import.meta.env.VITE_API_URL}/${p.image_path}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-opacity"
                                                        >
                                                            <ExternalLink size={16} />
                                                        </a>
                                                    </>
                                                ) : <ImageIcon size={24} />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-[#2A1F1D]">Site Progress Update</h4>
                                                <p className="text-xs text-[#8C7B70] mt-1 italic">"{p.note}"</p>
                                                <div className="flex gap-2 mt-2">
                                                    <span className="text-[10px] uppercase font-black text-amber-500">{p.alert_type}</span>
                                                    <span className="text-[10px] uppercase font-black text-[#8C7B70]">• {new Date(p.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleReviewAction('progress', p.progress_id, 'Rejected')} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"><XCircle size={20} /></button>
                                            <button onClick={() => handleReviewAction('progress', p.progress_id, 'Approved')} className="py-2 px-6 bg-[#2A1F1D] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#C06842] transition-all">Approve</button>
                                        </div>
                                    </div>
                                ))}
                                {pendingReviews.docs.map(d => (
                                    <div key={d.doc_id} className="p-4 bg-white rounded-2xl border border-amber-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex gap-4 items-start">
                                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100"><FileText size={24} /></div>
                                            <div>
                                                <h4 className="font-bold text-sm text-[#2A1F1D]">{d.name}</h4>
                                                <p className="text-[10px] text-[#8C7B70] uppercase font-bold tracking-tighter">{d.file_type} • {d.file_size}</p>
                                                <a href={`${import.meta.env.VITE_API_URL}/${d.file_path.replace(/\\/g, '/')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-black text-blue-600 mt-2 uppercase tracking-widest hover:underline">
                                                    <Eye size={12} /> Preview
                                                </a>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleReviewAction(d.source_type, d.doc_id, 'Rejected')} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"><XCircle size={20} /></button>
                                            <button onClick={() => handleReviewAction(d.source_type, d.doc_id, 'Approved')} className="py-2 px-6 bg-[#2A1F1D] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#C06842] transition-all">Approve</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>

                {/* Right - Team + Tools */}
                <div className="space-y-8">
                    <Card>
                        <SectionHeader
                            title="Site Team"
                            action={
                                <button onClick={() => setIsDiscoveryOpen(true)} className="w-8 h-8 flex items-center justify-center bg-[#2A1F1D] text-white rounded-full hover:bg-[#C06842] transition-colors shadow-lg">
                                    <Plus size={16} />
                                </button>
                            }
                        />
                        <div className="space-y-4">
                            {projectTeam.filter(m => m.status === 'Accepted').length > 0 ? projectTeam.filter(m => m.status === 'Accepted').map(member => (
                                <div key={member.user_id} className="flex items-center space-x-4 p-3 bg-[#FDFCF8] border border-[#E3DACD]/30 rounded-2xl hover:bg-white transition-all group">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E3DACD] to-[#FDFCF8] flex items-center justify-center font-bold text-[#5D4037] border border-[#E3DACD]">
                                        {member.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm text-[#2A1F1D] flex items-center gap-2">
                                            {member.name}
                                        </p>
                                        <p className="text-[10px] uppercase text-[#8C7B70] font-bold tracking-tight">{member.assigned_role || member.sub_category}</p>
                                    </div>
                                    <button onClick={() => handleRemoveMember(member.user_id, member.name)} className="p-2 text-[#8C7B70] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                        <XCircle size={18} />
                                    </button>
                                </div>
                            )) : (
                                <div className="text-center py-8 opacity-50">
                                    <Briefcase size={32} className="mx-auto mb-2 text-[#8C7B70]" />
                                    <p className="text-xs font-bold">No active experts on team</p>
                                </div>
                            )}
                            <button onClick={() => setIsDiscoveryOpen(true)} className="w-full py-4 mt-4 bg-[#F9F7F2] border-2 border-dashed border-[#E3DACD] rounded-2xl text-xs font-black text-[#5D4037] uppercase tracking-widest hover:border-[#C06842] hover:bg-white transition-all flex items-center justify-center gap-2">
                                <MapPin size={16} className="text-[#C06842]" /> Find Sub-Experts
                            </button>
                        </div>
                    </Card>

                    <Card className="bg-[#2A1F1D] text-white border-none overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#C06842]/20 rounded-full blur-2xl -mr-16 -mt-16" />
                        <SectionHeader title="Project Tools" />
                        <div className="grid grid-cols-2 gap-3 relative z-10">
                            <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all text-left">
                                <FileText size={20} className="mb-2 text-[#C06842]" />
                                <p className="text-[10px] font-bold uppercase tracking-wider">Reports</p>
                            </button>
                            <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all text-left">
                                <Clock size={20} className="mb-2 text-[#E68A2E]" />
                                <p className="text-[10px] font-bold uppercase tracking-wider">Timeline</p>
                            </button>
                        </div>
                    </Card>
                </div>
            </div>

            {/* ================================================================ */}
            {/* ASSIGN TASK MODAL */}
            {/* ================================================================ */}
            {isAssignModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2A1F1D]/70 backdrop-blur-md">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg p-10 shadow-2xl">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-serif font-bold text-[#2A1F1D]">Assign Task</h2>
                                <p className="text-xs text-[#8C7B70] mt-1">Project: <strong>{activeProject?.name}</strong></p>
                            </div>
                            <button onClick={() => setIsAssignModalOpen(false)} className="p-2 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"><XCircle size={24} /></button>
                        </div>
                        <form onSubmit={handleAssignTask} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-[#8C7B70] uppercase mb-2">Assign To *</label>
                                <select
                                    required
                                    className="w-full bg-[#F9F7F2] border border-[#E3DACD] rounded-xl px-4 py-3 text-sm font-medium focus:border-[#C06842] outline-none transition-colors"
                                    value={taskForm.assigned_to}
                                    onChange={e => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                                >
                                    <option value="">-- Select team member --</option>
                                    {projectTeam.map(m => (
                                        <option key={m.user_id} value={m.user_id}>
                                            {m.name} ({m.assigned_role || m.sub_category}) {m.status === 'Pending' ? '[PENDING ACCEPTANCE]' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#8C7B70] uppercase mb-2">Task Title *</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. Pour concrete slab on Ground Floor"
                                    className="w-full bg-[#F9F7F2] border border-[#E3DACD] rounded-xl px-4 py-3 text-sm focus:border-[#C06842] outline-none transition-colors"
                                    value={taskForm.title}
                                    onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#8C7B70] uppercase mb-2">Description</label>
                                <textarea
                                    rows={3}
                                    placeholder="Additional instructions or context..."
                                    className="w-full bg-[#F9F7F2] border border-[#E3DACD] rounded-xl px-4 py-3 text-sm focus:border-[#C06842] outline-none transition-colors resize-none"
                                    value={taskForm.description}
                                    onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#8C7B70] uppercase mb-2">Due Date</label>
                                <input
                                    type="date"
                                    className="w-full bg-[#F9F7F2] border border-[#E3DACD] rounded-xl px-4 py-3 text-sm focus:border-[#C06842] outline-none transition-colors"
                                    value={taskForm.due_date}
                                    onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-4 pt-2">
                                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="flex-1 py-3 text-[#8C7B70] font-bold hover:text-[#2A1F1D] transition-colors">Cancel</button>
                                <button type="submit" disabled={isSubmittingTask} className="flex-1 bg-[#C06842] text-white py-3 rounded-xl font-bold hover:bg-[#A65D3B] transition-all shadow-lg disabled:opacity-50">
                                    {isSubmittingTask ? 'Assigning...' : 'Assign Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================================================================ */}
            {/* REVIEW TASK PHOTO MODAL */}
            {/* ================================================================ */}
            {reviewingTask && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#2A1F1D]/80 backdrop-blur-lg">
                    <div className="bg-white rounded-[2rem] w-full max-w-xl p-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-serif font-bold text-[#2A1F1D]">Review Submission</h2>
                                <p className="text-xs text-[#8C7B70] mt-1 uppercase tracking-widest font-bold">Task: {reviewingTask.title}</p>
                            </div>
                            <button onClick={() => setReviewingTask(null)} className="p-2 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"><XCircle size={24} /></button>
                        </div>

                        <div className="flex gap-4 mb-6">
                            <button
                                onClick={() => setReviewForm({ ...reviewForm, status: 'Approved' })}
                                className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${reviewForm.status === 'Approved' ? 'bg-green-600 text-white shadow-lg' : 'bg-green-50 text-green-700 border border-green-100'}`}
                            >
                                <Check size={16} /> Approve
                            </button>
                            <button
                                onClick={() => setReviewForm({ ...reviewForm, status: 'Rejected' })}
                                className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${reviewForm.status === 'Rejected' ? 'bg-red-600 text-white shadow-lg' : 'bg-red-50 text-red-700 border border-red-100'}`}
                            >
                                <X size={16} /> Reject
                            </button>
                        </div>

                        {reviewingTask.image_path && (
                            <div className="mb-6 space-y-3">
                                <div className="rounded-2xl overflow-hidden border border-[#E3DACD] shadow-md max-h-48">
                                    <img
                                        src={`${import.meta.env.VITE_API_URL}/${reviewingTask.image_path}`}
                                        alt="Site photo"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                    <div className="hidden h-32 bg-[#F9F7F2] items-center justify-center flex-col gap-2 text-[#8C7B70]">
                                        <FileText size={40} />
                                        <p className="text-xs font-bold uppercase tracking-widest">Document File</p>
                                    </div>
                                </div>
                                <a
                                    href={`${import.meta.env.VITE_API_URL}/${reviewingTask.image_path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-4 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-blue-100 transition-all"
                                >
                                    <ExternalLink size={16} /> Open Proof Document
                                </a>
                            </div>
                        )}

                        {reviewForm.status === 'Rejected' ? (
                            <div className="space-y-4 mb-6 animate-fade-in">
                                <div>
                                    <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-2">Reason for Rejection *</label>
                                    <textarea
                                        required
                                        className="w-full bg-[#F9F7F2] border border-[#E3DACD] rounded-xl px-4 py-3 text-sm focus:border-red-400 outline-none transition-all resize-none"
                                        rows={3}
                                        placeholder="Identify what needs to be fixed..."
                                        value={reviewForm.rejection_reason}
                                        onChange={e => setReviewForm({ ...reviewForm, rejection_reason: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-2">New Due Date *</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full bg-[#F9F7F2] border border-[#E3DACD] rounded-xl px-4 py-3 text-sm focus:border-red-400 outline-none transition-all"
                                        value={reviewForm.due_date}
                                        onChange={e => setReviewForm({ ...reviewForm, due_date: e.target.value })}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="bg-[#F9F7F2] rounded-xl p-4 mb-6 space-y-2">
                                <p className="text-xs font-bold text-[#8C7B70] uppercase">Assignee Note</p>
                                <p className="text-sm text-[#2A1F1D] italic">"{reviewingTask.description || 'No notes provided'}"</p>
                                <p className="text-xs text-[#8C7B70]">Submitted by: <strong>{reviewingTask.assignee_name}</strong></p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button onClick={() => setReviewingTask(null)} className="flex-1 py-4 text-[#8C7B70] font-bold text-sm hover:text-[#2A1F1D] transition-colors">
                                Wait, go back
                            </button>
                            <button
                                onClick={handleTaskReview}
                                disabled={reviewForm.status === 'Rejected' && (!reviewForm.rejection_reason || !reviewForm.due_date)}
                                className={`flex-[2] py-4 rounded-2xl font-bold text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50 ${reviewForm.status === 'Rejected' ? 'bg-red-600 text-white' : 'bg-[#2A1F1D] text-white'}`}
                            >
                                Confirm {reviewForm.status}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Discovery Map Overlay */}
            {isDiscoveryOpen && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-[#1a1412]/80 backdrop-blur-md">
                    <div className="relative w-full max-w-6xl h-[80vh] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-[#E3DACD]/40 flex justify-between items-center bg-[#FDFCF8]">
                            <h2 className="text-2xl font-serif font-bold">Expert Discovery</h2>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setIsDiscoveryOpen(false)} className="flex items-center gap-2 px-6 py-2.5 bg-[#2A1F1D] text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[#C06842] transition-all shadow-md active:scale-95">
                                    <ArrowLeft size={16} /> Back to Dashboard
                                </button>
                                <button onClick={() => setIsDiscoveryOpen(false)} className="p-2 text-[#8C7B70] hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
                                    <XCircle size={28} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1">
                            <ExpertMap
                                currentProjectId={activeProject?.project_id}
                                subCategory={selectedRole}
                                siteLocation={activeProject?.location || "India"}
                                onAssign={() => { fetchData(); setIsDiscoveryOpen(false); }}
                                onClose={() => setIsDiscoveryOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Rating Modal */}
            {isRatingModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2A1F1D]/60 backdrop-blur-md overflow-y-auto">
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl p-10 shadow-2xl my-8">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-3xl font-serif font-bold text-[#2A1F1D]">Project Completed! 🎉</h2>
                                <p className="text-[#8C7B70] mt-1">Rate the professionals who worked on this project.</p>
                            </div>
                            <button onClick={() => setIsRatingModalOpen(false)} className="text-[#8C7B70] hover:text-[#C06842] transition-colors"><XCircle size={28} /></button>
                        </div>
                        {projectTeam.length === 0 ? (
                            <div className="text-center py-10 bg-[#F9F7F2] rounded-2xl border border-dashed border-[#E3DACD]">
                                <p className="text-[#8C7B70] font-medium">No team members assigned.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                {projectTeam.map(member => (
                                    <div key={member.user_id} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-[#F9F7F2] rounded-xl border border-[#E3DACD]">
                                        <div className="flex items-center gap-4 w-full sm:w-auto mb-4 sm:mb-0">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E3DACD] to-[#C06842] text-white flex items-center justify-center font-bold text-lg shadow-inner">{member.name.charAt(0)}</div>
                                            <div>
                                                <h4 className="font-bold text-[#2A1F1D] text-lg">{member.name}</h4>
                                                <p className="text-xs font-bold text-[#8C7B70] uppercase tracking-wider">{member.assigned_role || member.sub_category}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 justify-end">
                                            {[...Array(5)].map((_, i) => (
                                                <button key={i} type="button" onClick={() => handleRatingChange(member.user_id, i + 1)} className={`focus:outline-none transition-all hover:scale-110 ${teamRatings[member.user_id] > i ? 'text-[#F59E0B]' : 'text-[#E3DACD]'}`} title={`${i + 1} Star${i > 0 ? 's' : ''}`}>
                                                    <Star fill={teamRatings[member.user_id] > i ? 'currentColor' : 'none'} size={24} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mt-8 flex justify-end gap-4 border-t border-[#E3DACD]/50 pt-6">
                            <button onClick={() => setIsRatingModalOpen(false)} className="px-6 py-3 font-bold text-[#8C7B70] hover:text-[#2A1F1D] transition-colors">Skip</button>
                            <button onClick={handleSubmitRatings} disabled={projectTeam.length === 0 || isSubmittingRating} className="px-8 py-3 bg-[#C06842] text-white font-bold rounded-xl shadow-lg hover:bg-[#A65D3B] hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center gap-2">
                                {isSubmittingRating ? 'Submitting...' : 'Submit Ratings'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractorOverview;
