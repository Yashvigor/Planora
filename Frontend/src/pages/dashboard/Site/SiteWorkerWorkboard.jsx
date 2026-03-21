import React, { useState, useEffect, useCallback } from 'react';
import { 
    CheckCircle, Eye, MapPin, Calendar, 
    TrendingUp, Briefcase, Camera, Image as ImageIcon,
    ChevronRight, X, LayoutGrid, Award, Activity
} from 'lucide-react';

const Card = ({ children, className = "" }) => (
    <div className={`glass-card p-6 rounded-[2rem] border border-[#E3DACD]/40 shadow-sm transition-all hover:shadow-md ${className}`}>
        {children}
    </div>
);

const SiteWorkerWorkboard = ({ currentUser }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);

    const userId = currentUser?.user_id || currentUser?.id;

    const fetchData = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/user/${userId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTasks(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Error fetching site worker workboard data:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const completedTasks = tasks.filter(t => t.status === 'Approved');
    const uniqueProjects = new Set(tasks.map(t => t.project_id));

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-[#C06842]/20 border-t-[#C06842] rounded-full animate-spin mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-[#8C7B70]">Connecting to Site Workboard...</p>
        </div>
    );

    return (
        <div className="space-y-10 animate-fade-in pb-12">
            {/* Professional Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="group relative overflow-hidden bg-gradient-to-br from-[#1A1A1A] to-[#333333] p-10 rounded-[2.5rem] text-white shadow-2xl transition-all hover:scale-[1.01]">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#C06842]/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-[#C06842]/20 transition-colors" />
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-3">Professional Portfolio</p>
                            <h3 className="text-5xl font-serif font-bold tracking-tight">{completedTasks.length}</h3>
                            <div className="flex items-center gap-2 mt-4">
                                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-[9px] font-bold uppercase tracking-wider">Verified Completed</span>
                            </div>
                        </div>
                        <div className="p-6 bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-inner">
                            <Award className="w-10 h-10 text-[#C06842]" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[2.5rem] border border-[#E3DACD]/50 shadow-sm hover:shadow-2xl transition-all group flex items-center">
                    <div className="flex justify-between items-center w-full">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8C7B70] mb-3">Project History</p>
                            <h3 className="text-5xl font-serif font-bold text-[#2A1F1D] tracking-tight">{uniqueProjects.size}</h3>
                            <p className="text-xs text-[#8C7B70] mt-3 font-semibold flex items-center gap-1.5">
                                <Activity className="w-3 h-3 text-[#C06842]" /> Total Sites Developed
                            </p>
                        </div>
                        <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 group-hover:bg-blue-100 transition-all duration-500 transform group-hover:scale-110">
                            <Briefcase className="w-10 h-10 text-blue-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="space-y-8">
                <div className="flex justify-between items-end border-b border-[#E3DACD]/40 pb-6">
                    <div>
                        <h2 className="text-3xl font-bold font-serif text-[#2A1F1D]">Quality Benchmarks</h2>
                        <p className="text-xs text-[#8C7B70] mt-1 font-medium italic">Showcasing your verified site excellence</p>
                    </div>
                    <div className="px-5 py-2 bg-[#F9F7F2] rounded-full text-[10px] font-black uppercase tracking-widest text-[#8C7B70] border border-[#E3DACD]">
                        {completedTasks.length} Success Records
                    </div>
                </div>

                {completedTasks.length === 0 ? (
                    <div className="py-32 text-center glass-card rounded-[3rem] border-dashed border-2 bg-white/40 opacity-70">
                        <Camera size={56} className="mx-auto text-[#B8AFA5] mb-6 opacity-40" />
                        <h3 className="text-xl font-bold text-[#2A1F1D]">No completed submissions yet</h3>
                        <p className="text-sm mt-2 text-[#8C7B70]">Approval notices for your site tasks will appear here as visual proofs.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {completedTasks.map(task => (
                            <div 
                                key={task.task_id} 
                                className="group bg-white rounded-[2.5rem] border border-[#E3DACD]/30 overflow-hidden hover:shadow-[0_32px_64px_-16px_rgba(42,31,29,0.1)] transition-all duration-700 cursor-pointer flex flex-col h-full"
                                onClick={() => setSelectedTask(task)}
                            >
                                <div className="h-64 bg-[#FDFCFB] relative overflow-hidden flex items-center justify-center shrink-0">
                                    {task.image_path ? (
                                        <img 
                                            src={`${import.meta.env.VITE_API_URL}/${task.image_path}`} 
                                            alt={task.title}
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-3 opacity-20 text-[#8C7B70]">
                                            <ImageIcon size={48} />
                                            <span className="text-[10px] font-black uppercase tracking-tighter">No Visual Attachment</span>
                                        </div>
                                    )}
                                    <div className="absolute top-6 left-6 scale-90 origin-top-left transition-transform group-hover:scale-100">
                                        <span className="px-4 py-2 bg-white/95 backdrop-blur-md rounded-[1rem] text-[9px] font-black uppercase text-green-700 shadow-xl border border-white flex items-center gap-2">
                                            <CheckCircle size={12} /> Milestone Verified
                                        </span>
                                    </div>
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-8">
                                        <button className="px-6 py-2 bg-white text-[#C06842] rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                            <Eye size={14} /> Full Insight
                                        </button>
                                    </div>
                                </div>
                                <div className="p-8 flex flex-col flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="text-lg font-bold text-[#2A1F1D] group-hover:text-[#C06842] transition-colors leading-tight">{task.title}</h4>
                                    </div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 rounded-full bg-[#F9F7F2] flex items-center justify-center border border-[#E3DACD]/30">
                                            <MapPin size={14} className="text-[#C06842]" />
                                        </div>
                                        <p className="text-[10px] text-[#8C7B70] font-black uppercase tracking-[0.15em]">{task.project_name || 'Assigned Site'}</p>
                                    </div>
                                    <p className="text-xs text-[#8C7B70] line-clamp-3 leading-loose italic flex-1">
                                        {task.description ? `"${task.description}"` : "Official completion of assigned site works archived by system."}
                                    </p>
                                    <div className="mt-8 pt-6 border-t border-[#E3DACD]/20 flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.1em] text-[#B8AFA5]">
                                        <span className="flex items-center gap-2"><Calendar size={14} className="opacity-50" /> {new Date(task.updated_at).toLocaleDateString()}</span>
                                        <button className="flex items-center gap-1 text-[#2A1F1D] hover:text-[#C06842] transition-colors">Details <ChevronRight size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Enhanced Detail Modal */}
            {selectedTask && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#1A1A1A]/95 backdrop-blur-xl animate-fade-in" onClick={() => setSelectedTask(null)}>
                    <div className="bg-white rounded-[3.5rem] w-full max-w-4xl overflow-hidden shadow-[0_64px_128px_-32px_rgba(0,0,0,0.5)] animate-scale-up border border-white/20" onClick={e => e.stopPropagation()}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
                            {/* Left: Visual Evidence */}
                            <div className="h-96 lg:h-auto bg-[#F9F7F2] relative flex items-center justify-center overflow-hidden border-r border-[#E3DACD]/20">
                                {selectedTask.image_path ? (
                                    <img src={`${import.meta.env.VITE_API_URL}/${selectedTask.image_path}`} alt="Site Proof" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center gap-4 opacity-10">
                                        <ImageIcon size={120} />
                                        <span className="font-serif italic text-3xl">No Data</span>
                                    </div>
                                )}
                                <div className="absolute top-8 left-8">
                                    <div className="flex flex-col gap-2">
                                        <span className="px-5 py-2 bg-black/80 backdrop-blur-md text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-fit">
                                            <Activity size={12} className="text-[#C06842]" /> Site Live Capture
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Technical Breakdown */}
                            <div className="p-12 lg:p-16 flex flex-col justify-center relative">
                                <button onClick={() => setSelectedTask(null)} className="absolute top-8 right-8 p-3 hover:bg-[#F9F7F2] rounded-full transition-colors text-[#8C7B70]">
                                    <X size={28} />
                                </button>
                                
                                <div className="mb-12">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-2 h-4 bg-[#C06842] rounded-full" />
                                        <p className="text-[#C06842] text-[10px] font-black uppercase tracking-[0.3em]">Project Dossier</p>
                                    </div>
                                    <h3 className="text-4xl font-bold font-serif text-[#2A1F1D] leading-tight mb-2">{selectedTask.title}</h3>
                                    <p className="text-sm font-medium text-[#8C7B70] italic">Verified Milestone #{selectedTask.task_id.toString().slice(-6)}</p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-10 mb-12">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B8AFA5]">Site Location</p>
                                        <p className="text-sm font-extrabold text-[#2A1F1D] flex items-center gap-2">
                                            <MapPin size={18} className="text-[#C06842]" /> {selectedTask.project_name || 'Standard Site'}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B8AFA5]">Handover Date</p>
                                        <p className="text-sm font-extrabold text-[#2A1F1D] flex items-center gap-2">
                                            <Calendar size={18} className="text-[#C06842]" /> {new Date(selectedTask.updated_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-8 bg-[#FDFCFB] rounded-3xl border border-[#E3DACD]/50 relative mb-12">
                                    <div className="absolute -top-3 left-6 px-4 py-1 bg-white border border-[#E3DACD]/50 rounded-full text-[9px] font-black uppercase tracking-widest text-[#8C7B70]">
                                        Observer Notes
                                    </div>
                                    <p className="text-sm text-[#5D4037] leading-relaxed italic font-medium">
                                        "{selectedTask.description || "The works were performed according to architectural standards and verified on-site by the project supervisor."}"
                                    </p>
                                </div>

                                <div className="flex gap-6">
                                    <button 
                                        onClick={() => setSelectedTask(null)}
                                        className="flex-1 py-5 border-2 border-[#E3DACD] text-[#8C7B70] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#F9F7F2] transition-colors"
                                    >
                                        Dismiss
                                    </button>
                                    {selectedTask.image_path && (
                                        <a 
                                            href={`${import.meta.env.VITE_API_URL}/${selectedTask.image_path}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 py-5 bg-[#C06842] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-[#A65D3B] transition-all shadow-xl shadow-[#C06842]/20"
                                        >
                                            <ImageIcon size={18} /> Resolution
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SiteWorkerWorkboard;
