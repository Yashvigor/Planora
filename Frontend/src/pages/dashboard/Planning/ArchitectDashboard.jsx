import React, { useState, useEffect, useCallback } from 'react';
import { useMockApp } from '../../../hooks/useMockApp';
import {
    Layers, PenTool, CheckCircle, Upload, AlertTriangle,
    MessageCircle, Calendar, Camera, FileText,
    Briefcase, Layout, ArrowRight, Clock, MoreHorizontal,
    Plus, Search, Filter, Eye, Download, Archive, Trash2,
    X, User, AlertOctagon, HelpCircle, MapPin, ChevronDown
} from 'lucide-react';
import DocumentManager from '../../../components/Common/DocumentManager';

const StatusBadge = ({ status }) => {
    const styles = {
        'Approved': 'bg-green-100 text-green-800 border-green-200',
        'Pending': 'bg-amber-100 text-amber-800 border-amber-200',
        'In Progress': 'bg-blue-100 text-blue-800 border-blue-200',
        'Not Started': 'bg-gray-100 text-gray-800 border-gray-200',
        'Review': 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || styles['Not Started']}`}>
            {status}
        </span>
    );
};

const SectionHeader = ({ title, action }) => (
    <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-[#3E2B26] flex items-center">
            {title}
        </h3>
        {action}
    </div>
);

const ArchitectDashboard = () => {
    const { currentUser, messages, siteProgress, sendMessage, addSiteProgress } = useMockApp();
    const [projects, setProjects] = useState([]);
    const [activeProject, setActiveProject] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- State & Persistence ---
    const initialData = {
        designStatus: [
            { id: 1, title: 'Concept Design', status: 'Approved', info: 'Finalized on Jan 15' },
            { id: 2, title: 'Working Drawings', status: 'In Progress', info: 'Struc. coordination ongoing' },
            { id: 3, title: '3D / Elevation', status: 'Pending', info: 'Client feedback awaited' },
            { id: 4, title: 'Structural Coord.', status: 'Review', info: 'Beam clash resolved' },
            { id: 5, title: 'Approval Submission', status: 'Not Started', info: 'Due by Feb 20' },
        ],
        drawings: [],
        coordination: [
            { id: 1, type: 'Structural', message: 'Increase column C4 size to 450x600mm.', from: 'Er. Civil', date: '2h ago', priority: 'High' },
            { id: 2, type: 'MEP', message: 'HVAC duct clash with beam at grid 3-B.', from: 'MEP Consultant', date: '5h ago', priority: 'Medium' },
            { id: 3, type: 'Clash', message: 'Plumbing pipe conflicting with electrical tray in corridor.', from: 'System', date: '1d ago', priority: 'Critical' },
        ],
        siteQueries: [
            { id: 1, from: 'Site Eng.', subject: 'Lintel height clarification', status: 'Pending' },
            { id: 2, from: 'Contractor', subject: 'Tile shade approval', status: 'Resolved' },
        ],
        siteProgress: [
            { id: 1, img: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=300', note: 'Plinth work completed', date: 'Today', alert: null },
            { id: 2, img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=300', note: 'Column shuttering', date: 'Yesterday', alert: 'Rebar spacing deviation noticed' },
        ]
    };

    const [data, setData] = useState({
        designStatus: [],
        drawings: [],
        coordination: [],
        siteQueries: [],
        siteProgress: []
    });

    const fetchProjectDetails = useCallback(async (projectId) => {
        try {
            // Fetch Phases from Backend
            const phasesRes = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}/phases`);
            const phases = phasesRes.ok ? await phasesRes.json() : [];

            // Filter Local Context Data
            const projMessages = messages.filter(m => m.projectId === projectId).map(m => ({
                id: m.id,
                type: 'Update',
                message: m.text,
                from: m.sender || 'User',
                date: m.time,
                priority: 'Normal'
            }));

            const projProgress = siteProgress.filter(p => p.projectId === projectId).map(p => ({
                id: p.id,
                img: p.image, // Base64 or URL
                note: p.note,
                date: p.date,
                alert: p.alertType
            }));

            setData(prev => ({
                ...prev,
                designStatus: phases.length > 0 ? phases : initialData.designStatus,
                coordination: projMessages.length > 0 ? projMessages : [], // Use filtered local messages
                siteProgress: projProgress.length > 0 ? projProgress : []   // Use filtered local progress
            }));
        } catch (err) {
            console.error('Error fetching project details:', err);
        }
    }, [messages, siteProgress]);

    const fetchProfessionalProjects = useCallback(async () => {
        if (!currentUser?.user_id && !currentUser?.id) return;
        const uid = currentUser.user_id || currentUser.id;
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/professionals/${uid}/projects`);
            if (res.ok) {
                const projectsData = await res.json();
                setProjects(projectsData);
                if (projectsData.length > 0 && !activeProject) {
                    setActiveProject(projectsData[0]);
                }
            }
        } catch (err) {
            console.error('Failed to fetch assigned projects:', err);
        } finally {
            setLoading(false);
        }
    }, [currentUser, activeProject]);

    useEffect(() => {
        fetchProfessionalProjects();
    }, [fetchProfessionalProjects]);

    useEffect(() => {
        if (activeProject?.project_id) {
            fetchProjectDetails(activeProject.project_id);
        }
    }, [activeProject, fetchProjectDetails]);

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in font-sans pb-20 text-[#2A1F1D]">

            {/* 1. HEADER SECTION (Project Snapshot) */}
            <div className="glass-panel rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                <div className="absolute right-0 top-0 w-80 h-80 bg-[#C06842]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div>
                        <div className="flex items-center space-x-3 mb-2 opacity-80">
                            <div className="p-2 bg-[#C06842]/10 rounded-lg text-[#C06842]">
                                <Briefcase size={18} />
                            </div>
                            <span className="text-sm font-bold tracking-widest uppercase text-[#8C7B70]">Architect Workspace</span>
                        </div>
                        <h1 className="text-5xl font-bold mb-4 font-serif text-[#2A1F1D]">Welcome, {currentUser?.name || "Architect"}</h1>
                        <div className="flex flex-wrap gap-4 text-sm mt-6">
                            <div className="px-4 py-2 bg-[#F9F7F2] rounded-xl border border-[#E3DACD] flex items-center space-x-2 text-[#5D4037] shadow-sm">
                                <Layout size={16} className="text-[#C06842]" />
                                <span>Active Projects: <strong className="text-[#2A1F1D] ml-1">{projects.length}</strong></span>
                            </div>
                            {activeProject && (
                                <div className="px-4 py-2 bg-[#F9F7F2] rounded-xl border border-[#E3DACD] flex items-center space-x-2 text-[#5D4037] shadow-sm">
                                    <MapPin size={16} className="text-[#E68A2E]" />
                                    <span>Selected: <strong className="text-[#2A1F1D] ml-1">{activeProject.name}</strong></span>
                                </div>
                            )}
                        </div>
                    </div>

                    {activeProject && (
                        <div className="bg-[#FDFCF8]/60 backdrop-blur-md p-6 rounded-2xl border border-[#E3DACD]/50 min-w-[220px] shadow-sm group-hover:shadow-md transition-all">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs text-[#8C7B70] font-bold uppercase tracking-widest">Current Phase</span>
                                <MoreHorizontal size={16} className="text-[#B8AFA5]" />
                            </div>
                            <div className="text-2xl font-bold text-[#C06842] flex items-center space-x-3">
                                <span>Active</span>
                                <div className="h-2.5 w-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                            </div>
                            <p className="text-xs text-[#6E5E56] font-medium mt-1">{activeProject.type}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. DESIGN STATUS OVERVIEW */}
            <section>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {data.designStatus.map((item) => (
                        <div key={item.id} className="glass-card p-5 rounded-2xl border border-[#E3DACD]/40 hover:border-[#C06842]/30 hover:shadow-lg transition-all duration-300 group cursor-default">
                            <div className="flex justify-between items-start mb-3 h-10">
                                <h4 className="font-bold text-[#2A1F1D] text-sm leading-tight group-hover:text-[#C06842] transition-colors">{item.title}</h4>
                            </div>
                            <StatusBadge status={item.status} />
                            <p className="text-[10px] text-[#8C7B70] mt-4 border-t border-dashed border-[#E3DACD] pt-3 truncate font-medium">{item.info}</p>
                        </div>
                    ))}
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 3. DRAWINGS & DESIGN MANAGEMENT */}
                <div className="lg:col-span-2 glass-card rounded-[2rem] border border-[#E3DACD]/40 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                    <div className="p-8 border-b border-[#E3DACD]/30 flex flex-wrap justify-between items-center gap-4 bg-[#F9F7F2]/30">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-[#C06842]/10 rounded-xl text-[#C06842]"><Layers size={22} /></div>
                            <h3 className="text-xl font-serif font-bold text-[#2A1F1D]">Project Drawings</h3>
                        </div>
                        {projects.length > 1 && (
                            <div className="relative">
                                <select
                                    value={activeProject?.project_id}
                                    onChange={(e) => setActiveProject(projects.find(p => p.project_id === e.target.value))}
                                    className="appearance-none bg-white border border-[#E3DACD] rounded-xl px-4 py-2 pr-10 text-xs font-bold text-[#5D4037] outline-none shadow-sm focus:border-[#C06842]"
                                >
                                    {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.name}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-2.5 text-[#8C7B70] pointer-events-none" size={14} />
                            </div>
                        )}
                    </div>

                    <div className="p-8 flex-1">
                        {activeProject ? (
                            <DocumentManager
                                projectId={activeProject.project_id}
                                filterType="Planning"
                                title="Architectural Drawings"
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-[#8C7B70] space-y-4">
                                <Archive size={48} className="opacity-20" />
                                <p className="font-bold">No active projects assigned.</p>
                                <p className="text-xs">Once you are assigned to a project, drawings will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. COORDINATION & 5. SITE PROGRESS */}
                <div className="space-y-8">
                    {/* Coordination Panel */}
                    <div className="glass-card rounded-[2rem] border border-[#E3DACD]/40 shadow-sm p-8">
                        <SectionHeader
                            title="Coordination"
                            action={<AlertOctagon className="text-amber-500 animate-pulse" size={24} />}
                        />

                        <div className="space-y-4 mb-8">
                            {data.coordination.map((note) => (
                                <div key={note.id} className="p-4 bg-[#F9F7F2] rounded-2xl border border-[#E3DACD]/50 relative hover:border-[#C06842]/30 transition-colors group">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wide ${note.type === 'Structural' ? 'bg-blue-50 text-blue-700' :
                                            note.type === 'Clash' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'
                                            }`}>{note.type}</span>
                                        <span className="text-[10px] text-[#B8AFA5] font-medium">{note.date}</span>
                                    </div>
                                    <p className="text-sm font-semibold text-[#2A1F1D] leading-snug group-hover:text-[#C06842] transition-colors">"{note.message}"</p>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-[#E3DACD]/50 pt-6">
                            <h4 className="text-sm font-bold text-[#2A1F1D] mb-4 flex items-center gap-2 uppercase tracking-wider">
                                <HelpCircle size={18} className="text-[#A65D3B]" /> Site Queries
                            </h4>
                            <div className="space-y-3">
                                {data.siteQueries.map(q => (
                                    <div key={q.id} className="flex justify-between items-center text-sm p-3 bg-[#FDFCF8] border border-[#E3DACD]/30 rounded-xl hover:shadow-sm transition-shadow">
                                        <span className="text-[#5D4037] truncate flex-1 font-medium">{q.subject}</span>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${q.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>{q.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Site Progress */}
                    <div className="glass-card rounded-[2rem] border border-[#E3DACD]/40 shadow-sm p-8">
                        <SectionHeader
                            title="Site Progress"
                            action={<button className="p-2 bg-[#F9F7F2] rounded-full text-[#8C7B70] hover:text-[#C06842] transition-colors"><Camera size={20} /></button>}
                        />
                        <div className="space-y-4">
                            {data.siteProgress.map((item) => (
                                <div key={item.id} className="group relative rounded-2xl overflow-hidden border border-[#E3DACD]/50 hover:shadow-lg transition-all">
                                    <img src={item.img} alt="progress" className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end">
                                        <p className="text-white text-xs font-bold">{item.note}</p>
                                        <p className="text-white/60 text-[10px] mt-1">{item.date}</p>
                                        {item.alert && (
                                            <div className="absolute top-3 right-3 bg-red-500/90 text-white text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-lg backdrop-blur-sm">
                                                <AlertTriangle size={10} /> {item.alert}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-6 py-3 bg-[#F9F7F2] text-[#5D4037] rounded-xl text-xs font-bold hover:bg-[#2A1F1D] hover:text-white transition-all border border-[#E3DACD]/50">
                            View Site Gallery
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArchitectDashboard;
