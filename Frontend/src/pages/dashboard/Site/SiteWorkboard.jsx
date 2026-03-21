import React, { useState, useEffect, useCallback } from 'react';
import {
    LayoutGrid, CheckCircle, Clock, ChevronRight,
    FileText, Eye, MapPin, Calendar, ClipboardList,
    TrendingUp, Star, Award, User
} from 'lucide-react';

const Card = ({ children, className = "" }) => (
    <div className={`glass-card p-5 rounded-2xl border border-[#E3DACD]/40 shadow-sm transition-all hover:shadow-md ${className}`}>
        {children}
    </div>
);

const SiteWorkboard = ({ currentUser, projectId: propProjectId }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);

    const userId = currentUser?.user_id || currentUser?.id;

    const fetchTasks = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const url = propProjectId 
                ? `${import.meta.env.VITE_API_URL}/api/projects/${propProjectId}/tasks`
                : `${import.meta.env.VITE_API_URL}/api/tasks/user/${userId}`;
                
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` }
            });
            if (res.ok) {
                setTasks(await res.json());
            }
        } catch (err) {
            console.error('Error fetching tasks for workboard:', err);
        } finally {
            setLoading(false);
        }
    }, [userId, propProjectId]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // Group tasks by project
    const projectsMap = tasks.reduce((acc, task) => {
        const pid = task.project_id;
        if (!acc[pid]) {
            acc[pid] = {
                id: pid,
                name: task.project_name || 'Unnamed Project',
                location: task.location || 'Site Location',
                tasks: [],
                allCompleted: true
            };
        }
        acc[pid].tasks.push(task);
        if (task.status !== 'Approved') {
            acc[pid].allCompleted = false;
        }
        return acc;
    }, {});

    const projectList = Object.values(projectsMap);
    const currentProjects = projectList.filter(p => !p.allCompleted);
    const completedProjects = projectList.filter(p => p.allCompleted);

    const openPreview = (task) => {
        if (task.image_path) {
            setPreviewFile(`${import.meta.env.VITE_API_URL}/${task.image_path}`);
            setIsPreviewOpen(true);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <LayoutGrid className="w-12 h-12 text-[#C06842] mb-4 animate-spin-slow" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#8C7B70]">Syncing Workboard Data...</p>
        </div>
    );

    return (
        <div className="space-y-10 animate-fade-in">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="glass-card p-8 rounded-[2rem] bg-gradient-to-br from-[#2A1F1D] to-[#4A342E] text-white border-0 shadow-xl relative overflow-hidden group">
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B8AFA5] mb-2">Live Workload</p>
                            <h3 className="text-4xl font-serif font-bold">{currentProjects.length}</h3>
                            <p className="text-xs text-white/60 mt-2 font-medium">Active Commissions</p>
                        </div>
                        <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 group-hover:rotate-12 transition-transform">
                            <TrendingUp className="w-6 h-6 text-[#E68A2E]" />
                        </div>
                    </div>
                </div>

                <div className="glass-card p-8 rounded-[2rem] bg-white border border-[#E3DACD]/50 shadow-sm hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8C7B70] mb-2">Portfolio</p>
                            <h3 className="text-4xl font-serif font-bold text-[#2A1F1D]">{completedProjects.length}</h3>
                            <p className="text-xs text-[#8C7B70] mt-2 font-medium">Delivered Sites</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-2xl border border-green-100 group-hover:bg-green-100 transition-colors">
                            <Award className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="glass-card p-8 rounded-[2rem] bg-white border border-[#E3DACD]/50 shadow-sm hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8C7B70] mb-2">Milestones</p>
                            <h3 className="text-4xl font-serif font-bold text-[#2A1F1D]">{tasks.filter(t => t.status === 'Approved').length}</h3>
                            <p className="text-xs text-[#8C7B70] mt-2 font-medium">Approved Benchmarks</p>
                        </div>
                        <div className="p-4 bg-[#C06842]/10 rounded-2xl border border-[#C06842]/10 group-hover:bg-[#C06842]/20 transition-colors">
                            <Star className="w-6 h-6 text-[#C06842]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Current Projects */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-8 bg-[#C06842] rounded-full" />
                    <h2 className="text-2xl font-bold font-serif text-[#2A1F1D]">Current Workload</h2>
                </div>
                {currentProjects.length === 0 ? (
                    <div className="text-center py-10 glass-card rounded-3xl border-dashed border-2 border-[#E3DACD] bg-white/50">
                        <Clock className="w-10 h-10 mx-auto text-[#B8AFA5] mb-2" />
                        <p className="text-sm font-bold text-[#8C7B70]">No active projects at the moment</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {currentProjects.map(project => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onSelect={() => setSelectedProject(project)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Completed Projects */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-8 bg-green-600 rounded-full" />
                    <h2 className="text-2xl font-bold font-serif text-[#2A1F1D]">Project Portfolio</h2>
                </div>
                {completedProjects.length === 0 ? (
                    <div className="text-center py-10 glass-card rounded-3xl border-dashed border-2 border-[#E3DACD] bg-white/50">
                        <CheckCircle className="w-10 h-10 mx-auto text-[#B8AFA5] mb-2" />
                        <p className="text-sm font-bold text-[#8C7B70]">Completed projects will appear here</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-85 hover:opacity-100 transition-opacity">
                        {completedProjects.map(project => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                isCompleted
                                onSelect={() => setSelectedProject(project)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Details Modal */}
            {selectedProject && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2A1F1D]/60 backdrop-blur-md">
                    <div className="bg-[#FDFCF8] rounded-[2.5rem] w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl border border-white flex flex-col animate-scale-up">
                        {/* Modal Header */}
                        <div className="p-8 pb-4 border-b border-[#E3DACD]/50 relative">
                            <button
                                onClick={() => setSelectedProject(null)}
                                className="absolute top-6 right-8 p-2 hover:bg-white rounded-full transition-colors text-[#8C7B70] hover:text-[#2A1F1D]"
                            >
                                <ChevronRight className="rotate-90" />
                            </button>
                            <p className="text-[#C06842] text-[10px] font-black uppercase tracking-[0.2em] mb-2">Work Details</p>
                            <h3 className="text-2xl font-bold font-serif text-[#2A1F1D] pr-12">{selectedProject.name}</h3>
                            <div className="flex items-center gap-4 mt-2 text-xs text-[#8C7B70]">
                                <span className="flex items-center gap-1"><MapPin size={14} /> {selectedProject.location}</span>
                                <span className="flex items-center gap-1"><ClipboardList size={14} /> {selectedProject.tasks.length} Tasks Total</span>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 md:p-8 overflow-y-auto space-y-4">
                            {selectedProject.tasks
                                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                .map(task => (
                                    <div key={task.task_id} className="p-4 rounded-2xl bg-white border border-[#E3DACD]/40 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-[#2A1F1D] text-sm">{task.title}</h4>
                                                <StatusBadge status={task.status} />
                                            </div>
                                            {task.description && <p className="text-xs text-[#5D4037] mb-2 leading-relaxed">{task.description}</p>}
                                            <div className="flex items-center gap-3 text-[10px] text-[#8C7B70] font-bold">
                                                <span className="flex items-center gap-1 uppercase tracking-wider"><Calendar size={12} /> {new Date(task.created_at).toLocaleDateString()}</span>
                                                {task.image_path && <span className="text-[#C06842] flex items-center gap-1 uppercase tracking-wider">● Submission Attached</span>}
                                            </div>
                                        </div>
                                        {task.image_path && (
                                            <div className="flex flex-col gap-3 shrink-0">
                                                <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden border border-[#E3DACD]/50 bg-[#F9F7F2] shadow-inner group/img cursor-zoom-in" onClick={() => openPreview(task)}>
                                                    <img
                                                        src={`${import.meta.env.VITE_API_URL}/${task.image_path}`}
                                                        alt="Submission"
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-[#2A1F1D]/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Eye className="text-white w-8 h-8 drop-shadow-lg" />
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => openPreview(task)}
                                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#E3DACD] rounded-xl text-[10px] font-black uppercase tracking-widest text-[#2A1F1D] hover:bg-[#C06842] hover:text-white transition-all shadow-sm"
                                                >
                                                    Full Resolution
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Image Preview Modal */}
            {isPreviewOpen && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#2A1F1D]/90 animate-fade-in"
                    onClick={() => setIsPreviewOpen(false)}
                >
                    <div className="relative max-w-4xl w-full flex flex-col items-center">
                        <button className="absolute -top-12 right-0 text-white flex items-center gap-2 font-bold uppercase tracking-widest text-xs">
                            Click anywhere to close
                        </button>
                        <img
                            src={previewFile}
                            alt="Submission detail"
                            className="max-h-[85vh] w-auto rounded-xl shadow-2xl border-2 border-white object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

const ProjectCard = ({ project, onSelect, isCompleted = false }) => {
    const approvedCount = project.tasks.filter(t => t.status === 'Approved').length;
    const progress = Math.round((approvedCount / project.tasks.length) * 100);

    return (
        <div
            className="glass-card flex flex-col h-full bg-white group cursor-pointer rounded-3xl p-6 border border-[#E3DACD]/40 hover:shadow-2xl hover:border-[#C06842]/30 transition-all duration-500 overflow-hidden relative"
            onClick={onSelect}
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C06842]/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-[#C06842]/10 transition-colors"></div>

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex-1">
                    <h3 className="font-bold text-xl font-serif text-[#2A1F1D] group-hover:text-[#C06842] transition-colors leading-tight mb-2">
                        {project.name}
                    </h3>
                    <div className="flex items-center gap-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#8C7B70] flex items-center gap-1.5">
                            <MapPin size={12} className="text-[#C06842]" /> {project.location}
                        </p>
                    </div>
                </div>
                <div className={`p-4 rounded-2xl transition-all duration-500 ${isCompleted ? 'bg-green-50 text-green-600' : 'bg-[#C06842]/10 text-[#C06842]'} group-hover:scale-110 shadow-sm border border-black/5`}>
                    {isCompleted ? <Award size={22} /> : <Clock size={22} />}
                </div>
            </div>

            <div className="mt-auto space-y-4 relative z-10">
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] font-black">
                        <span className="text-[#8C7B70]">Site Execution Progress</span>
                        <span className={isCompleted ? 'text-green-600' : 'text-[#C06842]'}>{progress}%</span>
                    </div>
                    <div className="h-2.5 bg-[#F9F7F2] rounded-full overflow-hidden border border-[#E3DACD]/30 shadow-inner p-0.5">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(192,104,66,0.2)] ${isCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-[#D98B6C] to-[#C06842]'}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-[#E3DACD]/20">
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                            <div className="w-6 h-6 rounded-full border-2 border-white bg-[#F9F7F2] flex items-center justify-center">
                                <User size={10} className="text-[#C06842]" />
                            </div>
                        </div>
                        <span className="text-[9px] text-[#B8AFA5] font-black uppercase tracking-widest">
                            {approvedCount}/{project.tasks.length} Verified
                        </span>
                    </div>
                    <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#2A1F1D] group-hover:text-[#C06842] transition-colors">
                        Inspect <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const colors = {
        'Approved': 'bg-green-50 text-green-700 border-green-200',
        'Submitted': 'bg-blue-50 text-blue-700 border-blue-200',
        'Rejected': 'bg-red-50 text-red-700 border-red-200',
        'Pending': 'bg-amber-50 text-amber-700 border-amber-200'
    };

    return (
        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter border ${colors[status] || colors.Pending}`}>
            {status}
        </span>
    );
};

export default SiteWorkboard;
