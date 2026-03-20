import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, TrendingUp, AlertCircle, CheckCircle, Edit, Trash2, X } from 'lucide-react';

import { useMockApp } from '../../../hooks/useMockApp';

const Materials = () => {
    const { currentUser } = useMockApp();
    const uid = currentUser?.user_id || currentUser?.id;

    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    // Submission loading guard
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editMaterial, setEditMaterial] = useState(null);

    // Modal state (Create)
    const [showModal, setShowModal] = useState(false);
    const [newMaterial, setNewMaterial] = useState({
        name: '',
        category: 'Flooring',
        supplier: '',
        quantity: 0,
        unit: 'sq ft',
        unit_price: 0,
        status: 'in_stock'
    });

    useEffect(() => {
        if (!uid) return;
        fetchMaterials();
    }, [uid]);

    const fetchMaterials = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/materials/${uid}`);
            if (res.ok) {
                const data = await res.json();
                setMaterials(data);
            }
        } catch (error) {
            console.error('Failed to fetch materials:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateMaterial = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/materials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    professional_id: uid,
                    role: currentUser?.role,
                    ...newMaterial
                })
            });

            if (res.ok) {
                setShowModal(false);
                setNewMaterial({
                    name: '',
                    category: 'Flooring',
                    supplier: '',
                    quantity: 0,
                    unit: 'sq ft',
                    unit_price: 0,
                    status: 'in_stock'
                });
                fetchMaterials();
            }
        } catch (error) {
            console.error('Failed to create material:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (material) => {
        setEditMaterial({ ...material });
        setShowEditModal(true);
    };

    const handleUpdateMaterial = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/materials/${editMaterial.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...editMaterial,
                    role: currentUser?.role
                })
            });
            if (res.ok) {
                setShowEditModal(false);
                setEditMaterial(null);
                fetchMaterials();
            }
        } catch (error) {
            console.error('Failed to update material:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteMaterial = async (id) => {
        if (!window.confirm('Are you sure you want to delete this material? This cannot be undone.')) return;
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/materials/${id}`, { method: 'DELETE' });
            fetchMaterials();
        } catch (error) {
            console.error('Failed to delete material:', error);
        }
    };

    const categories = ['all', 'Flooring', 'Woodwork', 'Lighting', 'Fabrics', 'Hardware'];

    const getStatusBadge = (status) => {
        const styles = {
            in_stock: 'bg-green-50 text-green-700 border-green-200',
            low_stock: 'bg-[#E68A2E]/10 text-[#E68A2E] border-[#E68A2E]/30',
            out_of_stock: 'bg-red-50 text-red-700 border-red-200'
        };
        const icons = {
            in_stock: <CheckCircle size={14} />,
            low_stock: <AlertCircle size={14} />,
            out_of_stock: <AlertCircle size={14} />
        };
        const labels = {
            in_stock: 'In Stock',
            low_stock: 'Low Stock',
            out_of_stock: 'Out of Stock'
        };

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider border ${styles[status]}`}>
                {icons[status]}
                {labels[status]}
            </span>
        );
    };

    const filteredMaterials = materials.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.supplier.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const totalValue = materials.reduce((sum, m) => sum + (parseFloat(m.quantity) * parseFloat(m.unit_price)), 0);
    const lowStockCount = materials.filter(m => m.status === 'low_stock' || m.status === 'out_of_stock').length;

    return (
        <div className="space-y-8 animate-fade-in bg-[#FDFCF8] min-h-screen p-4 md:p-8 rounded-[2rem]">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-[#E68A2E] text-xs font-bold uppercase tracking-widest mb-1">
                        <Package size={14} /> Inventory
                    </div>
                    <h1 className="text-4xl font-serif font-bold text-[#2A1F1D]">Materials</h1>
                    <p className="text-[#8C7B70] mt-1 font-medium">Manage your project materials inventory</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-6 py-3 bg-[#2A1F1D] text-white rounded-xl font-bold hover:bg-[#C06842] hover:shadow-lg hover:shadow-[#C06842]/20 transition-all flex items-center gap-2 uppercase tracking-wide text-xs">
                    <Plus size={18} />
                    Add Material
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card relative overflow-hidden rounded-[2rem] p-6 border border-[#E3DACD]/50 shadow-sm group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#2A1F1D]/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="relative z-10 flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-[#F9F7F2] rounded-xl flex items-center justify-center text-[#2A1F1D] border border-[#E3DACD]">
                            <Package size={24} />
                        </div>
                    </div>
                    <p className="text-[#8C7B70] text-xs font-bold uppercase tracking-wider mb-1">Total Materials</p>
                    <p className="text-4xl font-serif font-bold text-[#2A1F1D]">{materials.length}</p>
                </div>

                <div className="glass-card relative overflow-hidden rounded-[2rem] p-6 border border-[#E3DACD]/50 shadow-sm group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="relative z-10 flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-[#F9F7F2] rounded-xl flex items-center justify-center text-[#2A1F1D] border border-[#E3DACD]">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    <p className="text-[#8C7B70] text-xs font-bold uppercase tracking-wider mb-1">Inventory Value</p>
                    <p className="text-4xl font-serif font-bold text-[#2A1F1D]">₹{(totalValue / 100000).toFixed(1)}L</p>
                </div>

                <div className="glass-card relative overflow-hidden rounded-[2rem] p-6 border border-[#E3DACD]/50 shadow-sm group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#E68A2E]/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="relative z-10 flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-[#F9F7F2] rounded-xl flex items-center justify-center text-[#2A1F1D] border border-[#E3DACD]">
                            <AlertCircle size={24} />
                        </div>
                    </div>
                    <p className="text-[#8C7B70] text-xs font-bold uppercase tracking-wider mb-1">Low Stock Items</p>
                    <p className="text-4xl font-serif font-bold text-[#2A1F1D]">{lowStockCount}</p>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C7B70]" size={20} />
                    <input
                        type="text"
                        placeholder="Search materials or suppliers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-[#E3DACD] rounded-xl text-[#2A1F1D] placeholder:text-[#B8AFA5] focus:border-[#C06842] focus:ring-2 focus:ring-[#C06842]/20 outline-none transition-all shadow-sm"
                    />
                </div>
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-6 py-3 bg-white border border-[#E3DACD] rounded-xl text-[#2A1F1D] focus:border-[#C06842] focus:ring-2 focus:ring-[#C06842]/20 outline-none transition-all shadow-sm font-medium cursor-pointer"
                >
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
                    ))}
                </select>
            </div>

            {/* Materials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-[#8C7B70] font-medium animate-pulse">
                        Loading materials directory...
                    </div>
                ) : filteredMaterials.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-[#8C7B70] font-medium">
                        No materials found.
                    </div>
                ) : (
                    filteredMaterials.map((material) => (
                        <div key={material.id} className="glass-card rounded-[2rem] border border-[#E3DACD]/40 overflow-hidden hover:shadow-xl transition-all group">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg font-serif text-[#2A1F1D] mb-1">{material.name}</h3>
                                        <p className="text-xs font-bold text-[#8C7B70] uppercase tracking-wide mb-3">{material.supplier}</p>
                                        <div className="mb-3">
                                            {getStatusBadge(material.status)}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-[#E3DACD]/50">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-[#B8AFA5] mb-1">Quantity</p>
                                        <p className="font-bold text-[#2A1F1D] text-lg">{material.quantity} <span className="text-xs font-medium text-[#8C7B70]">{material.unit}</span></p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase font-bold text-[#B8AFA5] mb-1">Price/Unit</p>
                                        <p className="font-bold text-[#C06842] text-lg">₹{material.unit_price}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-[10px] font-bold text-[#B8AFA5] uppercase tracking-wider">
                                        Added: {new Date(material.created_at).toLocaleDateString()}
                                    </span>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditClick(material)} className="p-2 text-[#C06842] hover:bg-[#C06842]/10 rounded-lg transition-all" title="Edit">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteMaterial(material.id)} className="p-2 text-[#8C7B70] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )))}
            </div>

            {/* Create Material Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[95vh] animate-fade-in border border-[#E3DACD]/50">
                        <div className="p-6 border-b border-[#E3DACD]/50 flex justify-between items-center bg-[#FDFCF8] shrink-0">
                            <h3 className="text-2xl font-serif font-bold text-[#2A1F1D] flex items-center gap-2">
                                <Package size={24} className="text-[#C06842]" /> Add New Material
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 text-[#8C7B70] hover:bg-[#E3DACD]/30 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <form id="material-form" onSubmit={handleCreateMaterial} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Material Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newMaterial.name}
                                        onChange={e => setNewMaterial({ ...newMaterial, name: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-[#E3DACD] bg-[#F9F7F2] focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-medium"
                                        placeholder="e.g. Italian Marble - Carrara White"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Category</label>
                                        <select
                                            value={newMaterial.category}
                                            onChange={e => setNewMaterial({ ...newMaterial, category: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-[#E3DACD] bg-[#F9F7F2] focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-medium"
                                        >
                                            {categories.filter(c => c !== 'all').map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Supplier</label>
                                        <input
                                            type="text"
                                            required
                                            value={newMaterial.supplier}
                                            onChange={e => setNewMaterial({ ...newMaterial, supplier: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-[#E3DACD] bg-[#F9F7F2] focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-medium"
                                            placeholder="e.g. Premium Stones Ltd"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Stock Quantity</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={newMaterial.quantity}
                                            onChange={e => setNewMaterial({ ...newMaterial, quantity: parseInt(e.target.value, 10) })}
                                            className="w-full px-4 py-3 rounded-xl border border-[#E3DACD] bg-[#F9F7F2] focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-medium"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Unit (e.g. sq ft, pieces)</label>
                                        <input
                                            type="text"
                                            required
                                            value={newMaterial.unit}
                                            onChange={e => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-[#E3DACD] bg-[#F9F7F2] focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-medium"
                                            placeholder="e.g. sq ft"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Price Per Unit (₹)</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={newMaterial.unit_price}
                                            onChange={e => setNewMaterial({ ...newMaterial, unit_price: parseFloat(e.target.value) })}
                                            className="w-full px-4 py-3 rounded-xl border border-[#E3DACD] bg-[#F9F7F2] focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-medium"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Inventory Status</label>
                                        <select
                                            value={newMaterial.status}
                                            onChange={e => setNewMaterial({ ...newMaterial, status: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-[#E3DACD] bg-[#F9F7F2] focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-medium"
                                        >
                                            <option value="in_stock">In Stock</option>
                                            <option value="low_stock">Low Stock</option>
                                            <option value="out_of_stock">Out of Stock</option>
                                        </select>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t border-[#E3DACD]/50 bg-[#FDFCF8] shrink-0 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-6 py-3 rounded-xl font-bold text-[#8C7B70] hover:bg-[#E3DACD]/30 transition-colors uppercase tracking-wide text-xs"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="material-form"
                                disabled={isSubmitting}
                                className="px-6 py-3 rounded-xl font-bold bg-[#2A1F1D] text-white hover:bg-[#C06842] shadow-lg hover:shadow-[#C06842]/20 transition-all uppercase tracking-wide text-xs flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> Processing...</>
                                ) : 'Add Material'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Material Modal */}
            {showEditModal && editMaterial && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
                        <div className="p-6 border-b border-[#E3DACD]/50 flex justify-between items-center bg-[#FDFCF8] shrink-0">
                            <h3 className="text-2xl font-serif font-bold text-[#2A1F1D] flex items-center gap-2">
                                <Edit size={24} className="text-[#C06842]" /> Edit Material
                            </h3>
                            <button onClick={() => setShowEditModal(false)} className="p-2 text-[#8C7B70] hover:bg-[#E3DACD]/30 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <form id="edit-material-form" onSubmit={handleUpdateMaterial} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Material Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={editMaterial.name}
                                        onChange={e => setEditMaterial({ ...editMaterial, name: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-[#E3DACD] bg-[#F9F7F2] focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-medium"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Category</label>
                                        <select
                                            value={editMaterial.category}
                                            onChange={e => setEditMaterial({ ...editMaterial, category: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-[#E3DACD] bg-[#F9F7F2] focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-medium"
                                        >
                                            {categories.filter(c => c !== 'all').map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Supplier</label>
                                        <input
                                            type="text"
                                            required
                                            value={editMaterial.supplier}
                                            onChange={e => setEditMaterial({ ...editMaterial, supplier: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-[#E3DACD] bg-[#F9F7F2] focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Stock Quantity</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={editMaterial.quantity}
                                            onChange={e => setEditMaterial({ ...editMaterial, quantity: parseInt(e.target.value, 10) })}
                                            className="w-full px-4 py-3 rounded-xl border border-[#E3DACD] bg-[#F9F7F2] focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Unit</label>
                                        <input
                                            type="text"
                                            required
                                            value={editMaterial.unit}
                                            onChange={e => setEditMaterial({ ...editMaterial, unit: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-[#E3DACD] bg-[#F9F7F2] focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Price Per Unit (₹)</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={editMaterial.unit_price}
                                            onChange={e => setEditMaterial({ ...editMaterial, unit_price: parseFloat(e.target.value) })}
                                            className="w-full px-4 py-3 rounded-xl border border-[#E3DACD] bg-[#F9F7F2] focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Inventory Status</label>
                                        <select
                                            value={editMaterial.status}
                                            onChange={e => setEditMaterial({ ...editMaterial, status: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-[#E3DACD] bg-[#F9F7F2] focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-medium"
                                        >
                                            <option value="in_stock">In Stock</option>
                                            <option value="low_stock">Low Stock</option>
                                            <option value="out_of_stock">Out of Stock</option>
                                        </select>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t border-[#E3DACD]/50 bg-[#FDFCF8] shrink-0 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="px-6 py-3 rounded-xl font-bold text-[#8C7B70] hover:bg-[#E3DACD]/30 transition-colors uppercase tracking-wide text-xs"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="edit-material-form"
                                disabled={isSubmitting}
                                className="px-6 py-3 rounded-xl font-bold bg-[#C06842] text-white hover:bg-[#2A1F1D] shadow-lg transition-all uppercase tracking-wide text-xs flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> Processing...</>
                                ) : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Materials;
