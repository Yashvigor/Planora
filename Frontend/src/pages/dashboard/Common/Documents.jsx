import React, { useState, useEffect } from 'react';
import { useMockApp } from '../../../hooks/useMockApp';
import { Upload, FileText, CheckCircle, Clock, AlertTriangle, X, Download, Trash2 } from 'lucide-react';

const Documents = () => {
    const { currentUser } = useMockApp();
    const [realDocs, setRealDocs] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    // Fetch projects and docs on mount
    useEffect(() => {
        if (currentUser?.id) {
            fetchProjects();
        }
    }, [currentUser]);

    useEffect(() => {
        if (selectedProjectId) {
            fetchDocuments(selectedProjectId);
        }
    }, [selectedProjectId]);

    const fetchProjects = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/projects/user/${currentUser.id}`);
            const data = await res.json();
            setProjects(data);
            if (data.length > 0) {
                setSelectedProjectId(data[0].project_id);
            }
        } catch (err) {
            console.error('Error fetching projects:', err);
        }
    };

    const fetchDocuments = async (projectId) => {
        try {
            const res = await fetch(`http://localhost:5000/api/documents/project/${projectId}`);
            const data = await res.json();
            setRealDocs(data);
        } catch (err) {
            console.error('Error fetching documents:', err);
        }
    };

    const handleDelete = async (docId) => {
        if (!window.confirm('Are you sure you want to delete this document?')) return;
        try {
            const res = await fetch(`http://localhost:5000/api/documents/${docId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchDocuments(selectedProjectId);
            } else {
                alert('Failed to delete document');
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const handleFile = async (file) => {
        if (!file || !selectedProjectId) {
            if (!selectedProjectId) alert('Please select a project first!');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('project_id', selectedProjectId);
        formData.append('uploaded_by', currentUser.id);
        formData.append('name', file.name);
        formData.append('category', currentUser.sub_category || currentUser.category || 'General');

        try {
            // Simulated progress because fetch doesn't support it natively without XHR
            const interval = setInterval(() => setProgress(p => p < 90 ? p + 10 : p), 200);

            const res = await fetch('http://localhost:5000/api/documents', {
                method: 'POST',
                body: formData,
            });

            clearInterval(interval);
            if (res.ok) {
                setProgress(100);
                setTimeout(() => {
                    setUploading(false);
                    setProgress(0);
                    fetchDocuments(selectedProjectId);
                }, 500);
            } else {
                throw new Error('Upload failed');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setUploading(false);
            alert('Failed to upload document');
        }
    };

    return (
        <div className="space-y-8 animate-fade-in font-sans text-[#2A1F1D]">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-serif font-bold text-[#2A1F1D]">My Documents</h1>
                <p className="text-[#8C7B70] mt-2 font-medium text-lg">Manage your project files, drawings, and verified certificates.</p>
            </div>

            {/* Upload Area */}
            <div
                className={`border-3 border-dashed rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center transition-all duration-300 ${isDragging ? 'border-[#C06842] bg-[#C06842]/5 scale-[1.02] shadow-xl' : 'border-[#E3DACD] bg-[#FDFCF8] hover:border-[#C06842]/50 hover:bg-[#F9F7F2]'
                    }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files[0];
                    handleFile(file);
                }}
            >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors ${isDragging ? 'bg-[#C06842] text-white' : 'bg-[#F9F7F2] text-[#C06842]'}`}>
                    <Upload size={32} strokeWidth={2} />
                </div>
                <h3 className="text-2xl font-bold font-serif text-[#2A1F1D] mb-2">Upload Files</h3>
                <p className="text-[#8C7B70] font-medium mb-8 max-w-sm">
                    Drag & drop your architectural drawings, approvals, or invoices here.
                    <br /><span className="text-xs uppercase tracking-widest font-bold mt-2 block opacity-70">Supported: PDF, JPG, PNG</span>
                </p>
                <label className="bg-[#2A1F1D] text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-[#2A1F1D]/20 hover:shadow-[#C06842]/30 hover:bg-[#C06842] transition-all cursor-pointer active:scale-95">
                    Browse Files
                    <input type="file" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
                </label>

                {uploading && (
                    <div className="w-full max-w-md mt-10 animate-fade-in">
                        <div className="flex justify-between text-xs font-bold text-[#8C7B70] mb-2 uppercase tracking-wider">
                            <span>Uploading...</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 bg-[#E3DACD] rounded-full overflow-hidden">
                            <div className="h-full bg-[#C06842] transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Documents Grid */}
            <div>
                <h2 className="text-2xl font-bold font-serif text-[#2A1F1D] mb-8 flex items-center gap-3">
                    <FileText size={24} className="text-[#C06842]" /> Received & Uploaded
                </h2>
                {realDocs.length === 0 ? (
                    <div className="glass-card rounded-[2rem] p-12 text-center text-[#8C7B70] border border-[#E3DACD] bg-[#F9F7F2]/50">
                        <FileText size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="font-bold text-lg">No documents found.</p>
                        {projects.length === 0 ? (
                            <p className="text-sm mt-1">You need to create a project first to upload documents.</p>
                        ) : (
                            <p className="text-sm mt-1">Upload one above to get started.</p>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {realDocs.map(doc => (
                            <div key={doc.doc_id} className="glass-card p-6 rounded-[2rem] border border-[#E3DACD]/50 shadow-sm hover:shadow-xl hover:border-[#C06842]/30 transition-all group relative flex flex-col h-full bg-white/60">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="bg-[#F9F7F2] p-4 rounded-2xl text-[#C06842] border border-[#E3DACD]/30 group-hover:bg-[#2A1F1D] group-hover:text-white transition-colors duration-300">
                                        <FileText size={28} strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        {doc.status === 'Approved' && <span className="bg-green-50 text-green-700 border border-green-100 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1.5"><CheckCircle size={12} />Verified</span>}
                                        {doc.status === 'Pending' && <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1.5"><Clock size={12} />Review</span>}
                                        {doc.status === 'Rejected' && <span className="bg-red-50 text-red-700 border border-red-100 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1.5"><AlertTriangle size={12} />Action</span>}
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <h4 className="font-bold text-lg text-[#2A1F1D] mb-1 leading-tight group-hover:text-[#C06842] transition-colors">{doc.name}</h4>
                                    <p className="text-xs text-[#8C7B70] font-bold uppercase tracking-wider mt-2 bg-[#F9F7F2] w-fit px-2 py-1 rounded-md">{doc.file_size} • {new Date(doc.created_at).toLocaleDateString()}</p>
                                </div>

                                <div className="pt-6 mt-6 border-t border-[#E3DACD]/50 flex flex-col gap-3">
                                    <div className="flex justify-between items-center gap-4">
                                        <a
                                            href={`http://localhost:5000/${doc.file_path}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-white bg-[#2A1F1D] hover:bg-[#C06842] py-2.5 rounded-xl transition-all shadow-md"
                                        >
                                            <Download size={16} /> View/Download
                                        </a>
                                        <button
                                            onClick={() => handleDelete(doc.doc_id)}
                                            className="p-2.5 text-[#8C7B70] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100" title="Remove">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    {doc.status === 'Pending' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const res = await fetch(`http://localhost:5000/api/documents/${doc.doc_id}/status`, {
                                                            method: 'PUT',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ status: 'Approved' })
                                                        });
                                                        if (res.ok) fetchProjects(); // Refresh everything
                                                    } catch (err) { alert(err.message); }
                                                }}
                                                className="flex-1 py-2 bg-green-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-green-700 transition-colors shadow-sm"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const res = await fetch(`http://localhost:5000/api/documents/${doc.doc_id}/status`, {
                                                            method: 'PUT',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ status: 'Rejected' })
                                                        });
                                                        if (res.ok) fetchProjects();
                                                    } catch (err) { alert(err.message); }
                                                }}
                                                className="flex-1 py-2 bg-white text-red-600 border border-red-100 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 transition-colors"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Documents;
