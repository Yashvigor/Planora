import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useMockApp } from '../../../hooks/useMockApp';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FileText, CheckSquare, Clock, Users, Upload, 
    ChevronRight, MoreVertical, Plus, AlertCircle, 
    CheckCircle2, Circle, PlayCircle, BarChart3, MapPin,
    Star, XCircle, Activity, LayoutGrid, Layers, ExternalLink,
    ArrowUpRight, Monitor, Filter, Construction, Image as ImageIcon
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

const ProjectWorkspace = () => {
    const { id } = useParams();
    const { currentUser } = useMockApp();
    const { showToast } = useToast();
    const [project, setProject] = useState(null);
    const [activeSection, setActiveSection] = useState('board'); // 'board', 'files'
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [projectTeam, setProjectTeam] = useState([]);
    const [siteProgress, setSiteProgress] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [ratings, setRatings] = useState({}); // { userId: ratingValue }

    const fetchProject = useCallback(async () => {
        setLoading(true);
        try {
            const [projRes, progRes, docsRes, teamRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}`),
                fetch(`${import.meta.env.VITE_API_URL}/api/site-progress/${id}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}` }
                }),
                fetch(`${import.meta.env.VITE_API_URL}/api/documents/project/${id}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}` }
                }),
                fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}/team?status=Accepted`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}` }
                })
            ]);

            if (projRes.ok) {
                const data = await projRes.json();
                setProject(data);
            }
            if (progRes.ok) setSiteProgress(await progRes.json());
            if (docsRes.ok) setDocuments(await docsRes.json());
            if (teamRes.ok) setProjectTeam(await teamRes.json());

        } catch (err) {
            console.error("Workspace fetch error:", err);
            showToast("Failed to initialize workspace data", "error");
        } finally {
            setLoading(false);
        }
    }, [id, showToast]);

    useEffect(() => {
        fetchProject();
    }, [fetchProject]);

    const handleUpdatePhase = async (phase, completed) => {
        if (updating) return;

        if (project?.status === 'Completed') {
            showToast("This project is finalized and locked. No further modifications are allowed.", "info");
            return;
        }
        
        const canUpdate = currentUser?.role === 'land_owner' || currentUser?.role === 'contractor';
        if (!canUpdate) {
            showToast("Only Land Owners or Contractors can update project phases.", "warning");
            return;
        }

        setUpdating(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}/phases`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}`
                },
                body: JSON.stringify({ phase, completed })
            });

            if (res.ok) {
                const updatedData = await res.json();
                showToast(`${phase.charAt(0).toUpperCase() + phase.slice(1)} phase updated!`, "success");
                setProject(updatedData);

                if (updatedData.status === 'Completed' && phase === 'execution' && completed) {
                    showToast("Project Completed! Please rate your team members.", "success");
                    const filteredTeam = projectTeam.filter(m => m.user_id !== (currentUser.user_id || currentUser.id));
                    setProjectTeam(filteredTeam);
                    setIsRatingModalOpen(true);
                }
            } else {
                const err = await res.json();
                showToast(err.error || "Failed to update phase", "error");
            }
        } catch (err) {
            showToast("Network error updating phase", "error");
        } finally {
            setUpdating(false);
        }
    };

    const submitRatings = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const ratingArray = Object.entries(ratings).map(([uid, r]) => ({ rated_user_id: uid, rating: r }));
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}/rate`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}`
                },
                body: JSON.stringify({ 
                    rater_id: currentUser.user_id || currentUser.id,
                    ratings: ratingArray 
                })
            });

            if (res.ok) {
                showToast("Ratings submitted. Thank you for your feedback!", "success");
                setIsRatingModalOpen(false);
            } else {
                showToast("Failed to submit ratings", "error");
            }
        } catch (err) {
            showToast("Error submitting ratings", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="w-12 h-12 border-4 border-[#C06842] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[#8C7B70] font-bold animate-pulse uppercase tracking-widest text-xs">Accessing Project Infrastructure...</p>
        </div>
    );

    if (!project) return (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
            <AlertCircle className="text-red-400 w-16 h-16" />
            <p className="text-[#2A1F1D] font-bold text-xl">Project Ecosystem Not Found</p>
            <button onClick={() => window.history.back()} className="text-[#C06842] font-bold underline">Return to Dashboard</button>
        </div>
    );

    const phases = [
        { id: 'planning', label: 'Planning & Architecting', weight: 30, completed: project.planning_completed, icon: Layers },
        { id: 'design', label: 'Intensive Design Review', weight: 30, completed: project.design_completed, dependsOn: 'planning', icon: Monitor },
        { id: 'execution', label: 'Site Execution & Delivery', weight: 40, completed: project.execution_completed, dependsOn: 'design', icon: Construction }
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-fade-in h-[calc(100vh-6rem)] flex flex-col">
            {/* HEROPLATE: High-Fidelity Infrastructure Summary */}
            <div className="glass-panel p-8 rounded-[3rem] shadow-2xl border border-[#E3DACD] bg-white relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#C06842]/5 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <h1 className="text-4xl font-serif font-black text-[#2A1F1D] tracking-tight">{project.name}</h1>
                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${
                                project.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' :
                                project.status === 'Execution' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                'bg-amber-50 text-[#C06842] border-[#C06842]/20'
                            }`}>
                                {project.status || 'Active Asset'}
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-6 text-sm text-[#8C7B70] font-bold">
                            <span className="flex items-center gap-2 bg-[#F9F7F2] px-4 py-2 rounded-xl border border-[#E3DACD]/50">
                                <Activity size={16} className="text-[#C06842]" /> ID: #{project.project_id.toString().substring(0,8)}...
                            </span>
                            <span className="flex items-center gap-2 bg-[#F9F7F2] px-4 py-2 rounded-xl border border-[#E3DACD]/50">
                                <MapPin size={16} className="text-[#A65D4D]" /> {project.location || 'Coordinated Strategy'}
                            </span>
                            <span className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-[#C06842]/30 text-[#C06842]">
                                <Users size={16} /> Team Members: {projectTeam.length || 0}
                            </span>
                        </div>
                    </div>

                    <div className="w-full md:w-80 space-y-3">
                        <div className="flex justify-between items-end">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8C7B70]">Development Velocity</p>
                            <span className="text-2xl font-serif font-black text-[#C06842]">{project.progress || 0}%</span>
                        </div>
                        <div className="w-full h-3 bg-[#F9F7F2] rounded-full overflow-hidden border border-[#E3DACD] shadow-inner p-[2px]">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${project.progress || 0}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-[#2A1F1D] via-[#A65D4D] to-[#C06842] rounded-full shadow-lg"
                            ></motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SYNC NAVIGATION BAR (Scroll Context) */}
            <div className="flex justify-between items-center bg-[#FDFCF8] p-2 rounded-[2rem] border border-[#E3DACD] shadow-sm sticky top-0 z-30">
                <div className="flex gap-2">
                    {[
                        { id: 'board', label: 'Work Board', icon: LayoutGrid },
                        { id: 'files', label: 'Knowledge Base', icon: FileText }
                    ].map(sec => (
                        <button
                            key={sec.id}
                            onClick={() => setActiveSection(sec.id)}
                            className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all ${
                                activeSection === sec.id 
                                ? 'bg-[#2A1F1D] text-white shadow-xl scale-[1.05]' 
                                : 'text-[#8C7B70] hover:bg-white hover:text-[#5D4037]'
                            }`}
                        >
                            <sec.icon size={16} /> {sec.label}
                        </button>
                    ))}
                </div>
                <div className="hidden md:flex items-center gap-4 px-6 text-[#8C7B70] text-[10px] font-black uppercase tracking-widest">
                    <span>Live Updates: {siteProgress.length}</span>
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                </div>
            </div>

            {/* UNIFIED SCROLLABLE ECOSYSTEM */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-10">
                <AnimatePresence mode="wait">
                    {activeSection === 'board' ? (
                        <motion.div 
                            key="board"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-10 pb-10"
                        >
                            {/* SECTION: Lifecycle Milestones */}
                            <section className="space-y-6">
                                <div className="flex items-center justify-between px-4">
                                    <h3 className="text-xl font-serif font-black text-[#2A1F1D] flex items-center gap-3 italic">
                                        <Layers size={22} className="text-[#C06842]" /> Strategic Milestones
                                    </h3>
                                    <p className="text-[10px] font-bold text-[#8C7B70]">Sequential Progression Required</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {phases.map((phase, idx) => {
                                        const isLocked = phase.dependsOn && !project[`${phase.dependsOn}_completed`];
                                        return (
                                            <div key={phase.id} className={`group relative glass-card p-4 rounded-[2.5rem] border-2 transition-all duration-500 ${
                                                phase.completed 
                                                ? 'bg-green-50/50 border-green-200 shadow-lg' 
                                                : isLocked 
                                                    ? 'bg-[#F9F7F2]/50 border-transparent opacity-60 grayscale'
                                                    : 'bg-white border-[#C06842]/30 shadow-xl shadow-[#C06842]/5'
                                            }`}>
                                                <div className="flex flex-col items-center text-center space-y-6 pt-4">
                                                    <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all ${
                                                        phase.completed 
                                                        ? 'bg-green-600 text-white shadow-lg shadow-green-200' 
                                                        : isLocked 
                                                            ? 'bg-[#E3DACD]/30 text-[#A65D4D]'
                                                            : 'bg-[#2A1F1D] text-white rotate-3 shadow-xl'
                                                    }`}>
                                                        {phase.completed ? <CheckCircle2 size={32} /> : isLocked ? <Clock size={32} /> : <phase.icon size={32} />}
                                                    </div>
                                                    
                                                    <div className="space-y-2">
                                                        <h4 className="font-serif font-black text-lg text-[#2A1F1D]">{phase.label}</h4>
                                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#C06842] bg-[#C06842]/5 px-4 py-1.5 rounded-full inline-block">
                                                            Impact: +{phase.weight}%
                                                        </p>
                                                    </div>

                                                    <button
                                                        disabled={updating || isLocked || project.status === 'Completed'}
                                                        onClick={() => handleUpdatePhase(phase.id, !phase.completed)}
                                                        className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all border ${
                                                            phase.completed
                                                            ? 'bg-white text-green-700 border-green-100 hover:bg-green-100/50'
                                                            : isLocked || project.status === 'Completed'
                                                                ? 'bg-transparent text-[#B8AFA5] border-[#E3DACD] cursor-not-allowed'
                                                                : 'bg-[#2A1F1D] text-white hover:bg-[#C06842] border-transparent hover:scale-[0.98] active:scale-95 shadow-xl'
                                                        }`}
                                                    >
                                                        {phase.completed ? 'Reopen Milestone' : (isLocked || project.status === 'Completed') ? 'Locked' : 'Initialize Completion'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                {/* SECTION: Site Activity Stream (The Workboard) */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="flex items-center justify-between bg-white/50 p-6 rounded-[2rem] border border-[#E3DACD]/40">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-[#2A1F1D] text-white rounded-2xl shadow-lg">
                                                <Activity size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-serif font-black text-[#2A1F1D]">Professional Site Stream</h3>
                                                <p className="text-[10px] font-bold text-[#8C7B70] uppercase tracking-widest mt-0.5">Live Coordination Feed</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => window.location.href = '/dashboard/tasks'}
                                            className="p-3 bg-white border border-[#E3DACD] text-[#C06842] rounded-2xl hover:bg-[#C06842] hover:text-white transition-all shadow-sm"
                                        >
                                            <ArrowUpRight size={18} />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {siteProgress.length > 0 ? siteProgress.map((item, idx) => (
                                            <motion.div 
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                key={item.progress_id || idx} 
                                                className="bg-white p-6 rounded-[2rem] border border-[#E3DACD]/50 shadow-sm hover:shadow-md transition-shadow group"
                                            >
                                                <div className="flex gap-6">
                                                    <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#F9F7F2] shrink-0 bg-[#F9F7F2] relative">
                                                        {item.image_path ? (
                                                            <img 
                                                                src={`${import.meta.env.VITE_API_URL}/${item.image_path}`} 
                                                                alt="site progress" 
                                                                className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[#B8AFA5]"><ImageIcon size={32} /></div>
                                                        )}
                                                        <div className="absolute top-1 right-1">
                                                            <div className="bg-white/90 p-1 rounded-lg border border-[#E3DACD]"><ImageIcon size={12} className="text-[#C06842]" /></div>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 space-y-2 py-1">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h4 className="font-serif font-black text-[#2A1F1D]">{item.note || 'Phase Work Submitted'}</h4>
                                                                <p className="text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mt-0.5">Submitted by Infrastructure Expert</p>
                                                            </div>
                                                            <span className="text-[9px] font-bold text-[#B8AFA5] bg-[#FDFCF8] px-3 py-1 rounded-full border border-[#E3DACD]/50 uppercase">{new Date(item.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-sm text-[#6E5E56] leading-relaxed line-clamp-2">{item.description || 'The site coordination team has validated this progress segment against project specifications.'}</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )) : (
                                            <div className="p-20 text-center space-y-4 opacity-40 bg-[#FDFCF8] rounded-[2.5rem] border border-dashed border-[#E3DACD]">
                                                <Activity size={48} className="mx-auto text-[#8C7B70]" />
                                                <p className="text-sm font-bold text-[#8C7B70]">Awaiting initial site telemetry...</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* SIDEBAR SECTION: Team & Stats */}
                                <div className="space-y-8">
                                    <div className="glass-panel p-8 rounded-[2.5rem] border border-[#C06842]/10 bg-gradient-to-br from-[#FDFCF8] to-white space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Filter size={18} /></div>
                                            <h3 className="font-serif font-black text-[#2A1F1D]">Asset Intelligence</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center p-4 bg-[#F9F7F2]/50 rounded-2xl border border-[#E3DACD]/40 shadow-inner">
                                                <span className="text-[10px] font-black uppercase text-[#8C7B70]">Risk Matrix</span>
                                                <span className="text-[10px] font-black uppercase text-green-600 bg-green-50 px-3 py-1 rounded-lg">Low Conflict</span>
                                            </div>
                                            <div className="flex justify-between items-center p-4 bg-[#F9F7F2]/50 rounded-2xl border border-[#E3DACD]/40 shadow-inner">
                                                <span className="text-[10px] font-black uppercase text-[#8C7B70]">Reliability Score</span>
                                                <span className="text-[10px] font-black uppercase text-[#C06842] font-serif">A+ PRIME</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="glass-panel p-8 rounded-[2.5rem] border border-[#E3DACD] bg-white space-y-6">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-serif font-black text-[#2A1F1D]">Project Files</h3>
                                            <span className="text-[10px] font-black text-[#C06842] underline cursor-pointer" onClick={() => setActiveSection('files')}>View All</span>
                                        </div>
                                        <div className="space-y-3">
                                            {documents.slice(0, 3).map((doc, idx) => (
                                                <div key={idx} className="flex items-center gap-3 p-3 hover:bg-[#F9F7F2] rounded-xl transition-colors cursor-pointer border border-transparent hover:border-[#E3DACD]/50">
                                                    <div className="p-2 bg-[#F9F7F2] text-[#8C7B70] rounded-lg"><FileText size={16} /></div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[11px] font-bold text-[#2A1F1D] truncate">{doc.name}</p>
                                                        <p className="text-[9px] text-[#A65D4D] font-bold uppercase">{doc.file_type} • {doc.file_size}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {documents.length === 0 && <p className="text-[10px] text-[#8C7B70] italic">No repository data yet.</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="files"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white p-10 rounded-[3rem] border border-[#E3DACD] min-h-[400px] flex flex-col"
                        >
                            <div className="flex justify-between items-center mb-10">
                                <h3 className="text-3xl font-serif font-black text-[#2A1F1D]">Knowledge Repository</h3>
                                <button className="flex items-center gap-2 px-6 py-3 bg-[#2A1F1D] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#C06842] transition-all">
                                    <Plus size={16} /> Central Integration
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {documents.length > 0 ? documents.map((doc, idx) => (
                                    <div key={doc.doc_id || idx} className="glass-card p-6 rounded-[2rem] border border-[#E3DACD] hover:border-[#C06842]/40 hover:shadow-xl transition-all group">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-14 h-14 bg-[#F9F7F2] rounded-2xl flex items-center justify-center text-[#C06842] group-hover:bg-[#C06842] group-hover:text-white transition-all shadow-inner">
                                                <FileText size={28} />
                                            </div>
                                            <a 
                                                href={`${import.meta.env.VITE_API_URL}/${doc.file_path}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="p-2 text-[#8C7B70] hover:text-[#C06842] transition-colors"
                                            >
                                                <ArrowUpRight size={20} />
                                            </a>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-black text-[#2A1F1D] tracking-tight truncate">{doc.name}</h4>
                                            <div className="flex gap-3 text-[9px] font-black uppercase tracking-widest text-[#8C7B70]">
                                                <span className="bg-[#F9F7F2] px-2 py-0.5 rounded-md border border-[#E3DACD]/50">{doc.file_type}</span>
                                                <span className="bg-[#F9F7F2] px-2 py-0.5 rounded-md border border-[#E3DACD]/50">{doc.file_size}</span>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-span-full py-20 text-center space-y-4 opacity-40">
                                        <FileText size={64} className="mx-auto text-[#8C7B70]" />
                                        <p className="font-serif font-black text-xl">Infrastructure Repository Empty</p>
                                        <p className="text-sm max-w-xs mx-auto">Upload technical documentation or site reports to begin building the project knowledge base.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* RATING MODAL */}
            {isRatingModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#2A1F1D]/80 backdrop-blur-xl">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-[3rem] w-full max-w-2xl p-10 shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        
                        <div className="flex justify-between items-center mb-8 relative z-10">
                            <div className="space-y-1">
                                <h3 className="text-3xl font-serif font-black text-[#2A1F1D]">Professional Appraisal</h3>
                                <p className="text-sm text-[#8C7B70]">Rate the performance of your infrastructure team to conclude the asset lifecycle.</p>
                            </div>
                            <button onClick={() => setIsRatingModalOpen(false)} className="p-3 hover:bg-red-50 text-[#8C7B70] hover:text-red-500 rounded-2xl transition-all">
                                <XCircle size={28} />
                            </button>
                        </div>

                        <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar mb-10">
                            {projectTeam.map(member => (
                                <div key={member.user_id} className="flex items-center justify-between p-6 bg-[#F9F7F2]/50 rounded-3xl border border-[#E3DACD]/50 group hover:border-[#C06842]/30 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-[#2A1F1D] text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg">
                                            {member.name?.[0]}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-[#2A1F1D]">{member.name}</h4>
                                            <p className="text-[10px] font-black uppercase text-[#C06842] tracking-widest">{member.assigned_role}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button 
                                                key={star}
                                                onClick={() => setRatings(prev => ({ ...prev, [member.user_id]: star }))}
                                                className={`p-1.5 transition-all transform hover:scale-125 ${
                                                    (ratings[member.user_id] || 0) >= star ? 'text-amber-400 scale-110' : 'text-[#E3DACD]'
                                                }`}
                                            >
                                                <Star size={24} fill={(ratings[member.user_id] || 0) >= star ? 'currentColor' : 'none'} strokeWidth={3} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button 
                            onClick={submitRatings}
                            disabled={isSubmitting || Object.keys(ratings).length === 0}
                            className="w-full py-5 bg-[#2A1F1D] text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-[#C06842] transition-all shadow-xl shadow-[#C06842]/20 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Finalizing Records...' : 'Finalize & Archive Project'}
                        </button>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default ProjectWorkspace;
