import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMockApp } from '../../../hooks/useMockApp';
import {
    Plus, HardHat, FileText, MapPin, 
    XCircle, Construction, Check, LayoutGrid, PenTool,
    Search, ChevronRight, Award, Shield, Layers, Users
} from 'lucide-react';
import ProfilePromptModal from '../../../components/dashboard/Common/ProfilePromptModal';
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
                subtitle="Monitor your project progress"
                action={<div className="text-[9px] font-black uppercase text-[#C06842] bg-[#C06842]/5 px-6 py-2.5 rounded-full border border-[#C06842]/10 tracking-[0.2em]">Phase Weighting</div>}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
                {phases.map(phase => {
                    const isLocked = phase.dependsOn && !project[phase.dependsOn];
                    const Icon = phase.icon;
                    return (
                        <div key={phase.id} className={`p-8 rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col items-center text-center space-y-6 ${
                            phase.completed ? 'bg-green-50/40 border-green-200 shadow-sm' : isLocked ? 'bg-[#FDFCF8]/30 border-transparent opacity-50 grayscale cursor-not-allowed' : 'bg-white border-[#C06842]/10 shadow-sm hover:border-[#C06842]/30'
                        }`}>
                            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 shadow-lg ${
                                phase.completed ? 'bg-green-600 text-white rotate-6' : isLocked ? 'bg-[#E3DACD]/50 text-[#8C7B70]' : 'bg-[#2A1F1D] text-white hover:rotate-6'
                            }`}>
                                {phase.completed ? <Check size={28} /> : <Icon size={24} />}
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-serif font-bold text-[#2A1F1D] text-lg">{phase.label}</h4>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C06842]">{phase.weight}% Weight</p>
                            </div>
                            <Button
                                size="md"
                                variant={phase.completed ? 'ghost' : isLocked ? 'outline' : 'primary'}
                                disabled={isLocked || project.status === 'Completed'}
                                onClick={() => onUpdatePhase(project.project_id, phase.id, !phase.completed)}
                                className="w-full"
                            >
                                {phase.completed ? 'Reopen' : isLocked ? 'Phase Locked' : 'Mark Completed'}
                            </Button>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

const LandOwnerDashboard = () => {
    const navigate = useNavigate();
    const { currentUser, setAuthUser } = useMockApp();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', type: 'Residential', location: '', budget: '', land_id: '' });
    const [lands, setLands] = useState([]);
    const [isProfilePromptOpen, setIsProfilePromptOpen] = useState(false);

    const fetchData = useCallback(async () => {
        if (!currentUser?.id && !currentUser?.user_id) { setLoading(false); return; }
        setLoading(true);
        try {
            const userId = currentUser.id || currentUser.user_id;
            const headers = { 'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}` };
            const [projRes, landRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/api/projects/user/${userId}`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/api/lands/user/${userId}`, { headers })
            ]);
            
            if (projRes.ok) setProjects(await projRes.json());
            if (landRes.ok) setLands(await landRes.json());

            if (!currentUser.profile_completed && !localStorage.getItem('profile_prompt_dismissed')) {
                setIsProfilePromptOpen(true);
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => { fetchData(); }, [fetchData]);

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

    const handleCreateProject = async (e) => {
        e.preventDefault();
        const userId = currentUser.user_id || currentUser.id;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}`
                },
                body: JSON.stringify({ owner_id: userId, ...newProject })
            });
            if (res.ok) { fetchData(); setIsCreateModalOpen(false); }
            else { const err = await res.json(); alert(err.error || 'Failed to create project'); }
        } catch (err) { console.error(err); }
    };

    const activeProjects = useMemo(() => projects.filter(p => p.status !== 'Completed'), [projects]);

        <div className="flex flex-col items-center justify-center min-vh-screen space-y-6 bg-[#FDFCF8]">
            <div className="w-14 h-14 border-[5px] border-[#C06842]/10 border-t-[#C06842] rounded-full animate-spin" />
            <p className="text-[#8C7B70] font-black uppercase text-[11px] tracking-[0.4em]">Loading Dashboard...</p>
        </div>

    return (
        <div className="max-w-7xl mx-auto space-y-24 pb-32 pt-16 font-sans text-[#2A1F1D]">
            {isProfilePromptOpen && (
                <ProfilePromptModal currentUser={currentUser} onSave={(u) => { setAuthUser(u); setIsProfilePromptOpen(false); window.location.reload(); }} onCancel={() => { setIsProfilePromptOpen(false); localStorage.setItem('profile_prompt_dismissed', 'true'); }} />
            )}

            {/* Premium Portfolio Header */}
            <div className="relative p-16 rounded-[4rem] overflow-hidden bg-white border border-[#E3DACD]/50 shadow-2xl">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#E68A2E]/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-[#C06842]/5 rounded-full blur-[100px]" />
                
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
                    <div className="flex items-center space-x-10">
                        <div className="relative group shrink-0">
                            <div className="absolute -inset-1 bg-gradient-to-r from-[#C06842] to-[#2A1F1D] rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative w-32 h-32 rounded-[1.8rem] p-1.5 bg-white border border-[#E3DACD]">
                                <img src={`https://ui-avatars.com/api/?name=${currentUser?.name}&background=2A1F1D&color=fff&size=200`} alt="Owner" className="w-full h-full rounded-[1.4rem] object-cover" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="h-[1px] w-8 bg-[#C06842]" />
                                <span className="text-[10px] font-black font-sans uppercase tracking-[0.4em] text-[#C06842]">Overview</span>
                            </div>
                            <h1 className="text-6xl font-serif font-black text-[#2A1F1D] tracking-tight leading-none mb-1">Land Owner Dashboard</h1>
                            <div className="flex items-center space-x-6 text-[11px] font-black uppercase tracking-[0.1em] text-[#8C7B70]">
                                <span className="flex items-center gap-2 tracking-[0.05em]"><LayoutGrid size={14} /> {activeProjects.length} Active Projects</span>
                                <span className="w-1.5 h-1.5 bg-[#E3DACD] rounded-full" />
                                <span className="flex items-center gap-2 italic">{currentUser?.email}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Button icon={Users} variant="secondary" onClick={() => navigate('/dashboard/find-pros')}>Find Professionals</Button>
                        <Button icon={Plus} variant="primary" onClick={() => setIsCreateModalOpen(true)}>Create Project</Button>
                    </div>
                </div>
            </div>

            {/* Active Assets Feed */}
            <div className="space-y-32">
                {activeProjects.length === 0 ? (
                    <div className="py-48 text-center bg-white/40 border border-dashed border-[#E3DACD] rounded-[5rem] backdrop-blur-sm relative group overflow-hidden">
                        <div className="relative z-10">
                            <Layers size={80} className="mx-auto text-[#E3DACD] mb-8 group-hover:scale-110 transition-transform duration-1000" strokeWidth={0.5} />
                            <h2 className="text-4xl font-serif font-black text-[#2A1F1D] mb-4 tracking-tight">No Projects Yet</h2>
                            <p className="text-[#8C7B70] max-w-sm mx-auto mb-12 font-medium leading-relaxed">You haven't started any projects. Create your first project to begin building.</p>
                            <Button icon={ChevronRight} size="lg" onClick={() => setIsCreateModalOpen(true)}>Create First Project</Button>
                        </div>
                    </div>
                ) : (
                    activeProjects.map(project => {
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
                                {/* Asset Card Identity */}
                                <div className="flex flex-col md:flex-row justify-between items-end gap-10 px-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <span className="w-14 h-14 bg-[#2A1F1D] text-[#C06842] rounded-2.5xl flex items-center justify-center shadow-xl"><Construction size={28} /></span>
                                            <div>
                                                <h2 className="text-5xl font-serif font-black text-[#2A1F1D] tracking-tight uppercase leading-none">{project.name}</h2>
                                                <p className="text-[11px] text-[#8C7B70] font-black uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
                                                    <MapPin size={12} className="text-[#C06842]" /> {project.location} • {project.type} Delivery
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full max-w-md space-y-3">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-black uppercase text-[#8C7B70] tracking-[0.2em]">Overall Progress</span>
                                            <span className="text-3xl font-serif font-black text-[#2A1F1D]">{progressPercent}%</span>
                                        </div>
                                        <div className="h-4 w-full bg-[#E3DACD]/20 rounded-full border border-[#E3DACD]/50 p-1 backdrop-blur-md overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${progressPercent}%` }}
                                                className="h-full bg-gradient-to-r from-[#D98B6C] to-[#C06842] rounded-full shadow-lg"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                                    <div className="lg:col-span-3 space-y-12">
                                        <ProjectLifecycle project={project} onUpdatePhase={handlePhaseUpdate} />
                                        
                                        <Card className="p-2" variant="glass">
                                            <div className="p-8 border-b border-[#E3DACD]/20">
                                                <SectionHeader 
                                                    title="Tasks & Updates" 
                                                    subtitle="Manage your project tasks"
                                                    action={<div className="text-[9px] font-black uppercase text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">Live</div>}
                                                />
                                            </div>
                                            <SiteWorkboard currentUser={currentUser} projectId={project.project_id} hideCompleted={true} />
                                        </Card>
                                    </div>

                                    <div className="space-y-12">
                                        <Card variant="dark" className="group relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C06842]/20 blur-[60px] rounded-full group-hover:translate-x-4 transition-transform duration-1000" />
                                            <SectionHeader 
                                                title="Project Team" 
                                                action={<Award size={24} className="text-[#C06842]" />}
                                            />
                                            <div className="space-y-8">
                                                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                                    <p className="text-[10px] font-black text-[#C06842] uppercase tracking-[0.3em] mb-4">Prime Contractor</p>
                                                    <div className="flex items-center gap-4 font-sans">
                                                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center font-bold">C</div>
                                                        <div>
                                                            <p className="text-base font-serif font-bold">Lead Contractor</p>
                                                            <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Verified Professional</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button size="lg" className="w-full" onClick={() => navigate('/dashboard/expert-discovery')}>Find Experts</Button>
                                            </div>
                                        </Card>

                                        <Card variant="flat" className="backdrop-blur-md">
                                            <SectionHeader title="Site Registry" subtitle="Asset documentation hub" />
                                            <div className="grid grid-cols-1 gap-4">
                                                {[
                                                    { icon: FileText, label: 'Blueprints', sub: 'Technical Drafting' },
                                                    { icon: Shield, label: 'Compliance Hub', sub: 'Certifications' }
                                                ].map((ext, idx) => {
                                                    const Icon = ext.icon;
                                                    return (
                                                        <button key={idx} className="p-6 bg-white rounded-3xl border border-[#E3DACD]/60 hover:border-[#C06842] text-left transition-all active:scale-95 flex items-center gap-4">
                                                            <div className="shrink-0"><Icon size={20} className="text-[#C06842]" /></div>
                                                            <div>
                                                                <p className="text-[11px] font-black uppercase tracking-widest text-[#2A1F1D]">{ext.label}</p>
                                                                <p className="text-[9px] text-[#8C7B70] uppercase font-bold tracking-tighter">{ext.sub}</p>
                                                            </div>
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

            {/* Project Initiation Overlay */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#2A1F1D]/80 backdrop-blur-xl"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-[4rem] w-full max-w-xl p-16 shadow-3xl border border-white/20 relative"
                        >
                            <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-10 right-10 p-3 rounded-full hover:bg-[#F9F7F2] transition-colors"><XCircle size={32} className="text-[#E3DACD]" /></button>
                            <SectionHeader title="New Project" subtitle="Create a new construction project" />
                            <form onSubmit={handleCreateProject} className="space-y-8">
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-[0.3em]">Project Title</label>
                                    <input required type="text" placeholder="e.g. Zenith Corporate Hub" className="w-full bg-[#FDFCF8] border-2 border-[#E3DACD]/50 rounded-[1.5rem] px-7 py-5 font-serif font-bold text-lg focus:border-[#C06842] outline-none transition-all placeholder:text-[#E3DACD]/60" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-[0.3em]">Project Type</label>
                                        <select className="w-full bg-[#FDFCF8] border-2 border-[#E3DACD]/50 rounded-[1.5rem] px-7 py-5 font-bold text-sm outline-none appearance-none hover:border-[#C06842] transition-colors" value={newProject.type} onChange={e => setNewProject({ ...newProject, type: e.target.value })}>
                                            <option>Residential</option><option>Commercial</option><option>Industrial</option><option>Hospitality</option>
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-[0.3em]">Budget</label>
                                        <div className="relative">
                                            <span className="absolute left-7 top-1/2 -translate-y-1/2 font-bold text-[#C06842]">₹</span>
                                            <input required type="number" className="w-full bg-[#FDFCF8] border-2 border-[#E3DACD]/50 rounded-[1.5rem] pl-12 pr-7 py-5 font-bold text-sm focus:border-[#C06842] outline-none transition-all" value={newProject.budget} onChange={e => setNewProject({ ...newProject, budget: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-[0.3em]">Select Land</label>
                                    <select required className="w-full bg-[#FDFCF8] border-2 border-[#E3DACD]/50 rounded-[1.5rem] px-7 py-5 font-bold text-sm outline-none hover:border-[#C06842] transition-colors" value={newProject.land_id} onChange={e => {
                                        const selectedLand = lands.find(l => l.land_id === e.target.value);
                                        setNewProject({ ...newProject, land_id: e.target.value, location: selectedLand?.location || '' });
                                    }}>
                                        <option value="">Select Land</option>
                                        {lands.map(l => <option key={l.land_id} value={l.land_id}>{l.name} - {l.location}</option>)}
                                    </select>
                                </div>
                                <Button size="lg" className="w-full py-7" type="submit">Create Project</Button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LandOwnerDashboard;
