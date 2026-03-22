import React, { useState, useEffect, useCallback } from 'react';
import { 
    LayoutGrid, CheckCircle, Clock, ChevronRight,
    FileText, Eye, MapPin, Calendar, ClipboardList,
    TrendingUp, Star, Award, User, Users, Upload, 
    Plus, X, Image as ImageIcon, Briefcase, Camera, PencilRuler
} from 'lucide-react';

const Card = ({ children, className = "" }) => (
    <div className={`glass-card p-6 rounded-[2rem] border border-[#E3DACD]/40 shadow-sm transition-all hover:shadow-md ${className}`}>
        {children}
    </div>
);

const ArchitectWorkboard = ({ currentUser }) => {
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [teamMembers, setTeamMembers] = useState({});
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [uploadFile, setUploadFile] = useState(null);
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
            // 1. Fetch Tasks
            const tasksRes = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/user/${uid}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` }
            });
            const tasksData = await tasksRes.json();
            setTasks(Array.isArray(tasksData) ? tasksData : []);

            // 2. Fetch Projects Assigned to Architect
            const projectsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/professionals/${uid}/projects`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` }
            });
            const projectsData = await projectsRes.json();
            const acceptedProjects = Array.isArray(projectsData) ? projectsData.filter(p => !p.assignment_status || p.assignment_status === 'Accepted') : [];
            setProjects(acceptedProjects);

            // 3. Fetch Team Members for each project
            const teamsMap = {};
            for (const proj of acceptedProjects) {
                const teamRes = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${proj.project_id}/team?status=Accepted`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` }
                });
                if (teamRes.ok) {
                    teamsMap[proj.project_id] = await teamRes.json();
                }
            }
            setTeamMembers(teamsMap);

        } catch (err) {
            console.error('Error fetching architect workboard data:', err);
        } finally {
            setLoading(false);
        }
    }, [uid]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile) return;

        const data = new FormData();
        data.append('architect_id', uid);
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('category', formData.category);
        data.append('is_team_project', formData.is_team_project);
        if (formData.project_id) data.append('project_id', formData.project_id);
        if (uploadFile) data.append('file', uploadFile);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/drawings`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` },
                body: data
            });

            if (res.ok) {
                alert('Drawing uploaded successfully!');
                setIsUploadModalOpen(false);
                setFormData({ title: '', description: '', category: 'Floor Plan', is_team_project: false, project_id: '' });
                setUploadFile(null);
            }
        } catch (err) {
            console.error('Error uploading drawing:', err);
        }
    };

    const completedTasks = tasks.filter(t => t.status === 'Approved');
    
    // Calculate total unique teammates
    const uniqueTeammates = new Set();
    Object.values(teamMembers).forEach(team => {
        team.forEach(m => {
            if (m.user_id !== uid) uniqueTeammates.add(m.user_id);
        });
    });

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#C06842]/20 border-t-[#C06842] rounded-full animate-spin mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-[#8C7B70]">Structuring Architect Board...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="group relative overflow-hidden bg-gradient-to-br from-[#2A1F1D] to-[#4A342E] p-8 rounded-[2.5rem] text-white shadow-xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#C06842]/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#C06842]/40 transition-colors" />
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B8AFA5] mb-2">Total Deliverables</p>
                            <h3 className="text-4xl font-serif font-bold">{completedTasks.length}</h3>
                            <p className="text-xs text-white/50 mt-2 font-medium">Approved Benchmarks</p>
                        </div>
                        <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                            <CheckCircle className="w-6 h-6 text-[#E68A2E]" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-[#E3DACD]/50 shadow-sm hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8C7B70] mb-2">Project Network</p>
                            <h3 className="text-4xl font-serif font-bold text-[#2A1F1D]">{uniqueTeammates.size}</h3>
                            <p className="text-xs text-[#8C7B70] mt-2 font-medium">Collaborating Professionals</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 group-hover:bg-blue-100 transition-colors">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-[#E3DACD]/50 shadow-sm hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8C7B70] mb-2">Active Roles</p>
                            <h3 className="text-4xl font-serif font-bold text-[#2A1F1D]">{projects.length}</h3>
                            <p className="text-xs text-[#8C7B70] mt-2 font-medium">Current Project Teams</p>
                        </div>
                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 group-hover:bg-amber-100 transition-colors">
                            <Briefcase className="w-6 h-6 text-amber-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Upload & Team Projects */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Drawing Upload Card */}
                    <Card className="bg-[#FDFCF8] border-[#C06842]/20 border-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-[#C06842] text-white rounded-2xl shadow-lg shadow-[#C06842]/20">
                                <Plus size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold font-serif text-[#2A1F1D]">Upload Drawing</h3>
                                <p className="text-[10px] text-[#8C7B70] font-black uppercase tracking-widest">Architecture Studio</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => setIsUploadModalOpen(true)}
                            className="w-full py-4 bg-white border-2 border-dashed border-[#E3DACD] rounded-3xl text-sm font-bold text-[#8C7B70] flex flex-col items-center justify-center gap-2 hover:border-[#C06842] hover:bg-[#C06842]/5 transition-all group/up"
                        >
                            <Upload className="w-8 h-8 text-[#B8AFA5] group-hover/up:scale-110 group-hover/up:text-[#C06842] transition-all" />
                            <span>Post New Blueprint/Render</span>
                        </button>

                        <div className="mt-6 pt-6 border-t border-[#E3DACD]/40">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#B8AFA5] mb-4">Your Project Teams</p>
                            <div className="space-y-3">
                                {projects.length === 0 ? (
                                    <p className="text-xs text-[#8C7B70] italic">Not part of any project teams yet.</p>
                                ) : (
                                    projects.map(proj => (
                                        <div key={proj.project_id} className="p-4 bg-white rounded-2xl border border-[#E3DACD]/50 flex items-center justify-between hover:shadow-md transition-shadow cursor-default">
                                            <div>
                                                <h4 className="text-sm font-bold text-[#2A1F1D]">{proj.name}</h4>
                                                <p className="text-[10px] text-[#8C7B70] font-medium">{teamMembers[proj.project_id]?.length || 0} Team Members</p>
                                            </div>
                                            <div className="w-8 h-8 bg-[#F9F7F2] rounded-full flex items-center justify-center">
                                                <Users size={14} className="text-[#C06842]" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Side: Work Board (Completed Tasks) */}
                <div className="lg:col-span-8">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-8 bg-[#C06842] rounded-full" />
                            <h2 className="text-2xl font-bold font-serif text-[#2A1F1D]">Completed Task Vault</h2>
                        </div>
                        <span className="px-4 py-1.5 bg-[#F9F7F2] rounded-full text-[10px] font-black uppercase tracking-[0.1em] text-[#8C7B70] border border-[#E3DACD]">
                            {completedTasks.length} Milestones
                        </span>
                    </div>

                    {completedTasks.length === 0 ? (
                        <div className="py-24 text-center glass-card rounded-[2.5rem] border-dashed border-2 bg-white/50 opacity-60">
                            <Calendar size={48} className="mx-auto text-[#B8AFA5] mb-4" />
                            <h3 className="text-lg font-bold text-[#2A1F1D]">No completed tasks yet</h3>
                            <p className="text-sm mt-1">Assignments you finish will archive here with visual proofs.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {completedTasks.map(task => (
                                <div 
                                    key={task.task_id} 
                                    className="group bg-white rounded-[2.5rem] border border-[#E3DACD]/50 overflow-hidden hover:shadow-2xl hover:border-[#C06842]/50 transition-all duration-500 cursor-pointer"
                                    onClick={() => setSelectedTask(task)}
                                >
                                    <div className="h-48 bg-[#F9F7F2] relative overflow-hidden flex items-center justify-center">
                                        {task.image_path ? (
                                            <img 
                                                src={`${import.meta.env.VITE_API_URL}/${task.image_path}`} 
                                                alt={task.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 opacity-30">
                                                <ImageIcon size={32} />
                                                <span className="text-[10px] font-bold">No Image Attached</span>
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4">
                                            <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-xl text-[10px] font-black uppercase text-green-600 shadow-sm border border-green-100">
                                                Final Submission
                                            </span>
                                        </div>
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button className="p-3 bg-white rounded-full text-[#C06842] shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                                <Eye size={20} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-[#2A1F1D] group-hover:text-[#C06842] transition-colors line-clamp-1">{task.title}</h4>
                                        </div>
                                        <p className="text-[10px] text-[#C06842] font-black uppercase tracking-widest flex items-center gap-1.5 mb-3">
                                            <MapPin size={12} /> {task.project_name}
                                        </p>
                                        <p className="text-xs text-[#8C7B70] line-clamp-2 leading-relaxed h-8 mb-4">
                                            {task.description || "Archived task completion without notes."}
                                        </p>
                                        <div className="pt-4 border-t border-[#E3DACD]/30 flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-[#B8AFA5]">
                                            <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(task.updated_at).toLocaleDateString()}</span>
                                            <button className="flex items-center gap-1 text-[#2A1F1D] hover:text-[#C06842]">Details <ChevronRight size={12} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 lg:p-10 bg-[#2A1F1D]/70 backdrop-blur-xl animate-fade-in">
                    <div className="bg-white rounded-[3rem] w-full max-w-xl overflow-hidden shadow-[0_40px_100px_-20px_rgba(42,31,29,0.3)] border-4 border-white animate-scale-up flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="shrink-0 p-8 border-b border-[#E3DACD]/30 flex justify-between items-center bg-[#FDFCF8]">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-[#2A1F1D] text-white rounded-[1.5rem] shadow-xl">
                                    <PencilRuler size={24} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold font-serif text-[#2A1F1D]">Upload Architectural Asset</h3>
                                    <p className="text-[10px] text-[#C06842] font-black uppercase tracking-widest mt-1">Publish to project team vault</p>
                                </div>
                            </div>
                            <button onClick={() => setIsUploadModalOpen(false)} className="p-3 hover:bg-red-50 text-[#8C7B70] hover:text-red-600 rounded-full transition-all">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleUpload} className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#8C7B70] ml-1">Asset Title</label>
                                    <input 
                                        required
                                        type="text" 
                                        className="w-full px-5 py-4 bg-[#FDFCF8] border border-[#E3DACD] rounded-2xl text-sm font-bold text-[#2A1F1D] focus:border-[#C06842] outline-none transition-all focus:ring-4 focus:ring-[#C06842]/5"
                                        placeholder="e.g., Structure Analysis - Phase 1"
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#8C7B70] ml-1">Context</label>
                                        <select 
                                            className="w-full px-5 py-4 bg-[#FDFCF8] border border-[#E3DACD] rounded-2xl text-sm font-bold text-[#2A1F1D] focus:border-[#C06842] outline-none appearance-none"
                                            value={formData.project_id}
                                            onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                                        >
                                            <option value="">Personal Vault</option>
                                            {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#8C7B70] ml-1">Category</label>
                                        <select 
                                            className="w-full px-5 py-4 bg-[#FDFCF8] border border-[#E3DACD] rounded-2xl text-sm font-bold text-[#2A1F1D] focus:border-[#C06842] outline-none appearance-none"
                                            value={formData.category}
                                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                                        >
                                            <option value="Floor Plan">Floor Plan</option>
                                            <option value="Elevation">Elevation</option>
                                            <option value="Structural">Structural</option>
                                            <option value="3D Render">3D Render</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#8C7B70] ml-1">Drawing File (PDF or Image)</label>
                                    <div className="relative group/upload h-48">
                                        <input 
                                            required
                                            type="file" 
                                            accept="image/*,.pdf"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            onChange={(e) => setUploadFile(e.target.files[0])}
                                        />
                                        <div className="w-full h-full border-4 border-dashed border-[#E3DACD] rounded-[2rem] flex flex-col items-center justify-center bg-[#F9F7F2] relative overflow-hidden group-hover/upload:border-[#C06842] group-hover/upload:bg-[#C06842]/5 transition-all">
                                            {/* Blueprint-inspired background detail */}
                                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(192, 104, 66, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(192, 104, 66, 0.5) 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
                                            
                                            <Camera size={48} className="text-[#C06842] mb-3 transition-transform group-hover/upload:scale-110" />
                                            <span className="text-xs font-black uppercase tracking-widest text-[#2A1F1D]">
                                                {uploadFile ? uploadFile.name : 'Photo or Blueprint Plan'}
                                            </span>
                                            <p className="text-[9px] text-[#8C7B70] font-bold mt-2">Maximum file size: 25MB</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-5 bg-[#F9F7F2] rounded-3xl border border-[#E3DACD]/50">
                                    <input 
                                        type="checkbox" 
                                        id="share_team"
                                        className="w-5 h-5 text-[#C06842] focus:ring-[#C06842] border-[#E3DACD] rounded cursor-pointer"
                                        checked={formData.is_team_project}
                                        onChange={(e) => setFormData({...formData, is_team_project: e.target.checked})}
                                        disabled={!formData.project_id}
                                    />
                                    <label htmlFor="share_team" className={`flex-1 cursor-pointer ${!formData.project_id ? 'opacity-40' : ''}`}>
                                        <p className="text-sm font-bold text-[#2A1F1D]">Broadcast to Project Team</p>
                                        <p className="text-[10px] text-[#8C7B70] font-medium leading-tight">If checked, all accepted professionals in the project will see this.</p>
                                    </label>
                                </div>
                            </div>

                            <div className="shrink-0 group relative overflow-hidden rounded-[1.5rem]">
                                <div className="absolute inset-0 bg-gradient-to-r from-[#C06842] to-[#A65D3B] group-hover:scale-105 transition-transform duration-500" />
                                <button 
                                    type="submit"
                                    className="relative w-full py-5 text-white font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all"
                                >
                                    <Upload size={18} /> Confirm Upload
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Task Detail Modal */}
            {selectedTask && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#2A1F1D]/60 backdrop-blur-md animate-fade-in" onClick={() => setSelectedTask(null)}>
                    <div className="bg-[#FDFCF8] rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up border border-white" onClick={e => e.stopPropagation()}>
                        <div className="h-80 bg-[#2A1F1D] relative">
                            {selectedTask.image_path ? (
                                <img src={`${import.meta.env.VITE_API_URL}/${selectedTask.image_path}`} alt="Detail" className="w-full h-full object-contain" />
                            ) : (
                                <div className="h-full flex items-center justify-center text-white/20"><ImageIcon size={64} /></div>
                            )}
                            <button onClick={() => setSelectedTask(null)} className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white hover:text-black transition-all">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-10">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="text-[#C06842] text-[10px] font-black uppercase tracking-[0.2em] mb-2">Milestone Details</p>
                                    <h3 className="text-3xl font-bold font-serif text-[#2A1F1D]">{selectedTask.title}</h3>
                                </div>
                                <span className="px-5 py-2 bg-green-50 rounded-full text-xs font-black uppercase text-green-600 border border-green-100 shadow-sm">
                                    Approved
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#B8AFA5]">Project Site</p>
                                    <p className="text-sm font-bold text-[#2A1F1D] flex items-center gap-2"><MapPin size={16} className="text-[#C06842]" /> {selectedTask.project_name}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#B8AFA5]">Approval Date</p>
                                    <p className="text-sm font-bold text-[#2A1F1D] flex items-center gap-2 justify-end"><Calendar size={16} className="text-[#C06842]" /> {new Date(selectedTask.updated_at).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="p-6 bg-[#F9F7F2] rounded-3xl border border-[#E3DACD]/50">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8C7B70] mb-2">Technical Description</h4>
                                <p className="text-sm text-[#5D4037] leading-relaxed italic">"{selectedTask.description || "No technical notes were added for this task."}"</p>
                            </div>

                            <div className="mt-8 flex gap-4">
                                <button 
                                    onClick={() => setSelectedTask(null)}
                                    className="flex-1 py-4 border-2 border-[#E3DACD] text-[#8C7B70] rounded-2xl font-bold hover:bg-[#F9F7F2] transition-colors"
                                >
                                    Close Inspector
                                </button>
                                {selectedTask.image_path && (
                                    <a 
                                        href={`${import.meta.env.VITE_API_URL}/${selectedTask.image_path}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 py-4 bg-[#2A1F1D] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#4A342E] transition-all shadow-xl"
                                    >
                                        <Eye size={18} /> Full Resolution
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArchitectWorkboard;
