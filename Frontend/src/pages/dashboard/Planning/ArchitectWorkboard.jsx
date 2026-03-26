import React, { useState, useEffect, useCallback } from 'react';
import { 
    LayoutGrid, CheckCircle, Clock, ChevronRight,
    FileText, Eye, MapPin, Calendar, ClipboardList,
    TrendingUp, Star, Award, User, Users, Upload, 
    Plus, X, Image as ImageIcon, Briefcase, Camera, PencilRuler,
    Zap, Activity, Layout, ShieldCheck, ArrowRight, AlertOctagon, Download,
    Search, Filter, Lock, Trash2, Edit3, Save, FolderOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
        if (!window.confirm('Delete this drawing permanently?')) return;
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
    
    const totalEntities = tasks.length + drawings.length;
    const completionRate = totalEntities > 0 ? Math.round(((approvedTasks.length + drawings.filter(d => d.is_team_project).length) / totalEntities) * 100) : 0;

    const filteredAssets = drawings.filter(d => {
        const matchesSearch = d.title?.toLowerCase().includes(assetSearch.toLowerCase());
        const matchesCat = assetFilter === 'All' || d.category === assetFilter;
        return matchesSearch && matchesCat;
    });

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-44 opacity-80">
            <div className="w-12 h-12 border-[3px] border-[#E3DACD] border-t-[#C06842] rounded-full animate-spin mb-6" />
            <p className="text-xs font-bold text-[#8C7B70]">Loading your workspace...</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-20 max-w-[1600px] mx-auto text-left">
            
            {/* ─── 1. WELCOME HEADER ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-2 bg-[#2A1F1D] p-8 rounded-2xl text-white relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-72 h-72 bg-[#C06842]/8 rounded-full blur-[80px] -mr-20 -mt-20" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div className="space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C06842]">Architect Workspace</p>
                            <h1 className="text-3xl font-serif font-bold tracking-tight">Welcome back, {currentUser?.name?.split(' ')[0]}</h1>
                            <p className="text-white/40 text-sm max-w-sm leading-relaxed">Manage your tasks, drawings, and project deliverables — all in one place.</p>
                            
                            <div className="flex flex-wrap gap-3 pt-2">
                                <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-wide">{ongoingTasks.length} Pending Tasks</span>
                                </div>
                                <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
                                    <PencilRuler size={12} className="text-[#C06842]" />
                                    <span className="text-[10px] font-bold uppercase tracking-wide">{drawings.length} Drawings</span>
                                </div>
                            </div>
                        </div>

                        {/* Progress Ring */}
                        <div className="relative w-36 h-36 shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="72" cy="72" r="60" stroke="rgba(255,255,255,0.06)" strokeWidth="10" fill="transparent" />
                                <motion.circle 
                                    cx="72" cy="72" r="60" 
                                    stroke="#C06842" 
                                    strokeWidth="10" 
                                    fill="transparent" 
                                    strokeDasharray={2 * Math.PI * 60}
                                    initial={{ strokeDashoffset: 2 * Math.PI * 60 }}
                                    animate={{ strokeDashoffset: (2 * Math.PI * 60) * (1 - completionRate / 100) }}
                                    transition={{ duration: 1.5, ease: "circOut" }}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-serif font-bold">{completionRate}%</span>
                                <span className="text-[8px] font-bold uppercase tracking-widest opacity-40 mt-0.5">Progress</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Quick Stats Cards */}
                <div className="flex flex-col gap-4">
                    <div className="flex-1 bg-white p-6 rounded-2xl border border-[#E3DACD]/50 hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                                <CheckCircle size={20} />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8C7B70]">Completed</p>
                                <p className="text-3xl font-serif font-bold text-[#2A1F1D]">{approvedTasks.length}</p>
                            </div>
                        </div>
                        <p className="text-[11px] text-[#8C7B70] mt-3 leading-relaxed">Tasks approved and delivered to site.</p>
                    </div>

                    <div className="flex-1 bg-white p-6 rounded-2xl border border-[#E3DACD]/50 hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-[#C06842]/10 text-[#C06842] rounded-xl">
                                <PencilRuler size={20} />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8C7B70]">My Drawings</p>
                                <p className="text-3xl font-serif font-bold text-[#2A1F1D]">{drawings.length}</p>
                            </div>
                        </div>
                        <p className="text-[11px] text-[#8C7B70] mt-3 leading-relaxed">Plans and renders in your library.</p>
                    </div>
                </div>
            </div>

            {/* ─── 2. QUICK ACTION BAR ─── */}
            <div className="bg-white border border-[#E3DACD]/50 p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 pl-2">
                    <div className="w-9 h-9 bg-[#2A1F1D] rounded-lg flex items-center justify-center text-white">
                        <FolderOpen size={16} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#2A1F1D] hidden xl:block">My Projects</span>
                    <div className="hidden xl:flex items-center gap-3 ml-4 text-[10px] font-bold text-[#8C7B70]">
                        <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#C06842]" />{projects.length} Projects</span>
                        <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" />{tasks.length} Tasks</span>
                    </div>
                </div>
                
                {/* Search */}
                <div className="flex-1 max-w-sm mx-4 relative hidden lg:block">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B8AFA5]" size={14} />
                    <input 
                        type="text" 
                        placeholder="Search drawings..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-[#F9F7F2] border border-[#E3DACD]/50 rounded-xl text-xs font-medium text-[#2A1F1D] focus:border-[#C06842] outline-none transition-colors"
                        value={assetSearch}
                        onChange={(e) => setAssetSearch(e.target.value)}
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button 
                        onClick={() => {
                            setEditingDrawing(null);
                            setFormData({ title: '', description: '', category: 'Floor Plan', is_team_project: false, project_id: '' });
                            setIsUploadModalOpen(true);
                        }}
                        className="flex-1 sm:flex-none px-5 py-2.5 bg-[#C06842] text-white text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-[#A65D3B] transition-all flex items-center justify-center gap-2 shadow-md shadow-[#C06842]/15"
                    >
                        <Plus size={14} /> Create New Drawing
                    </button>
                </div>
            </div>

            {/* ─── 3. DESIGN PREVIEW ─── */}
            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#2A1F1D] text-[#C06842] rounded-xl">
                            <ImageIcon size={18} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold font-serif text-[#2A1F1D]">Design Preview</h3>
                            <p className="text-[10px] text-[#8C7B70] font-medium mt-0.5">Browse all your drawings and task deliverables</p>
                        </div>
                    </div>
                    <div className="flex gap-1.5">
                        {['All', 'Floor Plan', '3D Render', 'Elevation'].map(cat => (
                            <button 
                                key={cat}
                                onClick={() => setAssetFilter(cat)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${assetFilter === cat ? 'bg-[#2A1F1D] text-white' : 'bg-white text-[#8C7B70] border border-[#E3DACD] hover:border-[#C06842]'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Preview Gallery */}
                <div className="flex gap-5 overflow-x-auto pb-4 custom-scrollbar scroll-smooth">
                    {filteredAssets.length === 0 && ongoingTasks.filter(t => t.image_path).length === 0 ? (
                        <div className="w-full py-16 text-center bg-[#F9F7F2]/60 rounded-2xl border-2 border-dashed border-[#E3DACD]/50 flex flex-col items-center justify-center gap-3">
                            <div className="p-5 bg-white rounded-2xl border border-[#E3DACD]/30">
                                <ImageIcon size={40} className="text-[#E3DACD]" />
                            </div>
                            <p className="text-sm font-bold text-[#8C7B70]">Select a drawing to preview</p>
                            <p className="text-xs text-[#B8AFA5]">Upload your first drawing using the button above</p>
                        </div>
                    ) : (
                        <>
                            {/* My Drawings */}
                            {filteredAssets.map(asset => (
                                <motion.div 
                                    key={`drawing-${asset.drawing_id}`}
                                    whileHover={{ y: -6 }}
                                    className="relative w-72 h-52 rounded-2xl overflow-hidden group shrink-0 shadow-lg border-2 border-white cursor-pointer bg-[#2A1F1D]"
                                    onClick={() => setSelectedDrawing(asset)}
                                >
                                    <img src={`${import.meta.env.VITE_API_URL}/${asset.file_path}`} alt="Drawing" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/50 to-transparent">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                    <span className="px-2 py-0.5 bg-[#C06842] text-white text-[8px] font-bold uppercase tracking-wide rounded">{asset.category}</span>
                                                    {asset.is_team_project && <Users size={10} className="text-blue-400" />}
                                                </div>
                                                <h4 className="text-white font-bold text-sm truncate w-36">{asset.title}</h4>
                                            </div>
                                            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl text-white group-hover:bg-[#C06842] transition-colors">
                                                <Eye size={14} />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Hover Actions */}
                                    <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-3 group-hover:translate-x-0">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setEditingDrawing(asset); setFormData(asset); setIsUploadModalOpen(true); }}
                                            className="p-2 bg-white rounded-lg text-blue-600 hover:scale-110 shadow-md"
                                        >
                                            <Edit3 size={13} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteAsset(asset.drawing_id); }}
                                            className="p-2 bg-white rounded-lg text-red-600 hover:scale-110 shadow-md"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                            
                            {/* Task Deliverables */}
                            {ongoingTasks.filter(t => t.image_path).map(task => (
                                <motion.div 
                                    key={`task-${task.task_id}`}
                                    whileHover={{ y: -6 }}
                                    className="relative w-72 h-52 rounded-2xl overflow-hidden group shrink-0 shadow-lg border-2 border-[#F9F7F2] cursor-pointer"
                                    onClick={() => setSelectedTask(task)}
                                >
                                    <img src={`${import.meta.env.VITE_API_URL}/${task.image_path}`} alt="Task" className="w-full h-full object-cover grayscale brightness-50 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-500" />
                                    <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-[#2A1F1D] to-transparent">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-[8px] font-bold uppercase tracking-wide rounded mb-1.5 inline-block">Task Deliverable</span>
                                                <h4 className="text-white font-bold text-sm truncate w-36">{task.title}</h4>
                                            </div>
                                            <div className="p-2.5 bg-white text-[#2A1F1D] rounded-xl shadow-lg">
                                                <CheckCircle size={14} className="text-emerald-500" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* ─── 4. TWO-COLUMN: ASSIGNED TASKS + MY DRAWINGS LIST ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* LEFT: Assigned Tasks */}
                <div className="space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#2A1F1D] text-emerald-400 rounded-xl">
                            <ClipboardList size={18} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold font-serif text-[#2A1F1D]">Assigned Tasks</h3>
                            <p className="text-[10px] text-[#8C7B70] font-medium mt-0.5">Tasks from your project managers</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {tasks.length === 0 ? (
                            <div className="py-16 text-center bg-white rounded-2xl border border-[#E3DACD]/40 flex flex-col items-center gap-3">
                                <div className="p-4 bg-[#F9F7F2] rounded-2xl">
                                    <ClipboardList size={32} className="text-[#B8AFA5]" />
                                </div>
                                <p className="text-sm font-bold text-[#8C7B70]">No tasks assigned yet</p>
                                <p className="text-xs text-[#B8AFA5]">When a contractor assigns you work, it'll appear here.</p>
                            </div>
                        ) : (
                            tasks.map(task => (
                                <motion.div 
                                    key={task.task_id}
                                    whileHover={{ x: 4 }}
                                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                                        task.status === 'Rejected' ? 'bg-red-50/30 border-red-100 hover:shadow-lg' :
                                        task.status === 'Approved' ? 'bg-emerald-50/30 border-emerald-100' :
                                        'bg-white border-[#E3DACD]/50 hover:shadow-lg hover:border-[#C06842]/20'
                                    }`}
                                    onClick={() => setSelectedTask(task)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl ${task.status === 'Rejected' ? 'bg-red-100 text-red-600' : 'bg-[#F9F7F2] text-[#C06842]'}`}>
                                                {task.status === 'Rejected' ? <AlertOctagon size={18} /> : <Briefcase size={18} />}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-[#2A1F1D]">{task.title}</h4>
                                                <p className="text-[10px] text-[#C06842] font-bold mt-0.5">{task.project_name}</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase border ${
                                            task.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                            task.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                                            'bg-amber-50 text-amber-600 border-amber-200'
                                        }`}>
                                            {task.status}
                                        </span>
                                    </div>
                                    
                                    <p className="text-xs text-[#8C7B70] leading-relaxed mb-3 line-clamp-2">
                                        {task.description || "No description provided."}
                                    </p>

                                    <div className="flex items-center justify-between pt-3 border-t border-[#E3DACD]/30">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#2A1F1D] to-[#4A342E] flex items-center justify-center text-white text-[9px] font-bold">{task.assigner_name?.[0]}</div>
                                            <span className="text-[10px] font-bold text-[#2A1F1D]">{task.assigner_name}</span>
                                        </div>
                                        <span className="text-[10px] text-[#C06842] font-bold flex items-center gap-1 hover:gap-2 transition-all">
                                            View Details <ArrowRight size={12} />
                                        </span>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT: My Drawings List */}
                <div className="space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#2A1F1D] text-[#C06842] rounded-xl">
                            <PencilRuler size={18} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold font-serif text-[#2A1F1D]">My Drawings</h3>
                            <p className="text-[10px] text-[#8C7B70] font-medium mt-0.5">Your uploaded plans and renders</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {drawings.length === 0 ? (
                            <div className="py-16 text-center bg-[#FDFCF8] rounded-2xl border border-dashed border-[#E3DACD]/50 flex flex-col items-center gap-3">
                                <div className="p-4 bg-white rounded-2xl border border-[#E3DACD]/30">
                                    <Plus size={32} className="text-[#C06842]/40" />
                                </div>
                                <p className="text-sm font-bold text-[#8C7B70]">No drawings yet</p>
                                <p className="text-xs text-[#B8AFA5]">Click "Create New Drawing" to upload your first plan.</p>
                            </div>
                        ) : (
                            drawings.slice(0, 6).map(asset => (
                                <motion.div 
                                    key={asset.drawing_id} 
                                    whileHover={{ x: 4 }}
                                    className="p-4 bg-white border border-[#E3DACD]/40 rounded-2xl flex items-center justify-between group hover:shadow-lg hover:border-[#C06842]/20 transition-all cursor-pointer" 
                                    onClick={() => setSelectedDrawing(asset)}
                                >
                                    <div className="flex items-center gap-4 overflow-hidden">
                                        <div className="w-16 h-16 rounded-xl overflow-hidden shadow-md group-hover:scale-105 transition-transform shrink-0 bg-[#F9F7F2] border border-[#E3DACD]/30">
                                            <img src={`${import.meta.env.VITE_API_URL}/${asset.file_path}`} alt="Drawing" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="truncate">
                                            <h4 className="text-sm font-bold text-[#2A1F1D] truncate group-hover:text-[#C06842] transition-colors">{asset.title}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[9px] font-bold uppercase tracking-wide text-[#C06842]">{asset.category}</span>
                                                <span className="h-1 w-1 bg-[#E3DACD] rounded-full" />
                                                <span className="text-[9px] font-bold text-[#B8AFA5]">{new Date(asset.created_at).toLocaleDateString()}</span>
                                                {asset.is_team_project && (
                                                    <>
                                                        <span className="h-1 w-1 bg-[#E3DACD] rounded-full" />
                                                        <span className="text-[9px] font-bold text-blue-500 flex items-center gap-0.5"><Users size={9} /> Shared</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-3">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setEditingDrawing(asset); setFormData(asset); setIsUploadModalOpen(true); }}
                                            className="p-2 bg-[#F9F7F2] text-[#2A1F1D] hover:text-blue-600 rounded-lg transition-colors"
                                        ><Edit3 size={14} /></button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteAsset(asset.drawing_id); }}
                                            className="p-2 bg-[#F9F7F2] text-[#2A1F1D] hover:text-red-600 rounded-lg transition-colors"
                                        ><Trash2 size={14} /></button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                        {drawings.length > 6 && (
                            <button className="w-full py-3.5 bg-[#F9F7F2] border border-[#E3DACD] rounded-xl text-xs font-bold text-[#8C7B70] hover:bg-white hover:border-[#C06842] hover:text-[#2A1F1D] transition-all">
                                View All Drawings ({drawings.length})
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── MODALS ─── */}
            <AnimatePresence>
                {/* Upload / Edit Drawing Modal */}
                {isUploadModalOpen && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 lg:p-8 bg-[#2A1F1D]/70 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                        >
                            <div className="shrink-0 p-6 border-b border-[#E3DACD]/30 flex justify-between items-center bg-[#FDFCF8]">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-[#2A1F1D] text-[#C06842] rounded-xl">
                                        <PencilRuler size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold font-serif text-[#2A1F1D]">
                                            {editingDrawing ? 'Edit Drawing' : 'Upload New Drawing'}
                                        </h3>
                                        <p className="text-[10px] text-[#8C7B70] font-medium mt-0.5">
                                            {editingDrawing ? 'Update drawing details' : 'Add a new drawing to your library'}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setIsUploadModalOpen(false)} className="p-2 hover:bg-red-50 text-[#8C7B70] hover:text-red-600 rounded-lg transition-all">
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <form onSubmit={handleUpload} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#8C7B70]">Title</label>
                                        <input required type="text" className="w-full px-4 py-3 bg-[#FDFCF8] border border-[#E3DACD] rounded-xl text-sm font-medium text-[#2A1F1D] focus:border-[#C06842] outline-none" placeholder="e.g., Ground Floor Layout" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#8C7B70]">Linked Project</label>
                                            <select className="w-full px-4 py-3 bg-[#FDFCF8] border border-[#E3DACD] rounded-xl text-sm font-medium text-[#2A1F1D] focus:border-[#C06842] outline-none appearance-none cursor-pointer" value={formData.project_id} onChange={(e) => setFormData({...formData, project_id: e.target.value})}>
                                                <option value="">Personal (No Project)</option>
                                                {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#8C7B70]">Category</label>
                                            <select className="w-full px-4 py-3 bg-[#FDFCF8] border border-[#E3DACD] rounded-xl text-sm font-medium text-[#2A1F1D] focus:border-[#C06842] outline-none appearance-none cursor-pointer" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                                                <option value="Floor Plan">Floor Plan</option>
                                                <option value="Elevation">Elevation</option>
                                                <option value="Structural">Structural</option>
                                                <option value="3D Render">3D Render</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#8C7B70]">Description</label>
                                        <textarea className="w-full px-4 py-3 bg-[#FDFCF8] border border-[#E3DACD] rounded-xl text-sm font-medium text-[#2A1F1D] focus:border-[#C06842] outline-none h-20 resize-none" placeholder="Add a short note about this drawing..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
                                    </div>

                                    {!editingDrawing && (
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#8C7B70]">Drawing File</label>
                                            <div className="relative group/up">
                                                <input required type="file" accept="image/*,.pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={(e) => setUploadFile(e.target.files[0])} />
                                                <div className="w-full py-10 border-2 border-dashed border-[#E3DACD] rounded-xl flex flex-col items-center justify-center bg-[#FDFCF8] group-hover/up:border-[#C06842] group-hover/up:bg-[#C06842]/5 transition-all">
                                                    <Upload size={28} className="text-[#C06842]/30 mb-2 group-hover/up:text-[#C06842] transition-colors" />
                                                    <span className="text-xs font-bold text-[#8C7B70]">{uploadFile ? uploadFile.name : 'Choose file or drag & drop'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 p-4 bg-[#F9F7F2] rounded-xl border border-[#E3DACD]/50">
                                        <input type="checkbox" id="broadcast" className="w-5 h-5 text-[#C06842] focus:ring-[#C06842] border-[#E3DACD] rounded cursor-pointer" checked={formData.is_team_project} onChange={(e) => setFormData({...formData, is_team_project: e.target.checked})} disabled={!formData.project_id} />
                                        <label htmlFor="broadcast" className={`flex-1 cursor-pointer ${!formData.project_id ? 'opacity-30' : ''}`}>
                                            <p className="text-sm font-bold text-[#2A1F1D]">Share with Team</p>
                                            <p className="text-[10px] text-[#8C7B70] mt-0.5">Visible to other team members on this project.</p>
                                        </label>
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-4 bg-[#C06842] text-white font-bold uppercase tracking-wider rounded-xl hover:bg-[#A65D3B] transition-all shadow-lg shadow-[#C06842]/20 flex items-center justify-center gap-2 text-sm">
                                    {editingDrawing ? <Save size={16} /> : <Upload size={16} />} 
                                    {editingDrawing ? 'Save Changes' : 'Upload Drawing'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Drawing Detail Modal */}
                {selectedDrawing && (
                    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-[#1A1A1A]/90 backdrop-blur-xl" onClick={() => setSelectedDrawing(null)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col lg:flex-row max-h-[85vh]" onClick={e => e.stopPropagation()}>
                            <div className="lg:w-3/5 h-80 lg:h-auto bg-[#2A1F1D] relative">
                                <img src={`${import.meta.env.VITE_API_URL}/${selectedDrawing.file_path}`} alt="Detail" className="w-full h-full object-contain" />
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <span className="px-3 py-1.5 bg-[#C06842] text-white rounded-lg text-[10px] font-bold uppercase">{selectedDrawing.category}</span>
                                    {selectedDrawing.is_team_project && <span className="px-3 py-1.5 bg-white/20 backdrop-blur-md text-white rounded-lg text-[10px] font-bold uppercase flex items-center gap-1"><Users size={10} /> Shared</span>}
                                </div>
                                <button onClick={() => setSelectedDrawing(null)} className="lg:hidden absolute top-4 right-4 p-2 bg-white/10 backdrop-blur-md rounded-lg text-white"><X size={20} /></button>
                            </div>
                            <div className="lg:w-2/5 p-8 flex flex-col justify-between bg-white overflow-y-auto">
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#C06842]">{selectedDrawing.project_name || 'Personal Drawing'}</p>
                                            <h3 className="text-2xl font-bold font-serif text-[#2A1F1D] leading-tight">{selectedDrawing.title}</h3>
                                        </div>
                                        <button onClick={() => setSelectedDrawing(null)} className="hidden lg:block p-2 hover:bg-red-50 text-[#8C7B70] hover:text-red-500 rounded-lg transition-all"><X size={20} /></button>
                                    </div>
                                    <div className="space-y-5 mb-8">
                                        <div className="flex items-center gap-4 p-4 bg-[#F9F7F2] rounded-xl border border-[#E3DACD]/40">
                                            <div className="p-2.5 bg-white rounded-lg text-[#C06842] shadow-sm"><Calendar size={18} /></div>
                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-[#8C7B70] mb-0.5">Created On</p>
                                                <p className="text-sm font-bold text-[#2A1F1D]">{new Date(selectedDrawing.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8C7B70]">Description</p>
                                            <p className="text-sm text-[#5D4037] leading-relaxed italic">"{selectedDrawing.description || "No description provided."}"</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setSelectedDrawing(null)} className="flex-1 py-3.5 border border-[#E3DACD] text-[#8C7B70] rounded-xl text-xs font-bold hover:bg-[#F9F7F2] transition-all">Close</button>
                                    <a href={`${import.meta.env.VITE_API_URL}/${selectedDrawing.file_path}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-3.5 bg-[#2A1F1D] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#C06842] transition-all shadow-lg"><Download size={14} /> Download</a>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Task Detail Modal */}
                {selectedTask && (
                    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-[#2A1F1D]/80 backdrop-blur-md" onClick={() => setSelectedTask(null)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row max-h-[85vh]" onClick={e => e.stopPropagation()}>
                            <div className="lg:w-1/2 h-64 lg:h-auto bg-[#2A1F1D] relative">
                                {selectedTask.image_path ? (
                                    <img src={`${import.meta.env.VITE_API_URL}/${selectedTask.image_path}`} alt="Detail" className="w-full h-full object-contain" />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-white/10"><ImageIcon size={64} /></div>
                                )}
                                <div className="absolute top-4 left-4"><span className="px-3 py-1.5 bg-white text-[#C06842] rounded-lg text-[10px] font-bold uppercase shadow-md">Task Deliverable</span></div>
                            </div>
                            <div className="lg:w-1/2 p-8 flex flex-col justify-between overflow-y-auto">
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <p className="text-[#C06842] text-[10px] font-bold uppercase tracking-widest mb-1">{selectedTask.project_name}</p>
                                            <h3 className="text-2xl font-bold font-serif text-[#2A1F1D] leading-tight">{selectedTask.title}</h3>
                                        </div>
                                        <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-red-50 text-[#B8AFA5] hover:text-red-500 rounded-lg transition-all"><X size={20} /></button>
                                    </div>
                                    <div className="space-y-5 mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-[#F9F7F2] rounded-lg border border-[#E3DACD]/50"><Calendar size={16} className="text-[#C06842]" /></div>
                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-[#8C7B70] mb-0.5">Last Updated</p>
                                                <p className="text-sm font-bold text-[#2A1F1D]">{new Date(selectedTask.updated_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-[#8C7B70]">Notes</p>
                                            <p className="text-sm text-[#5D4037] leading-relaxed italic">"{selectedTask.description || "No notes provided."}"</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setSelectedTask(null)} className="flex-1 py-3.5 bg-white border border-[#E3DACD] text-[#8C7B70] rounded-xl text-xs font-bold hover:bg-[#F9F7F2] transition-all">Close</button>
                                    {selectedTask.image_path && (
                                        <a href={`${import.meta.env.VITE_API_URL}/${selectedTask.image_path}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-3.5 bg-[#2A1F1D] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#C06842] transition-all shadow-lg"><Download size={14} /> Download</a>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ArchitectWorkboard;
