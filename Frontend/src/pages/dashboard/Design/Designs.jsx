import React, { useState, useEffect } from 'react';
import { Palette, Plus, Search, Heart, Eye, Download, Share2, X, Pencil, Trash2, Check } from 'lucide-react';
import { useMockApp } from '../../../hooks/useMockApp';

const Designs = () => {
    const { currentUser } = useMockApp();
    const uid = currentUser?.user_id || currentUser?.id;

    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    // Dynamic data states
    const [designs, setDesigns] = useState([]);
    const [loading, setLoading] = useState(true);

    // Submission loading guard
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal state for Upload
    const [showModal, setShowModal] = useState(false);
    const [newDesign, setNewDesign] = useState({
        title: '',
        category: 'Living Room',
        style: '',
        client_name: '',
        image_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=300', // default placeholder
        project_type: 'Personal',
        project_id: ''
    });

    // Modal state for View Details
    const [viewDesign, setViewDesign] = useState(null);

    // Projects list for dropdown
    const [assignedProjects, setAssignedProjects] = useState([]);

    const categories = ['all', 'Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Office', 'Dining Room'];

    useEffect(() => {
        if (!uid) return;
        fetchDesigns();
        fetchAssignedProjects();
    }, [uid]);

    const fetchAssignedProjects = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/professional/${uid}`);
            if (res.ok) {
                const data = await res.json();
                setAssignedProjects(data);
                if (data.length > 0) {
                    setNewDesign(prev => ({ ...prev, project_id: data[0].project_id }));
                }
            }
        } catch (error) {
            console.error('Failed to fetch assigned projects:', error);
        }
    };

    const fetchDesigns = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/designs/${uid}`);
            if (res.ok) {
                const data = await res.json();
                setDesigns(data);
            }
        } catch (error) {
            console.error('Failed to fetch designs:', error);
        } finally {
            setLoading(false);
        }
    };

    const [editingDesign, setEditingDesign] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleCreateDesign = async (e) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        e.preventDefault();
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/designs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    professional_id: uid,
                    title: newDesign.title,
                    category: newDesign.category,
                    style: newDesign.style,
                    client_name: newDesign.client_name,
                    image_url: newDesign.image_url,
                    project_type: newDesign.project_type,
                    project_id: newDesign.project_id
                })
            });

            if (res.ok) {
                setShowModal(false);
                setNewDesign({
                    title: '',
                    category: 'Living Room',
                    style: '',
                    client_name: '',
                    image_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=300',
                    project_type: 'Personal',
                    project_id: assignedProjects.length > 0 ? assignedProjects[0].project_id : ''
                });
                fetchDesigns();
            } else {
                alert('Failed to upload design');
            }
        } catch (error) {
            console.error('Error uploading design:', error);
            alert('An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditDesign = async (e) => {
        if (isSubmitting || !editingDesign) return;
        setIsSubmitting(true);
        e.preventDefault();
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/designs/${editingDesign.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editingDesign.title,
                    category: editingDesign.category,
                    style: editingDesign.style,
                    client_name: editingDesign.client_name,
                    image_url: editingDesign.image,
                    project_type: editingDesign.project_type,
                    project_id: editingDesign.project_id
                })
            });

            if (res.ok) {
                setEditingDesign(null);
                fetchDesigns();
            } else {
                alert('Failed to update design');
            }
        } catch (error) {
            console.error('Error updating design:', error);
            alert('An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteDesign = async (id) => {
        if (!window.confirm('Are you sure you want to delete this design? This cannot be undone.')) return;
        
        setIsDeleting(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/designs/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchDesigns();
                if (viewDesign?.id === id) setViewDesign(null);
            } else {
                alert('Failed to delete design');
            }
        } catch (error) {
            console.error('Error deleting design:', error);
            alert('An error occurred');
        } finally {
            setIsDeleting(false);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            approved: 'bg-green-50 text-green-700 border-green-200',
            pending_review: 'bg-amber-50 text-amber-700 border-amber-200',
            rejected: 'bg-red-50 text-red-700 border-red-200',
            in_review: 'bg-[#E68A2E]/10 text-[#E68A2E] border-[#E68A2E]/30',
            draft: 'bg-[#8C7B70]/10 text-[#8C7B70] border-[#8C7B70]/30'
        };
        const labels = {
            approved: 'Approved',
            pending_review: 'Pending Review',
            rejected: 'Rejected',
            in_review: 'In Review',
            draft: 'Draft'
        };

        const style = styles[status] || styles.draft;
        const label = labels[status] || status;

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider border ${style}`}>
                {label}
            </span>
        );
    };

    const filteredDesigns = designs.filter(d => {
        const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (d.client_name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const totalDesigns = designs.length;
    const approvedDesigns = designs.filter(d => d.status === 'approved').length;
    // const totalViews = designs.reduce((sum, d) => sum + d.views, 0); // Removed as per instruction

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
                <button
                    onClick={() => setShowModal(true)}
                    className="px-6 py-3 bg-[#2A1F1D] text-white rounded-xl font-bold hover:bg-[#C06842] hover:shadow-lg hover:shadow-[#C06842]/20 transition-all flex items-center gap-2 uppercase tracking-wide text-xs">
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
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#E68A2E]/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="relative z-10 flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-[#F9F7F2] rounded-xl flex items-center justify-center text-[#2A1F1D] border border-[#E3DACD]">
                            <Heart size={24} />
                        </div>
                    </div>
                    <p className="text-[#8C7B70] text-xs font-bold uppercase tracking-wider mb-1">Approved Designs</p>
                    <p className="text-4xl font-serif font-bold text-[#2A1F1D]">{approvedDesigns}</p>
                </div>

                {/* Removed Total Views card */}
                <div className="glass-card relative overflow-hidden rounded-[2rem] p-6 border border-[#E3DACD]/50 shadow-sm group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="relative z-10 flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-[#F9F7F2] rounded-xl flex items-center justify-center text-[#2A1F1D] border border-[#E3DACD]">
                            <Eye size={24} />
                        </div>
                    </div>
                    <p className="text-[#8C7B70] text-xs font-bold uppercase tracking-wider mb-1">Total Views</p>
                    <p className="text-4xl font-serif font-bold text-[#2A1F1D]">{designs.reduce((sum, d) => sum + d.views, 0)}</p>
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
                        <div className="h-48 overflow-hidden relative cursor-pointer" onClick={() => setViewDesign(design)}>
                            <img src={design.image} alt={design.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 md:p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex justify-end gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); setEditingDesign({ ...design, id: design.id, image: design.image }); }} className="p-2 bg-amber-500/80 text-white hover:bg-amber-600 rounded-lg backdrop-blur-md transition-all shadow-sm">
                                        <Pencil size={16} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteDesign(design.id); }} className="p-2 bg-red-500/80 text-white hover:bg-red-600 rounded-lg backdrop-blur-md transition-all shadow-sm">
                                        <Trash2 size={16} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); setViewDesign(design); }} className="p-2 bg-white/20 text-white hover:bg-white/40 rounded-lg backdrop-blur-md transition-all">
                                        <Eye size={16} />
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
                                    <p className="font-bold text-[#2A1F1D] text-sm truncate">{design.client_name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase font-bold text-[#B8AFA5] mb-1">Date</p>
                                    <p className="font-bold text-[#2A1F1D] text-sm">{new Date(design.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-end text-sm">
                                <button onClick={() => setViewDesign(design)} className="text-[#C06842] text-xs font-bold uppercase tracking-wider hover:underline">
                                    View Details
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create/Edit Design Modal */}
            {(showModal || editingDesign) && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#2A1F1D]/60 backdrop-blur-md" onClick={() => { setShowModal(false); setEditingDesign(null); }}></div>
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl relative z-10 overflow-hidden animate-fade-in border border-[#E3DACD]/50 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-8 border-b border-[#E3DACD]/50 flex justify-between items-center bg-[#FDFCF8] shrink-0">
                            <div>
                                <h3 className="text-3xl font-serif font-bold text-[#2A1F1D]">{editingDesign ? 'Edit Design' : 'Upload New Design'}</h3>
                                <p className="text-[10px] text-[#A65D3B] mt-1 uppercase tracking-[0.2em] font-black">Portfolio Management</p>
                            </div>
                            <button onClick={() => { setShowModal(false); setEditingDesign(null); }} className="p-3 text-[#8C7B70] hover:bg-red-50 hover:text-red-500 rounded-full transition-all duration-300 shadow-sm hover:shadow-md">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Scrollable Form Body */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <form id="design-upload-form" onSubmit={editingDesign ? handleEditDesign : handleCreateDesign} className="space-y-8 pb-4">
                                <div className="space-y-6">
                                    <div className="group transition-all">
                                        <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-3 ml-1 group-focus-within:text-[#C06842]">Design Title</label>
                                        <input
                                            type="text"
                                            required
                                            value={editingDesign ? editingDesign.title : newDesign.title}
                                            onChange={e => editingDesign ? setEditingDesign({ ...editingDesign, title: e.target.value }) : setNewDesign({ ...newDesign, title: e.target.value })}
                                            className="w-full px-5 py-4 rounded-2xl border-2 border-[#E3DACD]/50 bg-[#F9F7F2]/50 focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-medium text-sm placeholder:text-[#8C7B70]/30"
                                            placeholder="e.g. Modern Scandinavian Living Room"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-3 ml-1">Project Type</label>
                                            <div className="relative">
                                                <select
                                                    value={editingDesign ? editingDesign.project_type : newDesign.project_type}
                                                    onChange={e => editingDesign ? setEditingDesign({ ...editingDesign, project_type: e.target.value }) : setNewDesign({ ...newDesign, project_type: e.target.value })}
                                                    className="w-full px-5 py-4 rounded-2xl border-2 border-[#E3DACD]/50 bg-[#F9F7F2]/50 focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-bold text-xs appearance-none cursor-pointer"
                                                >
                                                    <option value="Personal">Personal Model</option>
                                                    <option value="Team">Team Project (Review Req.)</option>
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#A65D3B]">
                                                    <Plus size={14} className="rotate-45" />
                                                </div>
                                            </div>
                                        </div>

                                        {(editingDesign ? editingDesign.project_type === 'Team' : newDesign.project_type === 'Team') && (
                                            <div>
                                                <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-3 ml-1">Active Project</label>
                                                <div className="relative">
                                                    <select
                                                        value={editingDesign ? editingDesign.project_id : newDesign.project_id}
                                                        onChange={e => editingDesign ? setEditingDesign({ ...editingDesign, project_id: e.target.value }) : setNewDesign({ ...newDesign, project_id: e.target.value })}
                                                        className="w-full px-5 py-4 rounded-2xl border-2 border-[#E3DACD]/50 bg-[#F9F7F2]/50 focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-bold text-xs appearance-none cursor-pointer"
                                                        required={(editingDesign ? editingDesign.project_type === 'Team' : newDesign.project_type === 'Team')}
                                                    >
                                                        <option value="" disabled>Select a project</option>
                                                        {assignedProjects.map(proj => (
                                                            <option key={proj.project_id} value={proj.project_id}>{proj.name}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#A65D3B]">
                                                        <Plus size={14} className="rotate-45" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-3 ml-1">Category</label>
                                            <select
                                                value={editingDesign ? editingDesign.category : newDesign.category}
                                                onChange={e => editingDesign ? setEditingDesign({ ...editingDesign, category: e.target.value }) : setNewDesign({ ...newDesign, category: e.target.value })}
                                                className="w-full px-5 py-4 rounded-2xl border-2 border-[#E3DACD]/50 bg-[#F9F7F2]/50 focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-bold text-xs cursor-pointer"
                                            >
                                                {categories.filter(c => c !== 'all').map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-3 ml-1">Design Style</label>
                                            <input
                                                type="text"
                                                required
                                                value={editingDesign ? editingDesign.style : newDesign.style}
                                                onChange={e => editingDesign ? setEditingDesign({ ...editingDesign, style: e.target.value }) : setNewDesign({ ...newDesign, style: e.target.value })}
                                                className="w-full px-5 py-4 rounded-2xl border-2 border-[#E3DACD]/50 bg-[#F9F7F2]/50 focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-medium text-sm placeholder:text-[#8C7B70]/30"
                                                placeholder="e.g. Boho Chic"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-3 ml-1">Client Name (Optional)</label>
                                        <input
                                            type="text"
                                            value={editingDesign ? editingDesign.client_name : newDesign.client_name}
                                            onChange={e => editingDesign ? setEditingDesign({ ...editingDesign, client_name: e.target.value }) : setNewDesign({ ...newDesign, client_name: e.target.value })}
                                            className="w-full px-5 py-4 rounded-2xl border-2 border-[#E3DACD]/50 bg-[#F9F7F2]/50 focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-medium text-sm"
                                            placeholder="Who is this for?"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-3 ml-1">Visual Reference (URL)</label>
                                        <input
                                            type="url"
                                            value={editingDesign ? editingDesign.image : newDesign.image_url}
                                            onChange={e => editingDesign ? setEditingDesign({ ...editingDesign, image: e.target.value }) : setNewDesign({ ...newDesign, image_url: e.target.value })}
                                            className="w-full px-5 py-4 rounded-2xl border-2 border-[#E3DACD]/50 bg-[#F9F7F2]/50 focus:bg-white focus:outline-none focus:border-[#C06842] transition-all text-[11px] font-mono overflow-hidden"
                                            placeholder="https://images.unsplash.com/..."
                                        />
                                    </div>

                                    {/* Real-time Preview */}
                                    {(editingDesign ? editingDesign.image : newDesign.image_url) && (
                                        <div className="pt-4">
                                            <label className="block text-[10px] font-black text-[#8C7B70] uppercase tracking-widest mb-3 ml-1">Asset Preview</label>
                                            <div className="rounded-3xl overflow-hidden h-48 border-2 border-[#E3DACD]/50 shadow-inner group relative">
                                                <img src={editingDesign ? editingDesign.image : newDesign.image_url} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Fixed Footer */}
                        <div className="p-8 border-t border-[#E3DACD]/50 bg-[#FDFCF8] flex justify-end gap-4 shrink-0">
                            <button
                                type="button"
                                onClick={() => { setShowModal(false); setEditingDesign(null); }}
                                className="px-8 py-4 rounded-2xl font-black text-[10px] text-[#8C7B70] hover:bg-white hover:text-[#2A1F1D] border border-transparent hover:border-[#E3DACD] transition-all uppercase tracking-[0.2em]"
                            >
                                Discard
                            </button>
                            <button
                                type="submit"
                                form="design-upload-form"
                                disabled={isSubmitting}
                                className="px-10 py-4 rounded-2xl font-black text-[10px] bg-[#2A1F1D] text-white hover:bg-[#C06842] shadow-xl hover:shadow-[#C06842]/30 transition-all uppercase tracking-[0.2em] flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        Processing
                                    </>
                                ) : (
                                    <>
                                        {editingDesign ? 'Update Design' : 'Confirm & Upload'}
                                        {editingDesign ? <Check size={14} /> : <Plus size={14} />}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Design Details Modal */}
            {viewDesign && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewDesign(null)}></div>
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl relative z-10 overflow-hidden animate-fade-in flex flex-col md:flex-row max-h-[95vh]">

                        {/* Image Section */}
                        <div className="md:w-2/3 bg-gray-100 flex items-center justify-center relative min-h-[40vh] md:min-h-[auto]">
                            <img
                                src={viewDesign.image}
                                alt={viewDesign.title}
                                className="w-full h-full object-cover md:object-contain absolute inset-0 md:relative"
                            />
                        </div>

                        {/* Details Section */}
                        <div className="md:w-1/3 p-8 flex flex-col bg-white overflow-y-auto">
                            <div className="flex justify-end mb-4">
                                <button onClick={() => setViewDesign(null)} className="p-2 text-[#8C7B70] hover:bg-[#E3DACD]/30 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <h2 className="text-3xl font-serif font-bold text-[#2A1F1D] mb-2">{viewDesign.title}</h2>
                            <div className="mb-6">
                                {getStatusBadge(viewDesign.status)}
                            </div>

                            <div className="space-y-6 flex-grow">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-[#B8AFA5] mb-1">Category & Style</p>
                                    <p className="font-medium text-[#2A1F1D]">{viewDesign.category} • {viewDesign.style}</p>
                                </div>

                                <div>
                                    <p className="text-[10px] uppercase font-bold text-[#B8AFA5] mb-1">Client</p>
                                    <p className="font-bold text-[#2A1F1D]">{viewDesign.client_name || 'N/A'}</p>
                                </div>

                                <div>
                                    <p className="text-[10px] uppercase font-bold text-[#B8AFA5] mb-1">Upload Date</p>
                                    <p className="font-medium text-[#2A1F1D]">{new Date(viewDesign.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Designs;
