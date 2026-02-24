import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useMockApp } from '../../../hooks/useMockApp';
import {
    AlertTriangle, Bell, Calendar, ChevronRight, Download,
    FileText, Hammer, MessageSquare, Phone, PieChart,
    Plus, TrendingUp, User, Users, XCircle, CheckCircle,
    ArrowUpRight, Clock, ShieldCheck, HardHat, ExternalLink,
    Banknote, Coins, MapPin, ArrowLeft, Star
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ExpertMap from '../../../components/dashboard/Client/ExpertMap';

// --- Reusable UI Components ---

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

// --- Charts & Visuals ---

const DonutChart = ({ percentage, color = "text-[#C06842]", label, subt }) => {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex items-center space-x-6">
            <div className="relative w-28 h-28">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 70 70">
                    <circle
                        className="text-[#E3DACD]"
                        strokeWidth="6"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="35"
                        cy="35"
                    />
                    <circle
                        className={`${color} transition-all duration-1000 ease-out`}
                        strokeWidth="6"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="35"
                        cy="35"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#2A1F1D]">
                    <span className="text-2xl font-serif font-bold">{percentage}%</span>
                </div>
            </div>
            <div>
                <p className="text-lg font-bold text-[#2A1F1D]">{label}</p>
                <p className="text-sm text-[#6E5E56]">{subt}</p>
            </div>
        </div>
    );
};

const BudgetBar = ({ label, value, max, color = "bg-[#C06842]" }) => {
    const widthPC = Math.min((value / max) * 100, 100);
    return (
        <div className="mt-4">
            <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-[#6E5E56] uppercase tracking-wider">{label}</span>
                <span className="text-[#2A1F1D]">₹ {(value / 100000).toFixed(1)}L</span>
            </div>
            <div className="w-full bg-[#E3DACD]/30 h-2 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full ${color} transition-all duration-1000`}
                    style={{ width: `${widthPC}%` }}
                ></div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, subtext, trend, icon: Icon }) => (
    <div className="glass-card p-6 rounded-[1.5rem] hover:-translate-y-1 duration-300 group">
        <div className="flex justify-between items-start mb-3">
            <p className="text-[#8C7B70] text-[10px] font-bold uppercase tracking-widest">{label}</p>
            {Icon && <Icon size={18} className="text-[#C06842] group-hover:scale-110 transition-transform" />}
        </div>
        <div className="flex justify-between items-end">
            <h4 className="text-3xl font-serif font-medium text-[#2A1F1D] mb-1">{value}</h4>
            {trend && (
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full mb-1 flex items-center ${trend === 'up' ? 'bg-[#FDFCF8] text-green-700 border border-green-100' : 'bg-red-50 text-red-700'
                    }`}>
                    {trend === 'up' ? <TrendingUp size={10} className="mr-1" /> : <ArrowUpRight size={10} className="mr-1 rotate-90" />}
                    {trend === 'up' ? 'High' : 'Low'}
                </span>
            )}
        </div>
        {subtext && <p className="text-xs text-[#6E5E56] font-medium mt-1">{subtext}</p>}
    </div>
);

const DocumentItem = ({ name, type, status, onDownload }) => (
    <div className="flex items-center justify-between p-4 bg-[#FDFCF8]/80 backdrop-blur-sm rounded-2xl hover:bg-white transition-all group cursor-pointer border border-[#E3DACD]/50 hover:border-[#C06842]/30 shadow-sm hover:shadow-md">
        <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${status === 'Approved' ? 'bg-green-50 text-green-700' :
                type === 'img' ? 'bg-[#F9F7F2] text-[#C06842]' : 'bg-[#E3DACD]/20 text-[#5D4037]'
                }`}>
                <FileText size={20} />
            </div>
            <div>
                <p className="font-bold text-[#2A1F1D] text-sm">{name}</p>
                <p className="text-[10px] text-[#8C7B70] font-bold uppercase tracking-wide">Updated just now</p>
            </div>
        </div>
        <div className="flex items-center space-x-2">
            {status ? (
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${status === 'Approved' ? 'bg-green-50 text-green-700 border border-green-100' :
                    'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>{status}</span>
            ) : (
                <span className="text-[10px] font-bold text-[#A65D3B] px-2 opacity-0 group-hover:opacity-100 transition-opacity">VIEW</span>
            )}
            <button
                onClick={(e) => { e.stopPropagation(); onDownload(); }}
                className="p-2 text-[#8C7B70] hover:text-[#C06842] hover:bg-[#F9F7F2] rounded-lg transition-all opacity-0 group-hover:opacity-100"
            >
                <Download size={18} />
            </button>
        </div>
    </div>
);

const NotificationItem = ({ title, time, type }) => (
    <div className="flex items-start space-x-4 p-4 border-b border-[#E3DACD]/30 last:border-0 hover:bg-[#F9F7F2] rounded-xl transition-colors group">
        <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${type === 'alert' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-[#C06842]'
            }`} />
        <div className="flex-1">
            <p className="text-sm font-bold text-[#2A1F1D] leading-tight group-hover:text-[#C06842] transition-colors">{title}</p>
            <p className="text-xs text-[#8C7B70] mt-1">{time}</p>
        </div>
        <ChevronRight size={14} className="text-[#D8CFC4] group-hover:text-[#A65D3B] mt-1 transition-colors" />
    </div>
);

const LandOwnerDashboard = () => {
    const { currentUser, messages, siteProgress } = useMockApp();
    const [projects, setProjects] = useState([]);
    const [activeProject, setActiveProject] = useState(null);
    const [history, setHistory] = useState([]);
    const [recentDocs, setRecentDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [projectTeam, setProjectTeam] = useState([]);
    const [newProject, setNewProject] = useState({ name: '', type: 'Residential', location: '', budget: '' });

    // Rating State
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [teamRatings, setTeamRatings] = useState({});
    const [isSubmittingRating, setIsSubmittingRating] = useState(false);

    const fetchData = useCallback(async () => {
        if (!currentUser?.id) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const projRes = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/user/${currentUser.id}`);
            const projData = await projRes.json();
            setProjects(projData);

            const projToFetch = activeProject || projData[0];
            if (projToFetch) {
                if (!activeProject) setActiveProject(projToFetch);

                const [histRes, docRes, teamRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/api/activity/${projToFetch.project_id}`),
                    fetch(`${import.meta.env.VITE_API_URL}/api/documents/project/${projToFetch.project_id}`),
                    fetch(`${import.meta.env.VITE_API_URL}/api/projects/${projToFetch.project_id}/team`)
                ]);

                if (histRes.ok) setHistory(await histRes.json());
                if (docRes.ok) setRecentDocs(await docRes.json());
                if (teamRes.ok) setProjectTeam(await teamRes.json());
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    }, [currentUser, activeProject]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateProject = async (e) => {
        e.preventDefault();
        const userId = currentUser.user_id || currentUser.id;

        if (!userId) {
            alert("Error: User ID not found. Please try logging in again.");
            return;
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    owner_id: userId,
                    ...newProject,
                    budget: parseFloat(newProject.budget) || 0
                }),
            });

            const contentType = res.headers.get("content-type");
            if (res.ok) {
                setIsCreateModalOpen(false);
                fetchData();
                setNewProject({ name: '', type: 'Residential', location: '', budget: '' });
                alert("Project launched successfully!");
            } else {
                let errorMessage = 'Unknown error occurred';
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await res.json();
                    errorMessage = errorData.error || errorMessage;
                } else {
                    const text = await res.text();
                    console.error('Non-JSON Error Response:', text);
                    errorMessage = `Server Error (${res.status}): The backend returned an unexpected response format. Please ensure the server is running correctly.`;
                }
                alert(`Failed to launch project: ${errorMessage}`);
            }
        } catch (err) {
            console.error('Project creation networking error:', err);
            alert(`Connection Error: Could not connect to the backend server at ${import.meta.env.VITE_API_URL}. Please ensure the backend is running. (Error: ${err.message})`);
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
                // Update local state temporarily, better to just refetch
                setActiveProject(prev => ({ ...prev, status: 'Completed' }));
                fetchData();
                setIsRatingModalOpen(true); // Open rating modal immediately 
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

            // Format ratings into an array, filtering out zeroes or undefined
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
                setTeamRatings({}); // reset
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

    const calculations = useMemo(() => {
        if (!activeProject) return { netProfit: 0, roi: "0.0", budget: 0, marketValue: 0 };
        const investment = parseFloat(activeProject.budget) || 0;
        const marketVal = parseFloat(activeProject.market_value) || (investment * 1.5);
        const netProfit = marketVal - investment;
        const roi = investment > 0 ? (netProfit / investment) * 100 : 0;

        return {
            netProfit,
            roi: roi.toFixed(1),
            budget: investment,
            marketValue: marketVal
        };
    }, [activeProject]);

    if (loading) return <div className="p-20 text-center font-serif text-2xl animate-pulse">Initializing Dashboard...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 font-sans text-[#2A1F1D]">
            {!activeProject ? (
                <div className="animate-fade-in py-10 text-center">
                    <Card className="text-center py-20 bg-[#F9F7F2]/50">
                        <div className="w-24 h-24 bg-[#E3DACD]/30 rounded-full flex items-center justify-center mx-auto mb-8 text-[#C06842]">
                            <HardHat size={48} />
                        </div>
                        <h1 className="text-4xl font-serif font-bold text-[#2A1F1D] mb-4">No Active Project Found</h1>
                        <p className="text-[#8C7B70] text-lg mb-10 max-w-md mx-auto">Start your construction journey today. Create a project to track designs, approvals, and budget.</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="w-full sm:w-auto px-10 py-5 bg-[#C06842] text-white rounded-2xl font-bold text-lg shadow-xl hover:bg-[#A65D3B] transition-all transform hover:scale-105"
                            >
                                Initialize New Project
                            </button>
                            <button
                                onClick={() => setIsDiscoveryOpen(true)}
                                className="w-full sm:w-auto px-10 py-5 bg-[#2A1F1D] text-white rounded-2xl font-bold text-lg shadow-xl hover:bg-[#4A3D39] transition-all transform hover:scale-105 flex items-center justify-center"
                            >
                                <MapPin size={20} className="mr-2" /> Browse Professionals
                            </button>
                        </div>
                    </Card>
                </div>
            ) : (
                <div className="animate-fade-in space-y-8">
                    {/* Header Section */}
                    <div className="glass-panel rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                        <div className="absolute right-0 top-0 w-80 h-80 bg-[#C06842]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                            <div className="flex items-center space-x-8">
                                <div className="relative group cursor-pointer">
                                    <div className="w-24 h-24 rounded-2xl p-1 bg-gradient-to-br from-[#E3DACD] to-[#C06842]">
                                        <img
                                            src={`https://i.pravatar.cc/150?u=${currentUser?.id}`}
                                            alt="Profile"
                                            className="w-full h-full rounded-xl object-cover border-2 border-[#FDFCF8]"
                                        />
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-[#4A342E] border-4 border-[#FDFCF8] w-8 h-8 rounded-full flex items-center justify-center shadow-md">
                                        <ShieldCheck size={14} className="text-[#FDFCF8]" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[#8C7B70] text-sm font-bold tracking-wide uppercase mb-2 flex items-center">
                                        Welcome back <span className="w-2 h-2 bg-green-500 rounded-full ml-2 animate-pulse"></span>
                                    </p>
                                    <h1 className="text-4xl font-serif font-medium text-[#2A1F1D] leading-tight mb-2">{currentUser?.name || "Land Owner"}</h1>
                                    <div className="flex items-center space-x-3 text-sm font-medium text-[#6E5E56]">
                                        <span className="bg-[#E3DACD]/30 px-3 py-1 rounded-full text-xs font-bold text-[#5D4037] border border-[#E3DACD]/50">OWNER</span>
                                        <span>•</span>
                                        <span>{activeProject.name}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 w-full lg:w-auto bg-[#FDFCF8]/60 backdrop-blur-md rounded-2xl p-6 border border-[#E3DACD]/40 shadow-sm hover:shadow-md transition-all duration-300">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h2 className="font-bold text-lg text-[#2A1F1D]">Current Phase</h2>
                                        <p className="text-xs text-[#C06842] font-bold uppercase tracking-wide mt-1">{activeProject.status}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-[#8C7B70] font-bold uppercase tracking-widest">Target (Est)</p>
                                        <p className="text-sm font-bold text-[#2A1F1D]">{activeProject.expected_completion ? new Date(activeProject.expected_completion).toLocaleDateString() : "TBD"}</p>
                                    </div>
                                </div>
                                <div className="relative pt-2">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-xs font-bold text-[#6E5E56]">Completion Progress</span>
                                        <span className="text-sm font-bold text-[#C06842]">{recentDocs.length > 0 ? Math.min(recentDocs.filter(d => d.status === 'Approved').length * 20, 100) : 0}%</span>
                                    </div>
                                    <div className="w-full bg-[#D8CFC4]/30 h-2.5 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-[#C06842] to-[#E68A2E] rounded-full shadow-[0_0_10px_rgba(192,104,66,0.3)]" style={{ width: `${recentDocs.length > 0 ? Math.min(recentDocs.filter(d => d.status === 'Approved').length * 20, 100) : 0}%` }}></div>
                                    </div>
                                </div>

                                {activeProject.status !== 'Completed' && (
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            onClick={handleCompleteProject}
                                            className="px-4 py-2 bg-[#2A1F1D] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#4A342E] transition-colors flex items-center gap-2"
                                        >
                                            <CheckCircle size={14} /> Mark as Completed
                                        </button>
                                    </div>
                                )}
                                {activeProject.status === 'Completed' && (
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
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="bg-gradient-to-br from-[#2A1F1D] to-[#4A342E] text-white border-none overflow-hidden relative group">
                                    <p className="text-[#E3DACD] text-xs font-bold uppercase tracking-wider mb-6">Proj. ROI</p>
                                    <h4 className="text-5xl font-serif mb-2">{calculations.roi}%</h4>
                                    <p className="text-xs text-[#D8CFC4]">Profit: ₹{(calculations.netProfit / 100000).toFixed(1)}L</p>
                                </Card>
                                <StatCard label="Total Investment" value={`₹ ${(calculations.budget / 100000).toFixed(1)}L`} icon={Banknote} />
                                <StatCard label="Est. Market Value" value={`₹ ${(calculations.marketValue / 100000).toFixed(1)}L`} trend="up" icon={Coins} />
                            </div>

                            <Card>
                                <SectionHeader title="Financial Overview" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="flex flex-col items-center">
                                        <DonutChart percentage={calculations.roi > 100 ? 100 : calculations.roi} label="ROI Estimate" />
                                    </div>
                                    <div className="space-y-6">
                                        <BudgetBar label="Total Budget" value={calculations.budget} max={calculations.budget} color="bg-[#2A1F1D]" />
                                        <BudgetBar label="Current Spend" value={calculations.budget * 0.45} max={calculations.budget} color="bg-[#C06842]" />
                                    </div>
                                </div>
                            </Card>

                            <Card>
                                <SectionHeader title="Recent Documents" action={<Link to="/documents" className="text-[#C06842] text-xs font-bold">View All</Link>} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {recentDocs.length > 0 ? recentDocs.map(doc => (
                                        <DocumentItem key={doc.doc_id} name={doc.name} status={doc.status} onDownload={() => window.open(`${import.meta.env.VITE_API_URL}/${doc.file_path}`, '_blank')} />
                                    )) : <p className="text-sm italic text-[#8C7B70]">No recent documents.</p>}
                                </div>
                            </Card>
                        </div>

                        <div className="space-y-8">
                            <Card>
                                <SectionHeader title="Site Team" action={<button onClick={() => setIsDiscoveryOpen(true)} className="w-8 h-8 flex items-center justify-center bg-[#2A1F1D] text-white rounded-full hover:bg-[#C06842]"><Plus size={16} /></button>} />
                                <div className="space-y-4">
                                    {projectTeam.map(member => (
                                        <div key={member.user_id} className="group flex items-center space-x-4 p-2 hover:bg-[#F9F7F2] rounded-xl transition-all">
                                            <div className="w-10 h-10 rounded-full bg-[#E3DACD] flex items-center justify-center font-bold">{member.name.charAt(0)}</div>
                                            <div className="flex-1">
                                                <p className="font-bold text-sm">{member.name}</p>
                                                <p className="text-[10px] uppercase text-[#8C7B70]">{member.assigned_role || member.sub_category}</p>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveMember(member.user_id, member.name)}
                                                className="p-2 text-[#8C7B70] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                title={`Remove ${member.name} from project`}
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    ))}
                                    <button onClick={() => setIsDiscoveryOpen(true)} className="w-full py-3 bg-[#FDFCF8] border border-[#E3DACD] rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#F9F7F2]">
                                        <MapPin size={16} className="text-[#C06842]" /> Find Experts
                                    </button>
                                </div>
                            </Card>

                            <Card className="bg-[#2A1F1D] text-white">
                                <SectionHeader title="Timeline" />
                                <div className="space-y-6">
                                    {history.map(log => (
                                        <div key={log.log_id} className="flex space-x-3 text-xs">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#C06842] mt-1"></div>
                                            <div>
                                                <p className="font-bold">{log.action}</p>
                                                <p className="text-[#8C7B70]">{log.details}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            )}

            {/* Overlays */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2A1F1D]/60 backdrop-blur-md">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg p-10 shadow-2xl">
                        <h2 className="text-3xl font-serif font-bold mb-8">New Project</h2>
                        <form onSubmit={handleCreateProject} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-[#8C7B70] uppercase mb-2">Project Name</label>
                                <input required type="text" className="w-full bg-[#F9F7F2] border border-[#E3DACD] rounded-xl px-4 py-3" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#8C7B70] uppercase mb-2">Type</label>
                                    <select className="w-full bg-[#F9F7F2] border border-[#E3DACD] rounded-xl px-4 py-3" value={newProject.type} onChange={e => setNewProject({ ...newProject, type: e.target.value })}>
                                        <option>Residential</option><option>Commercial</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#8C7B70] uppercase mb-2">Budget (₹)</label>
                                    <input required type="number" className="w-full bg-[#F9F7F2] border border-[#E3DACD] rounded-xl px-4 py-3" value={newProject.budget} onChange={e => setNewProject({ ...newProject, budget: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#8C7B70] uppercase mb-2">Location</label>
                                <input required type="text" className="w-full bg-[#F9F7F2] border border-[#E3DACD] rounded-xl px-4 py-3" value={newProject.location} onChange={e => setNewProject({ ...newProject, location: e.target.value })} />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-3 text-[#8C7B70] font-bold">Cancel</button>
                                <button type="submit" className="flex-1 bg-[#C06842] text-white py-3 rounded-xl font-bold">Launch</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
                            <ExpertMap currentProjectId={activeProject?.project_id} subCategory={selectedRole} siteLocation={activeProject?.location || "India"} onAssign={() => { fetchData(); setIsDiscoveryOpen(false); }} onClose={() => setIsDiscoveryOpen(false)} />
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

export default LandOwnerDashboard;
