import React, { useState, useEffect, useCallback } from 'react';
import { useMockApp } from '../../../hooks/useMockApp';
import { DollarSign, TrendingUp, Clock, CheckCircle, Download, Calendar, CreditCard, FileText, Upload, Edit2, X, Save } from 'lucide-react';

const Payments = () => {
    const { currentUser, projects } = useMockApp(); // Still using useMockApp for currentUser
    const [payments, setPayments] = useState([]);
    const [realProjects, setRealProjects] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchPayments = useCallback(async () => {
        const uid = currentUser.user_id || currentUser.id;
        if (!uid) return;
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/user/${uid}`);
            const data = await res.json();
            setPayments(data);
        } catch (err) {
            console.error('Error fetching payments:', err);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    const fetchProjects = useCallback(async () => {
        const uid = currentUser.user_id || currentUser.id;
        if (!uid) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/user/${uid}`);
            const data = await res.json();
            setRealProjects(data);
        } catch (err) {
            console.error('Error fetching projects:', err);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchPayments();
        fetchProjects();
    }, [fetchPayments, fetchProjects]);

    const handleUploadInvoice = async () => {
        if (realProjects.length === 0) {
            alert('Please create a project first before uploading invoices!');
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf,image/*';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                // For simplicity in this demo, we auto-create a payment record 
                // In a real app, we'd show a form first.
                try {
                    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payments`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            project_id: realProjects[0].project_id,
                            client_id: currentUser.id,
                            vendor_id: null, // To be assigned
                            invoice_number: `INV-${Date.now().toString().slice(-6)}`,
                            amount: 1000, // Placeholder
                            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                        })
                    });
                    if (res.ok) {
                        fetchPayments();
                        alert(`Invoice ${file.name} uploaded and tracked!`);
                    }
                } catch (err) {
                    console.error('Error creating payment:', err);
                }
            }
        };
        input.click();
    };

    const handleEditClick = (payment) => {
        setEditingPayment({ ...payment });
        setIsEditModalOpen(true);
    };

    const handleUpdatePayment = async () => {
        if (!editingPayment) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/${editingPayment.payment_id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: editingPayment.status,
                    notes: editingPayment.notes,
                    amount: editingPayment.amount
                })
            });
            if (res.ok) {
                fetchPayments();
                setIsEditModalOpen(false);
                setEditingPayment(null);
            } else {
                alert('Failed to update payment details');
            }
        } catch (err) {
            console.error('Error updating payment:', err);
        }
    };

    const filteredPayments = payments.filter(p =>
        activeTab === 'overview' ? true : p.status?.toLowerCase() === activeTab
    );

    const totalRevenue = payments.filter(p => p.status?.toLowerCase() === 'paid').reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const pendingAmount = payments.filter(p => p.status?.toLowerCase() === 'pending').reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const overdueAmount = payments.filter(p => p.status?.toLowerCase() === 'overdue').reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const getStatusBadge = (status) => {
        const styles = {
            paid: 'bg-green-50 text-green-700 border-green-100',
            pending: 'bg-amber-50 text-amber-700 border-amber-100',
            overdue: 'bg-red-50 text-red-700 border-red-100'
        };
        const icons = {
            paid: <CheckCircle size={12} />,
            pending: <Clock size={12} />,
            overdue: <TrendingUp size={12} />
        };

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${styles[status]}`}>
                {icons[status]}
                {status}
            </span>
        );
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="space-y-8 animate-fade-in font-sans text-[#2A1F1D]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-serif font-bold text-[#2A1F1D]">Payments</h1>
                    <p className="text-[#8C7B70] mt-2 font-medium">View and update invoice details</p>
                </div>
                <button
                    onClick={handleUploadInvoice}
                    className="px-6 py-3 bg-[#2A1F1D] hover:bg-[#C06842] text-white rounded-xl font-bold shadow-lg shadow-[#2A1F1D]/20 transition-all flex items-center gap-2"
                >
                    <Upload size={20} />
                    Upload Invoice
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-[2rem] border border-[#E3DACD] shadow-sm relative overflow-hidden group hover:shadow-lg transition-all bg-[#FDFCF8]">
                    <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 border border-green-100 shadow-sm">
                            <DollarSign size={24} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 bg-green-50 px-2 py-1 rounded-lg">Revenue</span>
                    </div>
                    <div>
                        <p className="text-[#8C7B70] text-xs font-bold uppercase tracking-wider mb-1">Total Revenue</p>
                        <p className="text-3xl font-serif font-bold text-[#2A1F1D]">{formatCurrency(totalRevenue)}</p>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-[2rem] border border-[#E3DACD] shadow-sm relative overflow-hidden group hover:shadow-lg transition-all bg-[#FDFCF8]">
                    <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100 shadow-sm">
                            <Clock size={24} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">Pending</span>
                    </div>
                    <div>
                        <p className="text-[#8C7B70] text-xs font-bold uppercase tracking-wider mb-1">Pending Payments</p>
                        <p className="text-3xl font-serif font-bold text-[#2A1F1D]">{formatCurrency(pendingAmount)}</p>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-[2rem] border border-[#E3DACD] shadow-sm relative overflow-hidden group hover:shadow-lg transition-all bg-[#FDFCF8]">
                    <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 border border-red-100 shadow-sm">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-red-600 bg-red-50 px-2 py-1 rounded-lg">Overdue</span>
                    </div>
                    <div>
                        <p className="text-[#8C7B70] text-xs font-bold uppercase tracking-wider mb-1">Overdue Amount</p>
                        <p className="text-3xl font-serif font-bold text-[#2A1F1D]">{formatCurrency(overdueAmount)}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-[#E3DACD] pb-1">
                {['overview', 'pending', 'paid', 'overdue'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 font-bold text-sm transition-all rounded-t-xl border-b-2 capitalize ${activeTab === tab
                            ? 'border-[#C06842] text-[#C06842] bg-[#F9F7F2]'
                            : 'border-transparent text-[#8C7B70] hover:text-[#5D4037] hover:bg-white/50'
                            }`}
                    >
                        {tab === 'overview' ? 'All Payments' : tab}
                    </button>
                ))}
            </div>

            {/* Payments Table */}
            <div className="glass-card border border-[#E3DACD]/50 rounded-[2rem] overflow-hidden shadow-sm bg-white/40">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#F9F7F2] border-b border-[#E3DACD]">
                            <tr>
                                <th className="px-8 py-5 text-left text-[10px] font-bold text-[#8C7B70] uppercase tracking-wider">Invoice</th>
                                <th className="px-8 py-5 text-left text-[10px] font-bold text-[#8C7B70] uppercase tracking-wider">Client</th>
                                <th className="px-8 py-5 text-left text-[10px] font-bold text-[#8C7B70] uppercase tracking-wider">Amount</th>
                                <th className="px-8 py-5 text-left text-[10px] font-bold text-[#8C7B70] uppercase tracking-wider">Date</th>
                                <th className="px-8 py-5 text-left text-[10px] font-bold text-[#8C7B70] uppercase tracking-wider">Status</th>
                                <th className="px-8 py-5 text-center text-[10px] font-bold text-[#8C7B70] uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E3DACD]/50">
                            {filteredPayments.map((payment) => (
                                <tr key={payment.payment_id} className="hover:bg-[#F9F7F2]/50 transition-colors group">
                                    <td className="px-8 py-5 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-lg border border-[#E3DACD]/50 text-[#C06842]">
                                                <FileText size={16} />
                                            </div>
                                            <span className="font-bold text-[#2A1F1D] text-sm group-hover:text-[#C06842] transition-colors">{payment.invoice_number}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-[#E3DACD] text-[#5D4037] flex items-center justify-center text-[10px] font-bold">P</div>
                                            <span className="text-[#5D4037] font-medium text-sm">Project Client</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 whitespace-nowrap font-serif font-bold text-[#2A1F1D] text-base">{formatCurrency(payment.amount)}</td>
                                    <td className="px-8 py-5 whitespace-nowrap text-[#8C7B70] text-sm font-medium">{new Date(payment.created_at).toLocaleDateString()}</td>
                                    <td className="px-8 py-5 whitespace-nowrap">{getStatusBadge(payment.status?.toLowerCase())}</td>
                                    <td className="px-8 py-5 whitespace-nowrap">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleEditClick(payment)}
                                                className="p-2 text-[#8C7B70] hover:text-[#C06842] hover:bg-white rounded-lg transition-all border border-transparent hover:border-[#E3DACD]"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="p-2 text-[#8C7B70] hover:text-[#2A1F1D] hover:bg-white rounded-lg transition-all border border-transparent hover:border-[#E3DACD]">
                                                <Download size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && editingPayment && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2A1F1D]/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-[#E3DACD] relative">
                        <button
                            onClick={() => setIsEditModalOpen(false)}
                            className="absolute right-6 top-6 p-2 text-[#8C7B70] hover:text-[#C06842] rounded-full hover:bg-[#F9F7F2] transition-all"
                        >
                            <X size={20} />
                        </button>

                        <h3 className="text-2xl font-serif font-bold text-[#2A1F1D] mb-6">Update Payment Details</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Invoice #</label>
                                <input
                                    type="text"
                                    disabled
                                    value={editingPayment.invoice_number}
                                    className="w-full bg-[#F9F7F2] border border-[#E3DACD] rounded-xl px-4 py-3 text-[#2A1F1D] font-bold opacity-60"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={editingPayment.amount}
                                        onChange={(e) => setEditingPayment({ ...editingPayment, amount: Number(e.target.value) })}
                                        className="w-full bg-[#FDFCF8] border border-[#E3DACD] rounded-xl px-4 py-3 text-[#2A1F1D] focus:ring-2 focus:ring-[#C06842]/20 focus:border-[#C06842] outline-none transition-all font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Status</label>
                                    <select
                                        value={editingPayment.status?.toLowerCase()}
                                        onChange={(e) => setEditingPayment({ ...editingPayment, status: e.target.value })}
                                        className="w-full bg-[#FDFCF8] border border-[#E3DACD] rounded-xl px-4 py-3 text-[#2A1F1D] focus:ring-2 focus:ring-[#C06842]/20 focus:border-[#C06842] outline-none transition-all font-bold"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                        <option value="overdue">Overdue</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Notes</label>
                                <textarea
                                    value={editingPayment.notes || ''}
                                    onChange={(e) => setEditingPayment({ ...editingPayment, notes: e.target.value })}
                                    className="w-full bg-[#FDFCF8] border border-[#E3DACD] rounded-xl px-4 py-3 text-[#2A1F1D] focus:ring-2 focus:ring-[#C06842]/20 focus:border-[#C06842] outline-none transition-all font-medium h-24"
                                    placeholder="Add any internal notes..."
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleUpdatePayment}
                            className="w-full mt-8 bg-[#2A1F1D] hover:bg-[#C06842] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-[#2A1F1D]/20 transition-all"
                        >
                            <Save size={20} />
                            Save Changes
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payments;
