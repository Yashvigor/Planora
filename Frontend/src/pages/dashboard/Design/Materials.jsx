import React, { useState } from 'react';
import { Package, Plus, Search, TrendingUp, AlertCircle, CheckCircle, Edit, Trash2 } from 'lucide-react';

const Materials = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    // Static materials data
    const materials = [
        {
            id: 1,
            name: 'Italian Marble - Carrara White',
            category: 'Flooring',
            supplier: 'Premium Stones Ltd',
            quantity: 250,
            unit: 'sq ft',
            pricePerUnit: 850,
            status: 'in_stock',
            lastOrdered: '2026-01-28',
        },
        {
            id: 2,
            name: 'Teak Wood Panels',
            category: 'Woodwork',
            supplier: 'WoodCraft Suppliers',
            quantity: 45,
            unit: 'panels',
            pricePerUnit: 1200,
            status: 'low_stock',
            lastOrdered: '2026-02-01',
        },
        {
            id: 3,
            name: 'LED Strip Lights - Warm White',
            category: 'Lighting',
            supplier: 'Lumina Electrics',
            quantity: 0,
            unit: 'meters',
            pricePerUnit: 180,
            status: 'out_of_stock',
            lastOrdered: '2026-01-25',
        },
        {
            id: 4,
            name: 'Velvet Upholstery Fabric - Emerald',
            category: 'Fabrics',
            supplier: 'Textile World',
            quantity: 120,
            unit: 'meters',
            pricePerUnit: 450,
            status: 'in_stock',
            lastOrdered: '2026-01-30',
        },
        {
            id: 5,
            name: 'Brass Door Handles - Antique Finish',
            category: 'Hardware',
            supplier: 'Metalworks Inc',
            quantity: 18,
            unit: 'pieces',
            pricePerUnit: 650,
            status: 'low_stock',
            lastOrdered: '2026-02-02',
        },
    ];

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

    const totalValue = materials.reduce((sum, m) => sum + (m.quantity * m.pricePerUnit), 0);
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
                <button className="px-6 py-3 bg-[#2A1F1D] text-white rounded-xl font-bold hover:bg-[#C06842] hover:shadow-lg hover:shadow-[#C06842]/20 transition-all flex items-center gap-2 uppercase tracking-wide text-xs">
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
                {filteredMaterials.map((material) => (
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
                                    <p className="font-bold text-[#C06842] text-lg">₹{material.pricePerUnit}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-[10px] font-bold text-[#B8AFA5] uppercase tracking-wider">Last: {material.lastOrdered}</span>
                                <div className="flex gap-2">
                                    <button className="p-2 text-[#C06842] hover:bg-[#C06842]/10 rounded-lg transition-all">
                                        <Edit size={16} />
                                    </button>
                                    <button className="p-2 text-[#8C7B70] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Materials;
