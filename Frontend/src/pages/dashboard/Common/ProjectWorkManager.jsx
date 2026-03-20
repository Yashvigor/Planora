import React, { useState, useEffect, useCallback } from 'react';
import {
    Camera, FileText, CheckCircle, XCircle, Clock,
    ChevronRight, Upload, AlertTriangle, Eye, Image as ImageIcon
} from 'lucide-react';

const Card = ({ children, className = "" }) => (
    <div className={`glass-card p-5 rounded-2xl border border-[#E3DACD]/40 shadow-sm transition-all ${className}`}>
        {children}
    </div>
);

const ProjectWorkManager = ({ currentUser }) => {
    const [projects, setProjects] = useState([]);
    const [activeProject, setActiveProject] = useState(null);
    const [submissions, setSubmissions] = useState({ progress: [], docs: [] });
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadType, setUploadType] = useState('progress'); // 'progress' or 'doc'
    const [uploadLoading, setUploadLoading] = useState(false);

    // Form State
    const [note, setNote] = useState('');
    const [file, setFile] = useState(null);
    const [docName, setDocName] = useState('');

    const fetchData = useCallback(async () => {
        const uid = currentUser?.user_id || currentUser?.id;
        if (!uid) return;
        setLoading(true);
        try {
            // 1. Fetch Assigned Projects
            const projRes = await fetch(`${import.meta.env.VITE_API_URL}/api/professionals/${uid}/projects`);
            if (projRes.ok) {
                const projData = await projRes.json();
                setProjects(projData);
                if (projData.length > 0 && !activeProject) {
                    setActiveProject(projData[0]);
                }
            }

            // 2. Fetch My Submissions for active project (if any)
            if (activeProject) {
                const [progRes, docRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/api/site-progress/${activeProject.project_id}`),
                    fetch(`${import.meta.env.VITE_API_URL}/api/documents/project/${activeProject.project_id}`)
                ]);

                if (progRes.ok && docRes.ok) {
                    const progData = await progRes.json();
                    const docData = await docRes.json();

                    // Filter for only MY submissions
                    setSubmissions({
                        progress: progData.filter(p => p.updated_by === uid),
                        docs: docData.filter(d => d.uploaded_by === uid)
                    });
                }
            }
        } catch (err) {
            console.error('Error fetching professional work data:', err);
        } finally {
            setLoading(false);
        }
    }, [currentUser, activeProject]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!activeProject) return;
        const uid = currentUser?.user_id || currentUser?.id;

        setUploadLoading(true);
        const formData = new FormData();
        formData.append('project_id', activeProject.project_id);
        formData.append('updated_by', uid);

        try {
            if (uploadType === 'progress') {
                formData.append('note', note);
                if (file) formData.append('image', file);
                formData.append('alert_type', 'Work Update');

                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/site-progress`, {
                    method: 'POST',
                    body: formData
                });
                if (res.ok) alert("Progress update submitted for review!");
                else throw new Error("Failed to upload progress");
            } else {
                formData.append('uploaded_by', uid); // duplicate for docs API consistency
                formData.append('name', docName || file?.name);
                if (file) formData.append('file', file);

                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/documents`, {
                    method: 'POST',
                    body: formData
                });
                if (res.ok) alert("Document uploaded and pending review!");
                else throw new Error("Failed to upload document");
            }

            setIsUploadModalOpen(false);
            setFile(null);
            setNote('');
            setDocName('');
            fetchData();
        } catch (err) {
            alert(err.message);
        } finally {
            setUploadLoading(false);
        }
    };

    if (loading && projects.length === 0) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="w-12 h-12 border-4 border-[#A65D3B]/20 border-t-[#A65D3B] rounded-full animate-spin" />
            <p className="text-[#8C7B70] font-bold tracking-widest uppercase text-xs">Loading Project Data...</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Project Selector */}
            <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {projects.map(proj => (
                    <button
                        key={proj.project_id}
                        onClick={() => setActiveProject(proj)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${activeProject?.project_id === proj.project_id
                            ? 'bg-[#2A1F1D] text-white border-[#2A1F1D] shadow-lg shadow-[#2A1F1D]/20'
                            : 'bg-white text-[#8C7B70] border-[#E3DACD]/50 hover:border-[#C06842]'
                            }`}
                    >
                        {proj.name}
                    </button>
                ))}
                {projects.length === 0 && <p className="text-xs text-[#8C7B70] italic">No projects assigned yet.</p>}
            </div>

            {activeProject && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Action Cards */}
                    <div className="space-y-4">
                        <Card className="bg-[#2A1F1D] text-white overflow-hidden relative group cursor-pointer"
                            onClick={() => { setUploadType('progress'); setIsUploadModalOpen(true); }}>
                            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Camera size={60} />
                            </div>
                            <div className="relative z-10">
                                <h3 className="font-bold text-lg mb-1">Upload Progress</h3>
                                <p className="text-[#B8AFA5] text-xs">Share photos of your completed work</p>
                                <div className="mt-4 flex items-center gap-2 text-[#C06842] font-bold text-[10px] uppercase tracking-widest">
                                    Launch Interface <ChevronRight size={12} />
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-white border-[#E3DACD] hover:border-[#C06842] transition-colors cursor-pointer group"
                            onClick={() => { setUploadType('doc'); setIsUploadModalOpen(true); }}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-[#2A1F1D]">Technical Documents</h3>
                                    <p className="text-[#8C7B70] text-xs mt-1">Submit drawings, reports or specs</p>
                                </div>
                                <div className="w-12 h-12 bg-[#F9F7F2] rounded-xl flex items-center justify-center text-[#C06842] group-hover:bg-[#C06842] group-hover:text-white transition-colors">
                                    <FileText size={24} />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Submission History */}
                    <Card className="flex flex-col h-full bg-[#FDFCF8]/50">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-[#2A1F1D] font-serif uppercase text-xs tracking-widest">Recent Activity</h3>
                            <Clock size={16} className="text-[#8C7B70]" />
                        </div>
                        <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                            {[...submissions.progress, ...submissions.docs]
                                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                .map((sub, idx) => (
                                    <div key={idx} className="p-3 bg-white rounded-xl border border-[#E3DACD]/30 shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter border ${sub.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-100' :
                                                sub.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                                                    'bg-amber-50 text-amber-700 border-amber-100'
                                                }`}>
                                                {sub.status || 'Pending'}
                                            </span>
                                            <span className="text-[9px] text-[#B8AFA5] font-bold">{new Date(sub.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex gap-3">
                                            {sub.image_path ? (
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0 overflow-hidden border border-[#E3DACD]/30">
                                                    <img src={`${import.meta.env.VITE_API_URL}/${sub.image_path}`} alt="work" className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100">
                                                    <FileText size={20} />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-[#2A1F1D] truncate">{sub.name || sub.note}</p>
                                                {sub.status === 'Rejected' && sub.rejection_reason && (
                                                    <p className="text-[10px] text-red-600 font-bold mt-1 line-clamp-1 italic italic">
                                                        <AlertTriangle size={10} className="inline mr-1" /> "{sub.rejection_reason}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            {submissions.progress.length === 0 && submissions.docs.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center opacity-40 py-10">
                                    <Clock size={32} className="mb-2" />
                                    <p className="text-xs font-bold uppercase tracking-widest">No history found</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-[#2A1F1D]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg bg-white relative overflow-hidden animate-slide-up">
                        <div className="absolute top-0 right-0 p-4">
                            <button onClick={() => setIsUploadModalOpen(false)} className="text-[#8C7B70] hover:text-[#2A1F1D] p-2 hover:bg-[#F9F7F2] rounded-full transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <h2 className="text-2xl font-bold font-serif text-[#2A1F1D]">
                                {uploadType === 'progress' ? 'Step Progress Update' : 'Document Submission'}
                            </h2>
                            <p className="text-[#8C7B70] text-sm mt-1">
                                Project: <strong className="text-[#C06842]">{activeProject?.name}</strong>
                            </p>
                        </div>

                        <form onSubmit={handleFileUpload} className="space-y-6">
                            {uploadType === 'doc' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#8C7B70]">Document Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Revised Structural Layout"
                                        className="w-full px-4 py-3 bg-[#F9F7F2]/50 border border-[#E3DACD] rounded-xl focus:ring-2 focus:ring-[#C06842] focus:border-transparent outline-none transition-all text-sm"
                                        value={docName}
                                        onChange={(e) => setDocName(e.target.value)}
                                        required
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#8C7B70]">
                                    {uploadType === 'progress' ? 'Activity Description' : 'File Description (Optional)'}
                                </label>
                                <textarea
                                    placeholder={uploadType === 'progress' ? "Describe what was completed today..." : "Add any details or notes about this document..."}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-[#F9F7F2]/50 border border-[#E3DACD] rounded-xl focus:ring-2 focus:ring-[#C06842] focus:border-transparent outline-none transition-all text-sm resize-none"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    required={uploadType === 'progress'}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#8C7B70]">
                                    {uploadType === 'progress' ? 'Photographic Evidence' : 'Select File'}
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        className="hidden"
                                        id="project-file"
                                        onChange={(e) => setFile(e.target.files[0])}
                                        accept={uploadType === 'progress' ? "image/*" : ".pdf,.docx,.xlsx,.xls,.png,.jpg"}
                                        required
                                    />
                                    <label htmlFor="project-file" className="w-full flex flex-col items-center justify-center border-2 border-dashed border-[#E3DACD] rounded-2xl p-8 cursor-pointer hover:bg-[#F9F7F2] hover:border-[#C06842] transition-all group">
                                        {file ? (
                                            <div className="flex flex-col items-center">
                                                <div className="p-3 bg-green-50 rounded-full text-green-600 mb-2">
                                                    <CheckCircle size={24} />
                                                </div>
                                                <p className="text-sm font-bold text-[#2A1F1D]">{file.name}</p>
                                                <p className="text-[10px] text-[#8C7B70] mt-1 font-bold">{(file.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="p-4 bg-[#F9F7F2] rounded-full text-[#C06842] group-hover:scale-110 transition-transform mb-3">
                                                    <Upload size={32} />
                                                </div>
                                                <p className="text-sm font-bold text-[#2A1F1D]">
                                                    {uploadType === 'progress' ? 'Tap to take photo' : 'Drag & Drop File'}
                                                </p>
                                                <p className="text-[10px] text-[#8C7B70] mt-1 uppercase tracking-tighter">Max file size: 10MB</p>
                                            </>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={uploadLoading || !file}
                                className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all shadow-xl ${uploadLoading || !file
                                    ? 'bg-[#B8AFA5] text-[#FDFCF8] cursor-not-allowed'
                                    : 'bg-[#C06842] text-white hover:bg-[#2A1F1D] hover:scale-[1.02] active:scale-95 shadow-[#C06842]/20'
                                    }`}
                            >
                                {uploadLoading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <><Upload size={16} /> Submit for Review</>
                                )}
                            </button>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default ProjectWorkManager;
