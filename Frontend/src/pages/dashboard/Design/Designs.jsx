import React, { useState, useEffect, useRef } from 'react';
import { 
    Palette, Plus, Search, Heart, Eye, 
    X, Pencil, Trash2, Check, FileText, ImageIcon, 
    Upload, Calendar, LayoutGrid, List, Filter, Edit
} from 'lucide-react';
import { useMockApp } from '../../../hooks/useMockApp';

const Designs = () => {
    const { currentUser } = useMockApp();
    const uid = currentUser?.user_id || currentUser?.id;

    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    // Data states
    const [designs, setDesigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [viewDesign, setViewDesign] = useState(null);
    const [editDesign, setEditDesign] = useState(null);

    // Form states
    const [newDesign, setNewDesign] = useState({
        title: '',
        description: '',
        category: 'Living Room',
        style: 'Modern',
        client_name: '',
        project_type: 'Personal',
        project_id: '',
        file: null,
        preview_url: ''
    });

    const [assignedProjects, setAssignedProjects] = useState([]);
    const fileInputRef = useRef(null);
    const editFileInputRef = useRef(null);

    const categories = ['all', 'Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Office', 'Dining Room', 'Commercial'];

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

    const handleFileChange = (e, isEdit = false) => {
        const file = e.target.files[0];
        if (file) {
            if (isEdit) {
                setEditDesign(prev => ({
                    ...prev,
                    file: file,
                    preview_url: file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
                }));
            } else {
                setNewDesign(prev => ({
                    ...prev,
                    file: file,
                    preview_url: file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
                }));
            }
        }
    };

    const handleCreateDesign = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        const formData = new FormData();
        formData.append('title', newDesign.title);
        formData.append('description', newDesign.description);
        formData.append('category', newDesign.category);
        formData.append('style', newDesign.style);
        formData.append('client_name', newDesign.client_name);
        formData.append('project_type', newDesign.project_type);
        if (newDesign.project_type === 'Team') formData.append('project_id', newDesign.project_id);
        if (newDesign.file) formData.append('design_file', newDesign.file);
        formData.append('role', currentUser?.role || 'interior_designer');

        setIsSubmitting(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/designs`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` },
                body: formData
            });

            if (res.ok) {
                setShowModal(false);
                resetForm();
                fetchDesigns();
            } else {
                alert('Failed to upload design.');
            }
        } catch (error) {
            console.error('Error uploading design:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (design) => {
        setEditDesign({ 
            ...design, 
            preview_url: design.file_type === 'Image' ? design.file_path : ''
        });
        setShowEditModal(true);
    };

    const handleUpdateDesign = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            // Note: Update design doesn't take file uploads in this simple implementation
            // but we update the fields. For file updates, we usually handle it separately or re-upload.
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/designs/${editDesign.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('planora_token')}` 
                },
                body: JSON.stringify(editDesign)
            });

            if (res.ok) {
                setShowEditModal(false);
                setEditDesign(null);
                fetchDesigns();
            } else {
                alert('Failed to update design.');
            }
        } catch (error) {
            console.error('Error updating design:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteDesign = async (id) => {
        if (!window.confirm('Are you sure you want to delete this design? This cannot be undone.')) return;
        
        setIsDeleting(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/designs/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` }
            });

            if (res.ok) {
                setDesigns(prev => prev.filter(d => d.id !== id));
                if (viewDesign?.id === id) setViewDesign(null);
            }
        } catch (error) {
            console.error('Delete failed:', error);
        } finally {
            setIsDeleting(false);
        }
    };



    const resetForm = () => {
        setNewDesign({
            title: '',
            description: '',
            category: 'Living Room',
            style: 'Modern',
            client_name: '',
            project_type: 'Personal',
            project_id: '',
            file: null,
            preview_url: ''
        });
    };

    const filteredDesigns = designs.filter(d => {
        const matchesSearch = (d.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (d.client_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (d.description || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const getStatusBadge = (status) => {
        const s = status?.toLowerCase();
        const styles = {
            approved: 'bg-green-50 text-green-700 border-green-200',
            pending_review: 'bg-amber-50 text-amber-700 border-amber-200',
            in_review: 'bg-[#E68A2E]/10 text-[#E68A2E] border-[#E68A2E]/30',
            rejected: 'bg-red-50 text-red-700 border-red-200'
        };
        const style = styles[s] || 'bg-gray-50 text-gray-700 border-gray-200';
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider border ${style}`}>
                {s?.replace('_', ' ')}
            </span>
        );
    };

    return (
        <div className="space-y-8 animate-fade-in bg-[#FDFCF8] min-h-screen p-4 md:p-8 rounded-[2rem]">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-[#E68A2E] text-xs font-bold uppercase tracking-widest mb-1">
                        <Palette size={14} /> Portfolio
                    </div>
                    <h1 className="text-4xl font-serif font-bold text-[#2A1F1D]">Designs</h1>
                    <p className="text-[#8C7B70] mt-1 font-medium">Manage your design portfolio and project concepts</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
                        className="p-3 bg-white border border-[#E3DACD] rounded-xl text-[#8C7B70] hover:text-[#2A1F1D] transition-all shadow-sm"
                    >
                        {viewMode === 'grid' ? <List size={20} /> : <LayoutGrid size={20} />}
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-6 py-3 bg-[#2A1F1D] text-white rounded-xl font-bold hover:bg-[#C06842] hover:shadow-lg hover:shadow-[#C06842]/20 transition-all flex items-center gap-2 uppercase tracking-wide text-xs">
                        <Plus size={18} />
                        Create Design
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card relative overflow-hidden rounded-[2rem] p-6 border border-[#E3DACD]/50 shadow-sm group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#2A1F1D]/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="relative z-10 flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-[#F9F7F2] rounded-xl flex items-center justify-center text-[#2A1F1D] border border-[#E3DACD]">
                            <Palette size={24} />
                        </div>
                    </div>
                    <p className="text-[#8C7B70] text-xs font-bold uppercase tracking-wider mb-1">Total Designs</p>
                    <p className="text-4xl font-serif font-bold text-[#2A1F1D]">{designs.length}</p>
                </div>

                <div className="glass-card relative overflow-hidden rounded-[2rem] p-6 border border-[#E3DACD]/50 shadow-sm group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="relative z-10 flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-[#F9F7F2] rounded-xl flex items-center justify-center text-[#2A1F1D] border border-[#E3DACD]">
                            <FileText size={24} />
                        </div>
                    </div>
                    <p className="text-[#8C7B70] text-xs font-bold uppercase tracking-wider mb-1">Documents (PDF)</p>
                    <p className="text-4xl font-serif font-bold text-[#2A1F1D]">{designs.filter(d => d.file_type === 'PDF').length}</p>
                </div>

                <div className="glass-card relative overflow-hidden rounded-[2rem] p-6 border border-[#E3DACD]/50 shadow-sm group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#E68A2E]/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="relative z-10 flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-[#F9F7F2] rounded-xl flex items-center justify-center text-[#2A1F1D] border border-[#E3DACD]">
                            <ImageIcon size={24} />
                        </div>
                    </div>
                    <p className="text-[#8C7B70] text-xs font-bold uppercase tracking-wider mb-1">Visuals (Image)</p>
                    <p className="text-4xl font-serif font-bold text-[#2A1F1D]">{designs.filter(d => d.file_type === 'Image').length}</p>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C7B70]" size={20} />
                    <input
                        type="text"
                        placeholder="Search by title, client, or description..."
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

            {/* Content Area */}
            {loading ? (
                <div className="py-12 text-center text-[#8C7B70] font-medium animate-pulse">
                    Loading designs directory...
                </div>
            ) : filteredDesigns.length === 0 ? (
                <div className="py-12 text-center text-[#8C7B70] font-medium">
                    No designs found.
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDesigns.map((design) => (
                        <div key={design.id} className="glass-card rounded-[2rem] border border-[#E3DACD]/40 overflow-hidden hover:shadow-xl transition-all group hover:-translate-y-1">
                            <div className="h-48 overflow-hidden relative cursor-pointer bg-[#F9F7F2]" onClick={() => setViewDesign(design)}>
                                {design.file_type === 'PDF' ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-amber-600/60 transition-transform duration-700 group-hover:scale-110">
                                        <FileText size={48} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C7B70]">PDF Document</span>
                                    </div>
                                ) : (
                                    <img src={design.file_path || design.image_url} alt={design.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                )}
                                
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); setViewDesign(design); }} className="p-2 bg-white/20 text-white hover:bg-[#C06842] rounded-lg backdrop-blur-md transition-all">
                                            <Eye size={16} />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleEditClick(design); }} className="p-2 bg-white/20 text-white hover:bg-blue-600 rounded-lg backdrop-blur-md transition-all">
                                            <Edit size={16} />
                                        </button>

                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteDesign(design.id); }} className="p-2 bg-red-500/80 text-white hover:bg-red-600 rounded-lg backdrop-blur-md transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="font-bold font-serif text-lg text-[#2A1F1D] mb-1 line-clamp-1">{design.title}</h3>
                                        <p className="text-xs font-bold text-[#8C7B70] uppercase tracking-wide mb-3">{design.category} • {design.style}</p>
                                        <div className="mb-3">
                                            {getStatusBadge(design.status)}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-[#E3DACD]/50">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-[#B8AFA5] mb-1">Client</p>
                                        <p className="font-bold text-[#2A1F1D] text-sm truncate">{design.client_name || 'Personal'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase font-bold text-[#B8AFA5] mb-1">Date</p>
                                        <p className="font-bold text-[#2A1F1D] text-sm">{new Date(design.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#8C7B70] uppercase tracking-wider">
                                        {design.file_type === 'PDF' ? <FileText size={12} className="text-amber-600" /> : <ImageIcon size={12} className="text-blue-600" />}
                                        {design.file_type}
                                    </div>
                                    <button onClick={() => setViewDesign(design)} className="text-[#C06842] text-xs font-black uppercase tracking-wider hover:underline">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* List View */
                <div className="glass-card rounded-[2rem] border border-[#E3DACD]/40 overflow-hidden bg-white/40 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#F9F7F2] border-b border-[#E3DACD]/50">
                                <tr className="text-[10px] font-black uppercase tracking-widest text-[#8C7B70]">
                                    <th className="px-8 py-5">Design Identifier</th>
                                    <th className="px-6 py-5">Classification</th>
                                    <th className="px-6 py-5">Stakeholder</th>
                                    <th className="px-6 py-5">Date</th>
                                    <th className="px-6 py-5">Status</th>
                                    <th className="px-8 py-5 text-right">Utility</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E3DACD]/30">
                                {filteredDesigns.map((design) => (
                                    <tr key={design.id} className="hover:bg-white transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-[#FDFCF8] border border-[#E3DACD]/50 flex items-center justify-center text-[#C06842]">
                                                    {design.file_type === 'PDF' ? <FileText size={18} /> : <ImageIcon size={18} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[#2A1F1D] text-sm">{design.title}</p>
                                                    <p className="text-[10px] text-[#8C7B70]">{design.category}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 font-medium text-[#2A1F1D] text-xs">{design.style}</td>
                                        <td className="px-6 py-5 font-bold text-[#2A1F1D] text-xs">{design.client_name || 'Personal'}</td>
                                        <td className="px-6 py-5 text-xs text-[#8C7B70] font-medium">{new Date(design.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-5">{getStatusBadge(design.status)}</td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => setViewDesign(design)} className="p-2 text-[#C06842] hover:bg-[#C06842]/10 rounded-lg transition-all" title="View"><Eye size={16} /></button>
                                                <button onClick={() => handleEditClick(design)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit"><Edit size={16} /></button>

                                                <button onClick={() => handleDeleteDesign(design.id)} className="p-2 text-[#8C7B70] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Design Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[95vh] animate-fade-in border border-[#E3DACD]/50">
                        <div className="p-6 border-b border-[#E3DACD]/50 flex justify-between items-center bg-[#FDFCF8] shrink-0">
                            <h3 className="text-2xl font-serif font-bold text-[#2A1F1D] flex items-center gap-2">
                                <Palette size={24} className="text-[#C06842]" /> Create New Design
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 text-[#8C7B70] hover:bg-[#E3DACD]/30 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <form id="design-form" onSubmit={handleCreateDesign} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Digital Asset (Image or PDF)</label>
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`group relative rounded-xl border-2 border-dashed transition-all duration-500 cursor-pointer overflow-hidden flex flex-col items-center justify-center p-8 ${newDesign.file ? 'border-[#C06842] bg-[#C06842]/5' : 'border-[#E3DACD] hover:border-[#C06842] bg-[#F9F7F2]'}`}
                                    >
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, false)} />
                                        
                                        {newDesign.preview_url ? (
                                            <div className="relative w-full h-40">
                                                <img src={newDesign.preview_url} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                                    <span className="text-white text-xs font-bold uppercase tracking-widest">Change File</span>
                                                </div>
                                            </div>
                                        ) : newDesign.file?.type === 'application/pdf' ? (
                                            <div className="text-center">
                                                <FileText size={40} className="text-amber-600 mb-2" />
                                                <p className="font-bold text-[#2A1F1D] text-sm truncate">{newDesign.file.name}</p>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <Upload size={32} className="text-[#8C7B70] mb-2 mx-auto" />
                                                <p className="text-[10px] font-black text-[#2A1F1D] uppercase tracking-widest">Click to select file</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Design Title</label>
                                        <input 
                                            required
                                            type="text" 
                                            value={newDesign.title}
                                            onChange={e => setNewDesign({...newDesign, title: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl border border-[#E3DACD] bg-[#F9F7F2] focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-medium"
                                            placeholder="e.g. Minimalist Bedroom Layout"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Category</label>
                                        <select 
                                            value={newDesign.category}
                                            onChange={e => setNewDesign({...newDesign, category: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl border border-[#E3DACD] bg-[#F9F7F2] focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-medium"
                                        >
                                            {categories.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Style</label>
                                        <input 
                                            type="text" 
                                            value={newDesign.style}
                                            onChange={e => setNewDesign({...newDesign, style: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl border border-[#E3DACD] bg-[#F9F7F2] focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-medium"
                                            placeholder="e.g. Boho"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Client Name</label>
                                        <input 
                                            type="text" 
                                            value={newDesign.client_name}
                                            onChange={e => setNewDesign({...newDesign, client_name: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl border border-[#E3DACD] bg-[#F9F7F2] focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-medium"
                                            placeholder="Who is this for?"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Project Type</label>
                                        <select 
                                            value={newDesign.project_type}
                                            onChange={e => setNewDesign({...newDesign, project_type: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl border border-[#E3DACD] bg-[#F9F7F2] focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-medium"
                                        >
                                            <option value="Personal">Personal Model</option>
                                            <option value="Team">Team Project</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Technical Description</label>
                                        <textarea 
                                            rows="3"
                                            value={newDesign.description}
                                            onChange={e => setNewDesign({...newDesign, description: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl border border-[#E3DACD] bg-[#F9F7F2] focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-medium resize-none"
                                            placeholder="Design specifics and material notes..."
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="hidden"></button>
                            </form>
                        </div>

                        <div className="p-6 border-t border-[#E3DACD]/50 bg-[#FDFCF8] shrink-0 flex justify-end gap-3">
                            <button 
                                onClick={() => setShowModal(false)}
                                className="px-6 py-3 rounded-xl font-bold text-[#8C7B70] hover:bg-[#E3DACD]/30 transition-colors uppercase tracking-wide text-xs"
                            >
                                Discard
                            </button>
                            <button 
                                type="submit" 
                                form="design-form"
                                disabled={isSubmitting || !newDesign.file}
                                className="px-6 py-3 bg-[#2A1F1D] text-white rounded-xl font-bold hover:bg-[#C06842] shadow-lg transition-all flex items-center gap-2 uppercase tracking-wide text-xs disabled:opacity-50"
                            >
                                {isSubmitting ? 'Uploading...' : 'Publish Design'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Design Modal */}
            {showEditModal && editDesign && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[95vh] animate-fade-in border border-[#E3DACD]/50">
                        <div className="p-6 border-b border-[#E3DACD]/50 flex justify-between items-center bg-[#FDFCF8] shrink-0">
                            <h3 className="text-2xl font-serif font-bold text-[#2A1F1D] flex items-center gap-2">
                                <Edit size={24} className="text-[#C06842]" /> Edit Design
                            </h3>
                            <button onClick={() => setShowEditModal(false)} className="p-2 text-[#8C7B70] hover:bg-[#E3DACD]/30 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <form id="edit-design-form" onSubmit={handleUpdateDesign} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Design Title</label>
                                        <input 
                                            required
                                            type="text" 
                                            value={editDesign.title}
                                            onChange={e => setEditDesign({...editDesign, title: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl border border-[#E3DACD] bg-[#F9F7F2] focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Category</label>
                                        <select 
                                            value={editDesign.category}
                                            onChange={e => setEditDesign({...editDesign, category: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl border border-[#E3DACD] bg-[#F9F7F2] focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-medium"
                                        >
                                            {categories.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Style</label>
                                        <input 
                                            type="text" 
                                            value={editDesign.style}
                                            onChange={e => setEditDesign({...editDesign, style: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl border border-[#E3DACD] bg-[#F9F7F2] focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Client Name</label>
                                        <input 
                                            type="text" 
                                            value={editDesign.client_name}
                                            onChange={e => setEditDesign({...editDesign, client_name: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl border border-[#E3DACD] bg-[#F9F7F2] focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Project Type</label>
                                        <select 
                                            value={editDesign.project_type}
                                            onChange={e => setEditDesign({...editDesign, project_type: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl border border-[#E3DACD] bg-[#F9F7F2] focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-medium"
                                        >
                                            <option value="Personal">Personal Model</option>
                                            <option value="Team">Team Project</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-[#8C7B70] uppercase tracking-wider mb-2">Technical Description</label>
                                        <textarea 
                                            rows="3"
                                            value={editDesign.description}
                                            onChange={e => setEditDesign({...editDesign, description: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl border border-[#E3DACD] bg-[#F9F7F2] focus:bg-white focus:outline-none focus:border-[#C06842] transition-all font-medium resize-none"
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t border-[#E3DACD]/50 bg-[#FDFCF8] shrink-0 flex justify-end gap-3">
                            <button 
                                onClick={() => setShowEditModal(false)}
                                className="px-6 py-3 rounded-xl font-bold text-[#8C7B70] hover:bg-[#E3DACD]/30 transition-colors uppercase tracking-wide text-xs"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                form="edit-design-form"
                                disabled={isSubmitting}
                                className="px-6 py-3 bg-[#C06842] text-white rounded-xl font-bold hover:bg-[#2A1F1D] shadow-lg transition-all flex items-center gap-2 uppercase tracking-wide text-xs disabled:opacity-50"
                            >
                                {isSubmitting ? 'Updating...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Design Detail Modal */}
            {viewDesign && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewDesign(null)}></div>
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl relative z-10 overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-fade-in border border-[#E3DACD]/30">
                        {/* Media Section */}
                        <div className="md:w-3/5 bg-[#F9F7F2] flex items-center justify-center relative min-h-[300px]">
                            {viewDesign.file_type === 'PDF' ? (
                                <div className="p-12 flex flex-col items-center gap-4 text-amber-600">
                                    <FileText size={80} strokeWidth={1} />
                                    <p className="text-sm font-bold uppercase tracking-widest text-[#8C7B70]">Technical Blueprint (PDF)</p>

                                </div>
                            ) : (
                                <img src={viewDesign.file_path || viewDesign.image_url} alt={viewDesign.title} className="w-full h-full object-contain" />
                            )}
                        </div>

                        {/* Details Section */}
                        <div className="md:w-2/5 p-8 flex flex-col bg-white overflow-y-auto">
                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[#E68A2E] text-[10px] font-black uppercase tracking-widest">
                                        Metadata
                                    </div>
                                    <h2 className="text-2xl font-serif font-bold text-[#2A1F1D]">{viewDesign.title}</h2>
                                    <div className="pt-2">
                                        {getStatusBadge(viewDesign.status)}
                                    </div>
                                </div>
                                <button onClick={() => setViewDesign(null)} className="p-2 text-[#8C7B70] hover:bg-gray-100 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-6 flex-1">
                                <div>
                                    <p className="text-[10px] uppercase font-black text-[#B8AFA5] mb-1 tracking-widest">Description</p>
                                    <p className="text-sm text-[#8C7B70] italic leading-relaxed">
                                        {viewDesign.description || "The professional has not provided a manual technical scope for this entry."}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] uppercase font-black text-[#B8AFA5] mb-1 tracking-widest">Classification</p>
                                        <p className="text-sm font-bold text-[#2A1F1D]">{viewDesign.style}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-black text-[#B8AFA5] mb-1 tracking-widest">Category</p>
                                        <p className="text-sm font-bold text-[#2A1F1D]">{viewDesign.category}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-black text-[#B8AFA5] mb-1 tracking-widest">Stakeholder</p>
                                        <p className="text-sm font-bold text-[#2A1F1D]">{viewDesign.client_name || 'Personal'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-black text-[#B8AFA5] mb-1 tracking-widest">Created At</p>
                                        <p className="text-sm font-bold text-[#2A1F1D]">{new Date(viewDesign.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 mt-8 border-t border-gray-100 flex gap-2">

                                <button
                                    onClick={() => handleEditClick(viewDesign)}
                                    className="flex-1 py-4 bg-[#2A1F1D] text-white rounded-xl font-bold text-xs uppercase tracking-wide hover:bg-[#C06842] transition-all flex items-center justify-center gap-2"
                                >
                                    <Edit size={16} /> Edit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Designs;
