import React, { useState } from 'react';
import { Palette, Plus, Search, Heart, Eye, Download, Share2 } from 'lucide-react';

const Designs = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    // Static designs data
    const designs = [
        {
            id: 1,
            title: 'Modern Living Room Concept',
            category: 'Living Room',
            style: 'Contemporary',
            client: 'Rajesh Kumar',
            status: 'approved',
            date: '2026-02-01',
            likes: 24,
            views: 156,
            image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=300"
        },
        {
            id: 2,
            title: 'Minimalist Bedroom Design',
            category: 'Bedroom',
            style: 'Minimalist',
            client: 'Priya Patel',
            status: 'in_review',
            date: '2026-01-30',
            likes: 18,
            views: 98,
            image: "https://images.unsplash.com/photo-1616137466211-f939a420be84?auto=format&fit=crop&q=80&w=300"
        },
        {
            id: 3,
            title: 'Industrial Kitchen Layout',
            category: 'Kitchen',
            style: 'Industrial',
            client: 'Amit Sharma',
            status: 'draft',
            date: '2026-02-02',
            likes: 31,
            views: 203,
            image: "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?auto=format&fit=crop&q=80&w=300"
        },
        {
            id: 4,
            title: 'Luxury Bathroom Spa',
            category: 'Bathroom',
            style: 'Luxury',
            client: 'BuildWell Constructions',
            status: 'approved',
            date: '2026-01-28',
            likes: 42,
            views: 287,
            image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&q=80&w=300"
        },
        {
            id: 5,
            title: 'Cozy Home Office',
            category: 'Office',
            style: 'Scandinavian',
            client: 'Sneha Reddy',
            status: 'in_review',
            date: '2026-01-29',
            likes: 27,
            views: 145,
            image: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&q=80&w=300"
        },
        {
            id: 6,
            title: 'Elegant Dining Space',
            category: 'Dining Room',
            style: 'Classic',
            client: 'Vikram Singh',
            status: 'approved',
            date: '2026-01-27',
            likes: 35,
            views: 198,
            image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&q=80&w=300"
        },
    ];

    const categories = ['all', 'Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Office', 'Dining Room'];

    const getStatusBadge = (status) => {
        const styles = {
            approved: 'bg-green-50 text-green-700 border-green-200',
            in_review: 'bg-[#E68A2E]/10 text-[#E68A2E] border-[#E68A2E]/30',
            draft: 'bg-[#8C7B70]/10 text-[#8C7B70] border-[#8C7B70]/30'
        };
        const labels = {
            approved: 'Approved',
            in_review: 'In Review',
            draft: 'Draft'
        };

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider border ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    const filteredDesigns = designs.filter(d => {
        const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.client.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const totalDesigns = designs.length;
    const approvedDesigns = designs.filter(d => d.status === 'approved').length;
    const totalViews = designs.reduce((sum, d) => sum + d.views, 0);

    return (
        <div className="space-y-8 animate-fade-in bg-[#FDFCF8] min-h-screen p-4 md:p-8 rounded-[2rem]">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-[#E68A2E] text-xs font-bold uppercase tracking-widest mb-1">
                        <Palette size={14} /> Portfolio
                    </div>
                    <h1 className="text-4xl font-serif font-bold text-[#2A1F1D]">Designs</h1>
                    <p className="text-[#8C7B70] mt-1 font-medium">Your design portfolio and project concepts</p>
                </div>
                <button className="px-6 py-3 bg-[#2A1F1D] text-white rounded-xl font-bold hover:bg-[#C06842] hover:shadow-lg hover:shadow-[#C06842]/20 transition-all flex items-center gap-2 uppercase tracking-wide text-xs">
                    <Plus size={18} />
                    Create Design
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card relative overflow-hidden rounded-[2rem] p-6 border border-[#E3DACD]/50 shadow-sm group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#C06842]/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="relative z-10 flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-[#F9F7F2] rounded-xl flex items-center justify-center text-[#2A1F1D] border border-[#E3DACD]">
                            <Palette size={24} />
                        </div>
                    </div>
                    <p className="text-[#8C7B70] text-xs font-bold uppercase tracking-wider mb-1">Total Designs</p>
                    <p className="text-4xl font-serif font-bold text-[#2A1F1D]">{totalDesigns}</p>
                </div>

                <div className="glass-card relative overflow-hidden rounded-[2rem] p-6 border border-[#E3DACD]/50 shadow-sm group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="relative z-10 flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-[#F9F7F2] rounded-xl flex items-center justify-center text-[#2A1F1D] border border-[#E3DACD]">
                            <Eye size={24} />
                        </div>
                    </div>
                    <p className="text-[#8C7B70] text-xs font-bold uppercase tracking-wider mb-1">Total Views</p>
                    <p className="text-4xl font-serif font-bold text-[#2A1F1D]">{totalViews}</p>
                </div>

                <div className="glass-card relative overflow-hidden rounded-[2rem] p-6 border border-[#E3DACD]/50 shadow-sm group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#E68A2E]/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="relative z-10 flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-[#F9F7F2] rounded-xl flex items-center justify-center text-[#2A1F1D] border border-[#E3DACD]">
                            <Heart size={24} />
                        </div>
                    </div>
                    <p className="text-[#8C7B70] text-xs font-bold uppercase tracking-wider mb-1">Approved Designs</p>
                    <p className="text-4xl font-serif font-bold text-[#2A1F1D]">{approvedDesigns}</p>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C7B70]" size={20} />
                    <input
                        type="text"
                        placeholder="Search designs or clients..."
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

            {/* Designs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDesigns.map((design) => (
                    <div key={design.id} className="glass-card rounded-[2rem] border border-[#E3DACD]/40 overflow-hidden hover:shadow-xl transition-all group hover:-translate-y-1">
                        <div className="h-48 overflow-hidden relative">
                            <img src={design.image} alt={design.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 md:p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex justify-end gap-2">
                                    <button className="p-2 bg-white/20 text-white hover:bg-white/40 rounded-lg backdrop-blur-md transition-all">
                                        <Eye size={16} />
                                    </button>
                                    <button className="p-2 bg-white/20 text-white hover:bg-white/40 rounded-lg backdrop-blur-md transition-all">
                                        <Share2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white/60 backdrop-blur-sm">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="font-bold font-serif text-lg text-[#2A1F1D] mb-1 line-clamp-1">{design.title}</h3>
                                    <div className="flex items-center gap-2 text-xs font-bold text-[#8C7B70] mb-3 uppercase tracking-wide">
                                        <span>{design.category}</span>
                                        <span className="text-[#E3DACD]">•</span>
                                        <span>{design.style}</span>
                                    </div>
                                    <div className="mb-3">
                                        {getStatusBadge(design.status)}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-[#E3DACD]/50">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-[#B8AFA5] mb-1">Client</p>
                                    <p className="font-bold text-[#2A1F1D] text-sm truncate">{design.client}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase font-bold text-[#B8AFA5] mb-1">Date</p>
                                    <p className="font-bold text-[#2A1F1D] text-sm">{design.date}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5 text-[#8C7B70] group-hover:text-[#C06842] transition-colors">
                                        <Heart size={16} className="text-[#C06842]" />
                                        <span className="font-bold">{design.likes}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[#8C7B70]">
                                        <Eye size={16} />
                                        <span className="font-bold">{design.views}</span>
                                    </div>
                                </div>
                                <button className="text-[#C06842] text-xs font-bold uppercase tracking-wider hover:underline">
                                    View Details
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Designs;
