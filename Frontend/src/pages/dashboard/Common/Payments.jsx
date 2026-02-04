import React, { useState } from 'react';
import { DollarSign, TrendingUp, Clock, CheckCircle, Download, Calendar, CreditCard, FileText, Plus } from 'lucide-react';

const Payments = () => {
    const [activeTab, setActiveTab] = useState('overview');

    // Static payment data
    const payments = [
        { id: 1, invoice: 'INV-2026-001', client: 'Rajesh Kumar', amount: 250000, status: 'paid', date: '2026-02-01', method: 'Bank Transfer' },
        { id: 2, invoice: 'INV-2026-002', client: 'BuildWell Constructions', amount: 180000, status: 'pending', date: '2026-02-03', method: 'Cheque' },
        { id: 3, invoice: 'INV-2026-003', client: 'Priya Patel', amount: 95000, status: 'overdue', date: '2026-01-25', method: 'UPI' },
        { id: 4, invoice: 'INV-2026-004', client: 'Amit Sharma', amount: 320000, status: 'paid', date: '2026-01-30', method: 'Bank Transfer' },
    ];

    const totalRevenue = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
    const overdueAmount = payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);

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
                    <p className="text-[#8C7B70] mt-2 font-medium">Track invoices and payment transactions</p>
                </div>
                <button className="px-6 py-3 bg-[#2A1F1D] hover:bg-[#C06842] text-white rounded-xl font-bold shadow-lg shadow-[#2A1F1D]/20 transition-all flex items-center gap-2">
                    <Plus size={20} />
                    Create Invoice
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
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-3 font-bold text-sm transition-all rounded-t-xl border-b-2 ${activeTab === 'overview'
                        ? 'border-[#C06842] text-[#C06842] bg-[#F9F7F2]'
                        : 'border-transparent text-[#8C7B70] hover:text-[#5D4037] hover:bg-white/50'
                        }`}
                >
                    All Payments
                </button>
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-6 py-3 font-bold text-sm transition-all rounded-t-xl border-b-2 ${activeTab === 'pending'
                        ? 'border-[#C06842] text-[#C06842] bg-[#F9F7F2]'
                        : 'border-transparent text-[#8C7B70] hover:text-[#5D4037] hover:bg-white/50'
                        }`}
                >
                    Pending
                </button>
            </div>

            {/* Payments Table */}
            <div className="glass-card border border-[#E3DACD]/50 rounded-[2rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#F9F7F2] border-b border-[#E3DACD]">
                            <tr>
                                <th className="px-8 py-5 text-left text-[10px] font-bold text-[#8C7B70] uppercase tracking-wider">Invoice</th>
                                <th className="px-8 py-5 text-left text-[10px] font-bold text-[#8C7B70] uppercase tracking-wider">Client</th>
                                <th className="px-8 py-5 text-left text-[10px] font-bold text-[#8C7B70] uppercase tracking-wider">Amount</th>
                                <th className="px-8 py-5 text-left text-[10px] font-bold text-[#8C7B70] uppercase tracking-wider">Date</th>
                                <th className="px-8 py-5 text-left text-[10px] font-bold text-[#8C7B70] uppercase tracking-wider">Method</th>
                                <th className="px-8 py-5 text-left text-[10px] font-bold text-[#8C7B70] uppercase tracking-wider">Status</th>
                                <th className="px-8 py-5 text-left text-[10px] font-bold text-[#8C7B70] uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E3DACD]/50 bg-white/60">
                            {payments.map((payment) => (
                                <tr key={payment.id} className="hover:bg-[#F9F7F2] transition-colors group">
                                    <td className="px-8 py-5 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-lg border border-[#E3DACD]/50 text-[#C06842]">
                                                <FileText size={16} />
                                            </div>
                                            <span className="font-bold text-[#2A1F1D] text-sm group-hover:text-[#C06842] transition-colors">{payment.invoice}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-[#E3DACD] text-[#5D4037] flex items-center justify-center text-xs font-bold">{payment.client.charAt(0)}</div>
                                            <span className="text-[#5D4037] font-medium text-sm">{payment.client}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 whitespace-nowrap font-serif font-bold text-[#2A1F1D] text-base">{formatCurrency(payment.amount)}</td>
                                    <td className="px-8 py-5 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-[#8C7B70] text-sm font-medium">
                                            <Calendar size={14} />
                                            {payment.date}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-[#5D4037] text-sm font-medium bg-[#F9F7F2] px-3 py-1 rounded-lg w-fit border border-[#E3DACD]/50">
                                            <CreditCard size={14} className="text-[#C06842]" />
                                            {payment.method}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 whitespace-nowrap">{getStatusBadge(payment.status)}</td>
                                    <td className="px-8 py-5 whitespace-nowrap">
                                        <button className="p-2 text-[#8C7B70] hover:text-[#C06842] hover:bg-[#F9F7F2] rounded-lg transition-all">
                                            <Download size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Payments;
