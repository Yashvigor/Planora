import React, { useState, useEffect, useCallback } from 'react';
import { 
    Upload, FileText, Trash2, Edit3, Eye, 
    Plus, X, Filter, Search, MoreVertical,
    ChevronDown, Lock, Users, Briefcase
} from 'lucide-react';

const ArchitectDrawings = ({ currentUser }) => {
    const [drawings, setDrawings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [editingDrawing, setEditingDrawing] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Floor Plan',
        is_team_project: false,
        project_id: ''
    });
    const [projects, setProjects] = useState([]);
    const [uploadFile, setUploadFile] = useState(null);

    const architectId = currentUser?.user_id || currentUser?.id;

    const fetchDrawings = useCallback(async () => {
        if (!architectId) return;
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/drawings/${architectId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` }
            });
            if (res.ok) {
                setDrawings(await res.json());
            }
        } catch (err) {
            console.error('Error fetching drawings:', err);
        } finally {
            setLoading(false);
        }
    }, [architectId]);

    const fetchProjects = useCallback(async () => {
        if (!architectId) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/professionals/${architectId}/projects`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProjects(data.filter(p => !p.assignment_status || p.assignment_status === 'Accepted'));
            }
        } catch (err) {
            console.error('Error fetching projects:', err);
        }
    }, [architectId]);

    useEffect(() => {
        fetchDrawings();
        fetchProjects();
    }, [fetchDrawings, fetchProjects]);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile && !editingDrawing) return;

        const data = new FormData();
        data.append('architect_id', architectId);
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('category', formData.category);
        data.append('is_team_project', formData.is_team_project);
        if (formData.project_id) data.append('project_id', formData.project_id);
        if (uploadFile) data.append('file', uploadFile);

        try {
            const url = editingDrawing 
                ? `${import.meta.env.VITE_API_URL}/api/drawings/${editingDrawing.drawing_id}`
                : `${import.meta.env.VITE_API_URL}/api/drawings`;
            
            const method = editingDrawing ? 'PUT' : 'POST';
            
            const res = await fetch(url, {
                method,
                body: editingDrawing ? JSON.stringify(formData) : data,
                headers: editingDrawing ? {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('planora_token')}`
                } : {
                    'Authorization': `Bearer ${localStorage.getItem('planora_token')}`
                }
            });

            if (res.ok) {
                await fetchDrawings();
                setIsUploadModalOpen(false);
                setEditingDrawing(null);
                setFormData({ title: '', description: '', category: 'Floor Plan', is_team_project: false, project_id: '' });
                setUploadFile(null);
            }
        } catch (err) {
            console.error('Error saving drawing:', err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this drawing?')) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/drawings/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('planora_token')}` }
            });
            if (res.ok) {
                setDrawings(prev => prev.filter(d => d.drawing_id !== id));
            }
        } catch (err) {
            console.error('Error deleting drawing:', err);
        }
    };

    const categories = ['All', 'Floor Plan', 'Elevation', 'Structural', 'MEP', '3D Render', 'Other'];

    const filteredDrawings = drawings.filter(d => {
        const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || d.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-180px)] bg-white rounded-[2rem] border border-[#E3DACD]/40 shadow-sm overflow-hidden animate-fade-in relative">
            {/* Mobile Sidebar Toggle */}
            <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden absolute bottom-6 right-6 z-[160] p-4 bg-[#C06842] text-white rounded-2xl shadow-2xl scale-125 transition-transform active:scale-95"
            >
                {isSidebarOpen ? <X size={24} /> : <Filter size={24} />}
            </button>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    className="lg:hidden fixed inset-0 bg-[#2A1F1D]/40 backdrop-blur-sm z-[150] animate-fade-in"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`w-80 border-r border-[#E3DACD]/30 bg-[#FDFCF8] flex flex-col absolute lg:relative inset-y-0 left-0 z-[155] lg:z-0 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-6 border-b border-[#E3DACD]/30">
                    <button 
                        onClick={() => {
                            setEditingDrawing(null);
                            setFormData({ title: '', description: '', category: 'Floor Plan', is_team_project: false, project_id: '' });
                            setIsUploadModalOpen(true);
                        }}
                        className="w-full py-3 bg-[#C06842] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#A65D3B] transition-all shadow-lg shadow-[#C06842]/20"
                    >
                        <Plus size={18} /> New Drawing
                    </button>
                    
                    <div className="mt-6 relative">
                        <Search className="absolute left-3 top-2.5 text-[#B8AFA5]" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search drawings..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-[#E3DACD] rounded-xl text-xs font-medium outline-none focus:border-[#C06842]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <p className="px-2 text-[10px] font-black uppercase tracking-widest text-[#B8AFA5] mb-4">Categories</p>
                    {categories.map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-bold transition-all ${filterCategory === cat ? 'bg-[#C06842]/10 text-[#C06842]' : 'text-[#8C7B70] hover:bg-white'}`}
                        >
                            <span>{cat}</span>
                            <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-[#E3DACD]/40">
                                {cat === 'All' ? drawings.length : drawings.filter(d => d.category === cat).length}
                            </span>
                        </button>
                    ))}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col bg-white">
                <div className="p-8 border-b border-[#E3DACD]/30 flex justify-between items-center bg-[#FDFCF8]/30">
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-[#2A1F1D]">Drawing Studio</h2>
                        <p className="text-xs text-[#8C7B70] font-medium mt-1">Manage all your architectural blueprints and project renders.</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="px-3 py-1.5 bg-[#F9F7F2] rounded-lg border border-[#E3DACD] text-[10px] font-bold text-[#8C7B70] flex items-center gap-2">
                            <Lock size={12} /> Personal
                        </div>
                        <div className="px-3 py-1.5 bg-[#F9F7F2] rounded-lg border border-[#E3DACD] text-[10px] font-bold text-[#8C7B70] flex items-center gap-2">
                            <Users size={12} /> Team
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-4">
                            <div className="w-10 h-10 border-4 border-[#C06842] border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm font-bold text-[#8C7B70] uppercase tracking-widest">Loading Library...</p>
                        </div>
                    ) : filteredDrawings.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                            <div className="p-8 bg-[#F9F7F2] rounded-full">
                                <FileText size={48} className="text-[#B8AFA5]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[#2A1F1D]">No drawings found</h3>
                                <p className="text-sm">Upload your first architectural drawing to get started.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredDrawings.map(drawing => (
                                <div key={drawing.drawing_id} className="group glass-card border border-[#E3DACD]/40 rounded-[2rem] overflow-hidden hover:shadow-2xl hover:border-[#C06842]/50 transition-all duration-300 flex flex-col bg-white">
                                    <div className="h-52 bg-[#F9F7F2] relative overflow-hidden flex items-center justify-center border-b border-[#F9F7F2]">
                                        <img 
                                            src={`${import.meta.env.VITE_API_URL}/${drawing.file_path}`} 
                                            alt={drawing.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-[#2A1F1D]/0 group-hover:bg-[#2A1F1D]/40 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                                            <a 
                                                href={`${import.meta.env.VITE_API_URL}/${drawing.file_path}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="p-2 bg-white rounded-lg text-[#2A1F1D] hover:bg-[#C06842] hover:text-white transition-all shadow-lg"
                                            >
                                                <Eye size={18} />
                                            </a>
                                            <button 
                                                onClick={() => {
                                                    setEditingDrawing(drawing);
                                                    setFormData({
                                                        title: drawing.title,
                                                        description: drawing.description || '',
                                                        category: drawing.category,
                                                        is_team_project: drawing.is_team_project,
                                                        project_id: drawing.project_id || ''
                                                    });
                                                    setIsUploadModalOpen(true);
                                                }}
                                                className="p-2 bg-white rounded-lg text-[#2A1F1D] hover:bg-blue-600 hover:text-white transition-all shadow-lg"
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(drawing.drawing_id)}
                                                className="p-2 bg-white rounded-lg text-[#2A1F1D] hover:bg-red-600 hover:text-white transition-all shadow-lg"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                        <div className="absolute top-3 left-3 flex gap-2">
                                            <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] font-black uppercase text-[#C06842] shadow-sm">
                                                {drawing.category}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-[#2A1F1D] line-clamp-1 group-hover:text-[#C06842] transition-colors">{drawing.title}</h4>
                                            <div className="mt-1 flex items-center gap-2">
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${drawing.is_team_project ? 'bg-[#C06842]/10 text-[#C06842]' : 'bg-[#B8AFA5]/10 text-[#8C7B70]'}`}>
                                                    {drawing.is_team_project ? 'Shared with Team' : 'Personal Asset'}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-[#8C7B70] mt-2 line-clamp-2 min-h-[2.5rem] leading-relaxed font-medium">{drawing.description || 'No description provided.'}</p>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-[#E3DACD]/40 flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-[#B8AFA5]">
                                            <span className="flex items-center gap-1">
                                                {drawing.is_team_project ? <Users size={12} className="text-[#C06842]" /> : <Lock size={12} />}
                                                {drawing.is_team_project ? 'Team' : 'Private'}
                                            </span>
                                            <span>{new Date(drawing.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Upload/Edit Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#2A1F1D]/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up">
                        <div className="p-8 border-b border-[#E3DACD]/30 flex justify-between items-center bg-[#FDFCF8]/50">
                            <h3 className="text-xl font-bold font-serif text-[#2A1F1D]">
                                {editingDrawing ? 'Edit Drawing Details' : 'Upload New Drawing'}
                            </h3>
                            <button onClick={() => setIsUploadModalOpen(false)} className="p-2 hover:bg-[#F9F7F2] rounded-full transition-colors text-[#8C7B70]">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpload} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#8C7B70]">Title</label>
                                    <input 
                                        required
                                        type="text" 
                                        className="w-full px-4 py-3 bg-[#FDFCF8] border border-[#E3DACD] rounded-xl text-sm font-bold text-[#2A1F1D] focus:border-[#C06842] outline-none"
                                        placeholder="e.g., Ground Floor Furniture Layout"
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#8C7B70]">Category</label>
                                        <select 
                                            className="w-full px-4 py-3 bg-[#FDFCF8] border border-[#E3DACD] rounded-xl text-sm font-bold text-[#2A1F1D] focus:border-[#C06842] outline-none appearance-none"
                                            value={formData.category}
                                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                                        >
                                            {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#8C7B70]">Linked Project (Optional)</label>
                                        <select 
                                            className="w-full px-4 py-3 bg-[#FDFCF8] border border-[#E3DACD] rounded-xl text-sm font-bold text-[#2A1F1D] focus:border-[#C06842] outline-none appearance-none"
                                            value={formData.project_id}
                                            onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                                        >
                                            <option value="">Personal (No Project)</option>
                                            {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#8C7B70]">Description</label>
                                    <textarea 
                                        className="w-full px-4 py-3 bg-[#FDFCF8] border border-[#E3DACD] rounded-xl text-sm font-medium text-[#2A1F1D] focus:border-[#C06842] outline-none h-24 resize-none"
                                        placeholder="Add notes about this drawing..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    ></textarea>
                                </div>

                                {!editingDrawing && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#8C7B70]">Drawing File</label>
                                        <div className="relative group/upload">
                                            <input 
                                                required
                                                type="file" 
                                                accept="image/*,.pdf"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                onChange={(e) => setUploadFile(e.target.files[0])}
                                            />
                                            <div className="w-full py-8 border-2 border-dashed border-[#E3DACD] rounded-[1.5rem] flex flex-col items-center justify-center text-[#B8AFA5] group-hover/upload:border-[#C06842] group-hover/upload:text-[#C06842] transition-all">
                                                <Upload size={32} />
                                                <span className="mt-2 text-xs font-bold uppercase tracking-widest">
                                                    {uploadFile ? uploadFile.name : 'Choose file or drag & drop'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-3 p-4 bg-[#F9F7F2] rounded-2xl border border-[#E3DACD]/50">
                                    <input 
                                        type="checkbox" 
                                        id="team_project"
                                        className="w-5 h-5 text-[#C06842] focus:ring-[#C06842] border-[#E3DACD] rounded"
                                        checked={formData.is_team_project}
                                        onChange={(e) => setFormData({...formData, is_team_project: e.target.checked})}
                                    />
                                    <label htmlFor="team_project" className="flex-1 cursor-pointer">
                                        <p className="text-sm font-bold text-[#2A1F1D]">Share with Team</p>
                                        <p className="text-[10px] text-[#8C7B70] font-medium leading-tight">If linked to a project, team members can view this drawing.</p>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button 
                                    type="submit"
                                    className="w-full py-4 bg-[#C06842] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#A65D3B] transition-all shadow-xl shadow-[#C06842]/20"
                                >
                                    {editingDrawing ? 'Update Drawing' : 'Upload Drawing'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArchitectDrawings;
