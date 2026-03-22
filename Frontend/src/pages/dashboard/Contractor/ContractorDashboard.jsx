import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMockApp } from '../../../hooks/useMockApp';
import {
    HardHat, Clock, CheckCircle, FileText,
    MapPin, XCircle, Briefcase, TrendingUp, Award, Star,
    Target, BarChart3, Construction, LayoutGrid, PenTool, Check, Layers, ArrowUpRight, ChevronRight,
    ClipboardList, Hammer, Shield, PieChart, ImageIcon
} from 'lucide-react';
import ProfilePromptModal from '../../../components/dashboard/Common/ProfilePromptModal';
import RatingModal from '../../../components/dashboard/Common/RatingModal';
import SiteWorkboard from '../Site/SiteWorkboard';
import { motion, AnimatePresence } from 'framer-motion';

// Shared Components
import Card from '../../../components/Common/Card';
import Button from '../../../components/Common/Button';
import SectionHeader from '../../../components/Common/SectionHeader';

const ProjectLifecycle = ({ project, onUpdatePhase }) => {
    const phases = [
        { id: 'planning', label: '1. Planning', weight: 30, icon: LayoutGrid, completed: project.planning_completed },
        { id: 'design', label: '2. Design', weight: 30, icon: PenTool, completed: project.design_completed, dependsOn: 'planning_completed' },
        { id: 'execution', label: '3. Execution', weight: 40, icon: Construction, completed: project.execution_completed, dependsOn: 'design_completed' }
    ];

    return (
        <Card className="mb-12" variant="glass">
            <SectionHeader 
                title="Project Phases" 
                subtitle="Manage project milestones"
                action={<div className="text-[8px] font-black uppercase text-[#C06842] bg-[#C06842]/5 px-4 py-2 rounded-full border border-[#C06842]/10 tracking-[0.2em]">Phase Management</div>}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {phases.map(phase => {
                    const isLocked = phase.dependsOn && !project[phase.dependsOn];
                    const Icon = phase.icon;
                    return (
                        <div key={phase.id} className={`p-5 rounded-[2rem] border-2 transition-all duration-500 flex flex-col items-center text-center space-y-4 ${
                            phase.completed ? 'bg-green-50/40 border-green-200 shadow-sm' : isLocked ? 'bg-[#FDFCF8]/30 border-transparent opacity-50 grayscale cursor-not-allowed' : 'bg-white border-[#C06842]/10 shadow-sm hover:border-[#C06842]/30'
                        }`}>
                            <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center transition-all duration-500 shadow-lg ${
                                phase.completed ? 'bg-green-600 text-white rotate-6' : isLocked ? 'bg-[#E3DACD]/50 text-[#8C7B70]' : 'bg-[#C06842] text-white hover:rotate-6 shadow-xl shadow-[#C06842]/20'
                            }`}>
                                {phase.completed ? <Check size={22} /> : <Icon size={20} />}
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-serif font-bold text-[#2A1F1D] text-base">{phase.label}</h4>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#C06842]">{phase.weight}% Completion</p>
                            </div>
                            <Button
                                size="md"
                                variant={phase.completed ? 'ghost' : isLocked ? 'outline' : 'primary'}
                                disabled={isLocked || project.status === 'Completed'}
                                onClick={() => onUpdatePhase(project.project_id, phase.id, !phase.completed)}
                                className="w-full"
                            >
                                {phase.completed ? 'Reopen' : isLocked ? 'Locked' : 'Mark Completed'}
                            </Button>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

const ContractorDashboard = () => {
    const navigate = useNavigate();
    const { currentUser, setAuthUser } = useMockApp();
    const [projects, setProjects] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isProfilePromptOpen, setIsProfilePromptOpen] = useState(false);
    const [ratingProject, setRatingProject] = useState(null);

    const fetchData = useCallback(async () => {
        if (!currentUser?.user_id && !currentUser?.id) { setLoading(false); return; }
        const uid = currentUser.user_id || currentUser.id;
        setLoading(true);
        try {
            const headers = { 'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}` };
            const [projRes, profileRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/api/professionals/${uid}/projects`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/api/user/${uid}`, { headers })
            ]);

            if (projRes.ok) {
                const projData = await projRes.json();
                setInvitations(projData.filter(p => p.assignment_status === 'Pending'));
                // Include EVERYTHING that isn't Rejected/Removed.
                setProjects(projData.filter(p => p.assignment_status !== 'Rejected'));
            }

            if (profileRes.ok) {
                setProfile(await profileRes.json());
            }

            if (!currentUser.profile_completed && !localStorage.getItem('profile_prompt_dismissed')) {
                setIsProfilePromptOpen(true);
            }
        } catch (err) { console.error('Error fetching contractor data:', err); }
        finally { setLoading(false); }
    }, [currentUser]);

    useEffect(() => { 
        fetchData(); 
        const handleGlobalSearch = (e) => {
            setSearchQuery(e.detail);
        };
        window.addEventListener('planora_search', handleGlobalSearch);
        return () => {
            window.removeEventListener('planora_search', handleGlobalSearch);
        };
    }, [fetchData]);

    const handlePhaseUpdate = async (projectId, phase, completed) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}/phases`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}`
                },
                body: JSON.stringify({ phase, completed })
            });
            if (res.ok) fetchData();
            else { const err = await res.json(); alert(err.error || 'Failed to update phase'); }
        } catch (err) { console.error(err); }
    };

    const handleInvitationResponse = async (projectId, status) => {
        const uid = currentUser.user_id || currentUser.id;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}/assign/${uid}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}` },
                body: JSON.stringify({ status })
            });
            if (res.ok) fetchData();
        } catch (err) { console.error(err); }
    };

    const activeProjectPipelines = useMemo(() => projects.filter(p => p.status !== 'Completed'), [projects]);
    const completedProjectsCount = useMemo(() => projects.filter(p => p.status === 'Completed').length, [projects]);
    const pendingRatings = useMemo(() => projects.filter(p => p.status === 'Completed' && !p.has_rated), [projects]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-vh-screen space-y-6 bg-[#FDFCF8]">
            <div className="w-14 h-14 border-[5px] border-[#C06842]/10 border-t-[#C06842] rounded-full animate-spin" />
            <p className="text-[#8C7B70] font-black uppercase text-[11px] tracking-[0.4em]">Loading Dashboard...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-16 pb-24 pt-10 font-sans text-[#2A1F1D]">
            {isProfilePromptOpen && (
                <ProfilePromptModal currentUser={currentUser} onSave={(u) => { setAuthUser(u); setIsProfilePromptOpen(false); window.location.reload(); }} onCancel={() => { setIsProfilePromptOpen(false); localStorage.setItem('profile_prompt_dismissed', 'true'); }} />
            )}

            <RatingModal 
                isOpen={!!ratingProject} 
                onClose={() => setRatingProject(null)} 
                project={ratingProject} 
                currentUser={currentUser} 
                onComplete={() => {
                    setRatingProject(null);
                    fetchData();
                }}
            />

            {/* Premium Analytics Profile Header */}
            <Card variant="dark" className="relative p-10 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#C06842]/10 rounded-full blur-[140px] -mr-48 -mt-48 opacity-60 animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-16">
                    <div className="flex items-center space-x-12">
                        <div className="relative group shrink-0">
                            <div className="absolute -inset-1.5 bg-gradient-to-r from-[#C06842] to-[#E68A2E] rounded-[1.8rem] blur opacity-40 group-hover:opacity-75 transition duration-1000"></div>
                            <div className="relative w-28 h-28 rounded-[1.5rem] p-1.5 bg-[#2A1F1D] border border-white/10 overflow-hidden">
                                <img src={`https://ui-avatars.com/api/?name=${currentUser?.name}&background=C06842&color=fff&size=256`} alt="Contractor" className="w-full h-full rounded-[1.2rem] object-cover shadow-2xl" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="h-[1px] w-6 bg-[#C06842]" />
                                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#C06842]">Overview</span>
                            </div>
                            <h1 className="text-4xl font-serif font-black tracking-tight leading-none mb-2">{currentUser?.name}</h1>
                            <div className="flex flex-wrap items-center gap-5 text-[10px] font-black uppercase tracking-[0.2em] text-[#8C7B70]">
                                <span className="bg-white/5 px-4 py-2 rounded-full border border-white/10 text-white/80">{currentUser?.sub_category || 'Contractor'}</span>
                                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Platform Verified</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full lg:max-w-xl">
                        {[
                            { label: 'Active Projects', value: activeProjectPipelines.length, icon: Target },
                            { label: 'Completed', value: completedProjectsCount, icon: Award, color: 'text-emerald-400' },
                            { label: 'Avg Rating', value: profile?.avg_rating > 0 ? profile.avg_rating : 'Not Rated', icon: Star, color: 'text-amber-400' }
                        ].map((stat, idx) => {
                            const Icon = stat.icon;
                            return (
                                <div key={idx} className="p-5 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center justify-center group hover:bg-white/10 transition-all">
                                    <div className={`text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-2 text-[#8C7B70] group-hover:text-white transition-colors`}>
                                        <Icon size={12} /> {stat.label}
                                    </div>
                                    <p className={`text-3xl font-serif font-black ${stat.color || 'text-[#C06842]'}`}>{stat.value}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Card>

            {/* Invitations Alert */}
            {invitations.length > 0 && (
                <Card className="bg-[#C06842]/5 border-[#C06842]/20 flex flex-col md:flex-row items-center justify-between gap-8 py-10">
                    <div className="flex items-center gap-6 text-left">
                        <div className="w-14 h-14 bg-[#C06842] text-white rounded-[1.2rem] flex items-center justify-center shadow-2xl relative shrink-0">
                            <Briefcase size={28} />
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-white text-[#C06842] rounded-full flex items-center justify-center text-[9px] font-black">{invitations.length}</div>
                        </div>
                        <div>
                            <h3 className="font-serif text-2xl font-black text-[#2A1F1D] tracking-tight mb-1">New Invitations</h3>
                            <p className="text-[10px] text-[#8C7B70] font-black uppercase tracking-[0.1em] max-w-md">You have {invitations.length} new project invitations.</p>
                        </div>
                    </div>
                    <Button variant="primary" icon={ChevronRight} onClick={() => navigate('/dashboard/notifications')}>View Invitations</Button>
                </Card>
            )}

            {/* Ratings Pending Alert */}
            {pendingRatings.length > 0 && (
                <Card className="bg-amber-50 border-amber-200 py-10 flex flex-col md:flex-row items-center justify-between gap-8 group">
                    <div className="flex items-center gap-6 text-left">
                        <div className="w-14 h-14 bg-amber-500 text-white rounded-[1.2rem] flex items-center justify-center shadow-lg relative shrink-0">
                            <Star size={28} />
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-white text-amber-500 rounded-full border-2 border-amber-500 flex items-center justify-center text-[10px] font-black">{pendingRatings.length}</div>
                        </div>
                        <div>
                            <h3 className="font-serif text-2xl font-black text-[#2A1F1D] tracking-tight mb-1">Peer Ratings Requested</h3>
                            <p className="text-[10px] text-[#8C7B70] font-black uppercase tracking-[0.1em] max-w-md">The project cycle for {pendingRatings.length} project(s) is complete. Please rate the performance of your collaborators.</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {pendingRatings.map(p => (
                            <Button key={p.project_id} size="md" variant="primary" onClick={() => setRatingProject(p)}>Rate Team for {p.name}</Button>
                        ))}
                    </div>
                </Card>
            )}
            <div className="space-y-32">
                {activeProjectPipelines.filter(p => !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.location?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                    <div className="py-48 text-center bg-white/40 border border-dashed border-[#E3DACD] rounded-[5rem] backdrop-blur-sm relative group">
                        <BarChart3 size={80} className="mx-auto text-[#E3DACD] mb-8 group-hover:scale-110 transition-transform duration-1000" strokeWidth={0.5} />
                        <h2 className="text-4xl font-serif font-black text-[#2A1F1D] mb-4 tracking-tight text-center">No Matching Projects</h2>
                        <p className="text-[#8C7B70] max-w-sm mx-auto font-medium leading-relaxed text-center">No projects found matching your search: "{searchQuery}"</p>
                    </div>
                ) : (
                    activeProjectPipelines
                        .filter(p => !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.location?.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(project => {
                        const progressPercent = (
                            (project.planning_completed ? 30 : 0) +
                            (project.design_completed ? 30 : 0) +
                            (project.execution_completed ? 40 : 0)
                        );
                        return (
                            <motion.div 
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                key={project.project_id} 
                                className="space-y-12"
                            >
                                {/* Strategic Site Header */}
                                <div className="flex flex-col md:flex-row justify-between items-end gap-10 px-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <span className="w-12 h-12 bg-[#2A1F1D] text-[#C06842] rounded-2xl flex items-center justify-center shadow-xl"><Layers size={22} /></span>
                                            <div>
                                                <div className="flex items-center gap-4 mb-2">
                                                    <h2 className="text-3xl font-serif font-black text-[#2A1F1D] tracking-tight uppercase leading-none">{project.name}</h2>
                                                    <span className="text-[8px] font-black uppercase text-[#C06842] bg-[#C06842]/5 border border-[#C06842]/10 px-3 py-1.5 rounded-full tracking-[0.22em]">{project.assigned_role || 'Project Lead'}</span>
                                                </div>
                                                <p className="text-[11px] text-[#8C7B70] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                                                    <MapPin size={12} className="text-[#C06842]" /> {project.location} • <span className="text-[#2A1F1D]">Client: {project.client_name || 'Land Owner'}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full max-w-md space-y-3">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[9px] font-black uppercase text-[#8C7B70] tracking-[0.2em]">Project Progress</span>
                                            <span className="text-2xl font-serif font-black text-[#2A1F1D]">{progressPercent}%</span>
                                        </div>
                                        <div className="h-4 w-full bg-[#E3DACD]/20 rounded-full border border-[#E3DACD]/50 p-1 backdrop-blur-md overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${progressPercent}%` }}
                                                className="h-full bg-gradient-to-r from-amber-600 to-[#C06842] rounded-full shadow-lg"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 text-left">
                                    <div className="lg:col-span-3 space-y-12">
                                        <ProjectLifecycle project={project} onUpdatePhase={handlePhaseUpdate} />
                                        
                                        <Card className="p-2" variant="glass">
                                            <div className="p-8 border-b border-[#E3DACD]/20">
                                                <SectionHeader 
                                                    title="Workboard" 
                                                    subtitle="Manage project tasks"
                                                    action={<div className="text-[9px] font-black uppercase text-[#C06842] bg-[#F9F7F2] px-3 py-2 rounded-full border border-[#E3DACD]/50">Live</div>}
                                                />
                                            </div>
                                            <SiteWorkboard currentUser={currentUser} projectId={project.project_id} hideCompleted={true} />
                                        </Card>
                                    </div>

                                    <div className="space-y-12">
                                        <Card variant="dark" className="group">
                                            <SectionHeader title="Quick Actions" className="mb-10" />
                                            <div className="space-y-4">
                                                <Button icon={Hammer} className="w-full py-6" onClick={() => navigate(`/dashboard/project/${project.project_id}`)}>Project Details</Button>
                                                <Button variant="secondary" icon={ClipboardList} className="w-full py-6" onClick={() => navigate(`/dashboard/project/${project.project_id}`)}>Project Logs</Button>
                                            </div>
                                        </Card>

                                        <Card variant="flat" className="backdrop-blur-md">
                                            <SectionHeader title="Project Resources" subtitle="Quick access to project data" />
                                            <div className="space-y-4">
                                                {[
                                                    { icon: ImageIcon, label: 'Photos', sub: 'Site Photos' },
                                                    { icon: PieChart, label: 'Stats', sub: 'Burn Rates' },
                                                    { icon: Shield, label: 'Safety', sub: 'Safety Protocols' }
                                                ].map((res, idx) => {
                                                    const Icon = res.icon;
                                                    return (
                                                        <button key={idx} className="w-full p-5 bg-white rounded-2xl border border-[#E3DACD]/60 hover:border-[#C06842] text-left transition-all group flex items-center justify-between active:scale-95">
                                                            <div className="flex items-center gap-4">
                                                                <div className="shrink-0 group-hover:scale-110 transition-transform"><Icon size={18} className="text-[#C06842]" /></div>
                                                                <div>
                                                                    <p className="text-[11px] font-black uppercase tracking-widest text-[#2A1F1D]">{res.label}</p>
                                                                    <p className="text-[9px] text-[#8C7B70] uppercase font-bold tracking-tighter">{res.sub}</p>
                                                                </div>
                                                            </div>
                                                            <ArrowUpRight size={12} className="text-[#E3DACD] group-hover:text-[#C06842] transition-colors" />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </Card>
                                    </div>
                                </div>
                                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#E3DACD]/50 to-transparent my-24" />
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ContractorDashboard;
