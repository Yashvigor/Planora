import React, { useState, useEffect, useCallback } from 'react';
import { 
    LayoutGrid, CheckCircle, Clock, ChevronRight,
    FileText, Eye, MapPin, Calendar, ClipboardList,
    TrendingUp, Star, Award, User, Users, Upload, 
    Plus, X, Image as ImageIcon, Briefcase, Camera, PencilRuler,
    Zap, Activity, Layout, ShieldCheck, ArrowRight, AlertOctagon, Download,
    Search, Filter, Lock, Trash2, Edit3, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SectionHeader = ({ title, subtitle, icon: Icon, extra }) => (
    <div className="flex items-center justify-between mb-8 group">
        <div className="flex items-center gap-4">
            {Icon && (
                <div className="p-3 bg-[#2A1F1D] text-[#C06842] rounded-2xl shadow-xl group-hover:scale-110 transition-transform duration-500">
                    <Icon size={20} />
                </div>
            )}
            <div>
                <h3 className="text-xl font-bold font-serif text-[#2A1F1D] tracking-tight">{title}</h3>
                {subtitle && <p className="text-[10px] text-[#8C7B70] font-black uppercase tracking-[0.2em] mt-1 italic">{subtitle}</p>}
            </div>
        </div>
        {extra}
        <div className="h-[1px] flex-1 mx-8 bg-gradient-to-r from-[#E3DACD]/40 to-transparent hidden xl:block" />
    </div>
);

const ArchitectWorkboard = ({ currentUser }) => {
    // Basic States
    const [tasks, setTasks] = useState([]);
    const [drawings, setDrawings] = useState([]);
    const [projects, setProjects] = useState([]);
    const [teamMembers, setTeamMembers] = useState({});
    const [loading, setLoading] = useState(true);
    
    // UI States
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedDrawing, setSelectedDrawing] = useState(null);
    const [editingDrawing, setEditingDrawing] = useState(null);
    const [uploadFile, setUploadFile] = useState(null);
    const [assetFilter, setAssetFilter] = useState('All');
    const [assetSearch, setAssetSearch] = useState('');
    
    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Floor Plan',
        is_team_project: false,
        project_id: ''
    });

    const uid = currentUser?.user_id || currentUser?.id;

    const fetchData = useCallback(async () => {
        if (!uid) return;
        setLoading(true);
        try {
            // Parallel Fetching for speed
            const [tasksRes, projectsRes, drawingsRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/api/tasks/user/${uid}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` }
                }),
                fetch(`${import.meta.env.VITE_API_URL}/api/professionals/${uid}/projects`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` }
                }),
                fetch(`${import.meta.env.VITE_API_URL}/api/drawings/${uid}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` }
                })
            ]);

            const tasksData = await tasksRes.json();
            const projectsData = await projectsRes.json();
            const drawingsData = await drawingsRes.json();

            setTasks(Array.isArray(tasksData) ? tasksData : []);
            setDrawings(Array.isArray(drawingsData) ? drawingsData : []);
            
            const acceptedProjects = Array.isArray(projectsData) ? projectsData.filter(p => !p.assignment_status || p.assignment_status === 'Accepted') : [];
            setProjects(acceptedProjects);

            // Fetch team members sequentially (or could be maps in future)
            const teamsMap = {};
            for (const proj of acceptedProjects) {
                const teamRes = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${proj.project_id}/team?status=Accepted`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` }
                });
                if (teamRes.ok) teamsMap[proj.project_id] = await teamRes.json();
            }
            setTeamMembers(teamsMap);

        } catch (err) {
            console.error('Error fetching architect workboard data:', err);
        } finally {
            setLoading(false);
        }
    }, [uid]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleUpload = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('architect_id', uid);
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('category', formData.category);
        data.append('is_team_project', formData.is_team_project);
        if (formData.project_id) data.append('project_id', formData.project_id);
        if (uploadFile) data.append('file', uploadFile);

        try {
            const url = editingDrawing 
                ? `${import.meta.env.VITE_API_URL}/api/drawings/${editingDrawing.drawing_id}`
                : `${import.meta.env.VITE_API_URL}/api/drawings`;
            const method = editingDrawing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: editingDrawing ? {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('planora_token')}`
                } : {
                    'Authorization': `Bearer ${localStorage.getItem('planora_token')}`
                },
                body: editingDrawing ? JSON.stringify(formData) : data
            });

            if (res.ok) {
                setIsUploadModalOpen(false);
                setEditingDrawing(null);
                setFormData({ title: '', description: '', category: 'Floor Plan', is_team_project: false, project_id: '' });
                setUploadFile(null);
                fetchData();
            }
        } catch (err) {
            console.error('Error handling asset update:', err);
        }
    };

    const handleDeleteAsset = async (id) => {
        if (!window.confirm('Delete this Studio Asset permanently?')) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/drawings/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` }
            });
            if (res.ok) fetchData();
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const ongoingTasks = tasks.filter(t => t.status !== 'Approved');
    const approvedTasks = tasks.filter(t => t.status === 'Approved');
    
    // Unified completion including drawings (deliverables)
    const totalEntities = tasks.length + drawings.length;
    const progressTotal = approvedTasks.length + (drawings.filter(d => d.is_team_project).length * 0.5); // Weighting them
    const completionRate = totalEntities > 0 ? Math.round(((approvedTasks.length + drawings.filter(d => d.is_team_project).length) / totalEntities) * 100) : 0;

    const filteredAssets = drawings.filter(d => {
        const matchesSearch = d.title?.toLowerCase().includes(assetSearch.toLowerCase());
        const matchesCat = assetFilter === 'All' || d.category === assetFilter;
        return matchesSearch && matchesCat;
    });

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-44 opacity-80">
            <div className="w-16 h-16 border-4 border-[#C06842]/10 border-t-[#C06842] rounded-full animate-spin mb-6" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8C7B70] animate-pulse">Initializing Master Architect Hub</p>
        </div>
    );

    return (
        <div className="space-y-12 pb-20 max-w-[1600px] mx-auto text-left">
            
            {/* 1. HERO CONTEXT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-8 bg-[#1A1A1A] p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group border border-white/5"
                >
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#C06842]/5 rounded-full blur-[100px] -mr-40 -mt-40 group-hover:bg-[#C06842]/10 transition-all duration-1000" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <span className="h-4 w-1 bg-[#C06842] rounded-full" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C06842]">Unified Studio Workspace</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-serif font-black tracking-tight leading-tight">Master Workflow</h1>
                            <p className="text-white/40 text-sm max-w-sm leading-relaxed font-medium">Synchronizing your contractor deliverables and independent studio assets in a single operational frame.</p>
                            
                            <div className="flex flex-wrap gap-4 pt-4">
                                <div className="px-6 py-3 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center gap-3 shadow-inner">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.1em]">{ongoingTasks.length} Pending Tasks</span>
                                </div>
                                <div className="px-6 py-3 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center gap-3 shadow-inner">
                                    <ImageIcon size={14} className="text-[#C06842]" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.1em]">{drawings.length} Studio Assets</span>
                                </div>
                            </div>
                        </div>

                        <div className="relative w-56 h-56 group/chart">
                            <svg className="w-full h-full transform -rotate-90 filter drop-shadow-2xl">
                                <circle cx="112" cy="112" r="90" stroke="rgba(255,255,255,0.03)" strokeWidth="14" fill="transparent" />
                                <motion.circle 
                                    cx="112" cy="112" r="90" 
                                    stroke="#C06842" 
                                    strokeWidth="14" 
                                    fill="transparent" 
                                    strokeDasharray={2 * Math.PI * 90}
                                    initial={{ strokeDashoffset: 2 * Math.PI * 90 }}
                                    animate={{ strokeDashoffset: (2 * Math.PI * 90) * (1 - completionRate / 100) }}
                                    transition={{ duration: 2, ease: "circOut" }}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-5xl font-serif font-black">{completionRate}%</span>
                                <span className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40 mt-1">Global Logic</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="flex-1 bg-white p-8 rounded-[3rem] border border-[#E3DACD]/50 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F9F7F2] rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 group-hover:rotate-12 transition-transform">
                                    <ShieldCheck size={28} />
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[#8C7B70]">Artifact Vault</p>
                                    <p className="text-4xl font-serif font-black text-[#2A1F1D]">{approvedTasks.length}</p>
                                </div>
                            </div>
                            <p className="text-[11px] font-bold text-[#8C7B70] mt-4 leading-relaxed">Verified technical drawings successfully deployed to site command.</p>
                        </div>
                    </div>

                    <div className="flex-1 bg-[#FDFCF8] p-8 rounded-[3rem] border-2 border-[#C06842]/10 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
                        <div className="absolute bottom-0 right-0 w-24 h-24 bg-[#E3DACD]/20 blur-2xl rounded-full" />
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="p-4 bg-[#2A1F1D] text-[#C06842] rounded-2xl shadow-xl group-hover:-translate-y-1 transition-transform">
                                    <PencilRuler size={28} />
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[#8C7B70]">Creative Output</p>
                                    <p className="text-4xl font-serif font-black text-[#2A1F1D]">{drawings.length}</p>
                                </div>
                            </div>
                            <p className="text-[11px] font-bold text-[#8C7B70] mt-4 leading-relaxed">Active visualizations and technical plans managed independently.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. STUDIOS CONTROL PANEL */}
            <motion.div 
                layout
                className="bg-white/90 backdrop-blur-2xl border border-[#E3DACD]/60 p-4 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-6"
            >
                <div className="flex items-center gap-8 pl-6 hidden xl:flex">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#2A1F1D] rounded-xl flex items-center justify-center text-white shadow-lg"><Layout size={18} /></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#2A1F1D]">Operational Bridge</span>
                    </div>
                    <div className="h-8 w-[1px] bg-[#E3DACD]" />
                    <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-[#8C7B70]">
                        <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#C06842]" /> 12 Projects</span>
                        <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> 8 Partners</span>
                    </div>
                </div>
                
                <div className="flex-1 max-w-md mx-4 relative hidden lg:block">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B8AFA5]" size={15} />
                    <input 
                        type="text" 
                        placeholder="Search assets or deliverables..." 
                        className="w-full pl-12 pr-6 py-3.5 bg-[#F9F7F2] border border-[#E3DACD]/50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#2A1F1D] focus:border-[#C06842] outline-none transition-all"
                        value={assetSearch}
                        onChange={(e) => setAssetSearch(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                        onClick={() => {
                            setEditingDrawing(null);
                            setFormData({ title: '', description: '', category: 'Floor Plan', is_team_project: false, project_id: '' });
                            setIsUploadModalOpen(true);
                        }}
                        className="flex-1 sm:flex-none px-8 py-4 bg-[#C06842] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[#A65D3B] hover:shadow-2xl shadow-[#C06842]/20 transition-all flex items-center justify-center gap-3 group"
                    >
                        <Plus size={16} className="group-hover:rotate-90 transition-transform duration-500" />
                        New Studio Asset
                    </button>
                    <button className="hidden sm:flex px-8 py-4 bg-white border border-[#E3DACD] text-[#8C7B70] text-[10px] font-black uppercase tracking-widest rounded-2xl hover:border-[#2A1F1D] hover:text-[#2A1F1D] transition-all items-center justify-center gap-3">
                        <Filter size={16} /> Filter Options
                    </button>
                </div>
            </motion.div>

            {/* 3. VISUAL ASSETS STRIP (Consolidated) */}
            <div className="space-y-8">
                <SectionHeader 
                    title="Asset Visualizer" 
                    subtitle="Integrated High-Resolution Previews" 
                    icon={ImageIcon} 
                    extra={
                        <div className="flex gap-2">
                            {['All', 'Floor Plan', '3D Render', 'Elevation'].map(cat => (
                                <button 
                                    key={cat}
                                    onClick={() => setAssetFilter(cat)}
                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${assetFilter === cat ? 'bg-[#2A1F1D] text-white' : 'bg-white text-[#8C7B70] border border-[#E3DACD] hover:border-[#C06842]'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    }
                />
                
                <div className="flex gap-8 overflow-x-auto pb-8 custom-scrollbar scroll-smooth">
                    {filteredAssets.length === 0 && ongoingTasks.filter(t => t.image_path).length === 0 ? (
                        <div className="w-full py-24 text-center bg-[#F9F7F2]/50 rounded-[4rem] border-2 border-dashed border-[#E3DACD]/60 flex flex-col items-center justify-center gap-4 opacity-60">
                            <ImageIcon size={64} className="text-[#E3DACD]" strokeWidth={0.5} />
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#8C7B70]">Workspace Visual Vault Empty</p>
                        </div>
                    ) : (
                        <>
                            {/* Studio Assets (independent) */}
                            {filteredAssets.map(asset => (
                                <motion.div 
                                    key={`drawing-${asset.drawing_id}`}
                                    whileHover={{ y: -12, scale: 1.02 }}
                                    className="relative w-80 h-60 rounded-[3rem] overflow-hidden group shrink-0 shadow-2xl border-4 border-white cursor-pointer bg-[#2A1F1D]"
                                    onClick={() => setSelectedDrawing(asset)}
                                >
                                    <img src={`${import.meta.env.VITE_API_URL}/${asset.file_path}`} alt="Site" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-125 group-hover:rotate-1" />
                                    <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/40 to-transparent">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="px-3 py-1 bg-[#C06842] text-white text-[8px] font-black uppercase tracking-widest rounded-lg">{asset.category}</span>
                                                    {asset.is_team_project && <Users size={12} className="text-blue-400" />}
                                                </div>
                                                <h4 className="text-white font-serif font-black text-base truncate w-40">{asset.title}</h4>
                                            </div>
                                            <div className="p-3 bg-white/10 backdrop-blur-xl rounded-2xl text-white group-hover:bg-[#C06842] transition-colors shadow-2xl">
                                                <Eye size={18} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute top-6 right-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setEditingDrawing(asset); setFormData(asset); setIsUploadModalOpen(true); }}
                                            className="p-3 bg-white rounded-2xl text-blue-600 hover:scale-110 active:scale-95 shadow-xl"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteAsset(asset.drawing_id); }}
                                            className="p-3 bg-white rounded-2xl text-red-600 hover:scale-110 active:scale-95 shadow-xl"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                            
                            {/* Deliverable Evidence (Tasks) */}
                            {ongoingTasks.filter(t => t.image_path).map(task => (
                                <motion.div 
                                    key={`task-${task.task_id}`}
                                    whileHover={{ y: -12 }}
                                    className="relative w-80 h-60 rounded-[3rem] overflow-hidden group shrink-0 shadow-2xl border-4 border-[#F9F7F2] cursor-pointer"
                                    onClick={() => setSelectedTask(task)}
                                >
                                    <img src={`${import.meta.env.VITE_API_URL}/${task.image_path}`} alt="Deliverable" className="w-full h-full object-cover grayscale brightness-50 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700" />
                                    <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-[#2A1F1D] to-transparent">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest rounded-lg mb-2 inline-block">Contractor Milestone</span>
                                                <h4 className="text-white font-bold text-sm truncate w-40">{task.title}</h4>
                                            </div>
                                            <div className="p-3 bg-white text-[#2A1F1D] rounded-2xl shadow-xl transition-all">
                                                <CheckCircle size={18} className="text-emerald-500" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* 4. DUAL REGISTRY: DELIVERABLES VS ASSETS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                
                {/* PART A: Contractor Deliverables */}
                <div className="space-y-10">
                    <SectionHeader title="Contractor Deliverables" subtitle="Tasks assigned to you by project managers" icon={ShieldCheck} />
                    <div className="space-y-5">
                        {tasks.length === 0 ? (
                            <div className="py-24 text-center bg-white rounded-[3rem] border border-[#E3DACD]/40 opacity-50 flex flex-col items-center gap-4">
                                <ClipboardList size={40} className="text-[#B8AFA5]" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#8C7B70]">Registry Clear</p>
                            </div>
                        ) : (
                            tasks.map(task => (
                                <motion.div 
                                    key={task.task_id}
                                    whileHover={{ scale: 1.01, x: 10 }}
                                    className={`p-8 rounded-[2.5rem] border transition-all ${task.status === 'Rejected' ? 'bg-red-50/20 border-red-100 shadow-xl shadow-red-500/5' : task.status === 'Approved' ? 'bg-emerald-50/20 border-emerald-100' : 'bg-white border-[#E3DACD]/50 shadow-sm hover:shadow-xl'}`}
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-5">
                                            <div className={`p-4 rounded-2xl shadow-lg transition-transform ${task.status === 'Rejected' ? 'bg-red-600 text-white' : 'bg-[#2A1F1D] text-[#C06842]'}`}>
                                                {task.status === 'Rejected' ? <AlertOctagon size={22} /> : <Briefcase size={22} />}
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-[#2A1F1D] tracking-tight">{task.title}</h4>
                                                <p className="text-[10px] text-[#C06842] font-black uppercase tracking-[0.2em] mt-1 italic">{task.project_name}</p>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border ${task.status === 'Approved' ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' : task.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-100 text-amber-600 border-amber-200'}`}>
                                            {task.status}
                                        </div>
                                    </div>
                                    
                                    <p className="text-sm text-[#8C7B70] font-medium leading-[1.6] mb-8 line-clamp-2">
                                        {task.description || "Active milestone under operational review in site command."}
                                    </p>

                                    <div className="flex items-center justify-between pt-6 border-t border-[#E3DACD]/30">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2A1F1D] to-[#4A342E] flex items-center justify-center text-white text-[10px] font-black shadow-lg">{task.assigner_name?.[0]}</div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black uppercase text-[#2A1F1D] tracking-widest leading-none">{task.assigner_name}</span>
                                                <span className="text-[8px] font-bold text-[#8C7B70] mt-1">Management</span>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedTask(task)} className="text-[10px] font-black uppercase tracking-widest text-[#C06842] hover:text-[#2A1F1D] flex items-center gap-2 group/btn">
                                            Inspector Mode <ArrowRight size={14} className="group-hover/btn:translate-x-2 transition-transform" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* PART B: Studio Registry (Independent Assets) */}
                <div className="space-y-10">
                    <SectionHeader title="Studio Registry" subtitle="Your independent architectural plans/assets" icon={PencilRuler} />
                    <div className="space-y-4">
                        {drawings.length === 0 ? (
                            <div className="py-24 text-center bg-[#FDFCF8] rounded-[3rem] border border-dashed border-[#E3DACD]/60 flex flex-col items-center gap-4">
                                <Plus size={40} className="text-[#C06842] opacity-30" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#8C7B70]">No Independent Assets Logged</p>
                            </div>
                        ) : (
                            drawings.slice(0, 6).map(asset => (
                                <motion.div 
                                    key={asset.drawing_id} 
                                    whileHover={{ x: -10 }}
                                    className="p-5 bg-white border border-[#E3DACD]/40 rounded-3xl flex items-center justify-between group hover:shadow-2xl hover:border-[#C06842]/30 transition-all cursor-pointer" 
                                    onClick={() => setSelectedDrawing(asset)}
                                >
                                    <div className="flex items-center gap-6 overflow-hidden">
                                        <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl group-hover:scale-105 transition-transform shrink-0 bg-[#2A1F1D] border-2 border-white">
                                            <img src={`${import.meta.env.VITE_API_URL}/${asset.file_path}`} alt="Asset" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="truncate">
                                            <h4 className="text-base font-bold text-[#2A1F1D] mb-2 truncate group-hover:text-[#C06842] transition-colors">{asset.title}</h4>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-[#C06842]">{asset.category}</span>
                                                <span className="h-1 w-1 bg-[#E3DACD] rounded-full" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-[#B8AFA5]">{new Date(asset.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button className="p-3 bg-white text-[#2A1F1D] hover:text-[#C06842] rounded-2xl shadow-xl border border-[#E3DACD]/50 transition-all"><Eye size={18} /></button>
                                        <button className="p-3 bg-white text-[#2A1F1D] hover:text-[#C06842] rounded-2xl shadow-xl border border-[#E3DACD]/50 transition-all"><ArrowRight size={18} /></button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                        {drawings.length > 6 && (
                            <button className="w-full py-5 bg-[#FDFCF8] border border-[#E3DACD] rounded-3xl text-[10px] font-black uppercase tracking-widest text-[#8C7B70] hover:bg-white hover:border-[#C06842] hover:text-[#2A1F1D] transition-all">
                                View Entire Studio Library ({drawings.length})
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* 5. MODALS (Architectural Precision) */}
            <AnimatePresence>
                {/* 1. Upload/Edit Asset Modal */}
                {isUploadModalOpen && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 lg:p-10 bg-[#2A1F1D]/90 backdrop-blur-2xl">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="bg-white rounded-[4rem] w-full max-w-2xl overflow-hidden shadow-[0_50px_150px_-20px_rgba(0,0,0,0.5)] border-4 border-white flex flex-col max-h-[90vh]"
                        >
                            <div className="shrink-0 p-10 border-b border-[#E3DACD]/30 flex justify-between items-center bg-[#FDFCF8]">
                                <div className="flex items-center gap-6">
                                    <div className="p-5 bg-[#2A1F1D] text-[#C06842] rounded-[2rem] shadow-2xl shadow-[#C06842]/20"><PencilRuler size={32} /></div>
                                    <div>
                                        <h3 className="text-3xl font-black font-serif text-[#2A1F1D] tracking-tighter">
                                            {editingDrawing ? 'Refine Asset' : 'Inject New Asset'}
                                        </h3>
                                        <p className="text-[10px] text-[#C06842] font-black uppercase tracking-[0.3em] mt-1 italic">Publishing to the Studio Registry</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsUploadModalOpen(false)} className="p-4 hover:bg-red-50 text-[#8C7B70] hover:text-red-600 rounded-full transition-all"><X size={36} /></button>
                            </div>
                            
                            <form onSubmit={handleUpload} className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-12">
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#8C7B70] ml-3">Asset Designation (Title)</label>
                                        <input required type="text" className="w-full px-8 py-5 bg-[#FDFCF8] border-2 border-[#E3DACD]/60 rounded-3xl text-sm font-bold text-[#2A1F1D] focus:border-[#C06842] outline-none" placeholder="e.g., Structure Analysis - Phase 1" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-[#8C7B70] ml-3">Association</label>
                                            <select className="w-full px-8 py-5 bg-[#FDFCF8] border-2 border-[#E3DACD]/60 rounded-3xl text-sm font-bold text-[#2A1F1D] focus:border-[#C06842] outline-none appearance-none cursor-pointer" value={formData.project_id} onChange={(e) => setFormData({...formData, project_id: e.target.value})}>
                                                <option value="">Independent Study</option>
                                                {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-[#8C7B70] ml-3">Taxonomy</label>
                                            <select className="w-full px-8 py-5 bg-[#FDFCF8] border-2 border-[#E3DACD]/60 rounded-3xl text-sm font-bold text-[#2A1F1D] focus:border-[#C06842] outline-none appearance-none cursor-pointer" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                                                <option value="Floor Plan">Floor Plan</option>
                                                <option value="Elevation">Elevation</option>
                                                <option value="Structural">Structural</option>
                                                <option value="3D Render">3D Render</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>

                                    {!editingDrawing && (
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-[#8C7B70] ml-3">Technical Data Source (Blueprint/Image)</label>
                                            <div className="relative group/up h-56">
                                                <input required type="file" accept="image/*,.pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={(e) => setUploadFile(e.target.files[0])} />
                                                <div className="w-full h-full border-4 border-dashed border-[#E3DACD] rounded-[3rem] flex flex-col items-center justify-center bg-[#FDFCF8] group-hover/up:border-[#C06842] group-hover/up:bg-[#C06842]/5 transition-all">
                                                    <Camera size={64} className="text-[#C06842]/20 mb-4 group-hover/up:scale-110 group-hover/up:text-[#C06842] transition-all" />
                                                    <span className="text-xs font-black uppercase tracking-widest text-[#2A1F1D]">{uploadFile ? uploadFile.name : 'Link Visual Frame'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 p-6 bg-[#F9F7F2] rounded-[2.5rem] border border-[#E3DACD]">
                                        <input type="checkbox" id="broadcast" className="w-6 h-6 text-[#C06842] focus:ring-[#C06842] border-[#E3DACD] rounded-lg cursor-pointer" checked={formData.is_team_project} onChange={(e) => setFormData({...formData, is_team_project: e.target.checked})} disabled={!formData.project_id} />
                                        <label htmlFor="broadcast" className={`flex-1 cursor-pointer ${!formData.project_id ? 'opacity-30' : ''}`}>
                                            <p className="text-base font-black text-[#2A1F1D] tracking-tight">Synchronize with Project Team</p>
                                            <p className="text-[11px] text-[#8C7B70] font-medium italic mt-0.5">Publish this asset to the common visual data pool for construction stakeholders.</p>
                                        </label>
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-7 bg-[#C06842] text-white font-black text-xs uppercase tracking-[0.5em] rounded-[2.5rem] hover:bg-[#A65D3B] transition-all shadow-3xl shadow-[#C06842]/30 flex items-center justify-center gap-3 active:scale-[0.98]">
                                    {editingDrawing ? <Save size={20} /> : <Upload size={20} />} 
                                    {editingDrawing ? 'Commit Refinements' : 'Initialize Studio Upload'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* 2. Drawing Context Inspector */}
                {selectedDrawing && (
                    <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-[#1A1A1A]/95 backdrop-blur-3xl" onClick={() => setSelectedDrawing(null)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#FDFCF8] rounded-[4.5rem] w-full max-w-5xl overflow-hidden shadow-6xl border-8 border-white flex flex-col lg:flex-row h-[90vh] lg:h-auto" onClick={e => e.stopPropagation()}>
                            <div className="lg:w-3/5 h-full min-h-[400px] bg-[#2A1F1D] relative shadow-inner">
                                <img src={`${import.meta.env.VITE_API_URL}/${selectedDrawing.file_path}`} alt="Detail" className="w-full h-full object-contain" />
                                <div className="absolute top-10 left-10 flex gap-4">
                                    <span className="px-8 py-3 bg-[#C06842] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl">{selectedDrawing.category}</span>
                                    {selectedDrawing.is_team_project && <span className="px-6 py-3 bg-white/20 backdrop-blur-2xl text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/20 flex items-center gap-2"><Users size={14} /> Shared Pool</span>}
                                </div>
                                <button onClick={() => setSelectedDrawing(null)} className="lg:hidden absolute top-8 right-8 p-4 bg-white/10 backdrop-blur-md rounded-full text-white"><X size={28} /></button>
                            </div>
                            <div className="lg:w-2/5 p-16 flex flex-col justify-between bg-white border-l border-[#E3DACD]/50">
                                <div>
                                    <div className="flex justify-between items-start mb-10">
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C06842]">{selectedDrawing.project_name || 'Independent Asset'}</p>
                                            <h3 className="text-5xl font-black font-serif text-[#2A1F1D] leading-[0.9] tracking-tighter">{selectedDrawing.title}</h3>
                                        </div>
                                        <button onClick={() => setSelectedDrawing(null)} className="hidden lg:block p-4 hover:bg-red-50 text-[#8C7B70] hover:text-red-500 rounded-full transition-all duration-300"><X size={36} /></button>
                                    </div>
                                    <div className="space-y-8 mb-16">
                                        <div className="flex items-center gap-6 p-6 bg-[#F9F7F2] rounded-3xl border border-[#E3DACD]/40">
                                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#C06842] shadow-xl"><Calendar size={28} /></div>
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#8C7B70] mb-1">Production Date</p>
                                                <p className="text-lg font-bold text-[#2A1F1D]">{new Date(selectedDrawing.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8C7B70]">Technical Manifesto</p>
                                            <p className="text-lg text-[#5D4037] leading-relaxed font-serif italic text-left">"{selectedDrawing.description || "Inherent technical logic applied with architectural precision."}"</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setSelectedDrawing(null)} className="flex-1 py-6 border-2 border-[#E3DACD] text-[#8C7B70] rounded-[2.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-[#F9F7F2] transition-all">Dismiss Inspector</button>
                                    <a href={`${import.meta.env.VITE_API_URL}/${selectedDrawing.file_path}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-6 bg-[#2A1F1D] text-white rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-[#C06842] transition-all shadow-3xl shadow-black/20"><Download size={20} /> High-Res File</a>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* 3. Task Inspector (Existing) */}
                {selectedTask && (
                    <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-[#2A1F1D]/90 backdrop-blur-2xl" onClick={() => setSelectedTask(null)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#FDFCF8] rounded-[4rem] w-full max-w-4xl overflow-hidden shadow-3xl border-4 border-white flex flex-col lg:flex-row" onClick={e => e.stopPropagation()}>
                            <div className="lg:w-1/2 h-full min-h-[400px] bg-[#2A1F1D] relative shadow-inner">
                                {selectedTask.image_path ? (
                                    <img src={`${import.meta.env.VITE_API_URL}/${selectedTask.image_path}`} alt="Detail" className="w-full h-full object-contain" />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-white/10"><ImageIcon size={96} /></div>
                                )}
                                <div className="absolute top-10 left-10"><span className="px-6 py-2.5 bg-white text-[#C06842] rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">Deliverable</span></div>
                            </div>
                            <div className="lg:w-1/2 p-12 flex flex-col justify-between">
                                <div><div className="flex justify-between items-start mb-8"><div><p className="text-[#C06842] text-[10px] font-black uppercase tracking-[0.2em] mb-2">{selectedTask.project_name}</p><h3 className="text-3xl font-black font-serif text-[#2A1F1D] leading-tight tracking-tighter">{selectedTask.title}</h3></div><button onClick={() => setSelectedTask(null)} className="p-3 hover:bg-red-50 text-[#B8AFA5] hover:text-red-500 rounded-full transition-all"><X size={32} /></button></div><div className="space-y-8 mb-12"><div className="flex items-center gap-6"><div className="p-4 bg-[#F9F7F2] rounded-2xl border border-[#E3DACD]/50"><Calendar size={24} className="text-[#C06842]" /></div><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8C7B70] mb-1">Archive Date</p><p className="text-sm font-bold text-[#2A1F1D]">{new Date(selectedTask.updated_at).toLocaleDateString()}</p></div></div><div className="space-y-4"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8C7B70]">Milestone Notes</p><p className="text-sm text-[#5D4037] leading-relaxed font-medium italic">"{selectedTask.description || "No tactical notes reported."}"</p></div></div></div><div className="flex gap-4"><button onClick={() => setSelectedTask(null)} className="flex-1 py-5 bg-white border-2 border-[#E3DACD] text-[#8C7B70] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#F9F7F2] transition-all">Close Inspector</button>{selectedTask.image_path && ( <a href={`${import.meta.env.VITE_API_URL}/${selectedTask.image_path}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-5 bg-[#2A1F1D] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#A65D3B] transition-all shadow-xl shadow-black/20"><Download size={18} /> Asset Copy</a> )}</div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ArchitectWorkboard;
