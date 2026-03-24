import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMockApp } from '../../../hooks/useMockApp';
import { 
    LayoutGrid, Plus, Users, Award, 
    Construction, ClipboardList, Clock, 
    ArrowUpRight, MapPin, Search, ChevronRight,
    Star, Briefcase, FileText, Layers, ImageIcon,
    Activity, ShieldAlert, CheckCircle, Navigation, BarChart3, PenTool, Check
} from 'lucide-react';
import ProfilePromptModal from '../../../components/dashboard/Common/ProfilePromptModal';
import RatingModal from '../../../components/dashboard/Common/RatingModal';
import WeatherSafetyWidget from '../../../components/dashboard/Common/WeatherSafetyWidget';
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
        <Card className="mb-0 overflow-hidden border-none p-0 shadow-none">
            <SectionHeader 
                title="Project Phases" 
                subtitle="Manage your designated project milestones"
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
                                {phase.completed ? <CheckCircle size={22} /> : <Icon size={20} />}
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-serif font-bold text-[#2A1F1D] text-base">{phase.label}</h4>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#C06842]">{phase.weight}% Phase Value</p>
                            </div>
                            <Button
                                size="md"
                                variant={phase.completed ? 'ghost' : isLocked ? 'outline' : 'primary'}
                                disabled={isLocked || project.status === 'Completed'}
                                onClick={() => onUpdatePhase(project.project_id, phase.id, !phase.completed)}
                                className="w-full"
                            >
                                {phase.completed ? 'Reopen' : isLocked ? 'Locked' : 'Authorize Completion'}
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
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [ratingProject, setRatingProject] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    const fetchData = useCallback(async () => {
        if (!currentUser?.id && !currentUser?.user_id) { setLoading(false); return; }
        setLoading(true);
        try {
            const userId = currentUser.id || currentUser.user_id;
            const headers = { 'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}` };
            const projRes = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/user/${userId}`, { headers });
            if (projRes.ok) {
                const data = await projRes.json();
                console.log("[Contractor] Projects Fetched:", data);
                setProjects(data);
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }, [currentUser]);

    useEffect(() => { 
        fetchData(); 
        const handleSearch = (e) => setSearchQuery(e.detail);
        window.addEventListener('planora_search', handleSearch);
        return () => window.removeEventListener('planora_search', handleSearch);
    }, [fetchData]);

    const handlePhaseUpdate = async (projectId, phase, completed) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}/phases`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}` },
                body: JSON.stringify({ phase, completed })
            });
            if (res.ok) fetchData();
        } catch (err) { console.error(err); }
    };

    const activeProjectPipelines = useMemo(() => {
        const active = projects.filter(p => 
            p.status?.toLowerCase() !== 'completed' && 
            p.status?.toLowerCase() !== 'cancelled' &&
            p.invitation_status !== 'Pending'
        );
        console.log("[Contractor] Pipeline Count:", active.length);
        return active;
    }, [projects]);
    const pendingRatings = useMemo(() => projects.filter(p => p.status === 'Completed' && !p.has_rated), [projects]);
    const invitations = useMemo(() => projects.filter(p => p.invitation_status === 'Pending'), [projects]);

    const handleGenerateDailyReport = (project) => {
        const doc = new jsPDF();
        const todayStr = new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
        const leadContractor = currentUser?.name || 'Lead Contractor';
        
        doc.setFontSize(22); doc.setTextColor(192, 104, 66); doc.text("PLANORA", 15, 20);
        doc.setFontSize(14); doc.setTextColor(42, 31, 29); doc.text("DAILY SITE OPERATION REPORT", 15, 30);
        doc.setLineWidth(0.5); doc.setDrawColor(227, 218, 205); doc.line(15, 35, 195, 35);

        doc.setFontSize(10); doc.setTextColor(140, 123, 112);
        doc.text(`Project: ${project.name}`, 15, 45);
        doc.text(`Date: ${todayStr}`, 15, 50);
        doc.text(`Lead Contractor: ${leadContractor}`, 15, 55);
        doc.text(`Location: ${project.location || 'Site Location'}`, 15, 60);

        const todayDate = new Date().toDateString();
        const todayTasks = (project.tasks || []).filter(t => new Date(t.created_at).toDateString() === todayDate);
        const approvedTasks = todayTasks.filter(t => t.status === 'Approved');

        doc.setFillColor(249, 247, 242); doc.rect(15, 70, 55, 25, 'F');
        doc.setTextColor(42, 31, 29); doc.setFontSize(8); doc.text("TASKS LOGGED", 18, 78);
        doc.setFontSize(14); doc.text(`${todayTasks.length}`, 18, 88);

        doc.setFillColor(249, 247, 242); doc.rect(75, 70, 55, 25, 'F');
        doc.setTextColor(52, 211, 153); doc.setFontSize(8); doc.text("TASKS APPROVED", 78, 78);
        doc.setFontSize(14); doc.text(`${approvedTasks.length}`, 78, 88);

        const tableData = todayTasks.length > 0 
            ? todayTasks.map(t => [t.title, t.status.toUpperCase(), new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), t.assigned_to_name || '-'])
            : [['No tasks recorded today', '-', '-', '-']];

        autoTable(doc, {
            startY: 105, head: [['Task Description', 'Status', 'Logged At', 'Professional']], body: tableData,
            theme: 'grid', headStyles: { fillColor: [42, 31, 29], fontSize: 9 }, bodyStyles: { fontSize: 8 }
        });

        const finalY = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(10); doc.setTextColor(192, 104, 66); doc.text("Executive Summary:", 15, finalY);
        doc.setFontSize(8); doc.setTextColor(140, 123, 112);
        const summaryText = todayTasks.length > 0 
            ? `Site activity for ${todayStr} included ${todayTasks.length} logged tasks, with ${approvedTasks.length} approved. Operations at ${Math.round((approvedTasks.length / Math.max(1, todayTasks.length)) * 100)}% today.`
            : `No site activity was recorded for this reporting period. Project remains on standby or maintenance mode.`;
        doc.text(summaryText, 15, finalY + 5, { maxWidth: 175 });

        doc.save(`${project.name.replace(/\s+/g, '_')}_Daily_Log.pdf`);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-vh-screen space-y-6 bg-[#FDFCF8]">
            <div className="w-14 h-14 border-[5px] border-[#C06842]/10 border-t-[#C06842] rounded-full animate-spin" />
            <p className="text-[#8C7B70] font-black uppercase text-[11px] tracking-[0.4em]">Loading Dashboard...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-16 pb-24 pt-10 font-sans text-[#2A1F1D]">
            <RatingModal isOpen={!!ratingProject} onClose={() => setRatingProject(null)} project={ratingProject} currentUser={currentUser} onComplete={fetchData} />

            {/* Contractor Stats Header */}
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
                                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#C06842]">Contractor Hub</span>
                            </div>
                            <h1 className="text-4xl font-serif font-black tracking-tight leading-none mb-2">{currentUser?.name}</h1>
                            <div className="flex flex-wrap items-center gap-5 text-[10px] font-black uppercase tracking-[0.2em] text-[#8C7B70]">
                                <span className="bg-white/5 px-4 py-2 rounded-full border border-white/10 text-white/80">{currentUser?.specialization || 'Contractor'}</span>
                                <span className="flex items-center gap-2 italic">{currentUser?.email}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full lg:max-w-xl">
                        {[
                            { label: 'Current Load', value: activeProjectPipelines.length, icon: Activity },
                            { label: 'Team Size', value: '12', icon: Users, color: 'text-amber-400' },
                            { label: 'Completed Work', value: projects.filter(p => p.status === 'Completed').length, icon: Award, color: 'text-emerald-400' }
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
                        const progressPercent = project.progress?.percentage || 0;
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

                                {/* Site Visuals Strip */}
                                <div className="px-8 overflow-x-auto">
                                    <div className="flex gap-4 min-w-max pb-4">
                                        <div className="w-40 h-40 rounded-[2rem] bg-[#C06842]/5 border-2 border-dashed border-[#C06842]/20 flex flex-col items-center justify-center text-center p-6 space-y-2 shrink-0">
                                            <ImageIcon size={24} className="text-[#C06842]" />
                                            <p className="text-[9px] font-black uppercase text-[#8C7B70] tracking-widest leading-tight">Project<br/>Visuals</p>
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
                                            <div className="flex items-center px-10 text-[#8C7B70] text-[10px] uppercase font-black tracking-widest bg-white/40 rounded-[2rem] border border-dashed border-[#E3DACD]">
                                                No site visuals uploaded for this project yet
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 text-left">
                                    <div className="lg:col-span-3 space-y-12">
                                        <ProjectLifecycle project={project} onUpdatePhase={handlePhaseUpdate} />
                                    </div>

                                    <div className="space-y-8">
                                        <WeatherSafetyWidget location={project.location} />
                                        <Card variant="dark" className="group">
                                            <SectionHeader title="Quick Actions" className="mb-10" />
                                            <div className="space-y-4">
                                                <Button icon={Users} className="w-full py-6" onClick={() => navigate('/dashboard/reports')}>Project Team</Button>
                                                <Button variant="secondary" icon={FileText} className="w-full py-6 bg-emerald-600/10 text-emerald-700 border-emerald-600/20 hover:bg-emerald-600/20" onClick={() => handleGenerateDailyReport(project)}>Daily Site Report</Button>
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
            
            {/* Image Preview Modal */}
            <AnimatePresence>
                {previewImage && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-12 backdrop-blur-2xl bg-black/80" onClick={() => setPreviewImage(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative max-w-7xl max-h-full">
                            <img src={previewImage} className="w-full h-full object-contain rounded-3xl" alt="Preview" />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ContractorDashboard;
