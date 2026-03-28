import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    DollarSign, TrendingUp, Clock, CheckCircle, Download, 
    Calendar, CreditCard, FileText, Upload, Edit3, X, 
    Save, Filter, ChevronRight, AlertCircle, Info,
    Plus, Receipt, User, Briefcase, Eye, Check, Trash2, Send,
    Search, ArrowUpRight, Package, Shield, ImageIcon, Users, Activity,
    ShieldAlert, Printer, History as LedgerHistoryIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Payments = () => {
    // --------------------------------------------------------------------------
    // STATE & INITIALIZATION
    // --------------------------------------------------------------------------
    const [currentUser, setCurrentUser] = useState(null);
    const [payments, setPayments] = useState([]);
    const [projects, setProjects] = useState([]);
    const [activeProject, setActiveProject] = useState(null);
    const [summary, setSummary] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal & Drawer States
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null); // For Details Drawer
    const [requestType, setRequestType] = useState('quote'); // quote, wage, material, adhoc
    const [formData, setFormData] = useState({
        amount: '',
        notes: '',
        reference_id: '',
        invoice_number: '',
        wage_days: '',
        rate: '',
        receiver_id: ''
    });
    const [proofFile, setProofFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --------------------------------------------------------------------------
    // AUTH & DATA FETCHING
    // --------------------------------------------------------------------------
    const getToken = () => localStorage.getItem('planora_token') || localStorage.getItem('token') || '';

    const fetchLedger = useCallback(async (userId, projectId = null) => {
        const token = getToken();
        if (!token) return;
        try {
            const url = projectId 
                ? `${import.meta.env.VITE_API_URL}/api/payments/user/${userId}?project_id=${projectId}`
                : `${import.meta.env.VITE_API_URL}/api/payments/user/${userId}`;
            
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.status === 401) return; 
            const data = await res.json();
            setPayments(Array.isArray(data) ? data : []);
        } catch (err) { console.error('Ledger Fetch Error:', err); }
    }, []);

    const fetchSummary = useCallback(async (projectId) => {
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/summary/${projectId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) return;
            const data = await res.json();
            setSummary(data);
        } catch (err) { console.error('Summary Fetch Error:', err); }
    }, []);

    const fetchProjects = useCallback(async (userId) => {
        const token = getToken();
        if (!token) { setIsInitialLoad(false); return []; }
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/user/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401) return [];
            const data = await res.json();
            const finalData = Array.isArray(data) ? data : [];
            setProjects(finalData);
            return finalData;
        } catch (err) { console.error('Projects Fetch Error:', err); return []; }
    }, []);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('planora_current_user'));
        if (user) {
            setCurrentUser(user);
            const uid = user.user_id || user.id;
            fetchProjects(uid).then(data => { if (data?.length > 0) setActiveProject(data[0]); }).finally(() => setIsInitialLoad(false));
        } else { setIsInitialLoad(false); }
    }, [fetchProjects]);

    useEffect(() => {
        if (!currentUser || !activeProject) return;
        const uid = currentUser.user_id || currentUser.id;
        const syncData = async () => {
            setIsSyncing(true);
            await Promise.all([fetchLedger(uid, activeProject.project_id), fetchSummary(activeProject.project_id)]);
            setIsSyncing(false);
        };
        syncData();
    }, [currentUser, activeProject, fetchLedger, fetchSummary]);

    // --------------------------------------------------------------------------
    // ACTION HANDLERS
    // --------------------------------------------------------------------------
    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const body = new FormData();
        const uid = currentUser.user_id || currentUser.id;
        
        const isOwner = currentUser?.category === 'Land Owner' || currentUser?.category === 'Admin';
        const finalReceiverId = isOwner ? formData.receiver_id : uid;
        const finalSenderId = isOwner ? uid : (activeProject?.land_owner_id || '');

        body.append('project_id', activeProject.project_id);
        body.append('sender_id', finalSenderId);
        body.append('receiver_id', finalReceiverId);
        body.append('type', requestType);
        body.append('amount', formData.amount);
        body.append('notes', requestType === 'wage' ? `Days: ${formData.wage_days} | Rate: ${formData.rate}\n${formData.notes}` : formData.notes);
        body.append('invoice_number', formData.invoice_number);
        body.append('status', isOwner ? 'paid' : 'pending_review');
        if (proofFile) body.append('proof', proofFile);

        const token = getToken();
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payments`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body
            });
            if (res.ok) {
                setIsRequestModalOpen(false);
                setFormData({ amount: '', notes: '', reference_id: '', invoice_number: '', wage_days: '', rate: '', receiver_id: '' });
                setProofFile(null);
                fetchLedger(uid, activeProject.project_id);
                fetchSummary(activeProject.project_id);
            }
        } catch (err) { console.error('Submit Error:', err); } finally { setIsSubmitting(false); }
    };

    const handleUpdateStatus = async (paymentId, newStatus) => {
        const token = getToken();
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/${paymentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                const uid = currentUser.user_id || currentUser.id;
                fetchLedger(uid, activeProject.project_id);
                fetchSummary(activeProject.project_id);
                if (selectedPayment?.payment_id === paymentId) setSelectedPayment(null);
            }
        } catch (err) { console.error('Update Error:', err); }
    };

    const handleExport = () => {
        const doc = new jsPDF();
        const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const formatPdfCurrency = (amt) => 'Rs. ' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amt || 0);

        // Document Border & Frame
        doc.setDrawColor(227, 218, 205); doc.setLineWidth(0.1); doc.rect(5, 5, 200, 287);
        
        // Header (Planora Branding)
        doc.setFillColor(42, 31, 29); doc.rect(10, 10, 190, 40, 'F');
        doc.setFontSize(28); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.text("PLANORA", 20, 30);
        doc.setFontSize(10); doc.setTextColor(192, 104, 66); doc.setFont("helvetica", "normal"); doc.text("CONSTRUCTION COMMAND CENTER", 20, 38);
        doc.setFontSize(12); doc.setTextColor(255, 255, 255); doc.text("MASTER FINANCIAL LEDGER", 140, 30, { align: 'right' });

        // Metadata Cluster
        doc.setTextColor(42, 31, 29); doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.text("PROJECT OVERVIEW", 15, 65);
        doc.setFont("helvetica", "normal"); doc.setTextColor(140, 123, 112);
        doc.text(`Project Name:`, 15, 75); doc.setTextColor(42, 31, 29); doc.text(`${activeProject?.name || 'Unspecified'}`, 45, 75);
        doc.setTextColor(140, 123, 112); doc.text(`Audit Period:`, 15, 82); doc.setTextColor(42, 31, 29); doc.text(`As of ${today}`, 45, 82);
        doc.setTextColor(140, 123, 112); doc.text(`Ledger ID:`, 150, 75, { align: 'right' }); doc.setTextColor(42, 31, 29); doc.text(`PL-${activeProject?.project_id.toString().substring(0,8).toUpperCase()}`, 195, 75, { align: 'right' });

        // Summary Statistics (Fintech Grid)
        const budgetTotal = parseFloat(summary?.total_budget || 0);
        const actualSpent = parseFloat(summary?.stats?.total_spent || 0);
        const surplusBalance = Math.max(0, budgetTotal - actualSpent);

        doc.setFillColor(249, 247, 242); doc.setDrawColor(227, 218, 205); doc.setLineWidth(0.5);
        
        // Spent Card
        doc.rect(15, 95, 85, 30, 'FD');
        doc.setFontSize(8); doc.setTextColor(140, 123, 112); doc.text("TOTAL DISBURSEMENTS (VERIFIED)", 20, 105);
        doc.setFontSize(18); doc.setTextColor(42, 31, 29); doc.setFont("helvetica", "bold"); doc.text(formatPdfCurrency(actualSpent), 20, 118);

        // Surplus Card
        doc.rect(110, 95, 85, 30, 'FD');
        doc.setFontSize(8); doc.setTextColor(140, 123, 112); doc.text("BUDGET SURPLUS / RESERVE", 115, 105);
        doc.setFontSize(18); doc.setTextColor(192, 104, 66); doc.text(formatPdfCurrency(surplusBalance), 115, 118);

        // Ledger Terminal Table
        const tableBody = payments.map(p => [
            new Date(p.created_at).toLocaleDateString('en-GB'),
            p.receiver_name,
            p.type.toUpperCase(),
            { content: p.description || 'Ledger Entry', styles: { fontStyle: 'italic', textColor: [100, 100, 100] } },
            p.status.replace('_', ' ').toUpperCase(),
            { content: formatPdfCurrency(p.amount), styles: { halign: 'right', fontStyle: 'bold' } }
        ]);

        autoTable(doc, {
            startY: 140,
            head: [['Date', 'Recipient Entity', 'Track', 'Audit Notes', 'Status', 'Audit Value']],
            body: tableBody,
            theme: 'striped',
            headStyles: { fillColor: [42, 31, 29], fontSize: 9, cellPadding: 5 },
            bodyStyles: { fontSize: 8, cellPadding: 4, textColor: [42, 31, 29] },
            alternateRowStyles: { fillColor: [249, 247, 242] },
            columnStyles: { 
                0: { cellWidth: 25 }, 
                1: { cellWidth: 40 },
                2: { cellWidth: 20 },
                3: { cellWidth: 'auto' }
            }
        });

        // Audit Signature & Footer
        const finalPos = doc.lastAutoTable.finalY + 20;
        if (finalPos < 270) {
            doc.setDrawColor(227, 218, 205); doc.line(15, finalPos, 195, finalPos);
            doc.setFontSize(7); doc.setTextColor(140, 123, 112); doc.setFont("helvetica", "normal");
            doc.text("Planora Integrity: This ledger record is digitally synchronized and verified for secondary auditing purposes.", 15, finalPos + 10);
            doc.text("Official Project Document | System Generated | Planora.in", 195, finalPos + 10, { align: 'right' });
        }

        doc.save(`${activeProject?.name.replace(/\s+/g, '_')}_Master_Ledger.pdf`);
    };

    // --------------------------------------------------------------------------
    // HELPERS
    // --------------------------------------------------------------------------
    const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

    const isPayer = (payment) => {
        if (!currentUser) return false;
        const uid = String(currentUser.user_id || currentUser.id);
        return String(payment.sender_id) === uid;
    };

    const isContractorInTeam = activeProject?.team?.some(m => m.category === 'Contractor' || m.assigned_role?.toLowerCase().includes('contractor'));
    const isCurrentUserContractor = currentUser?.category?.toLowerCase().includes('contractor') || activeProject?.team?.some(m => String(m.user_id) === String(currentUser?.user_id || currentUser?.id) && m.assigned_role?.toLowerCase().includes('contractor'));
    const isCurrentUserLandOwner = ['land owner', 'landowner', 'admin'].includes(currentUser?.category?.toLowerCase());
    
    // Core Rule: If a contractor exists, only they can request from the Landowner
    const canRequestPayment = isCurrentUserLandOwner || isCurrentUserContractor || !isContractorInTeam;

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'paid': return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' };
            case 'approved': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' };
            case 'pending_review': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' };
            case 'rejected': return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' };
            default: return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-100' };
        }
    };

    const filteredPayments = useMemo(() => {
        return payments.filter(p => {
            const matchesTab = activeTab === 'all' || p.status === activeTab;
            const matchesSearch = !searchQuery || 
                p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.sender_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.receiver_name?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesTab && matchesSearch;
        });
    }, [payments, activeTab, searchQuery]);

    // --------------------------------------------------------------------------
    // RENDER
    // --------------------------------------------------------------------------
    if (isInitialLoad) return (
        <div className="flex flex-col items-center justify-center min-h-[600px] gap-6">
            <div className="w-12 h-12 border-4 border-[#C06842]/20 border-t-[#C06842] rounded-full animate-spin" />
            <p className="text-[#8C7B70] font-black uppercase text-[10px] tracking-widest">Master Ledger Syncing...</p>
        </div>
    );

    if (projects.length === 0) return (
        <div className="max-w-4xl mx-auto py-32 text-center bg-white/40 border-2 border-dashed border-[#E3DACD] rounded-[4rem] p-12">
            <ShieldAlert size={48} className="mx-auto mb-6 text-[#C06842]" />
            <h2 className="text-3xl font-serif font-black text-[#2A1F1D] mb-4">No Financial Channels Active</h2>
            <p className="text-[#8C7B70] font-medium max-w-lg mx-auto mb-10">Ensure you have active project assignments to access the financial ledger.</p>
            <button onClick={() => window.location.reload()} className="bg-[#2A1F1D] text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest">Retry Connection</button>
        </div>
    );

    return (
        <div className="max-w-screen-2xl mx-auto space-y-12 animate-fade-in font-sans text-[#2A1F1D] pb-12">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-serif font-black flex items-center gap-3">
                        Master Ledger
                        {isSyncing && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                    </h1>
                    <p className="text-[#8C7B70] text-xs font-black uppercase tracking-widest">Secure Construction Payout Terminal</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group">
                        <select 
                            value={activeProject?.project_id || ''}
                            onChange={(e) => setActiveProject(projects.find(p => p.project_id === e.target.value))}
                            className="appearance-none bg-white border border-[#E3DACD] text-[#2A1F1D] font-bold py-4 pl-12 pr-12 rounded-[1.5rem] outline-none transition-all cursor-pointer shadow-sm hover:border-[#C06842] min-w-[250px]"
                        >
                            {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.name}</option>)}
                        </select>
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C7B70]" size={18} />
                    </div>

                    {isCurrentUserLandOwner && (
                        <button 
                            onClick={handleExport}
                            className="p-4 bg-white border border-[#E3DACD] rounded-[1.5rem] text-[#2A1F1D] hover:bg-[#F9F7F2] transition-all shadow-sm group"
                            title="Export Master Ledger (PDF)"
                        >
                            <Printer size={20} className="group-hover:scale-110 transition-transform" />
                        </button>
                    )}

                    {canRequestPayment ? (
                        <button 
                            onClick={() => setIsRequestModalOpen(true)}
                            className="bg-[#C06842] hover:bg-[#2A1F1D] text-white px-8 py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-widest flex items-center gap-3 shadow-xl transition-all"
                        >
                            <Plus size={18} />
                            {isCurrentUserLandOwner ? 'Record Expense' : 'Generate Bill'}
                        </button>
                    ) : (
                        <div className="px-8 py-4 rounded-[1.5rem] bg-[#F9F7F2] border border-[#E3DACD] text-[#8C7B70] font-black uppercase text-[10px] tracking-widest flex items-center gap-3">
                            <ShieldAlert size={16} className="text-[#C06842]" /> 
                            Contractor Controlled Flow
                        </div>
                    )}
                </div>
            </div>

            {/* 1. Quad-Zone Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Settled', value: summary?.stats?.total_spent, icon: CheckCircle, text: 'text-emerald-700', bg: 'bg-emerald-50' },
                    { label: 'Pending Auditor', value: summary?.stats?.pending_review, icon: Clock, text: 'text-amber-700', bg: 'bg-amber-50' },
                    { label: 'Approved Unpaid', value: summary?.stats?.approved_unpaid, icon: CreditCard, text: 'text-blue-700', bg: 'bg-blue-50' },
                    { label: 'Budget Surplus', value: (parseFloat(summary?.total_budget || 0) - parseFloat(summary?.stats?.total_spent || 0)), icon: TrendingUp, text: 'text-[#2A1F1D]', bg: 'bg-[#F9F7F2]' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-[2.5rem] border border-[#E3DACD] p-8 shadow-sm group hover:shadow-lg transition-all border-b-4 border-b-[#C06842]/0 hover:border-b-[#C06842]">
                        <div className={`w-12 h-12 rounded-[1.25rem] ${stat.bg} ${stat.text} flex items-center justify-center mb-6`}>
                            <stat.icon size={22} />
                        </div>
                        <p className="text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-1">{stat.label}</p>
                        <h3 className={`text-3xl font-serif font-black ${stat.text}`}>{formatCurrency(stat.value)}</h3>
                    </div>
                ))}
            </div>

            {/* 2. Analytical Breakthrough & Table */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                <div className="xl:col-span-8 space-y-10">
                    
                    {/* Investment Pulse (For Owners/Contractors) */}
                    {(isCurrentUserLandOwner || isCurrentUserContractor) && (
                        <div className="bg-white rounded-[3rem] border border-[#E3DACD] p-10 overflow-hidden relative">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-2xl font-serif font-black">Investment Pulse</h2>
                                    <p className="text-[#8C7B70] text-xs font-bold uppercase tracking-widest mt-1">Resource Allocation Matrix</p>
                                </div>
                                <span className={`text-[10px] font-black uppercase px-4 py-2 rounded-full border ${isCurrentUserLandOwner ? 'bg-[#F9F7F2] text-[#C06842] border-[#E3DACD]' : 'bg-white text-[#2A1F1D] border-[#E3DACD]'}`}>
                                    {Math.round((summary?.stats?.total_spent / summary?.total_budget * 100) || 0)}% Allocated
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {[
                                    { label: 'Labor Force', val: summary?.stats?.wages_spent, icon: Users, p: (summary?.stats?.wages_spent / summary?.stats?.total_spent * 100 || 0) },
                                    { label: 'Materials Cap', val: summary?.stats?.materials_spent, icon: Package, p: (summary?.stats?.materials_spent / summary?.stats?.total_spent * 100 || 0) },
                                    { label: 'Audit / Fees', val: summary?.stats?.fees_spent, icon: Shield, p: (summary?.stats?.fees_spent / summary?.stats?.total_spent * 100 || 0) }
                                ].map((item, i) => (
                                    <div key={i} className="space-y-4">
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase text-[#8C7B70] tracking-widest">
                                            <span className="flex items-center gap-2"><item.icon size={12} className="text-[#C06842]" /> {item.label}</span>
                                            <span className="text-[#2A1F1D]">{Math.round(item.p)}%</span>
                                        </div>
                                        <div className="h-1.5 bg-[#F9F7F2] rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${item.p}%` }} className="h-full bg-[#C06842]" />
                                        </div>
                                        <p className="font-black text-lg">{formatCurrency(item.val)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Master Activity Terminal */}
                    <div className="bg-white rounded-[3rem] border border-[#E3DACD] overflow-hidden shadow-sm">
                        <div className="p-8 border-b border-[#F9F7F2] flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#FDFCF8]/30">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xl font-serif font-black">History Terminal</h2>
                                <div className="flex items-center bg-[#F9F7F2] p-1.5 rounded-2xl border border-[#E3DACD]">
                                    {['all', 'pending_review', 'approved', 'paid'].map(t => (
                                        <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-[#2A1F1D] text-white' : 'text-[#8C7B70]'}`}>
                                            {t.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="relative group max-w-xs w-full">
                                <input 
                                    type="text" 
                                    placeholder="Search ledger entries..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[#F9F7F2] border border-[#E3DACD] py-3 pl-10 pr-6 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-[#C06842]"
                                />
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C7B70]" size={14} />
                            </div>
                        </div>

                        <div className="overflow-x-auto min-h-[400px]">
                            <table className="w-full text-left">
                                <thead className="bg-[#F9F7F2]/80 font-black text-[#8C7B70] text-[9px] uppercase tracking-[0.2em] border-b border-[#E3DACD]">
                                    <tr>
                                        <th className="px-8 py-6">Date</th>
                                        <th className="px-8 py-6">Entities</th>
                                        <th className="px-8 py-6">Protocol</th>
                                        <th className="px-8 py-6">Status</th>
                                        <th className="px-8 py-6 text-right">Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F9F7F2]/50 font-sans">
                                    {filteredPayments.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-8 py-32 text-center opacity-30 select-none">
                                                <LedgerHistoryIcon size={48} className="mx-auto mb-4 text-[#8C7B70]" />
                                                <p className="font-black text-[#2A1F1D] uppercase tracking-widest text-xs">No Records Found</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredPayments.map((p, i) => {
                                            const sc = getStatusColor(p.status);
                                            return (
                                                <motion.tr 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    key={p.payment_id} 
                                                    onClick={() => setSelectedPayment(p)}
                                                    className="group hover:bg-[#FDFCF8] cursor-pointer transition-colors"
                                                >
                                                    <td className="px-8 py-6">
                                                        <span className="font-bold text-xs">{new Date(p.created_at).toLocaleDateString()}</span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-[12px] text-[#2A1F1D]">{isPayer(p) ? p.receiver_name : p.sender_name}</span>
                                                            <span className="text-[9px] font-black uppercase text-[#8C7B70] tracking-widest">{isPayer(p) ? 'Recipient' : 'Source'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className={`p-2 rounded-lg bg-[#F9F7F2] border border-[#E3DACD] text-[#C06842]`}>
                                                                {p.type === 'wage' ? <Users size={12} /> : p.type === 'material' ? <Package size={12} /> : <FileText size={12} />}
                                                            </div>
                                                            <span className="font-black text-[11px] uppercase tracking-tight truncate max-w-[120px]">{p.description || 'Ledger Entry'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className={`inline-flex items-center px-4 py-1.5 rounded-full border ${sc.bg} ${sc.text} ${sc.border} font-black text-[9px] uppercase tracking-widest`}>
                                                            {p.status.replace('_', ' ')}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <span className="font-black text-[16px] tracking-tight">{formatCurrency(p.amount)}</span>
                                                    </td>
                                                </motion.tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar Drawer */}
                <div className="xl:col-span-4 space-y-8">
                     <AnimatePresence mode='wait'>
                        {selectedPayment ? (
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                className="bg-[#2A1F1D] text-white p-10 rounded-[3rem] shadow-2xl space-y-8 sticky top-32"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-serif font-black">Audit Vault</h3>
                                    <button onClick={() => setSelectedPayment(null)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20"><X size={20} /></button>
                                </div>

                                <div className="space-y-6 text-center">
                                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                                        <p className="text-[9px] font-black uppercase text-white/40 tracking-[0.3em] mb-2">Claim Value</p>
                                        <h4 className="text-4xl font-serif font-black text-[#C06842]">{formatCurrency(selectedPayment.amount)}</h4>
                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase mt-4 ${getStatusColor(selectedPayment.status).bg} ${getStatusColor(selectedPayment.status).text}`}>
                                            {selectedPayment.status.replace('_', ' ')}
                                        </div>
                                    </div>

                                    <div className="text-left space-y-4 font-sans">
                                        <div className="grid grid-cols-2 gap-4 text-xs font-bold font-sans">
                                            <div className="space-y-1">
                                                <p className="text-white/30 uppercase text-[9px] tracking-widest font-black">Timeline</p>
                                                <p>{new Date(selectedPayment.created_at).toLocaleString()}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-white/30 uppercase text-[9px] tracking-widest font-black">Audit ID</p>
                                                <p className="font-mono text-[10px]">#PL-{selectedPayment.payment_id.toString().padStart(6, '0')}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-white/30 uppercase text-[9px] tracking-widest font-black">Description</p>
                                            <p className="text-sm font-medium leading-relaxed opacity-80">{selectedPayment.description}</p>
                                        </div>

                                        {selectedPayment.proof_image_path && (
                                            <div className="space-y-3">
                                                 <p className="text-white/30 uppercase text-[9px] tracking-widest font-black">Visual Proof</p>
                                                 <a href={`${import.meta.env.VITE_API_URL}/${selectedPayment.proof_image_path}`} target="_blank" rel="noopener noreferrer" className="block w-full h-32 bg-white/5 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center opacity-60 hover:opacity-100 transition-opacity">
                                                    <ImageIcon size={20} className="mb-2" />
                                                    <span className="text-[9px] font-black uppercase">Verify Proof</span>
                                                 </a>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-6 space-y-3">
                                        {isPayer(selectedPayment) && selectedPayment.status === 'pending_review' && (
                                            <button onClick={() => handleUpdateStatus(selectedPayment.payment_id, 'approved')} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest">Authorize Claim</button>
                                        )}
                                        {isPayer(selectedPayment) && selectedPayment.status === 'approved' && (
                                            <button onClick={() => handleUpdateStatus(selectedPayment.payment_id, 'paid')} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest">Final Settlement</button>
                                        )}
                                        <button className="w-full py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2">
                                            <Download size={14} /> Download Receipt
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-[600px] border-2 border-dashed border-[#E3DACD] rounded-[3rem] flex flex-col items-center justify-center p-12 text-center text-[#8C7B70] sticky top-32">
                                <LedgerHistoryIcon size={48} className="mb-6 opacity-20" />
                                <h4 className="font-black uppercase text-[10px] tracking-widest">Select Entry</h4>
                                <p className="text-sm font-medium mt-2">Pick a verified transaction to perform high-level secondary audit.</p>
                            </div>
                        )}
                     </AnimatePresence>
                </div>
            </div>

            {/* MODAL (FINTECH STYLE) */}
            <AnimatePresence>
                {isRequestModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#2A1F1D]/90 backdrop-blur-md p-4 overflow-y-auto font-sans">
                        <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="bg-white rounded-[4rem] w-full max-w-2xl p-12 relative shadow-2xl border border-white/10">
                            <button onClick={() => setIsRequestModalOpen(false)} className="absolute top-10 right-10 p-3 bg-[#F9F7F2] rounded-2xl text-[#8C7B70] hover:text-[#2A1F1D] transition-all"><X size={24} /></button>
                            
                            <div className="mb-10">
                                <h2 className="text-4xl font-serif font-black text-[#2A1F1D] leading-tight">Financial Claim</h2>
                                <p className="text-[#8C7B70] font-medium mt-3 text-lg">Integrated Construction Ledger Protocol</p>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-10 p-2 bg-[#F9F7F2] rounded-[2rem] border border-[#E3DACD]">
                                {[
                                    { id: 'quote', icon: FileText, label: 'Quote' },
                                    { id: 'wage', icon: Users, label: 'Wage' },
                                    { id: 'material', icon: Package, label: 'Material' }
                                ].map(track => (
                                    <button key={track.id} onClick={() => { setRequestType(track.id); setFormData({...formData, amount: ''}); }} className={`flex flex-col items-center gap-2 py-4 rounded-[1.5rem] transition-all ${requestType === track.id ? 'bg-white shadow-xl text-[#2A1F1D]' : 'text-[#8C7B70]'}`}>
                                        <track.icon size={20} className={requestType === track.id ? 'text-[#C06842]' : 'opacity-30'} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{track.label}</span>
                                    </button>
                                ))}
                            </div>

                            <form onSubmit={handleRequestSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {(isCurrentUserLandOwner || isCurrentUserContractor) && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[#8C7B70] uppercase ml-2">Recipient Entity</label>
                                            <select required value={formData.receiver_id} onChange={(e) => setFormData({...formData, receiver_id: e.target.value})} className="w-full bg-[#F9F7F2] border-2 border-transparent focus:border-[#C06842] focus:bg-white p-5 rounded-[1.5rem] font-bold text-[#2A1F1D] outline-none transition-all">
                                                <option value="">Select Professional...</option>
                                                {activeProject?.team?.filter(m => String(m.user_id) !== String(currentUser.user_id || currentUser.id)).map(member => (
                                                    <option key={member.user_id} value={member.user_id}>{member.name} ({member.assigned_role})</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {requestType === 'wage' && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[#8C7B70] uppercase ml-2">Attendance Pulse</label>
                                            <div className="flex items-center gap-3">
                                                <input placeholder="Days" type="number" required className="w-full bg-[#F9F7F2] p-5 rounded-[1.5rem] font-black text-center outline-none shadow-inner" onChange={(e) => { const d = parseFloat(e.target.value || 0); setFormData({...formData, wage_days: e.target.value, amount: (d * (parseFloat(formData.rate) || 0)).toString()}); }} />
                                                <div className="font-bold text-[#E3DACD]">×</div>
                                                <input placeholder="Rate" type="number" required className="w-full bg-[#F9F7F2] p-5 rounded-[1.5rem] font-black text-center outline-none shadow-inner" onChange={(e) => { const r = parseFloat(e.target.value || 0); setFormData({...formData, rate: e.target.value, amount: ((parseFloat(formData.wage_days) || 0) * r).toString()}); }} />
                                            </div>
                                        </div>
                                    )}

                                    <div className={`space-y-2 ${requestType !== 'wage' ? 'md:col-span-1' : 'md:col-span-2'}`}>
                                        <label className="text-[10px] font-black text-[#8C7B70] uppercase ml-2">Audit Value (INR)</label>
                                        <input type="number" required disabled={requestType === 'wage'} placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full bg-[#F9F7F2] border-2 border-transparent focus:border-[#C06842] focus:bg-white p-5 rounded-[1.5rem] font-black text-2xl text-[#2A1F1D] outline-none shadow-inner disabled:opacity-50" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#8C7B70] uppercase ml-2">Protocol Description</label>
                                    <textarea required rows={2} placeholder="Explain the protocol details..." value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full bg-[#F9F7F2] p-6 rounded-[2rem] font-medium outline-none shadow-inner resize-none" />
                                </div>

                                <button type="submit" disabled={isSubmitting} className="w-full py-6 rounded-[2.5rem] bg-[#2A1F1D] hover:bg-[#C06842] text-white font-black uppercase tracking-[0.4em] transition-all shadow-2xl disabled:opacity-50">
                                    {isSubmitting ? 'Syncing Ledger...' : 'Commit Claim'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Payments;
