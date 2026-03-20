import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useMockApp } from '../../../hooks/useMockApp';
import { 
    FileText, CheckSquare, Clock, Users, Upload, 
    ChevronRight, MoreVertical, Plus, AlertCircle, 
    CheckCircle2, Circle, PlayCircle, BarChart3
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

const ProjectWorkspace = () => {
    const { id } = useParams();
    const { currentUser } = useMockApp();
    const { showToast } = useToast();
    const [project, setProject] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const fetchProject = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}`);
            if (res.ok) {
                const data = await res.json();
                setProject(data);
            } else {
                showToast("Failed to load project details", "error");
            }
        } catch (err) {
            console.error("Project fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [id, showToast]);

    useEffect(() => {
        fetchProject();
    }, [fetchProject]);

    const handleUpdatePhase = async (phase, completed) => {
        if (updating) return;
        
        // Land Owners and Contractors can update phases
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
                showToast(`${phase.charAt(0).toUpperCase() + phase.slice(1)} phase updated!`, "success");
                fetchProject();
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

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="w-12 h-12 border-4 border-[#C06842] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[#8C7B70] font-bold animate-pulse">Initializing Workspace...</p>
        </div>
    );

    if (!project) return (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
            <AlertCircle className="text-red-400 w-16 h-16" />
            <p className="text-[#2A1F1D] font-bold text-xl">Project Not Found</p>
            <button onClick={() => window.history.back()} className="text-[#C06842] font-bold underline">Go Back</button>
        </div>
    );

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Clock },
        { id: 'tasks', label: 'Tasks', icon: CheckSquare },
        { id: 'files', label: 'Files', icon: FileText },
    ];

    const phases = [
        { id: 'planning', label: 'Planning Phase', weight: 30, completed: project.planning_completed },
        { id: 'design', label: 'Design Phase', weight: 30, completed: project.design_completed, dependsOn: 'planning' },
        { id: 'execution', label: 'Execution Phase', weight: 40, completed: project.execution_completed, dependsOn: 'design' }
    ];

    return (
        <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
            {/* Header */}
            <div className="glass-panel p-8 rounded-[2rem] shadow-sm border border-[#E3DACD] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#C06842]/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>
                
                <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-serif font-black text-[#2A1F1D]">{project.name}</h1>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            project.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' :
                            project.status === 'Execution' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                            'bg-amber-100 text-amber-700 border-amber-200'
                        }`}>
                            {project.status || 'Active'}
                        </span>
                    </div>
                    <p className="text-sm text-[#8C7B70] font-bold flex items-center gap-2">
                        Project ID: #{project.project_id.toString().padStart(4, '0')} 
                        <span className="text-[#E3DACD]">•</span> 
                        <MapPin size={14} className="text-[#C06842]" /> {project.location || 'Site Location'}
                    </p>
                </div>

                <div className="flex flex-col items-end gap-3 relative z-10 w-full md:w-auto">
                    <div className="w-full md:w-64 bg-[#F9F7F2] p-4 rounded-2xl border border-[#E3DACD]/50 shadow-inner">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#8C7B70]">Overall Progress</span>
                            <span className="text-sm font-black text-[#C06842]">{project.progress || 0}%</span>
                        </div>
                        <div className="w-full h-2 bg-[#E3DACD]/30 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-[#A65D4D] to-[#C06842] rounded-full transition-all duration-1000"
                                style={{ width: `${project.progress || 0}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 bg-[#FDFCF8] p-1.5 rounded-2xl border border-[#E3DACD] w-fit shadow-sm">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center transition-all ${activeTab === tab.id
                            ? 'bg-[#2A1F1D] text-white shadow-lg'
                            : 'text-[#8C7B70] hover:bg-[#F9F7F2] hover:text-[#5D4037]'
                            }`}
                    >
                        <tab.icon className="w-4 h-4 mr-2" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 glass-card rounded-[2.5rem] shadow-sm border border-[#E3DACD]/50 overflow-hidden relative bg-white">

                {/* OVERVIEW TAB - PHASE CHECKLIST */}
                {activeTab === 'overview' && (
                    <div className="p-10 overflow-y-auto h-full space-y-12">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-serif font-black text-[#2A1F1D] flex items-center gap-3">
                                    <BarChart3 size={24} className="text-[#C06842]" /> Project Lifecycle
                                </h3>
                                <p className="text-sm text-[#8C7B70]">Each phase completion unlocks the next milestone and updates project value.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                            {/* Connector Line */}
                            <div className="hidden md:block absolute top-12 left-20 right-20 h-0.5 bg-[#E3DACD]/30 -z-0"></div>

                            {phases.map((phase, idx) => {
                                const isLocked = phase.dependsOn && !project[`${phase.dependsOn}_completed`];
                                return (
                                    <div key={phase.id} className={`relative z-10 flex flex-col items-center text-center space-y-4 ${isLocked ? 'opacity-40' : ''}`}>
                                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500 border-2 ${
                                            phase.completed 
                                            ? 'bg-green-500 border-green-600 shadow-lg shadow-green-200 text-white' 
                                            : isLocked 
                                                ? 'bg-[#F9F7F2] border-[#E3DACD] text-[#B8AFA5]'
                                                : 'bg-white border-[#C06842] text-[#C06842] shadow-xl shadow-[#C06842]/10 animate-pulse'
                                        }`}>
                                            {phase.completed ? <CheckCircle2 size={32} /> : isLocked ? <Clock size={32} /> : <PlayCircle size={32} />}
                                        </div>
                                        
                                        <div>
                                            <h4 className="font-serif font-black text-lg text-[#2A1F1D]">{phase.label}</h4>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#8C7B70] mt-1">Impact: +{phase.weight}% Progress</p>
                                        </div>

                                        <button
                                            disabled={updating || isLocked}
                                            onClick={() => handleUpdatePhase(phase.id, !phase.completed)}
                                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                                                phase.completed
                                                ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                                                : isLocked
                                                    ? 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200'
                                                    : 'bg-[#2A1F1D] text-white hover:bg-[#C06842] shadow-md shadow-black/10'
                                            }`}
                                        >
                                            {phase.completed ? 'Reopen Phase' : isLocked ? 'Locked' : 'Mark Complete'}
                                        </button>
                                        
                                        {isLocked && (
                                            <p className="text-[9px] text-[#A65D4D] font-bold max-w-[120px]">Requires {phase.dependsOn} completion first.</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Summary Box */}
                        <div className="bg-[#F9F7F2]/50 p-8 rounded-3xl border border-[#E3DACD]/50 flex flex-col md:flex-row gap-8 items-center justify-between">
                            <div className="space-y-2">
                                <h4 className="font-serif font-black text-xl text-[#2A1F1D]">Project Health Status</h4>
                                <p className="text-sm text-[#8C7B70]">Based on current completion, the project is safely moving towards delivery.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="text-center bg-white px-6 py-4 rounded-2xl border border-[#E3DACD] shadow-sm">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[#8C7B70] mb-1">Risk Level</p>
                                    <p className="text-lg font-black text-green-600">Low</p>
                                </div>
                                <div className="text-center bg-white px-6 py-4 rounded-2xl border border-[#E3DACD] shadow-sm">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[#8C7B70] mb-1">Confidence</p>
                                    <p className="text-lg font-black text-[#C06842]">94%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TASKS TAB */}
                {activeTab === 'tasks' && (
                    <div className="p-8 h-full flex flex-col items-center justify-center space-y-6">
                        <div className="w-24 h-24 bg-[#F9F7F2] rounded-full flex items-center justify-center border-2 border-[#E3DACD] text-[#8C7B70]">
                            <CheckSquare size={48} />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-serif font-black text-[#2A1F1D]">Task Integration</h3>
                            <p className="text-[#8C7B70] max-w-sm mx-auto">Please use the global <b>Task Hub</b> in the sidebar to manage specific deliverables for this project.</p>
                        </div>
                        <button 
                            onClick={() => window.location.href = '/dashboard/tasks'}
                            className="px-8 py-3 bg-[#2A1F1D] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#C06842] transition-colors shadow-xl"
                        >
                            Open Task Hub
                        </button>
                    </div>
                )}

                {/* FILES TAB */}
                {activeTab === 'files' && (
                    <div className="p-8 h-full flex flex-col items-center justify-center space-y-6">
                        <div className="w-24 h-24 bg-[#F9F7F2] rounded-full flex items-center justify-center border-2 border-[#E3DACD] text-[#8C7B70]">
                            <FileText size={48} />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-serif font-black text-[#2A1F1D]">Project Repository</h3>
                            <p className="text-[#8C7B70] max-w-sm mx-auto">Centralized document management is available in the <b>Documents</b> section.</p>
                        </div>
                        <button 
                            onClick={() => window.location.href = '/dashboard/documents'}
                            className="px-8 py-3 bg-[#A65D4D] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#2A1F1D] transition-colors shadow-xl"
                        >
                            Open Documents
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectWorkspace;
