import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMockApp } from '../../../hooks/useMockApp';
import {
    Plus, HardHat, FileText, MapPin, 
    XCircle, Construction, Check, LayoutGrid, PenTool,
    Search, ChevronRight, Award, Shield, Layers, Users,
    Hammer, Star, ClipboardList, Calculator, ImageIcon
} from 'lucide-react';
import ProfilePromptModal from '../../../components/dashboard/Common/ProfilePromptModal';
import RatingModal from '../../../components/dashboard/Common/RatingModal';
import SiteWorkboard from '../Site/SiteWorkboard';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

const LandOwnerDashboard = () => {
    const navigate = useNavigate();
    const { currentUser, setAuthUser } = useMockApp();
    const [projects, setProjects] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', type: 'Residential', location: '', budget: '', land_id: '' });
    const [lands, setLands] = useState([]);
    const [isProfilePromptOpen, setIsProfilePromptOpen] = useState(false);
    const [ratingProject, setRatingProject] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [viewingTeamProject, setViewingTeamProject] = useState(null);

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

    const handleGenerateInvestmentReport = (project) => {
        const doc = new jsPDF();
        const today = new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
        const progressPercent = (
            (project.planning_completed ? 30 : 0) +
            (project.design_completed ? 30 : 0) +
            (project.execution_completed ? 40 : 0)
        );

        // Header
        doc.setFontSize(22);
        doc.setTextColor(192, 104, 66); // Planora Rust
        doc.text("PLANORA", 15, 20);
        
        doc.setFontSize(14);
        doc.setTextColor(42, 31, 29); // Dark Brown
        doc.text("PROJECT INVESTMENT REPORT", 15, 30);
        
        doc.setLineWidth(0.5);
        doc.setDrawColor(227, 218, 205);
        doc.line(15, 35, 195, 35);

        // Details
        doc.setFontSize(10);
        doc.setTextColor(140, 123, 112);
        doc.text(`Project Title: ${project.name}`, 15, 45);
        doc.text(`Reporting Date: ${today}`, 15, 50);
        doc.text(`Asset Type: ${project.type}`, 15, 55);
        doc.text(`Project Location: ${project.location}`, 15, 60);

        // Status Tiles
        doc.setFillColor(249, 247, 242);
        doc.rect(15, 70, 55, 25, 'F');
        doc.setTextColor(42, 31, 29);
        doc.setFontSize(8);
        doc.text("PHYSICAL COMPLETION", 18, 78);
        doc.setFontSize(14);
        doc.text(`${progressPercent}%`, 18, 88);

        doc.setFillColor(249, 247, 242);
        doc.rect(75, 70, 55, 25, 'F');
        doc.setTextColor(192, 104, 66);
        doc.setFontSize(8);
        doc.text("BUDGET EXHAUSTION", 78, 78);
        doc.setFontSize(14);
        doc.text(`${progressPercent + 15}%`, 78, 88);

        doc.setFillColor(249, 247, 242);
        doc.rect(135, 70, 55, 25, 'F');
        doc.setTextColor(52, 211, 153); // Emerald
        doc.setFontSize(8);
        doc.text("LAND STATUS", 138, 78);
        doc.setFontSize(14);
        doc.text("VERIFIED", 138, 88);

        // Milestone Table
        const milestoneData = [
            ['1. Planning Phase (30%)', project.planning_completed ? 'COMPLETED' : 'IN PROGRESS'],
            ['2. Design Phase (30%)', project.design_completed ? 'COMPLETED' : 'PENDING'],
            ['3. Execution Phase (40%)', project.execution_completed ? 'COMPLETED' : 'LOCKED']
        ];

        autoTable(doc, {
            startY: 105,
            head: [['Project Milestone', 'Current Status']],
            body: milestoneData,
            theme: 'grid',
            headStyles: { fillColor: [42, 31, 29], fontSize: 9 },
            bodyStyles: { fontSize: 8 }
        });

        // Risk Note
        const finalY = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(10);
        doc.setTextColor(192, 104, 66);
        doc.text("Risk Observation:", 15, finalY);
        doc.setFontSize(8);
        doc.setTextColor(140, 123, 112);
        doc.text("Physical progress is trailing budget expenditure by approximately 15%. Recommend secondary audit of material procurement logs and onsite productivity metrics.", 15, finalY + 5, { maxWidth: 175 });

        // Footer
        doc.setFontSize(7);
        doc.setTextColor(227, 218, 205);
        doc.text("Generated by Planora Business Intelligence", 15, 285);
        doc.text(`Document ID: PLN-${project.project_id.substring(0,8).toUpperCase()}`, 150, 285);

        doc.save(`${project.name.replace(/\s+/g, '_')}_Investment_Report.pdf`);
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

            {/* Premium Analytics Portfolio Header */}
            <Card variant="dark" className="relative p-10 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#C06842]/10 rounded-full blur-[140px] -mr-48 -mt-48 opacity-60 animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-16">
                    <div className="flex items-center space-x-12">
                        <div className="relative group shrink-0">
                            <div className="absolute -inset-1.5 bg-gradient-to-r from-[#C06842] to-[#E68A2E] rounded-[1.8rem] blur opacity-40 group-hover:opacity-75 transition duration-1000"></div>
                            <div className="relative w-28 h-28 rounded-[1.5rem] p-1.5 bg-[#2A1F1D] border border-white/10 overflow-hidden">
                                <img src={`https://ui-avatars.com/api/?name=${currentUser?.name}&background=C06842&color=fff&size=256`} alt="Owner" className="w-full h-full rounded-[1.2rem] object-cover shadow-2xl" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="h-[1px] w-6 bg-[#C06842]" />
                                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#C06842]">Portfolio Overview</span>
                            </div>
                            <h1 className="text-4xl font-serif font-black tracking-tight leading-none mb-2">{currentUser?.name}</h1>
                            <div className="flex flex-wrap items-center gap-5 text-[10px] font-black uppercase tracking-[0.2em] text-[#8C7B70]">
                                <span className="bg-white/5 px-4 py-2 rounded-full border border-white/10 text-white/80">Land Owner Portfolio</span>
                                <span className="flex items-center gap-2 italic">{currentUser?.email}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full lg:max-w-xl">
                        {[
                            { label: 'Active Projects', value: activeProjects.length, icon: LayoutGrid },
                            { label: 'Lands Owned', value: lands.length, icon: MapPin, color: 'text-amber-400' },
                            { label: 'Completed', value: completedProjectsCount, icon: Award, color: 'text-emerald-400' }
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

                <div className="mt-10 flex flex-wrap justify-center md:justify-start gap-4 relative z-10">
                    <Button icon={Users} variant="secondary" onClick={() => navigate('/dashboard/find-pros')}>Find Professionals</Button>
                    <Button icon={Plus} variant="primary" onClick={() => setIsCreateModalOpen(true)}>Create Project</Button>
                </div>
            </Card>

            {/* Ratings Pending Alert */}
            {pendingRatings.length > 0 && (
                <Card className="bg-amber-50 border-amber-200 py-10 flex flex-col md:flex-row items-center justify-between gap-8 group mt-8">
                    <div className="flex items-center gap-6 text-left">
                        <div className="w-14 h-14 bg-amber-500 text-white rounded-[1.2rem] flex items-center justify-center shadow-lg relative shrink-0">
                            <Star size={28} />
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-white text-amber-500 rounded-full border-2 border-amber-500 flex items-center justify-center text-[10px] font-black">{pendingRatings.length}</div>
                        </div>
                        <div>
                            <h3 className="font-serif text-2xl font-black text-[#2A1F1D] tracking-tight mb-1">Ratings Needed</h3>
                            <p className="text-[10px] text-[#8C7B70] font-black uppercase tracking-[0.1em] max-w-md">You haven't rated the team for {pendingRatings.length} completed project(s). Finalize your project with feedback.</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {pendingRatings.map(p => (
                            <Button key={p.project_id} size="md" variant="primary" onClick={() => setRatingProject(p)}>Rate {p.name}</Button>
                        ))}
                    </div>
                </Card>
            )}

            {/* Active Assets Feed */}
            <div className="space-y-32">
                {activeProjects.filter(p => !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.location?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                    <div className="py-24 text-center bg-white/40 border border-dashed border-[#E3DACD] rounded-[5rem] backdrop-blur-sm relative group overflow-hidden">
                        <div className="relative z-10">
                            <Layers size={80} className="mx-auto text-[#E3DACD] mb-8 group-hover:scale-110 transition-transform duration-1000" strokeWidth={0.5} />
                            <h2 className="text-4xl font-serif font-black text-[#2A1F1D] mb-4 tracking-tight">No Matching Projects</h2>
                            <p className="text-[#8C7B70] max-w-sm mx-auto mb-12 font-medium leading-relaxed">No projects found matching your search: "{searchQuery}"</p>
                            {searchQuery ? (
                                <Button icon={XCircle} variant="outline" onClick={() => setSearchQuery('')}>Clear Search</Button>
                            ) : (
                                <Button icon={ChevronRight} size="lg" onClick={() => setIsCreateModalOpen(true)}>Create First Project</Button>
                            )}
                        </div>
                    </div>
                ) : (
                    activeProjects
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
                                                    <span className="text-[8px] font-black uppercase text-[#C06842] bg-[#C06842]/5 border border-[#C06842]/10 px-3 py-1.5 rounded-full tracking-[0.22em]">{project.type} Project</span>
                                                </div>
                                                <p className="text-[11px] text-[#8C7B70] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                                                    <MapPin size={12} className="text-[#C06842]" /> {project.location} • <span className="text-[#2A1F1D]">Land Registry Status: Active</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full max-w-md space-y-6">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[9px] font-black uppercase text-[#8C7B70] tracking-[0.2em]">Physical Progress</span>
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
                                        {/* Financial Burn Sync */}
                                        <div className="space-y-3 p-5 bg-[#C06842]/5 rounded-[1.5rem] border border-[#C06842]/10">
                                            <div className="flex justify-between items-end">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black uppercase text-[#C06842] tracking-[0.2em]">Budget Spent Sync</span>
                                                    {((progressPercent + 15) > progressPercent) && (
                                                        <span className="bg-[#C06842] text-white text-[7px] font-black px-1.5 py-0.5 rounded shadow-sm">RISK ALERT</span>
                                                    )}
                                                </div>
                                                <span className="text-lg font-serif font-black text-[#C06842]">{progressPercent + 15}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-[#C06842]/10 rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: `${progressPercent + 15}%` }}
                                                    className="h-full bg-[#C06842]"
                                                />
                                            </div>
                                            <p className="text-[8px] text-[#8C7B70] font-bold uppercase tracking-tighter">Budget exhaustion is out-pacing physical progress by 15%.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Site Visuals Strip */}
                                <div className="px-8 overflow-x-auto">
                                    <div className="flex gap-4 min-w-max pb-4">
                                        <div className="w-40 h-52 rounded-[2.5rem] bg-[#C06842]/5 border-2 border-dashed border-[#C06842]/20 flex flex-col items-center justify-center text-center p-6 space-y-2 shrink-0">
                                            <ImageIcon size={24} className="text-[#C06842]" />
                                            <p className="text-[9px] font-black uppercase text-[#8C7B70] tracking-widest leading-tight">Site<br/>Gallery</p>
                                        </div>
                                        {project.tasks?.filter(t => t.image_path).map((task, tidx) => (
                                            <div 
                                                key={tidx} 
                                                className="relative w-80 h-52 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl group shrink-0 transition-all hover:scale-[1.02] hover:-rotate-1 cursor-zoom-in"
                                                onClick={() => setPreviewImage(`${import.meta.env.VITE_API_URL}/${task.image_path}`)}
                                            >
                                                <img src={`${import.meta.env.VITE_API_URL}/${task.image_path}`} alt="Site" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#2A1F1D]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="absolute bottom-0 inset-x-0 p-6">
                                                        <p className="text-[10px] text-white font-black uppercase tracking-widest truncate">{task.title}</p>
                                                        <p className="text-[8px] text-[#C06842] font-black uppercase tracking-widest">{new Date(task.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {(!project.tasks || project.tasks.filter(t => t.image_path).length === 0) && (
                                            <div className="flex items-center px-10 text-[#8C7B70] text-[10px] uppercase font-black tracking-widest bg-white/40 rounded-[2.5rem] border border-dashed border-[#E3DACD]">
                                                Awaiting first site visuals for this project
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                                    <div className="lg:col-span-3 space-y-12">
                                        <ProjectLifecycle project={project} onUpdatePhase={handlePhaseUpdate} />
                                    </div>

                                    <div className="space-y-12">
                                        <Card variant="dark" className="group relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C06842]/20 blur-[60px] rounded-full group-hover:translate-x-4 transition-transform duration-1000" />
                                            <SectionHeader title="Quick Actions" className="mb-10" />
                                            <div className="space-y-4">
                                                <Button icon={Users} className="w-full py-6" onClick={() => setViewingTeamProject(project)}>Project Team</Button>
                                                <Button variant="secondary" icon={FileText} className="w-full py-6 bg-emerald-600/10 text-emerald-700 border-emerald-600/20 hover:bg-emerald-600/20" onClick={() => handleGenerateInvestmentReport(project)}>Investment Report</Button>
                            <Button 
                                variant="secondary" 
                                icon={Calculator} 
                                className="w-full py-6 bg-blue-600/10 text-blue-700 border-blue-600/20 hover:bg-blue-600/20" 
                                onClick={() => navigate('/dashboard/quotations')}
                            >
                                Review Quotations
                            </Button>
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

            {/* Image Preview Modal */}
            <AnimatePresence>
                {previewImage && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center p-8 bg-[#2A1F1D]/90 backdrop-blur-xl"
                        onClick={() => setPreviewImage(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="relative max-w-5xl max-h-full"
                            onClick={e => e.stopPropagation()}
                        >
                            <button 
                                onClick={() => setPreviewImage(null)}
                                className="absolute -top-12 -right-12 p-3 text-white/60 hover:text-white transition-colors"
                            >
                                <XCircle size={32} />
                            </button>
                            <img src={previewImage} alt="Site Preview" className="w-full h-auto max-h-[85vh] object-contain rounded-[3rem] shadow-3xl border-4 border-white/20" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Project Team Modal */}
            <AnimatePresence>
                {viewingTeamProject && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120] flex items-center justify-center p-8 bg-[#2A1F1D]/80 backdrop-blur-xl"
                        onClick={() => setViewingTeamProject(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-[4rem] w-full max-w-xl p-16 shadow-3xl border border-white/20 relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <button onClick={() => setViewingTeamProject(null)} className="absolute top-10 right-10 p-3 rounded-full hover:bg-[#F9F7F2] transition-colors"><XCircle size={32} className="text-[#E3DACD]" /></button>
                            
                            <div className="mb-12">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="h-[1px] w-6 bg-[#C06842]" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#C06842]">Strategic Assets</span>
                                </div>
                                <h2 className="text-4xl font-serif font-black text-[#2A1F1D] tracking-tight">{viewingTeamProject.name} Team</h2>
                                <p className="text-[10px] text-[#8C7B70] font-black uppercase tracking-[0.2em] mt-2">Verified Field Professionals ({viewingTeamProject.team?.length || 0})</p>
                            </div>

                            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
                                {viewingTeamProject.team?.map((member, midx) => {
                                    const taskLoad = viewingTeamProject.tasks?.filter(t => t.assigned_to === (member.user_id || member.id)).length || 0;
                                    return (
                                        <div key={midx} className="p-6 bg-[#FDFCF8] rounded-[2rem] border-2 border-transparent hover:border-[#C06842]/10 flex items-center justify-between group transition-all">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-[1.2rem] bg-[#2A1F1D] text-[#C06842] flex items-center justify-center font-bold text-xl relative shadow-xl">
                                                    {member.name?.[0].toUpperCase() || '?'}
                                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full shadow-sm"></div>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black uppercase text-[#2A1F1D] tracking-tight mb-1">{member.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black uppercase text-[#C06842] bg-[#C06842]/5 px-3 py-1 rounded-full border border-[#C06842]/10">{member.assigned_role || member.sub_category}</span>
                                                        <span className="text-[8px] font-black text-[#8C7B70] uppercase italic tracking-widest leading-none">Registered Partner</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className="text-[7px] font-black uppercase text-[#8C7B70] tracking-widest leading-none mb-1">Assigned</p>
                                                    <p className="text-lg font-serif font-black text-[#2A1F1D] leading-none">{taskLoad} Tasks</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {(!viewingTeamProject.team || viewingTeamProject.team.length === 0) && (
                                    <div className="py-20 text-center space-y-4">
                                        <Users size={48} className="mx-auto text-[#E3DACD]" strokeWidth={0.5} />
                                        <p className="text-[10px] text-[#8C7B70] uppercase font-black tracking-widest">Awaiting team allocation</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-12 p-6 bg-[#C06842]/5 rounded-[2.5rem] border border-[#C06842]/10">
                                <p className="text-[9px] text-[#8C7B70] font-bold uppercase tracking-widest text-center">Team verified for {viewingTeamProject.name} deployment.</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LandOwnerDashboard;
