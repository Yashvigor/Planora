import React, { useState, useEffect, useCallback } from 'react';
import { useMockApp } from '../../../hooks/useMockApp';
import {
    CheckSquare, Clock, MapPin, User, FileText, Upload,
    AlertCircle, CheckCircle, XCircle, ChevronRight,
    Camera, FileIcon, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProjectSelectModal = ({ isOpen, onClose, onAssign, team, projects, isSubmitting }) => {
    const [form, setForm] = useState({ project_id: '', assigned_to: '', title: '', description: '', due_date: '' });
    const [projectTeam, setProjectTeam] = useState([]);
    useEffect(() => {
        if (form.project_id) {
            fetch(`${import.meta.env.VITE_API_URL}/api/projects/${form.project_id}/team?status=Accepted`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` }
            })
                .then(res => res.json())
                .then(data => setProjectTeam(Array.isArray(data) ? data : []))
                .catch(console.error);
        } else {
            setProjectTeam([]);
        }
    }, [form.project_id]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2A1F1D]/70 backdrop-blur-md">
            <div className="bg-white rounded-[2rem] w-full max-w-lg p-10 shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-[#2A1F1D]">Assign New Task</h2>
                        <p className="text-xs text-[#8C7B70] mt-1 tracking-widest uppercase font-bold text-[#A65D3B]">Global Management</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"><XCircle size={24} /></button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); onAssign(form); }} className="space-y-5">
                    <div>
                        <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-2">Select Project *</label>
                        <select
                            required
                            className="w-full bg-[#F9F7F2] border border-[#E3DACD] rounded-xl px-4 py-3 text-sm font-medium focus:border-[#C06842] outline-none transition-colors"
                            value={form.project_id}
                            onChange={e => setForm({ ...form, project_id: e.target.value, assigned_to: '' })}
                        >
                            <option value="">-- Choose project --</option>
                            {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-2">Assign To *</label>
                        <select
                            required
                            disabled={!form.project_id}
                            className="w-full bg-[#F9F7F2] border border-[#E3DACD] rounded-xl px-4 py-3 text-sm font-medium focus:border-[#C06842] outline-none transition-colors disabled:opacity-40"
                            value={form.assigned_to}
                            onChange={e => setForm({ ...form, assigned_to: e.target.value })}
                        >
                            <option value="">-- Select team member --</option>
                            {projectTeam.map(m => (
                                <option key={m.user_id} value={m.user_id}>{m.name} ({m.assigned_role || m.sub_category})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-2">Task Title *</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. Verify plumbing layout"
                            className="w-full bg-[#F9F7F2] border border-[#E3DACD] rounded-xl px-4 py-3 text-sm focus:border-[#C06842] outline-none transition-colors"
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-2">Due Date</label>
                        <input
                            type="date"
                            className="w-full bg-[#F9F7F2] border border-[#E3DACD] rounded-xl px-4 py-3 text-sm focus:border-[#C06842] outline-none transition-colors"
                            value={form.due_date}
                            onChange={e => setForm({ ...form, due_date: e.target.value })}
                        />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-[#C06842] text-white py-4 rounded-xl font-bold hover:bg-[#2A1F1D] transition-all shadow-lg disabled:opacity-50 mt-4">
                        {isSubmitting ? 'Processing...' : 'Assign Task'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const TaskReviewModal = ({ task, isOpen, onClose, onReview, isSubmitting }) => {
    const [review, setReview] = useState({ status: '', rejection_reason: '', due_date: '' });

    if (!isOpen || !task) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#2A1F1D]/80 backdrop-blur-lg">
            <div className="bg-white rounded-[2rem] w-full max-w-xl p-8 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-serif font-bold text-[#2A1F1D]">Verify Submission</h2>
                        <p className="text-[10px] text-[#A65D3B] mt-1 uppercase tracking-widest font-black">Project: {task.project_name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-red-50 rounded-full transition-all text-[#B8AFA5] hover:text-red-500"><XCircle size={24} /></button>
                </div>

                {task.image_path && (
                    <div className="mb-6 p-4 bg-[#F9F7F2] border border-[#E3DACD] rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white rounded-lg border border-[#E3DACD] shadow-sm text-[#C06842]">
                                <FileText size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[#2A1F1D]">Submitted Work Document</p>
                                <p className="text-[10px] text-[#8C7B70] uppercase font-bold tracking-widest mt-0.5">Click to view/download</p>
                            </div>
                        </div>
                        <a
                            href={`${import.meta.env.VITE_API_URL}${task.image_path.startsWith('/') ? '' : '/'}${task.image_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors font-bold text-xs uppercase tracking-widest border border-blue-100"
                        >
                            Open File
                        </a>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <button onClick={() => setReview({ ...review, status: 'Approved' })} className={`py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${review.status === 'Approved' ? 'bg-green-600 text-white shadow-md' : 'bg-green-50 text-green-700 border border-green-100'}`}>Approve</button>
                    <button onClick={() => setReview({ ...review, status: 'Rejected' })} className={`py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${review.status === 'Rejected' ? 'bg-red-600 text-white shadow-md' : 'bg-red-50 text-red-700 border border-red-100'}`}>Reject</button>
                </div>

                {review.status === 'Rejected' && (
                    <div className="space-y-4 mb-6">
                        <textarea required className="w-full bg-[#F9F7F2] border border-[#E3DACD] rounded-xl px-4 py-3 text-sm focus:border-red-400 outline-none resize-none" rows={3} placeholder="What needs correction?" value={review.rejection_reason} onChange={e => setReview({ ...review, rejection_reason: e.target.value })} />
                        <input type="date" className="w-full bg-[#F9F7F2] border border-[#E3DACD] rounded-xl px-4 py-3 text-sm" value={review.due_date} onChange={e => setReview({ ...review, due_date: e.target.value })} />
                    </div>
                )}

                <button
                    onClick={() => onReview(task.task_id, review)}
                    disabled={!review.status || isSubmitting}
                    className="w-full py-4 bg-[#2A1F1D] text-white rounded-xl font-bold hover:bg-[#C06842] transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            Processing...
                        </>
                    ) : 'Confirm Verdict'}
                </button>
            </div>
        </div>
    );
};

const Tasks = () => {
    const { currentUser } = useMockApp();
    const isContractor = currentUser?.role === 'contractor' || currentUser?.sub_category === 'Contractor';
    const isLandOwner = currentUser?.role === 'land_owner' || currentUser?.sub_category === 'Land Owner';
    const isManager = isContractor || isLandOwner; // Landowner can now manage tasks same as contractor

    const [tasks, setTasks] = useState([]); // Will stay empty for Landowner/Contractor
    const [assignedTasks, setAssignedTasks] = useState([]);
    const [tasksToReview, setTasksToReview] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(isManager ? 'assignments' : 'my_queue');
    const [selectedTask, setSelectedTask] = useState(null);
    const [reviewingTask, setReviewingTask] = useState(null);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [projects, setProjects] = useState([]);

    const fetchTasks = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        const uid = currentUser.user_id || currentUser.id;
        const headers = { 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` };

        try {
            const myRes = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/user/${uid}`, { headers });
            if (myRes.ok) setTasks(await myRes.json());

            if (isManager) {
                const [assignedRes, reviewRes, projRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/api/tasks/assigned-by/${uid}`, { headers }),
                    fetch(`${import.meta.env.VITE_API_URL}/api/tasks/to-review/${uid}`, { headers }),
                    isContractor
                        ? fetch(`${import.meta.env.VITE_API_URL}/api/professionals/${uid}/projects`, { headers })
                        : fetch(`${import.meta.env.VITE_API_URL}/api/projects/user/${uid}`, { headers })
                ]);
                if (assignedRes.ok) setAssignedTasks(await assignedRes.json());
                if (reviewRes.ok) setTasksToReview(await reviewRes.json());
                if (projRes.ok) {
                    const pData = await projRes.json();
                    setProjects(pData.filter(p => !p.assignment_status || p.assignment_status === 'Accepted' || isLandOwner));
                }
            }
        } catch (err) {
            console.error("Failed to fetch tasks:", err);
        } finally {
            setLoading(false);
        }
    }, [currentUser, isContractor]);

    useEffect(() => { fetchTasks(); }, [fetchTasks]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            if (selectedFile.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => setPreview(reader.result);
                reader.readAsDataURL(selectedFile);
            } else { setPreview(null); }
        }
    };

    const handleSubmitTask = async (e) => {
        e.preventDefault();
        if (!file || !selectedTask) return;
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', currentUser.user_id || currentUser.id);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${selectedTask.task_id}/submit`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` },
                body: formData
            });
            if (res.ok) {
                setSelectedTask(null); setFile(null); setPreview(null); fetchTasks();
            } else { const err = await res.json(); alert(err.error || "Submission failed"); }
        } catch (err) { console.error("Error submitting task:", err); } finally { setIsSubmitting(false); }
    };

    const handleAssignTask = async (form) => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` },
                body: JSON.stringify({
                    project_id: form.project_id,
                    assigned_by: currentUser.user_id || currentUser.id,
                    assigned_to: form.assigned_to,
                    title: form.title,
                    description: form.description,
                    due_date: form.due_date
                })
            });
            if (res.ok) { setIsAssignModalOpen(false); fetchTasks(); }
            else { const err = await res.json(); alert(err.error || "Assignment failed"); }
        } catch (err) { console.error("Error assigning task:", err); } finally { setIsSubmitting(false); }
    };

    const handleReviewTask = async (taskId, reviewData) => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${taskId}/review`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` },
                body: JSON.stringify({ ...reviewData, reviewer_id: currentUser.user_id || currentUser.id })
            });
            if (res.ok) { setReviewingTask(null); fetchTasks(); }
            else { const err = await res.json(); alert(err.error || "Review failed"); }
        } catch (err) { console.error("Error reviewing task:", err); } finally { setIsSubmitting(false); }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'bg-green-100 text-green-700 border-green-200';
            case 'Rejected': return 'bg-red-100 text-red-700 border-red-200';
            case 'Submitted': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-amber-100 text-amber-700 border-amber-200';
        }
    };

    const renderTaskList = (list) => (
        <div className="grid gap-6">
            {list.map((task) => (
                <motion.div layout key={task.task_id} className={`group bg-white rounded-[2rem] border border-[#E3DACD] overflow-hidden hover:shadow-xl transition-all duration-500`}>
                    <div className="p-8 flex flex-col lg:flex-row gap-8 items-start">
                        <div className="flex-1 space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusColor(task.status)}`}>{task.status}</span>
                                {task.project_name && <span className="text-[10px] font-black text-[#A65D3B] uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded border border-amber-100">{task.project_name}</span>}
                            </div>
                            <div>
                                <h3 className="text-xl font-serif font-bold text-[#2A1F1D]">{task.title}</h3>
                                <p className="text-xs text-[#8C7B70] mt-1">{task.description}</p>
                            </div>
                            <div className="flex flex-wrap gap-4 pt-2">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-[#8C7B70]"><User size={12} className="text-[#A65D3B]" /> {activeTab === 'my_queue' ? task.assigner_name : task.assignee_name}</div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-[#8C7B70]"><MapPin size={12} className="text-[#C06842]" /> {task.location}</div>
                                {task.due_date && <div className="flex items-center gap-2 text-[10px] font-bold text-[#8C7B70]"><Calendar size={12} className="text-[#E68A2E]" /> {new Date(task.due_date).toLocaleDateString()}</div>}
                            </div>
                        </div>

                        <div className="w-full lg:w-48 shrink-0">
                            {activeTab === 'my_queue' && (task.status === 'Pending' || task.status === 'Rejected') && (
                                <button onClick={() => setSelectedTask(task)} className="w-full py-3 bg-[#2A1F1D] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#C06842] transition-all shadow-md">
                                    {task.status === 'Rejected' ? 'Resubmit Work' : 'Submit Work'}
                                </button>
                            )}
                            {activeTab === 'to_review' && (
                                <button onClick={() => setReviewingTask(task)} className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md">Review Now</button>
                            )}
                            {task.status === 'Rejected' && (
                                <div className={`p-3 rounded-xl border ${activeTab === 'my_queue' ? 'mt-3 bg-red-50 border-red-100' : 'bg-red-50 border-red-100'}`}>
                                    <p className="text-[10px] text-red-700 font-bold uppercase mb-1 flex items-center gap-1"><AlertCircle size={12} /> Feedback</p>
                                    <p className="text-[11px] text-red-800 italic leading-tight">"{task.rejection_reason}"</p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );

    return (
        <div className="p-4 md:p-10 bg-[#FDFCF8] min-h-screen font-sans text-[#2A1F1D]">
            <div className="max-w-6xl mx-auto space-y-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-[#A65D3B]"><CheckSquare size={24} strokeWidth={2.5} /><span className="text-xs font-black uppercase tracking-[0.3em]">Lifecycle Management</span></div>
                        <h1 className="text-5xl font-serif font-bold tracking-tight text-[#2A1F1D]">Task Hub</h1>
                        <p className="text-[#8C7B70] text-lg max-w-md">Orchestrate project workflows, manage team assignments, and verify quality standards.</p>
                    </div>
                    {isManager && (
                        <button onClick={() => setIsAssignModalOpen(true)} className="px-8 py-4 bg-[#2A1F1D] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#C06842] transition-all shadow-xl hover:-translate-y-1 active:translate-y-0">Assign New Task</button>
                    )}
                </div>

                <div className="flex gap-4 border-b border-[#E3DACD]">
                    {isManager ? ([
                        { id: 'assignments', label: 'Manage Assignments', icon: FileText },
                        { id: 'to_review', label: 'Pending Reviews', icon: Clock, count: tasksToReview.length },
                        { id: 'history', label: 'Work History', icon: CheckCircle }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-4 text-xs font-black uppercase tracking-widest transition-all relative flex items-center gap-3 ${activeTab === tab.id ? 'text-[#C06842]' : 'text-[#8C7B70] hover:text-[#2A1F1D]'}`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                            {tab.count > 0 && <span className="w-5 h-5 bg-[#C06842] text-white text-[9px] flex items-center justify-center rounded-full animate-pulse">{tab.count}</span>}
                            {activeTab === tab.id && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-[#C06842] rounded-t-full" />}
                        </button>
                    ))) : ([
                        { id: 'my_queue', label: 'My Queue', icon: User },
                        { id: 'history', label: 'Work History', icon: CheckCircle }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-4 text-xs font-black uppercase tracking-widest transition-all relative flex items-center gap-3 ${activeTab === tab.id ? 'text-[#C06842]' : 'text-[#8C7B70] hover:text-[#2A1F1D]'}`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                            {activeTab === tab.id && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-[#C06842] rounded-t-full" />}
                        </button>
                    )))}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4"><div className="w-12 h-12 border-4 border-[#A65D3B]/20 border-t-[#A65D3B] rounded-full animate-spin" /><p className="text-[#8C7B70] font-medium">Synchronizing Work Hub...</p></div>
                ) : (
                    <div className="space-y-6">
                        {activeTab === 'my_queue' && renderTaskList(tasks)}
                        {activeTab === 'assignments' && renderTaskList(assignedTasks.filter(t => t.status !== 'Approved'))}
                        {activeTab === 'to_review' && renderTaskList(tasksToReview)}
                        {activeTab === 'history' && renderTaskList([...tasks, ...assignedTasks].filter(t => t.status === 'Approved' || t.status === 'Rejected' || t.status === 'Completed'))}

                        {(activeTab === 'my_queue' && tasks.length === 0) ||
                            (activeTab === 'assignments' && assignedTasks.length === 0) ||
                            (activeTab === 'to_review' && tasksToReview.length === 0) ? (
                            <div className="text-center py-20 opacity-40"><CheckCircle size={48} className="mx-auto mb-4 text-[#B8AFA5]" /><p className="font-serif text-xl font-bold">No tasks in this category</p></div>
                        ) : null}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {selectedTask && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedTask(null)} className="absolute inset-0 bg-[#2A1F1D]/60 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col">
                            <div className="p-8 border-b border-[#E3DACD]/50 flex justify-between items-center bg-[#FDFCF8]">
                                <div className="space-y-1"><h2 className="text-2xl font-serif font-bold text-[#2A1F1D]">Submit Work</h2><p className="text-xs font-black text-[#A65D3B] uppercase tracking-[0.2em]">{selectedTask.title}</p></div>
                                <button onClick={() => setSelectedTask(null)}><XCircle size={24} className="text-[#B8AFA5]" /></button>
                            </div>
                            <form onSubmit={handleSubmitTask} className="p-8 space-y-8">
                                <input type="file" onChange={handleFileChange} accept="image/*,.pdf" className="w-full bg-[#F9F7F2] border-2 border-dashed border-[#E3DACD] rounded-3xl p-10 text-center cursor-pointer" />
                                {preview && <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-2xl shadow-md" />}
                                <button type="submit" disabled={isSubmitting || !file} className="w-full py-4 bg-[#A65D3B] text-white rounded-2xl font-bold hover:bg-[#2A1F1D] shadow-lg disabled:opacity-50">Confirm Submission</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ProjectSelectModal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} onAssign={handleAssignTask} projects={projects} isSubmitting={isSubmitting} />
            <TaskReviewModal task={reviewingTask} isOpen={!!reviewingTask} onClose={() => setReviewingTask(null)} onReview={handleReviewTask} isSubmitting={isSubmitting} />
        </div>
    );
};

export default Tasks;
