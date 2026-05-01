import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMockApp } from '../../../hooks/useMockApp';
import {
    Plus, HardHat, FileText, MapPin,
    XCircle, Construction, Check, LayoutGrid, PenTool,
    Search, ChevronRight, Award, Shield, Layers, Users,
    Hammer, Star, ClipboardList, Calculator, ImageIcon, Radio, ShieldAlert,
    Activity, DollarSign
} from 'lucide-react';
import ProfilePromptModal from '../../../components/dashboard/Common/ProfilePromptModal';
import RatingModal from '../../../components/dashboard/Common/RatingModal';
import WeatherSafetyWidget from '../../../components/dashboard/Common/WeatherSafetyWidget';
import { ProjectLifecycle, DailyReportSummary } from '../../../components/dashboard/Common/SharedDashboardComponents';
import SiteWorkboard from '../Site/SiteWorkboard';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import socket from '../../../utils/socket';

// Shared Components
import Card from '../../../components/Common/Card';
import Button from '../../../components/Common/Button';
import SectionHeader from '../../../components/Common/SectionHeader';





const LandOwnerDashboard = () => {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };
    const navigate = useNavigate();
    const { 
        currentUser, 
        setAuthUser, 
        projects, 
        lands, 
        loadingData, 
        refreshAllData 
    } = useMockApp();

    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', type: 'Residential', location: '', budget: '', land_id: '' });
    const [isProfilePromptOpen, setIsProfilePromptOpen] = useState(false);
    const [ratingProject, setRatingProject] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [viewingTeamProject, setViewingTeamProject] = useState(null);

    const fetchData = useCallback(async () => {
        if (!currentUser?.id && !currentUser?.user_id) return;
        await refreshAllData();
        
        if (!currentUser.profile_completed && !localStorage.getItem('profile_prompt_dismissed')) {
            setIsProfilePromptOpen(true);
        }
    }, [currentUser, refreshAllData]);

    useEffect(() => {
        const handleGlobalSearch = (e) => {
            setSearchQuery(e.detail);
        };
        window.addEventListener('planora_search', handleGlobalSearch);

        return () => {
            window.removeEventListener('planora_search', handleGlobalSearch);
        };
    }, []);

    const handlePhaseUpdate = async (projectId, phase, completed) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}/phases`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}`
                },
                body: JSON.stringify({ phase, completed })
            });
            if (res.ok) fetchData();
            else { const err = await res.json(); alert(err.error || 'Failed to update phase'); }
        } catch (err) { console.error(err); }
    };

    const handleGenerateInvestmentReport = (project) => {
        const doc = new jsPDF();
        const today = new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
        const progressPercent = project.progress?.physical || 0;
        const financialBurn = project.progress?.financial || 0;
        const isOverBudget = project.progress?.isOverBudget;

        // Header
        doc.setFontSize(22);
        doc.setTextColor(192, 104, 66); // Planora Rust
        doc.text("PLANORA", 15, 20);

        doc.setFontSize(14);
        doc.setTextColor(42, 31, 29); // Dark Brown
        doc.text("PROJECT INVESTMENT REPORT", 15, 30);

        doc.setLineWidth(0.5);
        doc.setDrawColor(227, 218, 205);
        doc.line(15, 35, 195, 35);

        // Details
        doc.setFontSize(10);
        doc.setTextColor(140, 123, 112);
        doc.text(`Project Title: ${project.name}`, 15, 45);
        doc.text(`Reporting Date: ${today}`, 15, 50);
        doc.text(`Asset Type: ${project.type}`, 15, 55);
        doc.text(`Project Location: ${project.location}`, 15, 60);

        // Status Tiles
        doc.setFillColor(249, 247, 242);
        doc.rect(15, 70, 55, 25, 'F');
        doc.setTextColor(42, 31, 29);
        doc.setFontSize(8);
        doc.text("PHYSICAL COMPLETION", 18, 78);
        doc.setFontSize(14);
        doc.text(`${progressPercent}%`, 18, 88);

        doc.setFillColor(249, 247, 242);
        doc.rect(75, 70, 55, 25, 'F');
        doc.setTextColor(192, 104, 66);
        doc.setFontSize(8);
        doc.text("BUDGET EXHAUSTION", 78, 78);
        doc.setFontSize(14);
        doc.text(`${financialBurn}%`, 78, 88);

        doc.setFillColor(249, 247, 242);
        doc.rect(135, 70, 55, 25, 'F');
        doc.setTextColor(52, 211, 153); // Emerald
        doc.setFontSize(8);
        doc.text("LAND STATUS", 138, 78);
        doc.setFontSize(14);
        doc.text("VERIFIED", 138, 88);

        // Milestone Table
        const milestoneData = [
            ['1. Planning Phase (30%)', project.planning_completed ? 'COMPLETED' : 'IN PROGRESS'],
            ['2. Design Phase (30%)', project.design_completed ? 'COMPLETED' : 'PENDING'],
            ['3. Execution Phase (40%)', project.execution_completed ? 'COMPLETED' : 'LOCKED']
        ];

        autoTable(doc, {
            startY: 105,
            head: [['Project Milestone', 'Current Status']],
            body: milestoneData,
            theme: 'grid',
            headStyles: { fillColor: [42, 31, 29], fontSize: 9 },
            bodyStyles: { fontSize: 8 }
        });

        // Financial Audit Table (Phase-aligned)
        const totalBudget = parseFloat(project.budget || 0);
        const spentVal = parseFloat(project.total_spent || 0);
        const remainingVal = Math.max(0, totalBudget - spentVal);

        const financeData = [
            ['Total Projected Budget', formatCurrency(totalBudget)],
            ['Actual Expenditure (Verified PAID)', formatCurrency(spentVal)],
            ['Available Project Liquidity', formatCurrency(remainingVal)],
            ['Financial Burn (Paid/Budget)', `${financialBurn}%`]
        ];

        doc.setFontSize(10);
        doc.setTextColor(42, 31, 29);
        doc.text("FINANCIAL INTEGRITY AUDIT", 15, doc.lastAutoTable.finalY + 15);

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 20,
            head: [['Financial Metric', 'Audit Value']],
            body: financeData,
            theme: 'grid',
            headStyles: { fillColor: [192, 104, 66], fontSize: 9 },
            bodyStyles: { fontSize: 8, fontStyle: 'bold' }
        });

        // Risk Note
        const finalY = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(10);
        doc.setTextColor(192, 104, 66);
        doc.text("Risk Observation:", 15, finalY);
        doc.setFontSize(8);
        doc.setTextColor(140, 123, 112);
        doc.text(isOverBudget
            ? `Physical progress is trailing budget expenditure by ${Math.max(0, financialBurn - progressPercent)}%. Recommend immediate secondary audit of onsite productivity.`
            : `Project is currently stable. Financial expenditure is aligned with physical milestone completion.`, 15, finalY + 5, { maxWidth: 175 });

        // Footer
        doc.setFontSize(7);
        doc.setTextColor(227, 218, 205);
        doc.text("Generated by Planora Business Intelligence", 15, 285);
        doc.text(`Document ID: PLN-${String(project.project_id).substring(0, 8).toUpperCase()}`, 150, 285);

        doc.save(`${project.name.replace(/\s+/g, '_')}_Investment_Report.pdf`);
    };

    const handleGenerateDailyReport = (project) => {
        const doc = new jsPDF();
        const todayStr = new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
        const leadContractor = project.team?.find(m => m.assigned_role === 'contractor')?.name || 'System Lead';

        doc.setFontSize(22); doc.setTextColor(192, 104, 66); doc.text("PLANORA", 15, 20);
        doc.setFontSize(14); doc.setTextColor(42, 31, 29); doc.text("DAILY SITE REPORT", 15, 30);
        doc.setLineWidth(0.5); doc.setDrawColor(227, 218, 205); doc.line(15, 35, 195, 35);

        doc.setFontSize(10); doc.setTextColor(140, 123, 112);
        doc.text(`Project: ${project.name}`, 15, 45);
        doc.text(`Date: ${todayStr}`, 15, 50);
        doc.text(`Lead Contractor: ${leadContractor}`, 15, 55);
        doc.text(`Location: ${project.location || 'Site Location'}`, 15, 60);

        const todayDate = new Date().toDateString();
        // Updated filter to include all activity that happened today
        const todayTasks = (project.tasks || []).filter(t => {
            const createdToday = new Date(t.created_at).toDateString() === todayDate;
            const submittedToday = t.submitted_at && new Date(t.submitted_at).toDateString() === todayDate;
            const approvedToday = t.approved_at && new Date(t.approved_at).toDateString() === todayDate;
            return createdToday || submittedToday || approvedToday;
        });

        const approvedTasks = todayTasks.filter(t => t.status === 'Approved');

        doc.setFillColor(249, 247, 242); doc.rect(15, 70, 55, 25, 'F');
        doc.setTextColor(42, 31, 29); doc.setFontSize(8); doc.text("TASKS LOGGED", 18, 78);
        doc.setFontSize(14); doc.text(`${todayTasks.length}`, 18, 88);

        doc.setFillColor(249, 247, 242); doc.rect(75, 70, 55, 25, 'F');
        doc.setTextColor(52, 211, 153); doc.setFontSize(8); doc.text("TASKS APPROVED", 78, 78);
        doc.setFontSize(14); doc.text(`${approvedTasks.length}`, 78, 88);

        const tableData = todayTasks.length > 0
            ? todayTasks.map(t => {
                const activityTime = t.approved_at || t.submitted_at || t.created_at;
                return [t.title, t.status.toUpperCase(), new Date(activityTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), t.assigned_to_name || '-']
            })
            : [['No tasks recorded today', '-', '-', '-']];

        autoTable(doc, {
            startY: 105,
            head: [['Task Description', 'Status', 'Logged At', 'Professional']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [42, 31, 29], fontSize: 9 },
            bodyStyles: { fontSize: 8 }
        });

        const finalY = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(10); doc.setTextColor(192, 104, 66); doc.text("Executive Summary:", 15, finalY);
        doc.setFontSize(8); doc.setTextColor(140, 123, 112);
        const summaryText = todayTasks.length > 0
            ? `Site activity for ${todayStr} included ${todayTasks.length} logged tasks, with ${approvedTasks.length} approved. Operations at ${Math.round((approvedTasks.length / Math.max(1, todayTasks.length)) * 100)}% today.`
            : `No site activity was recorded for this reporting period. Project remains on standby or maintenance mode.`;
        doc.text(summaryText, 15, finalY + 5, { maxWidth: 175 });

        doc.save(`${project.name.replace(/\s+/g, '_')}_Daily_Report.pdf`);
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        const userId = currentUser.user_id || currentUser.id;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}`
                },
                body: JSON.stringify({ owner_id: userId, ...newProject })
            });
            if (res.ok) { fetchData(); setIsCreateModalOpen(false); }
            else { const err = await res.json(); alert(err.error || 'Failed to create project'); }
        } catch (err) { console.error(err); }
    };

    const activeProjects = useMemo(() => {
        const active = projects.filter(p => p.status?.toLowerCase() !== 'completed' && p.status?.toLowerCase() !== 'cancelled');
        console.log("[Dashboard] Active Project Count:", active.length);
        return active;
    }, [projects]);
    const completedProjectsCount = useMemo(() => projects.filter(p => p.status === 'Completed').length, [projects]);
    const pendingRatings = useMemo(() => projects.filter(p => p.status === 'Completed' && !p.has_rated), [projects]);

    if (loadingData && projects.length === 0) return (
        <div className="flex flex-col items-center justify-center min-vh-screen space-y-6 bg-[#FDFCF8]">
            <div className="w-14 h-14 border-[5px] border-[#C06842]/10 border-t-[#C06842] rounded-full animate-spin" />
            <p className="text-[#8C7B70] font-black uppercase text-[11px] tracking-[0.4em]">Loading Dashboard...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-16 pb-24 pt-10 font-sans text-[#2A1F1D]">
            {isProfilePromptOpen && (
                <ProfilePromptModal currentUser={currentUser} onSave={(u) => { setAuthUser(u); setIsProfilePromptOpen(false); window.location.reload(); }} onCancel={() => { setIsProfilePromptOpen(false); localStorage.setItem('profile_prompt_dismissed', 'true'); }} />
            )}

            <RatingModal
                isOpen={!!ratingProject}
                onClose={() => setRatingProject(null)}
                project={ratingProject}
                currentUser={currentUser}
                onComplete={() => {
                    setRatingProject(null);
                    fetchData();
                }}
            />

            {/* Premium Analytics Portfolio Header */}
            <Card variant="dark" className="relative p-10 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#C06842]/10 rounded-full blur-[140px] -mr-48 -mt-48 opacity-60 animate-pulse"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-16">
                    <div className="flex items-center space-x-12">
                        <div className="relative group shrink-0">
                            <div className="absolute -inset-1.5 bg-gradient-to-r from-[#C06842] to-[#E68A2E] rounded-[1.8rem] blur opacity-40 group-hover:opacity-75 transition duration-1000"></div>
                            <div className="relative w-28 h-28 rounded-[1.5rem] p-1.5 bg-[#2A1F1D] border border-white/10 overflow-hidden">
                                <img src={`https://ui-avatars.com/api/?name=${currentUser?.name}&background=C06842&color=fff&size=256`} alt="Owner" className="w-full h-full rounded-[1.2rem] object-cover shadow-2xl" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="h-[1px] w-6 bg-[#C06842]" />
                                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#C06842]">Portfolio Overview</span>
                            </div>
                            <h1 className="text-4xl font-serif font-black tracking-tight leading-none mb-2">{currentUser?.name}</h1>
                            <div className="flex flex-wrap items-center gap-5 text-[10px] font-black uppercase tracking-[0.2em] text-[#8C7B70]">
                                <span className="bg-white/5 px-4 py-2 rounded-full border border-white/10 text-white/80">Land Owner Portfolio</span>
                                <span className="flex items-center gap-2 italic">{currentUser?.email}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full lg:max-w-xl">
                        {[
                            { label: 'Active Projects', value: activeProjects.length, icon: LayoutGrid },
                            { label: 'Lands Owned', value: lands.length, icon: MapPin, color: 'text-amber-400' },
                            { label: 'Completed', value: completedProjectsCount, icon: Award, color: 'text-emerald-400' }
                        ].map((stat, idx) => {
                            const Icon = stat.icon;
                            return (
                                <div key={idx} className="p-5 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center justify-center group hover:bg-white/10 transition-all">
                                    <div className={`text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-2 text-[#8C7B70] group-hover:text-white transition-colors`}>
                                        <Icon size={12} /> {stat.label}
                                    </div>
                                    <p className={`text-3xl font-serif font-black ${stat.color || 'text-[#C06842]'}`}>{stat.value}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-10 flex flex-wrap justify-center md:justify-start gap-4 relative z-10">
                    <Button icon={Users} variant="secondary" onClick={() => navigate('/dashboard/find-pros')}>Find Professionals</Button>
                    <Button icon={Plus} variant="primary" onClick={() => setIsCreateModalOpen(true)}>Create Project</Button>
                </div>
            </Card>

            {/* Ratings Pending Alert */}
            {pendingRatings.length > 0 && (
                <Card className="bg-amber-50 border-amber-200 py-10 flex flex-col md:flex-row items-center justify-between gap-8 group mt-8">
                    <div className="flex items-center gap-6 text-left">
                        <div className="w-14 h-14 bg-amber-500 text-white rounded-[1.2rem] flex items-center justify-center shadow-lg relative shrink-0">
                            <Star size={28} />
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-white text-amber-500 rounded-full border-2 border-amber-500 flex items-center justify-center text-[10px] font-black">{pendingRatings.length}</div>
                        </div>
                        <div>
                            <h3 className="font-serif text-2xl font-black text-[#2A1F1D] tracking-tight mb-1">Ratings Needed</h3>
                            <p className="text-[10px] text-[#8C7B70] font-black uppercase tracking-[0.1em] max-w-md">You haven't rated the team for {pendingRatings.length} completed project(s). Finalize your project with feedback.</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {pendingRatings.map(p => (
                            <Button key={p.project_id} size="md" variant="primary" onClick={() => setRatingProject(p)}>Rate {p.name}</Button>
                        ))}
                    </div>
                </Card>
            )}

            {/* Active Assets Feed */}
            <div className="space-y-32">
                {activeProjects.filter(p => !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.location?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                    <div className="py-24 text-center bg-white/40 border border-dashed border-[#E3DACD] rounded-[5rem] backdrop-blur-sm relative group overflow-hidden">
                        <div className="relative z-10">
                            <Layers size={80} className="mx-auto text-[#E3DACD] mb-8 group-hover:scale-110 transition-transform duration-1000" strokeWidth={0.5} />
                            <h2 className="text-4xl font-serif font-black text-[#2A1F1D] mb-4 tracking-tight">No Matching Projects</h2>
                            <p className="text-[#8C7B70] max-w-sm mx-auto mb-12 font-medium leading-relaxed">No projects found matching your search: "{searchQuery}"</p>
                            {searchQuery ? (
                                <Button icon={XCircle} variant="outline" onClick={() => setSearchQuery('')}>Clear Search</Button>
                            ) : (
                                <Button icon={ChevronRight} size="lg" onClick={() => setIsCreateModalOpen(true)}>Create First Project</Button>
                            )}
                        </div>
                    </div>
                ) : (
                    activeProjects
                        .filter(p => !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.location?.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(project => {
                            const progressPercent = project.progress?.physical || 0;
                            const financialBurn = project.progress?.financial || 0;
                            const financialBurnDisplay = typeof financialBurn === 'number' ? financialBurn.toFixed(2) : financialBurn;
                            const isOverBudget = project.progress?.isOverBudget;

                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6 }}
                                    key={project.project_id}
                                    className="group relative bg-white rounded-[2rem] border border-[#E3DACD]/50 hover:border-[#b96a41]/30 overflow-hidden transition-all duration-500 hover:shadow-[0_25px_50px_-12px_rgba(42,31,29,0.08)] flex flex-col"
                                >
                                    {/* Decorative Gradient Top (Professional Style) */}
                                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#C06842] via-[#E68A2E] to-[#C06842] opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>

                                    {/* Glassmorphic Background Accents */}
                                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#C06842]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[#C06842]/10 transition-colors duration-700"></div>
                                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#E68A2E]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[#E68A2E]/10 transition-colors duration-700"></div>

                                    {/* 1. HEADER SECTION (COMPACT & PREMIUM) */}
                                    <div className="relative z-10 p-6 md:p-8 border-b border-[#F9F7F2] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white/60 backdrop-blur-sm">
                                        <div className="flex items-center gap-6">
                                            <div className="relative group/icon">
                                                <div className="absolute -inset-2 bg-gradient-to-tr from-[#C06842] to-[#E68A2E] rounded-3xl blur opacity-20 group-hover/icon:opacity-40 transition-opacity"></div>
                                                <div className="relative w-16 h-16 rounded-[1.2rem] bg-[#2A1F1D] flex items-center justify-center text-white shadow-xl shadow-[#2A1F1D]/20 transform -rotate-2 group-hover:rotate-0 transition-all duration-500">
                                                    <Construction size={28} strokeWidth={1.5} />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5 min-w-0">
                                                <div className="flex items-center gap-4 flex-wrap">
                                                    <h2 className="text-3xl font-serif font-black text-[#2A1F1D] tracking-tight group-hover:text-[#C06842] transition-colors truncate leading-none">{project.name}</h2>
                                                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-emerald-600 bg-emerald-50/80 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-100/50 shadow-sm shrink-0">
                                                        <Shield size={10} className="fill-emerald-600" /> Active Asset
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 text-[10px] font-bold text-[#8C7B70] uppercase tracking-widest">
                                                    <span className="text-[#C06842] flex items-center gap-1.5"><HardHat size={12}/> {project.type}</span>
                                                    <span className="w-1 h-1 rounded-full bg-[#E3DACD]" />
                                                    <span className="flex items-center gap-1.5">
                                                        <MapPin size={12} className="text-[#C06842]" /> {project.location}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2.5">
                                            {[
                                                { label: 'Team', icon: Users, onClick: () => setViewingTeamProject(project) },
                                                { label: 'Report', icon: FileText, onClick: () => handleGenerateInvestmentReport(project) },
                                                { label: 'Wallet', icon: DollarSign, onClick: () => navigate('/dashboard/payments') },
                                                { label: 'Log', icon: Activity, onClick: () => handleGenerateDailyReport(project), primary: true }
                                            ].map((action, aidx) => (
                                                <button
                                                    key={aidx}
                                                    onClick={action.onClick}
                                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                                                        action.primary 
                                                        ? 'bg-[#3E2B26] text-white hover:bg-[#b96a41] shadow-lg shadow-[#3E2B26]/10' 
                                                        : 'bg-[#F9F7F2] text-[#8C7B70] border border-[#E3DACD]/50 hover:border-[#b96a41] hover:text-[#b96a41]'
                                                    }`}
                                                >
                                                    <action.icon size={14} />
                                                    <span className="hidden sm:inline">{action.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 2. MAIN CONTENT GRID */}
                                    <div className="relative z-10 p-8 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
                                        {/* ENVIRONMENTAL INTELLIGENCE */}
                                        <div className="lg:col-span-3 space-y-6">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                                    <Radio size={16} className="animate-pulse" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase text-[#2A1F1D] tracking-[0.2em]">Site Integrity</span>
                                            </div>
                                            <div className="bg-white/40 p-1 rounded-3xl border border-[#E3DACD]/30">
                                                <WeatherSafetyWidget location={project.location} compact={true} />
                                            </div>
                                        </div>

                                        {/* FINANCIAL & PHYSICAL STATUS */}
                                        <div className="lg:col-span-6 space-y-8 bg-[#FDFCF8] p-8 rounded-[2.5rem] border border-[#E3DACD]/40 shadow-inner relative overflow-hidden group/stats">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#C06842]/5 to-transparent rounded-full -mr-16 -mt-16 transition-transform duration-700 group-hover/stats:scale-150"></div>
                                            
                                            <div className="flex items-center gap-3 mb-2 relative z-10">
                                                <Activity size={16} className="text-[#C06842]" />
                                                <span className="text-[10px] font-black uppercase text-[#2A1F1D] tracking-[0.2em]">Operational Pulse</span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-end px-1">
                                                        <div className="space-y-1">
                                                            <span className="text-[9px] font-black uppercase text-[#8C7B70] tracking-[0.2em]">Physical Development</span>
                                                            <p className="text-sm font-bold text-[#2A1F1D]">Phase Completion</p>
                                                        </div>
                                                        <span className="text-3xl font-serif font-black text-[#2A1F1D]">{progressPercent}<span className="text-xs text-[#C06842]">%</span></span>
                                                    </div>
                                                    <div className="h-2.5 w-full bg-white rounded-full border border-[#E3DACD]/50 p-0.5 shadow-inner">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            whileInView={{ width: `${progressPercent}%` }}
                                                            transition={{ duration: 1.5, ease: "circOut" }}
                                                            className="h-full bg-gradient-to-r from-[#2A1F1D] to-[#C06842] rounded-full relative"
                                                        >
                                                            <div className="absolute top-0 right-0 w-2 h-full bg-white/20 rounded-full"></div>
                                                        </motion.div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-end px-1">
                                                        <div className="space-y-1">
                                                            <span className="text-[9px] font-black uppercase text-[#8C7B70] tracking-[0.2em]">Financial Consumption</span>
                                                            <p className={`text-sm font-bold ${isOverBudget ? 'text-rose-600' : 'text-[#2A1F1D]'}`}>Budget Burn Rate</p>
                                                        </div>
                                                        <span className={`text-3xl font-serif font-black ${isOverBudget ? 'text-rose-600' : 'text-[#2A1F1D]'}`}>{financialBurnDisplay}<span className="text-xs">%</span></span>
                                                    </div>
                                                    <div className="h-2.5 w-full bg-white rounded-full border border-[#E3DACD]/50 p-0.5 shadow-inner">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            whileInView={{ width: `${Math.max(financialBurn > 0 ? 0.5 : 0, financialBurn)}%` }}
                                                            transition={{ duration: 1.5, ease: "circOut", delay: 0.2 }}
                                                            className={`h-full rounded-full relative transition-all duration-1000 ${isOverBudget ? 'bg-rose-500' : 'bg-[#E68A2E]'}`}
                                                        >
                                                            <div className="absolute top-0 right-0 w-2 h-full bg-white/20 rounded-full animate-pulse"></div>
                                                        </motion.div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-8 border-t border-[#E3DACD]/30 relative z-10">
                                                <ProjectLifecycle project={project} onUpdatePhase={handlePhaseUpdate} />
                                            </div>
                                        </div>

                                        {/* VISUAL FEED & REPORTS */}
                                        <div className="lg:col-span-3 space-y-8">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between px-1">
                                                    <div className="flex items-center gap-3">
                                                        <ImageIcon size={16} className="text-[#C06842]" />
                                                        <span className="text-[10px] font-black uppercase text-[#2A1F1D] tracking-[0.2em]">Visual Archive</span>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                                                    {project.tasks?.filter(t => t.image_path).length > 0 ? (
                                                        project.tasks?.filter(t => t.image_path).map((task, tidx) => (
                                                            <div
                                                                key={tidx}
                                                                className="relative w-44 h-32 rounded-2xl overflow-hidden border-2 border-[#E3DACD]/30 shadow-lg group/img shrink-0 snap-start cursor-pointer"
                                                                onClick={() => setPreviewImage(`${import.meta.env.VITE_API_URL}/${task.image_path}`)}
                                                            >
                                                                <img src={`${import.meta.env.VITE_API_URL}/${task.image_path}`} alt="Site" className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-700" />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end p-3">
                                                                    <span className="text-[8px] text-white font-black uppercase tracking-widest">Enlarge</span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="w-full h-32 rounded-2xl border-2 border-dashed border-[#E3DACD] bg-[#FDFCF8] flex flex-col items-center justify-center text-center p-4 group-hover:border-[#C06842]/40 transition-colors">
                                                            <div className="w-10 h-10 rounded-full bg-[#F9F7F2] flex items-center justify-center text-[#E3DACD] mb-2 group-hover:text-[#C06842] transition-colors">
                                                                <ImageIcon size={20} />
                                                            </div>
                                                            <p className="text-[8px] font-black uppercase text-[#8C7B70] tracking-[0.2rem]">No Site Feed</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <DailyReportSummary project={project} />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                )}
            </div>

            {/* Project Team Modal */}
            <AnimatePresence>
                {viewingTeamProject && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-[#2A1F1D]/40" onClick={() => setViewingTeamProject(null)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setViewingTeamProject(null)}
                                className="absolute top-6 right-6 text-[#8C7B70] hover:text-[#2A1F1D] transition-colors z-10"
                            >
                                <XCircle size={28} strokeWidth={1.5} />
                            </button>

                            <div className="p-10 space-y-8">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <span className="h-[1px] w-6 bg-[#C06842]" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#C06842]">Project Team</span>
                                    </div>
                                    <h2 className="text-3xl font-serif font-black text-[#2A1F1D] tracking-tight">{viewingTeamProject.name}</h2>
                                    <p className="text-xs text-[#8C7B70] font-bold">All assigned professionals for this project</p>
                                </div>

                                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                    {/* Land Owner (self) */}
                                    <div className="flex items-center gap-4 p-4 bg-[#F9F7F2] rounded-2xl border border-[#E3DACD]/30">
                                        <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-[#C06842]/20 shrink-0">
                                            <img src={`https://ui-avatars.com/api/?name=${currentUser?.name}&background=2A1F1D&color=fff&size=96`} alt="Owner" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-[#2A1F1D] text-sm truncate">{currentUser?.name}</p>
                                            <p className="text-[9px] font-black uppercase text-[#C06842] tracking-widest">Land Owner (You)</p>
                                        </div>
                                        <span className="text-[8px] font-black uppercase tracking-widest bg-[#2A1F1D] text-white px-3 py-1.5 rounded-full shrink-0">Owner</span>
                                    </div>

                                    {/* Team Members */}
                                    {(viewingTeamProject.team || []).filter(m => m.status === 'Accepted').map((member, idx) => (
                                        <div key={idx} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-[#E3DACD]/40 hover:border-[#C06842]/30 transition-colors">
                                            <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-[#E3DACD]/30 shrink-0">
                                                <img src={`https://ui-avatars.com/api/?name=${member.name}&background=C06842&color=fff&size=96`} alt={member.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-[#2A1F1D] text-sm truncate">{member.name}</p>
                                                <p className="text-[9px] font-black uppercase text-[#8C7B70] tracking-widest">{member.sub_category || member.category || member.assigned_role}</p>
                                            </div>
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shrink-0 ${member.assigned_role?.toLowerCase() === 'contractor'
                                                ? 'bg-[#C06842]/10 text-[#C06842] border border-[#C06842]/20'
                                                : 'bg-[#F9F7F2] text-[#8C7B70] border border-[#E3DACD]/40'
                                                }`}>{member.assigned_role || 'Member'}</span>
                                        </div>
                                    ))}

                                    {(viewingTeamProject.team || []).filter(m => m.status === 'Accepted').length === 0 && (
                                        <div className="py-12 text-center">
                                            <Users size={32} className="mx-auto text-[#E3DACD] mb-3" />
                                            <p className="text-xs font-bold text-[#8C7B70]">No team members assigned yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Project Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-[#2A1F1D]/30">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl relative"
                        >
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="absolute top-8 right-8 text-[#8C7B70] hover:text-[#2A1F1D] transition-colors"
                            >
                                <XCircle size={32} strokeWidth={1.5} />
                            </button>

                            <div className="p-12 space-y-10">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <span className="h-[1px] w-6 bg-[#C06842]" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C06842]">New Development</span>
                                    </div>
                                    <h2 className="text-4xl font-serif font-black text-[#2A1F1D] tracking-tight">Initiate Project</h2>
                                </div>

                                <form onSubmit={handleCreateProject} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase text-[#8C7B70] tracking-widest px-1">Project Name</label>
                                            <input
                                                required
                                                className="w-full bg-[#FDFCF8] border-2 border-[#E3DACD]/40 rounded-2xl py-4 px-6 font-bold focus:border-[#C06842] transition-colors outline-none"
                                                placeholder="e.g. Zenith Residency"
                                                value={newProject.name}
                                                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase text-[#8C7B70] tracking-widest px-1">Asset Category</label>
                                            <select
                                                className="w-full bg-[#FDFCF8] border-2 border-[#E3DACD]/40 rounded-2xl py-4 px-6 font-bold focus:border-[#C06842] transition-colors outline-none appearance-none"
                                                value={newProject.type}
                                                onChange={(e) => setNewProject({ ...newProject, type: e.target.value })}
                                            >
                                                <option>Residential</option>
                                                <option>Commercial</option>
                                                <option>Industrial</option>
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase text-[#8C7B70] tracking-widest px-1">Location Context</label>
                                            <input
                                                required
                                                className="w-full bg-[#FDFCF8] border-2 border-[#E3DACD]/40 rounded-2xl py-4 px-6 font-bold focus:border-[#C06842] transition-colors outline-none"
                                                placeholder="City, State"
                                                value={newProject.location}
                                                onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase text-[#8C7B70] tracking-widest px-1">Estimate Budget (USD)</label>
                                            <input
                                                required
                                                type="number"
                                                min="0"
                                                className="w-full bg-[#FDFCF8] border-2 border-[#E3DACD]/40 rounded-2xl py-4 px-6 font-bold focus:border-[#C06842] transition-colors outline-none"
                                                placeholder="e.g. 50000"
                                                value={newProject.budget || ''}
                                                onChange={(e) => setNewProject({ ...newProject, budget: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase text-[#8C7B70] tracking-widest px-1">Associate Land</label>
                                            <select
                                                required
                                                className="w-full bg-[#FDFCF8] border-2 border-[#E3DACD]/40 rounded-2xl py-4 px-6 font-bold focus:border-[#C06842] transition-colors outline-none appearance-none"
                                                value={newProject.land_id}
                                                onChange={(e) => setNewProject({ ...newProject, land_id: e.target.value })}
                                            >
                                                <option value="">Select an asset...</option>
                                                {lands.map(land => (
                                                    <option key={land.land_id} value={land.land_id}>{land.title} ({land.area} sq.ft)</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <Button size="lg" className="w-full py-6 text-base" type="submit">Deploy Project Command</Button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Image Preview Modal */}
            <AnimatePresence>
                {previewImage && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-12 backdrop-blur-2xl bg-black/80" onClick={() => setPreviewImage(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative max-w-7xl max-h-full">
                            <img src={previewImage} className="w-full h-full object-contain rounded-3xl" alt="Preview" />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LandOwnerDashboard;
