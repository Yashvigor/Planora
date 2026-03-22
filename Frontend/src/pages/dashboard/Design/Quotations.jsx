import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMockApp } from '../../../hooks/useMockApp';
import { FileText, Plus, Search, FileDown, Eye, X, Calculator, Send } from 'lucide-react';

const Quotations = () => {
    const { currentUser } = useMockApp();
    const uid = currentUser?.user_id || currentUser?.id;

    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Submission loading guard
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [newQuotation, setNewQuotation] = useState({
        title: '',
        client_name: '',
        valid_until: '',
        project_type: 'Personal',
        project_id: '',
        items: [{ description: '', quantity: 1, unit_price: 0 }]
    });

    // Detail modal state
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [fetchingDetail, setFetchingDetail] = useState(false);
    const [isPrintMode, setIsPrintMode] = useState(false);

    // Projects list for dropdown
    const [assignedProjects, setAssignedProjects] = useState([]);

    useEffect(() => {
        if (!uid) return;
        fetchQuotations();
        fetchAssignedProjects();
    }, [uid]);

    const fetchDetail = async (quoteId) => {
        try {
            setFetchingDetail(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/quotations/view/${quoteId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSelectedQuotation(data);
                setShowDetailModal(true);
                return data;
            }
        } catch (error) {
            console.error('Failed to fetch quotation details:', error);
        } finally {
            setFetchingDetail(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        const element = document.getElementById('quotation-print-area');
        if (!element) return;
        
        const opt = {
            margin: [0.5, 0.5],
            filename: `Planora_Quotation_${selectedQuotation?.title || 'Download'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 3, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        // Silent download
        html2pdf().from(element).set(opt).save();
    };

    const fetchAssignedProjects = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/professional/${uid}`);
            if (res.ok) {
                const data = await res.json();
                setAssignedProjects(data);
                if (data.length > 0) {
                    setNewQuotation(prev => ({ ...prev, project_id: data[0].project_id }));
                }
            }
        } catch (error) {
            console.error('Failed to fetch assigned projects:', error);
        }
    };

    const fetchQuotations = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/quotations/${uid}`);
            if (res.ok) {
                const data = await res.json();
                setQuotations(data);
            }
        } catch (error) {
            console.error('Failed to fetch quotations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateQuotation = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (newQuotation.project_type === 'Team' && !newQuotation.project_id) {
            alert('Please select a project for this team quotation.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/quotations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    professional_id: uid,
                    client_id: newQuotation.client_name, // Temporarily using name as ID for demo
                    project_type: newQuotation.project_type,
                    project_id: newQuotation.project_type === 'Team' ? newQuotation.project_id : null,
                    ...newQuotation
                })
            });

            if (res.ok) {
                setShowModal(false);
                setNewQuotation({
                    title: '',
                    client_name: '',
                    valid_until: '',
                    project_type: 'Personal',
                    project_id: assignedProjects.length > 0 ? assignedProjects[0].project_id : '',
                    items: [{ description: '', quantity: 1, unit_price: 0 }]
                });
                fetchQuotations();
            }
        } catch (error) {
            console.error('Failed to create quotation:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddItem = () => {
        setNewQuotation(prev => ({
            ...prev,
            items: [...prev.items, { description: '', quantity: 1, unit_price: 0 }]
        }));
    };

    const handleRemoveItem = (index) => {
        setNewQuotation(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleItemChange = (index, field, value) => {
        setNewQuotation(prev => {
            const newItems = [...prev.items];
            newItems[index] = { ...newItems[index], [field]: value };
            return { ...prev, items: newItems };
        });
    };

    const filteredQuotations = quotations.filter(q =>
        q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.client_id || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status) => {
        const styles = {
            accepted: 'bg-green-50 text-green-700 border-green-200',
            sent: 'bg-blue-50 text-blue-700 border-blue-200',
            pending_review: 'bg-amber-50 text-amber-700 border-amber-200',
            Personal: 'bg-green-50 text-green-700 border-green-200',
            draft: 'bg-[#8C7B70]/10 text-[#8C7B70] border-[#8C7B70]/30',
            rejected: 'bg-red-50 text-red-700 border-red-200'
        };
        const label = status === 'pending_review' ? 'Pending Review' : (status === 'Personal' ? 'Personal' : status);

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider border ${styles[status] || styles.draft}`}>
                {label}
            </span>
        );
    };

    const totalAmount = newQuotation.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    return (
        <div className="space-y-8 animate-fade-in bg-[#FDFCF8] min-h-screen p-4 md:p-8 rounded-[2rem]">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
                <div>
                    <div className="flex items-center gap-2 text-[#E68A2E] text-xs font-bold uppercase tracking-widest mb-1">
                        <FileText size={14} /> Documentation
                    </div>
                    <h1 className="text-4xl font-serif font-bold text-[#2A1F1D]">Quotations</h1>
                    <p className="text-[#8C7B70] mt-1 font-medium">Manage client estimates and commercial proposals</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-6 py-3 bg-[#2A1F1D] text-white rounded-xl font-bold hover:bg-[#C06842] hover:shadow-lg hover:shadow-[#C06842]/20 transition-all flex items-center gap-2 uppercase tracking-wide text-xs">
                    <Plus size={18} />
                    Create Quotation
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
                <div className="glass-card relative overflow-hidden rounded-[2rem] p-6 border border-[#E3DACD]/50 shadow-sm">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#C06842]/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <p className="text-[#8C7B70] text-xs font-bold uppercase tracking-wider mb-1">Total Quotations</p>
                    <p className="text-4xl font-serif font-bold text-[#2A1F1D]">{quotations.length}</p>
                </div>
                <div className="glass-card relative overflow-hidden rounded-[2rem] p-6 border border-[#E3DACD]/50 shadow-sm">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <p className="text-[#8C7B70] text-xs font-bold uppercase tracking-wider mb-1">Accepted</p>
                    <p className="text-4xl font-serif font-bold text-[#2A1F1D]">
                        {quotations.filter(q => q.status === 'accepted').length}
                    </p>
                </div>
                <div className="glass-card relative overflow-hidden rounded-[2rem] p-6 border border-[#E3DACD]/50 shadow-sm">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <p className="text-[#8C7B70] text-xs font-bold uppercase tracking-wider mb-1">Pending Responses</p>
                    <p className="text-4xl font-serif font-bold text-[#2A1F1D]">
                        {quotations.filter(q => q.status === 'sent').length}
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="flex gap-4 print:hidden">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C7B70]" size={20} />
                    <input
                        type="text"
                        placeholder="Search quotations by title or client..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-[#E3DACD] rounded-xl text-[#2A1F1D] placeholder:text-[#B8AFA5] focus:border-[#C06842] focus:ring-2 focus:ring-[#C06842]/20 outline-none transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* List */}
            <div className="glass-card border border-[#E3DACD]/40 rounded-[2rem] overflow-hidden print:hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#F9F7F2] border-b border-[#E3DACD]/50 text-[#8C7B70] text-[10px] uppercase tracking-wider font-bold">
                                <th className="p-4 pl-6">Title</th>
                                <th className="p-4">Client</th>
                                <th className="p-4">Date Created</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 pr-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-[#8C7B70] font-medium animate-pulse">
                                        Loading quotations...
                                    </td>
                                </tr>
                            ) : filteredQuotations.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-[#8C7B70] font-medium">
                                        No quotations found.
                                    </td>
                                </tr>
                            ) : (
                                filteredQuotations.map((quote) => (
                                    <tr key={quote.id} className="border-b border-[#E3DACD]/30 hover:bg-[#FDFCF8] transition-colors group">
                                        <td className="p-4 pl-6 font-bold text-[#2A1F1D]">{quote.title}</td>
                                        <td className="p-4 text-sm font-medium text-[#8C7B70]">{quote.client_id || 'N/A'}</td>
                                        <td className="p-4 text-sm font-medium text-[#8C7B70]">{new Date(quote.created_at).toLocaleDateString()}</td>
                                        <td className="p-4 font-bold text-[#2A1F1D]">₹{parseFloat(quote.total_amount).toLocaleString()}</td>
                                        <td className="p-4">{getStatusBadge(quote.status)}</td>
                                        <td className="p-4 pr-6 text-right space-x-2">
                                            <button
                                                onClick={() => { setIsPrintMode(false); fetchDetail(quote.id); }}
                                                disabled={fetchingDetail}
                                                className="p-2 text-[#8C7B70] hover:text-[#C06842] hover:bg-[#C06842]/10 rounded-lg transition-colors disabled:opacity-50"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={async () => { 
                                                    setIsPrintMode(true); 
                                                    const data = await fetchDetail(quote.id); 
                                                    if (data) {
                                                        setTimeout(handleDownload, 700);
                                                    }
                                                }}
                                                className="p-2 text-[#8C7B70] hover:text-[#2A1F1D] hover:bg-[#E3DACD]/30 rounded-lg transition-colors"
                                                title="Download / Print"
                                            >
                                                <FileDown size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detailed View Modal */}
            {showDetailModal && selectedQuotation && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm print:hidden" onClick={() => setShowDetailModal(false)}></div>
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-scale-in print:shadow-none print:max-h-none print:static print:w-full print:rounded-none">
                        <div className="p-6 border-b border-[#E3DACD]/50 flex justify-between items-center bg-[#FDFCF8] shrink-0 print:hidden">
                            <h3 className="text-xl font-serif font-bold text-[#2A1F1D]">Quotation Details</h3>
                            <div className="flex gap-2">
                                {isPrintMode && (
                                    <button
                                        onClick={handleDownload}
                                        className="p-2.5 bg-[#C06842] text-white rounded-xl hover:bg-[#A05636] transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-wide px-4"
                                    >
                                        <FileDown size={16} /> Download PDF
                                    </button>
                                )}
                                <button onClick={() => setShowDetailModal(false)} className="p-2 text-[#8C7B70] hover:bg-[#E3DACD]/30 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Printable Content */}
                        <div id="quotation-print-area" className="p-8 md:p-12 overflow-y-auto custom-scrollbar flex-1 bg-white print:overflow-visible print:p-0">
                            <div className="flex flex-col md:flex-row justify-between gap-8 mb-12 border-b border-[#E3DACD]/50 pb-8">
                                <div>
                                    <div className="text-[#C06842] font-serif text-3xl font-bold mb-4">Planora</div>
                                    <div className="space-y-1 text-sm text-[#8C7B70] font-medium">
                                        <p>Interior Design & Project Management</p>
                                        <p>Commercial Proposal</p>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <div className="bg-[#2A1F1D] text-white px-4 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest mb-4 inline-block">
                                        Quotation #{selectedQuotation.id.toString().substring(0, 8)}
                                    </div>
                                    <div className="space-y-1 text-sm font-medium">
                                        <p className="text-[#8C7B70]">Date Issued</p>
                                        <p className="text-[#2A1F1D] font-bold">{new Date(selectedQuotation.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                                <div>
                                    <h4 className="text-[10px] font-bold text-[#8C7B70] uppercase tracking-widest mb-4">Client Information</h4>
                                    <div className="space-y-2">
                                        <p className="text-xl font-bold text-[#2A1F1D]">{selectedQuotation.client_id || 'N/A'}</p>
                                        <p className="text-sm text-[#8C7B70] font-medium">Reference: {selectedQuotation.title}</p>
                                        {selectedQuotation.project_name && (
                                            <div className="mt-4 p-3 bg-[#FDFCF8] border border-[#E3DACD]/30 rounded-xl inline-block">
                                                <p className="text-[10px] font-bold text-[#C06842] uppercase tracking-tighter mb-0.5">Project</p>
                                                <p className="text-xs font-bold text-[#2A1F1D]">{selectedQuotation.project_name}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="md:text-right">
                                    <h4 className="text-[10px] font-bold text-[#8C7B70] uppercase tracking-widest mb-4">Validity</h4>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-[#8C7B70]">This quotation is valid until:</p>
                                        <p className="text-lg font-bold text-[#2A1F1D]">
                                            {selectedQuotation.valid_until 
                                                ? new Date(selectedQuotation.valid_until).toLocaleDateString(undefined, { dateStyle: 'long' })
                                                : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <table className="w-full mb-12 border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-[#2A1F1D] text-left text-[10px] uppercase font-bold text-[#8C7B70] tracking-widest">
                                        <th className="py-4 pr-4">Description</th>
                                        <th className="py-4 px-4 text-center">Qty</th>
                                        <th className="py-4 px-4 text-right">Unit Price</th>
                                        <th className="py-4 pl-4 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(selectedQuotation.items || []).map((item, idx) => (
                                        <tr key={idx} className="border-b border-[#E3DACD]/30 text-sm">
                                            <td className="py-5 pr-4 font-bold text-[#2A1F1D]">{item.description}</td>
                                            <td className="py-5 px-4 text-center font-medium text-[#8C7B70]">{item.quantity}</td>
                                            <td className="py-5 px-4 text-right font-medium text-[#8C7B70]">₹{parseFloat(item.unit_price).toLocaleString()}</td>
                                            <td className="py-5 pl-4 text-right font-bold text-[#2A1F1D]">₹{parseFloat(item.total_price).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="flex justify-end mb-12">
                                <div className="w-full max-w-xs space-y-4">
                                    <div className="flex justify-between items-center text-sm font-medium text-[#8C7B70] border-b border-[#E3DACD]/30 pb-4">
                                        <span>Subtotal</span>
                                        <span>₹{parseFloat(selectedQuotation.total_amount).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-[#2A1F1D] text-white p-5 rounded-2xl shadow-xl shadow-[#2A1F1D]/10">
                                        <span className="text-sm font-bold uppercase tracking-widest opacity-80">Total Estimate</span>
                                        <span className="text-2xl font-serif font-bold text-[#E68A2E]">₹{parseFloat(selectedQuotation.total_amount).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#FDFCF8] p-8 rounded-[2rem] border border-[#E3DACD]/30 text-center">
                                <h5 className="font-serif text-lg font-bold text-[#2A1F1D] mb-2">Terms & Conditions</h5>
                                <p className="text-xs text-[#8C7B70] font-medium max-w-lg mx-auto leading-relaxed">
                                    This estimate is based on the initial project requirements and is subject to change upon final technical assessment. 
                                    Prices include standard delivery and labor. Special requests or structural changes will incur additional costs.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>, document.body
            )}

            {/* Create Quotation Modal */}
            {showModal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm print:hidden" onClick={() => setShowModal(false)}></div>
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-fade-in print:shadow-none print:max-h-none print:static print:w-full print:rounded-none">
                        <div className="p-6 border-b border-[#E3DACD]/50 flex justify-between items-center bg-[#FDFCF8] shrink-0 print:hidden">
                            <h3 className="text-2xl font-serif font-bold text-[#2A1F1D] flex items-center gap-2">
                                <Calculator size={24} className="text-[#C06842]" /> New Quotation
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 text-[#8C7B70] hover:bg-[#E3DACD]/30 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar print:overflow-visible print:p-0">
                            <form id="quotation-form" onSubmit={handleCreateQuotation} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 print:hidden">
                                    <div>
                                        <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Project Type</label>
                                        <select
                                            value={newQuotation.project_type}
                                            onChange={e => setNewQuotation({ ...newQuotation, project_type: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-[#E3DACD] bg-[#F9F7F2] focus:bg-white focus:outline-none focus:border-[#C06842] focus:ring-2 focus:ring-[#C06842]/20 transition-all font-medium appearance-none"
                                        >
                                            <option value="Personal">Personal Quotation</option>
                                            <option value="Team">Team Project</option>
                                        </select>
                                    </div>

                                    {newQuotation.project_type === 'Team' && (
                                        <div>
                                            <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Select Project</label>
                                            <select
                                                value={newQuotation.project_id}
                                                onChange={e => setNewQuotation({ ...newQuotation, project_id: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-[#E3DACD] bg-[#F9F7F2] focus:bg-white focus:outline-none focus:border-[#C06842] focus:ring-2 focus:ring-[#C06842]/20 transition-all font-medium appearance-none"
                                                required={newQuotation.project_type === 'Team'}
                                            >
                                                <option value="" disabled>Select a project</option>
                                                {assignedProjects.map(proj => (
                                                    <option key={proj.project_id} value={proj.project_id}>{proj.name}</option>
                                                ))}
                                            </select>
                                            {assignedProjects.length === 0 && (
                                                <p className="text-xs text-red-500 mt-1">You are not assigned to any active projects.</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 print:hidden">
                                    <div>
                                        <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Project/Quote Title</label>
                                        <input
                                            type="text"
                                            required
                                            value={newQuotation.title}
                                            onChange={e => setNewQuotation({ ...newQuotation, title: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-[#E3DACD] bg-[#F9F7F2] focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-medium"
                                            placeholder="e.g. Master Bedroom Renovation"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Client Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={newQuotation.client_name}
                                            onChange={e => setNewQuotation({ ...newQuotation, client_name: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-[#E3DACD] bg-[#F9F7F2] focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-medium"
                                            placeholder="e.g. Yashvi Gor"
                                        />
                                    </div>
                                </div>

                                {/* Line Items */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center print:hidden">
                                        <h4 className="font-bold text-[#2A1F1D]">Line Items</h4>
                                        <button
                                            type="button"
                                            onClick={handleAddItem}
                                            className="text-xs font-bold text-[#C06842] hover:bg-[#C06842]/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 uppercase tracking-wide"
                                        >
                                            <Plus size={14} /> Add Item
                                        </button>
                                    </div>

                                    <div className="bg-[#F9F7F2] rounded-2xl border border-[#E3DACD] overflow-hidden print:border-none print:shadow-none print:bg-white">
                                        <div className="grid grid-cols-12 gap-4 p-4 border-b border-[#E3DACD]/50 text-[10px] uppercase font-bold text-[#8C7B70] tracking-wider print:border-b-2 print:border-black">
                                            <div className="col-span-6">Description</div>
                                            <div className="col-span-2 text-center">Qty</div>
                                            <div className="col-span-3 text-right">Unit Price (₹)</div>
                                            <div className="col-span-1 print:hidden"></div>
                                        </div>

                                        <div className="p-4 space-y-3 print:p-0 print:space-y-0">
                                            {newQuotation.items.map((item, idx) => (
                                                <div key={idx} className="grid grid-cols-12 gap-4 items-center group print:py-2 print:border-b print:border-gray-200">
                                                    <div className="col-span-6">
                                                        <input
                                                            type="text"
                                                            required
                                                            value={item.description}
                                                            onChange={e => handleItemChange(idx, 'description', e.target.value)}
                                                            className="w-full px-3 py-2 rounded-lg border border-[#E3DACD] focus:border-[#C06842] outline-none text-sm font-medium print:border-none print:p-0 print:bg-transparent"
                                                            placeholder="e.g. Paint Work (Living Room)"
                                                        />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <input
                                                            type="number"
                                                            required
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                                                            className="w-full px-3 py-2 rounded-lg border border-[#E3DACD] focus:border-[#C06842] outline-none text-sm font-bold text-center print:border-none print:p-0 print:bg-transparent print:text-center"
                                                        />
                                                    </div>
                                                    <div className="col-span-3">
                                                        <input
                                                            type="number"
                                                            required
                                                            min="0"
                                                            value={item.unit_price}
                                                            onChange={e => handleItemChange(idx, 'unit_price', e.target.value)}
                                                            className="w-full px-3 py-2 rounded-lg border border-[#E3DACD] focus:border-[#C06842] outline-none text-sm font-bold text-right print:border-none print:p-0 print:bg-transparent print:text-right"
                                                        />
                                                    </div>
                                                    <div className="col-span-1 text-right print:hidden">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveItem(idx)}
                                                            disabled={newQuotation.items.length === 1}
                                                            className="p-1.5 text-[#8C7B70] hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="bg-[#2A1F1D] text-white p-4 flex justify-between items-center text-lg font-serif mt-4 print:mt-0 print:bg-transparent print:text-black print:border-t-2 print:border-black">
                                            <span className="text-[#B8AFA5] text-sm print:text-black font-bold uppercase">Total Estimate</span>
                                            <span className="font-bold text-[#E68A2E] print:text-black">₹{totalAmount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t border-[#E3DACD]/50 bg-[#FDFCF8] shrink-0 flex justify-end gap-3 print:hidden">
                            <button
                                type="button"
                                onClick={handlePrint}
                                className="px-6 py-3 rounded-xl font-bold bg-[#C06842] text-white hover:bg-[#A05636] transition-colors uppercase tracking-wide text-xs"
                            >
                                <FileDown size={14} className="inline mr-1"/> Print
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-6 py-3 rounded-xl font-bold text-[#8C7B70] hover:bg-[#E3DACD]/30 transition-colors uppercase tracking-wide text-xs"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="quotation-form"
                                disabled={isSubmitting}
                                className="px-6 py-3 rounded-xl font-bold bg-[#2A1F1D] text-white hover:bg-[#C06842] shadow-lg hover:shadow-[#C06842]/20 transition-all flex items-center gap-2 uppercase tracking-wide text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> Processing...</>
                                ) : (
                                    <><Send size={16} /> Save Quotation</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>, document.body
            )}
        </div>
    );
};

export default Quotations;
