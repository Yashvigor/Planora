import React, { useState, useEffect, useCallback } from 'react';
import { useMockApp } from '../../../hooks/useMockApp';
import {
    HardHat, Clock, CheckCircle, FileText,
    MapPin, Plus, ArrowLeft, XCircle, Briefcase,
    TrendingUp, ArrowUpRight, Star, AlertOctagon
} from 'lucide-react';
import ExpertMap from '../../../components/dashboard/Client/ExpertMap';

const Card = ({ children, className = "" }) => (
    <div className={`glass-card rounded-[2rem] p-8 shadow-sm ${className}`}>
        {children}
    </div>
);

const SectionHeader = ({ title, action }) => (
    <div className="flex justify-between items-end mb-6 px-1">
        <h3 className="text-xl font-serif font-bold text-[#2A1F1D]">{title}</h3>
        {action}
    </div>
);

const ContractorOverview = () => {
    const { currentUser } = useMockApp();
    const [projects, setProjects] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [activeProject, setActiveProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [projectTeam, setProjectTeam] = useState([]);

    // Rating State
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [teamRatings, setTeamRatings] = useState({});
    const [isSubmittingRating, setIsSubmittingRating] = useState(false);

    const fetchData = useCallback(async () => {
        if (!currentUser?.user_id && !currentUser?.id) {
            setLoading(false);
            return;
        }
        const uid = currentUser.user_id || currentUser.id;
        setLoading(true);
        try {
            const projRes = await fetch(`${import.meta.env.VITE_API_URL}/api/professionals/${uid}/projects`);
            if (projRes.ok) {
                const projData = await projRes.json();

                const pendingInvs = projData.filter(p => p.assignment_status === 'Pending');
                const activeProjs = projData.filter(p => !p.assignment_status || p.assignment_status === 'Accepted');

                setInvitations(pendingInvs);
                setProjects(activeProjs);

                const projToFetch = activeProject || activeProjs[0];
                if (projToFetch) {
                    if (!activeProject || !activeProjs.find(p => p.project_id === activeProject.project_id)) {
                        setActiveProject(projToFetch);
                    }

                    const teamRes = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${projToFetch.project_id}/team`);
                    if (teamRes.ok) {
                        setProjectTeam(await teamRes.json());
                    }
                } else {
                    setActiveProject(null);
                    setProjectTeam([]);
                }
            }
        } catch (err) {
            console.error('Error fetching contractor data:', err);
        } finally {
            setLoading(false);
        }
    }, [currentUser, activeProject]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const respondToInvite = async (projectId, status) => {
        if (!currentUser?.user_id && !currentUser?.id) return;
        const uid = currentUser.user_id || currentUser.id;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}/assign/${uid}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }) // 'Accepted' or 'Rejected'
            });

            if (res.ok) {
                fetchData(); // Refresh lists
            } else {
                alert(`Failed to ${status.toLowerCase()} invitation.`);
            }
        } catch (err) {
            console.error("Error responding to invite:", err);
            alert("An error occurred while responding to the invitation.");
        }
    };

    const handleCompleteProject = async () => {
        if (!activeProject || activeProject.status === 'Completed') return;

        if (!window.confirm("Are you sure you want to mark this project as completed? This action cannot be undone immediately via the UI.")) {
            return;
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${activeProject.project_id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Completed' })
            });

            if (res.ok) {
                setActiveProject(prev => ({ ...prev, status: 'Completed' }));
                fetchData();
                setIsRatingModalOpen(true);
            } else {
                const err = await res.json();
                alert(`Failed to complete project: ${err.error}`);
            }
        } catch (error) {
            console.error("Error completing project:", error);
            alert("Connection error when completing project.");
        }
    };

    const handleRemoveMember = async (memberId, memberName) => {
        if (!window.confirm(`Are you sure you want to remove ${memberName} from this project team?`)) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${activeProject.project_id}/team/${memberId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchData(); // Refresh the team list
            } else {
                const errData = await res.json();
                alert(`Failed to remove team member: ${errData.error}`);
            }
        } catch (err) {
            console.error("Error removing team member:", err);
            alert("Connection error when removing team member.");
        }
    };

    const handleRatingChange = (userId, ratingValue) => {
        setTeamRatings(prev => ({
            ...prev,
            [userId]: ratingValue
        }));
    };

    const handleSubmitRatings = async () => {
        setIsSubmittingRating(true);
        try {
            const raterId = currentUser.user_id || currentUser.id;

            const ratingsArray = Object.entries(teamRatings)
                .filter(([_, rating]) => rating > 0)
                .map(([userId, rating]) => ({
                    rated_user_id: userId,
                    rating: rating
                }));

            if (ratingsArray.length === 0) {
                alert("Please provide at least one rating before submitting, or just skip.");
                setIsSubmittingRating(false);
                return;
            }

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${activeProject.project_id}/rate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rater_id: raterId,
                    ratings: ratingsArray
                })
            });

            if (res.ok) {
                alert("Ratings submitted successfully! Thank you for your feedback.");
                setIsRatingModalOpen(false);
                setTeamRatings({});
            } else {
                const errData = await res.json();
                alert(`Failed to submit ratings: ${errData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Error submitting ratings:", error);
            alert("Connection error when submitting ratings.");
        } finally {
            setIsSubmittingRating(false);
        }
    };

    if (loading) return <div className="p-20 text-center font-serif text-2xl animate-pulse">Initializing Contractor Workspace...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 font-sans text-[#2A1F1D]">

            {/* INVITATIONS BANNER */}
            {invitations.length > 0 && (
                <div className="space-y-4">
                    {invitations.map(inv => (
                        <div key={inv.project_id} className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h3 className="font-bold text-amber-900 flex items-center gap-2">
                                    <AlertOctagon size={18} /> New Project Invitation
                                </h3>
                                <p className="text-amber-800 text-sm mt-1">
                                    You have been invited to work on <strong>{inv.name}</strong> as <span className="uppercase text-xs font-bold bg-amber-200 px-2 py-0.5 rounded">{inv.assigned_role}</span>.
                                </p>
                            </div>
                            <div className="flex gap-3 shrink-0">
                                <button
                                    onClick={() => respondToInvite(inv.project_id, 'Rejected')}
                                    className="px-4 py-2 border border-amber-300 text-amber-800 rounded-lg text-sm font-bold hover:bg-amber-100 transition-colors"
                                >
                                    Decline
                                </button>
                                <button
                                    onClick={() => respondToInvite(inv.project_id, 'Accepted')}
                                    className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition-colors shadow-md"
                                >
                                    Accept Invitation
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Header */}
            <div className="glass-panel rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-500 border border-[#E3DACD]">
                <div className="absolute right-0 top-0 w-80 h-80 bg-[#C06842]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center space-x-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-[#2A1F1D] to-[#C06842] rounded-2xl flex items-center justify-center text-white shadow-lg">
                            <HardHat size={40} />
                        </div>
                        <div>
                            <p className="text-[#8C7B70] text-xs font-bold tracking-widest uppercase mb-1">Contractor Workspace</p>
                            <h1 className="text-4xl font-bold text-[#2A1F1D] font-serif">Welcome, {currentUser?.name || "Contractor"}</h1>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-[#E3DACD] text-center shadow-sm">
                            <p className="text-[10px] text-[#8C7B70] font-bold uppercase tracking-widest">Active Sites</p>
                            <p className="text-2xl font-serif font-bold text-[#2A1F1D]">{projects.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <SectionHeader
                            title="Assigned Projects"
                            action={
                                projects.length > 1 && (
                                    <select
                                        className="bg-[#F9F7F2] border border-[#E3DACD] rounded-xl px-4 py-2 text-xs font-bold text-[#5D4037] outline-none"
                                        value={activeProject?.project_id}
                                        onChange={(e) => setActiveProject(projects.find(p => p.project_id === e.target.value))}
                                    >
                                        {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.name}</option>)}
                                    </select>
                                )
                            }
                        />
                        <div className="space-y-6">
                            {projects.map(project => (
                                <div key={project.project_id} className={`p-6 rounded-3xl border transition-all ${activeProject?.project_id === project.project_id ? 'bg-[#FDFCF8] border-[#C06842]/30 shadow-md' : 'bg-white border-[#E3DACD]/40 hover:border-[#C06842]/20'}`}>
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <h3 className="font-bold text-xl text-[#2A1F1D] font-serif">{project.name}</h3>
                                            <p className="text-xs text-[#8C7B70] flex items-center gap-1 mt-1">
                                                <MapPin size={12} className="text-[#C06842]" /> {project.location || 'Site Location'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                                {project.status || 'Active'}
                                            </span>
                                            <button
                                                onClick={() => setActiveProject(project)}
                                                className="p-2 hover:bg-[#C06842] hover:text-white rounded-xl transition-all text-[#8C7B70]"
                                            >
                                                <TrendingUp size={20} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-[#F9F7F2]/50 p-3 rounded-xl border border-[#E3DACD]/30">
                                            <p className="text-[9px] text-[#8C7B70] font-bold uppercase mb-1">Type</p>
                                            <p className="text-xs font-bold text-[#2A1F1D]">{project.type}</p>
                                        </div>
                                        <div className="bg-[#F9F7F2]/50 p-3 rounded-xl border border-[#E3DACD]/30">
                                            <p className="text-[9px] text-[#8C7B70] font-bold uppercase mb-1">Role</p>
                                            <p className="text-xs font-bold text-[#2A1F1D] truncate">{project.assigned_role}</p>
                                        </div>
                                        <div className="bg-[#F9F7F2]/50 p-3 rounded-xl border border-[#E3DACD]/30 text-center">
                                            <p className="text-[9px] text-[#8C7B70] font-bold uppercase mb-1">Joined</p>
                                            <p className="text-xs font-bold text-[#2A1F1D]">{new Date(project.assigned_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    {activeProject?.project_id === project.project_id && project.status !== 'Completed' && (
                                        <div className="mt-4 flex justify-end">
                                            <button
                                                onClick={handleCompleteProject}
                                                className="px-4 py-2 bg-[#2A1F1D] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#4A342E] transition-colors flex items-center gap-2"
                                            >
                                                <CheckCircle size={14} /> Mark as Completed
                                            </button>
                                        </div>
                                    )}
                                    {activeProject?.project_id === project.project_id && project.status === 'Completed' && (
                                        <div className="mt-4 flex justify-end">
                                            <button
                                                onClick={() => setIsRatingModalOpen(true)}
                                                className="px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-yellow-100 transition-colors flex items-center gap-2"
                                            >
                                                <Star size={14} className="fill-yellow-500 text-yellow-500" /> Rate Team
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                <div className="space-y-8">
                    <Card>
                        <SectionHeader
                            title="Site Team"
                            action={
                                <button
                                    onClick={() => setIsDiscoveryOpen(true)}
                                    className="w-8 h-8 flex items-center justify-center bg-[#2A1F1D] text-white rounded-full hover:bg-[#C06842] transition-colors shadow-lg"
                                >
                                    <Plus size={16} />
                                </button>
                            }
                        />
                        <div className="space-y-4">
                            {projectTeam.length > 0 ? projectTeam.map(member => (
                                <div key={member.user_id} className="flex items-center space-x-4 p-3 bg-[#FDFCF8] border border-[#E3DACD]/30 rounded-2xl hover:bg-white transition-all group">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E3DACD] to-[#FDFCF8] flex items-center justify-center font-bold text-[#5D4037] border border-[#E3DACD]">
                                        {member.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm text-[#2A1F1D]">{member.name}</p>
                                        <p className="text-[10px] uppercase text-[#8C7B70] font-bold tracking-tight">{member.assigned_role || member.sub_category}</p>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveMember(member.user_id, member.name)}
                                        className="p-2 text-[#8C7B70] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        title={`Remove ${member.name} from project`}
                                    >
                                        <XCircle size={18} />
                                    </button>
                                </div>
                            )) : (
                                <div className="text-center py-8 opacity-50">
                                    <Briefcase size={32} className="mx-auto mb-2 text-[#8C7B70]" />
                                    <p className="text-xs font-bold">No sub-experts assigned yet</p>
                                </div>
                            )}
                            <button
                                onClick={() => setIsDiscoveryOpen(true)}
                                className="w-full py-4 mt-4 bg-[#F9F7F2] border-2 border-dashed border-[#E3DACD] rounded-2xl text-xs font-black text-[#5D4037] uppercase tracking-widest hover:border-[#C06842] hover:bg-white transition-all flex items-center justify-center gap-2"
                            >
                                <MapPin size={16} className="text-[#C06842]" /> Find Sub-Experts
                            </button>
                        </div>
                    </Card>

                    <Card className="bg-[#2A1F1D] text-white border-none overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#C06842]/20 rounded-full blur-2xl -mr-16 -mt-16"></div>
                        <SectionHeader title="Project Tools" />
                        <div className="grid grid-cols-2 gap-3 relative z-10">
                            <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all text-left">
                                <FileText size={20} className="mb-2 text-[#C06842]" />
                                <p className="text-[10px] font-bold uppercase tracking-wider">Reports</p>
                            </button>
                            <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all text-left">
                                <Clock size={20} className="mb-2 text-[#E68A2E]" />
                                <p className="text-[10px] font-bold uppercase tracking-wider">Timeline</p>
                            </button>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Discovery Map Overlay */}
            {isDiscoveryOpen && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-[#1a1412]/80 backdrop-blur-md">
                    <div className="relative w-full max-w-6xl h-[80vh] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-[#E3DACD]/40 flex justify-between items-center bg-[#FDFCF8]">
                            <h2 className="text-2xl font-serif font-bold">Expert Discovery</h2>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setIsDiscoveryOpen(false)}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-[#2A1F1D] text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[#C06842] transition-all shadow-md active:scale-95"
                                >
                                    <ArrowLeft size={16} /> Back to Dashboard
                                </button>
                                <button
                                    onClick={() => setIsDiscoveryOpen(false)}
                                    className="p-2 text-[#8C7B70] hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                    title="Close Map"
                                >
                                    <XCircle size={28} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1">
                            <ExpertMap
                                currentProjectId={activeProject?.project_id}
                                subCategory={selectedRole}
                                siteLocation={activeProject?.location || "India"}
                                onAssign={() => { fetchData(); setIsDiscoveryOpen(false); }}
                                onClose={() => setIsDiscoveryOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {isRatingModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2A1F1D]/60 backdrop-blur-md overflow-y-auto">
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl p-10 shadow-2xl my-8">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-3xl font-serif font-bold text-[#2A1F1D]">Project Completed! 🎉</h2>
                                <p className="text-[#8C7B70] mt-1">Please rate the professionals who worked on this project.</p>
                            </div>
                            <button onClick={() => setIsRatingModalOpen(false)} className="text-[#8C7B70] hover:text-[#C06842] transition-colors">
                                <XCircle size={28} />
                            </button>
                        </div>

                        {projectTeam.length === 0 ? (
                            <div className="text-center py-10 bg-[#F9F7F2] rounded-2xl border border-dashed border-[#E3DACD]">
                                <p className="text-[#8C7B70] font-medium">No team members were assigned to this project.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                {projectTeam.map(member => (
                                    <div key={member.user_id} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-[#F9F7F2] rounded-xl border border-[#E3DACD]">
                                        <div className="flex items-center gap-4 w-full sm:w-auto mb-4 sm:mb-0">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E3DACD] to-[#C06842] text-white flex items-center justify-center font-bold text-lg shadow-inner">
                                                {member.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-[#2A1F1D] text-lg">{member.name}</h4>
                                                <p className="text-xs font-bold text-[#8C7B70] uppercase tracking-wider">{member.assigned_role || member.sub_category}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 w-full sm:w-auto justify-center">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => handleRatingChange(member.user_id, star)}
                                                    className="focus:outline-none p-1 transition-transform hover:scale-110"
                                                >
                                                    <Star
                                                        size={28}
                                                        className={`transition-colors duration-200 ${(teamRatings[member.user_id] || 0) >= star
                                                            ? 'fill-yellow-500 text-yellow-500'
                                                            : 'text-gray-300 hover:text-yellow-200'
                                                            }`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-8 flex justify-end gap-4 border-t border-[#E3DACD]/50 pt-6">
                            <button
                                onClick={() => setIsRatingModalOpen(false)}
                                className="px-6 py-3 font-bold text-[#8C7B70] hover:text-[#2A1F1D] transition-colors"
                            >
                                Skip
                            </button>
                            <button
                                onClick={handleSubmitRatings}
                                disabled={projectTeam.length === 0 || isSubmittingRating}
                                className="px-8 py-3 bg-[#C06842] text-white font-bold rounded-xl shadow-lg hover:bg-[#A65D3B] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSubmittingRating ? 'Submitting...' : 'Submit Ratings'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractorOverview;
