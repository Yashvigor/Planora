import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    LayoutGrid, ChevronRight,
    FileText, Eye, MapPin, Clock, 
    TrendingUp, Award, User, Search, 
    CheckCircle2, AlertCircle, XCircle,
    Lock, RefreshCcw, Activity, ClipboardList
} from 'lucide-react';

// Shared Components
import Card from '../../../components/Common/Card';
import Button from '../../../components/Common/Button';
import SectionHeader from '../../../components/Common/SectionHeader';

const SiteWorkboard = ({ currentUser, projectId: propProjectId, hideCompleted = false }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const userId = currentUser?.user_id || currentUser?.id;

    const fetchTasks = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const url = propProjectId 
                ? `${import.meta.env.VITE_API_URL}/api/projects/${propProjectId}/tasks`
                : `${import.meta.env.VITE_API_URL}/api/tasks/user/${userId}`;
                
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}` }
            });
            if (res.ok) setTasks(await res.json());
        } catch (err) { console.error('Error fetching tasks:', err); }
        finally { setLoading(false); }
    }, [userId, propProjectId]);

    useEffect(() => { fetchTasks(); }, [fetchTasks]);

    const projectsMap = useMemo(() => {
        return tasks.reduce((acc, task) => {
            const pid = task.project_id;
            if (!acc[pid]) {
                acc[pid] = {
                    id: pid,
                    name: task.project_name || 'Unnamed Project',
                    location: task.location || 'Site Location',
                    status: task.project_status || 'Pending',
                    planning_completed: task.planning_completed,
                    design_completed: task.design_completed,
                    execution_completed: task.execution_completed,
                    tasks: [],
                    stats: { pending: 0, submitted: 0, approved: 0, rejected: 0 }
                };
            }
            const s = (task.status || 'Pending').toLowerCase();
            if (acc[pid].stats[s] !== undefined) acc[pid].stats[s]++;
            if (hideCompleted && task.status === 'Approved') return acc;
            acc[pid].tasks.push(task);
            return acc;
        }, {});
    }, [tasks, hideCompleted]);

    const projectList = useMemo(() => {
        let list = Object.values(projectsMap);
        if (searchQuery) list = list.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.location.toLowerCase().includes(searchQuery.toLowerCase()));
        if (statusFilter !== 'All') list = list.filter(p => statusFilter === 'Active' ? p.status !== 'Completed' : p.status === 'Completed');
        return list;
    }, [projectsMap, searchQuery, statusFilter]);

    const stats = useMemo(() => {
        const total = tasks.length;
        const approved = tasks.filter(t => t.status === 'Approved').length;
        const active = tasks.filter(t => t.status !== 'Approved').length;
        return { total, approved, active, percent: total > 0 ? Math.round((approved / total) * 100) : 0 };
    }, [tasks]);

    const openPreview = (task) => {
        if (task.image_path) { setPreviewFile(`${import.meta.env.VITE_API_URL}/${task.image_path}`); setIsPreviewOpen(true); }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <div className="w-16 h-16 border-4 border-[#C06842]/10 border-t-[#C06842] rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8C7B70] animate-pulse">Syncing Tasks...</p>
        </div>
    );

    return (
        <div className="space-y-12 animate-fade-in pb-20">
            {/* Header & Meta */}
            {!propProjectId && (
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                    <SectionHeader title="Workboard" subtitle={`Manage tasks for ${projectList.length} projects`} />
                    <div className="relative group w-full lg:w-96">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8C7B70] group-focus-within:text-[#C06842] transition-colors" />
                        <input type="text" placeholder="Search projects..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-white/80 border-2 border-[#E3DACD]/50 rounded-2xl text-xs font-bold outline-none focus:border-[#C06842] transition-all" />
                    </div>
                </div>
            )}

            {/* Performance Widgets */}
            {!propProjectId && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatMetric label="Total Tasks" val={stats.total} icon={ClipboardList} color="text-[#2A1F1D]" />
                    <StatMetric label="In Progress" val={stats.active} icon={Clock} color="text-[#E68A2E]" />
                    <StatMetric label="Completed" val={stats.approved} icon={CheckCircle2} color="text-green-600" />
                    <StatMetric label="Efficiency" val={`${stats.percent}%`} icon={TrendingUp} color="text-[#C06842]" isProgress />
                </div>
            )}

            {/* Projects Registry */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {projectList.length === 0 ? (
                    <div className="col-span-full py-40 text-center border-2 border-dashed border-[#E3DACD] rounded-[4rem] bg-[#F9F7F2]/20">
                        <Search size={64} className="mx-auto text-[#E3DACD] mb-6" strokeWidth={0.5} />
                        <h3 className="text-2xl font-serif font-black text-[#2A1F1D] mb-2">No Projects Found</h3>
                        <p className="text-[#8C7B70] text-sm max-w-xs mx-auto">Try adjusting your search or filters to find what you're looking for.</p>
                    </div>
                ) : (
                    projectList.map(project => (
                        <ProjectCard key={project.id} project={project} onSelect={() => setSelectedProject(project)} />
                    ))
                )}
            </div>

            {selectedProject && <KanbanModal project={selectedProject} onClose={() => setSelectedProject(null)} openPreview={openPreview} />}
            <ImageModal isOpen={isPreviewOpen} src={previewFile} onClose={() => setIsPreviewOpen(false)} />
        </div>
    );
};

const StatMetric = ({ label, val, icon: Icon, color, isProgress }) => (
    <Card className="p-7 relative overflow-hidden group border-2 border-transparent hover:border-[#C06842]/20">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8C7B70] mb-3">{label}</p>
                <h3 className={`text-3xl font-serif font-black ${color}`}>{val}</h3>
            </div>
            <div className={`p-4 rounded-xl bg-[#FDFCF8] ${color} group-hover:rotate-12 transition-transform shadow-sm`}><Icon size={20} /></div>
        </div>
        {isProgress && (
            <div className="mt-6 w-full bg-[#E3DACD]/30 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#C06842] h-full transition-all duration-1000" style={{ width: val }} />
            </div>
        )}
    </Card>
);

const ProjectCard = ({ project, onSelect }) => {
    const isCompleted = project.status === 'Completed';
    const total = project.tasks.length;
    const progress = total > 0 ? Math.round((project.stats.approved / total) * 100) : 0;
    return (
        <Card onClick={onSelect} className="p-0 overflow-hidden group flex flex-col h-full bg-white">
            <div className={`h-24 p-8 flex justify-between items-start transition-colors duration-500 ${isCompleted ? 'bg-green-600' : 'bg-[#2A1F1D]'}`}>
                <div className="relative z-10">
                    <p className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border mb-4 ${isCompleted ? 'bg-white/20 text-white' : 'bg-[#C06842] text-white'} border-transparent`}>{isCompleted ? 'Completed' : 'Active'}</p>
                    <h3 className="text-xl font-serif font-bold text-white tracking-tight truncate w-full">{project.name}</h3>
                </div>
                <Award className="text-white opacity-20" size={32} />
            </div>
            <div className="p-8 flex-1 flex flex-col space-y-6 text-left">
                <div className="flex items-center gap-2 text-[10px] font-black text-[#8C7B70] uppercase">
                    <MapPin size={14} className="text-[#C06842]" /> <span className="truncate">{project.location}</span>
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-[#8C7B70] uppercase tracking-widest">Progress</p>
                            <h4 className="text-2xl font-serif font-black text-[#2A1F1D]">{progress}%</h4>
                        </div>
                        <div className="flex gap-1">
                            <PhaseTick active={project.planning_completed} label="P" />
                            <PhaseTick active={project.design_completed} label="D" />
                            <PhaseTick active={project.execution_completed} label="E" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#E3DACD]/30">
                    <div className="bg-[#F9F7F2] p-4 rounded-2xl border border-[#E3DACD]/40">
                        <p className="text-[8px] font-black uppercase text-[#8C7B70] mb-1">Done</p>
                        <p className="text-lg font-black text-green-700">{project.stats.approved}</p>
                    </div>
                    <div className="bg-[#F9F7F2] p-4 rounded-2xl border border-[#E3DACD]/40">
                        <p className="text-[8px] font-black uppercase text-[#8C7B70] mb-1">Todo</p>
                        <p className="text-lg font-black text-[#C06842]">{project.stats.pending + project.stats.submitted}</p>
                    </div>
                </div>
                <Button variant="ghost" icon={ChevronRight} className="w-full">View Tasks</Button>
            </div>
        </Card>
    );
};

const PhaseTick = ({ active, label }) => (
    <div className={`w-6 h-6 rounded-md border flex items-center justify-center text-[10px] font-black transition-all ${active ? 'bg-green-600 text-white border-green-700 shadow-sm' : 'bg-white text-[#B8AFA5] border-[#E3DACD]/50'}`}>
        {label}
    </div>
);

const KanbanModal = ({ project, onClose, openPreview }) => {
    const columns = [
        { id: 'pending', title: 'Todo', icon: ClipboardList, color: 'text-[#8C7B70]', bg: 'bg-[#F9F7F2]' },
        { id: 'submitted', title: 'Review', icon: RefreshCcw, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'approved', title: 'Done', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
        { id: 'rejected', title: 'Rejected', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' }
    ];
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#2A1F1D]/80 backdrop-blur-xl">
            <div className="bg-[#FDFCF8] rounded-[4rem] w-full max-w-[95vw] h-[90vh] overflow-hidden flex flex-col border border-white/20 shadow-3xl">
                <header className="p-10 border-b border-[#E3DACD]/40 flex justify-between items-center bg-white/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#C06842]/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                    <div className="relative z-10">
                        <SectionHeader title={project.name} subtitle={project.location} />
                    </div>
                    <button onClick={onClose} className="p-4 rounded-full bg-[#F9F7F2] text-[#8C7B70] hover:text-[#C06842] transition-colors"><XCircle size={32} /></button>
                </header>
                <div className="flex-1 overflow-x-auto p-10 bg-[#F9F7F2]/30">
                    <div className="flex gap-10 h-full min-w-[1400px]">
                        {columns.map(col => {
                            const Icon = col.icon;
                            return (
                                <div key={col.id} className="flex-1 flex flex-col min-w-[320px]">
                                    <div className={`p-5 rounded-3xl ${col.bg} border-2 border-white mb-8 flex items-center gap-4 ${col.color} shadow-sm`}>
                                        <Icon size={20} />
                                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">{col.title}</span>
                                        <span className="ml-auto bg-white/60 px-2 py-1 rounded-lg text-[10px] font-black">{project.tasks.filter(t => t.status.toLowerCase() === col.id).length}</span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto pr-3 space-y-6 scroll-smooth">
                                        {project.tasks.filter(t => t.status.toLowerCase() === col.id).map(task => (
                                            <TaskCard key={task.task_id} task={task} onPreview={() => openPreview(task)} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

const TaskCard = ({ task, onPreview }) => (
    <Card variant="flat" className="p-6 border-transparent hover:border-[#C06842]/20 shadow-md">
        <div className="flex justify-between items-start mb-4">
            <h4 className="font-serif font-black text-[#2A1F1D] text-lg leading-tight text-left">{task.title}</h4>
            <span className="text-[8px] font-black uppercase tracking-widest text-[#8C7B70] bg-[#F9F7F2] px-2 py-1 rounded-lg border border-[#E3DACD]/50">{new Date(task.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
        </div>
        {task.description && <p className="text-[11px] text-[#5D4037] leading-relaxed mb-6 font-medium text-left">{task.description}</p>}
        {task.image_path && (
            <div onClick={onPreview} className="relative mb-6 rounded-2xl overflow-hidden cursor-zoom-in aspect-video group">
                <img src={`${import.meta.env.VITE_API_URL}/${task.image_path}`} alt="Detail" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-[#2A1F1D]/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Eye className="text-white" size={24} /></div>
            </div>
        )}
        <div className="pt-4 border-t border-[#E3DACD]/30 flex justify-between items-center text-left">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#2A1F1D] text-white flex items-center justify-center text-[10px] font-black shadow-md">{task.assigned_to_name?.[0]}</div>
                <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#8C7B70]">{task.assigned_to_name?.split(' ')[0]}</p>
            </div>
            {task.due_date && <p className="text-[9px] font-black text-[#C06842] flex items-center gap-1.5"><Clock size={12} /> {new Date(task.due_date).toLocaleDateString()}</p>}
        </div>
    </Card>
);

const ImageModal = ({ isOpen, src, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-[#2A1F1D]/90 backdrop-blur-xl animate-fade-in" onClick={onClose}>
            <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center gap-6">
                <XCircle size={48} className="absolute top-0 right-0 p-2 text-white/40 hover:text-white cursor-pointer transition-all" />
                <img src={src} alt="Evidence" className="max-h-[85vh] w-auto rounded-[2rem] shadow-3xl border-4 border-white/20 object-contain shadow-black" onClick={e => e.stopPropagation()} />
                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">Task Image</p>
            </div>
        </div>
    );
};

export default SiteWorkboard;
