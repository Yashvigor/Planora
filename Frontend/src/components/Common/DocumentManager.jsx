import React, { useState } from 'react';
import { useMockApp } from '../../hooks/useMockApp';
import { Upload, FileText, CheckCircle, Clock, AlertTriangle, Download, Trash2 } from 'lucide-react';

const DocumentManager = ({ title = "Documents", filterType = null, allowUpload = true, projectId = null, onUploadSuccess = null }) => {
    const { currentUser } = useMockApp();
    const [documents, setDocuments] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const fetchDocs = React.useCallback(async () => {
        if (!projectId) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/documents/project/${projectId}`);
            if (res.ok) {
                const data = await res.json();
                setDocuments(filterType ? data.filter(d => d.category === filterType) : data);
            }
        } catch (err) {
            console.error("Failed to fetch documents:", err);
        }
    }, [projectId, filterType]);

    React.useEffect(() => {
        fetchDocs();
    }, [fetchDocs]);

    const handleFile = async (file) => {
        if (!file || !projectId) {
            if (!projectId) alert("Please select a project first.");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('project_id', projectId);
        formData.append('uploaded_by', currentUser.user_id || currentUser.id);
        formData.append('category', filterType || 'General');
        formData.append('name', file.name);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/documents`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                fetchDocs();
                if (onUploadSuccess) onUploadSuccess();
                alert("File uploaded successfully!");
            } else {
                alert("Upload failed.");
            }
        } catch (err) {
            console.error("Upload error:", err);
            alert("An error occurred during upload.");
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    const handleDelete = async (docId) => {
        if (!window.confirm("Are you sure you want to delete this document?")) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/documents/${docId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchDocs();
            }
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in font-sans text-[#2A1F1D]">
            {/* Header */}
            <div>
                <h3 className="text-2xl font-serif font-bold text-[#2A1F1D]">{title}</h3>
            </div>

            {/* Upload Area */}
            {allowUpload && (
                <div
                    className={`border - 3 border - dashed rounded - [2rem] p - 8 flex flex - col items - center justify - center text - center transition - all duration - 300 ${isDragging ? 'border-[#C06842] bg-[#C06842]/5 scale-[1.01] shadow-xl' : 'border-[#E3DACD] bg-[#FDFCF8] hover:border-[#C06842]/50 hover:bg-[#F9F7F2]'
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
                    <div className={`w - 16 h - 16 rounded - full flex items - center justify - center mb - 4 transition - colors ${isDragging ? 'bg-[#C06842] text-white' : 'bg-[#F9F7F2] text-[#C06842]'}`}>
                        <Upload size={24} strokeWidth={2} />
                    </div>
                    <h4 className="text-lg font-bold font-serif text-[#2A1F1D] mb-1">Upload Files</h4>
                    <p className="text-[#8C7B70] text-sm font-medium mb-6 max-w-xs">
                        Drag & drop your files here.
                        <br /><span className="text-[10px] uppercase tracking-widest font-bold mt-1 block opacity-70">Supported: PDF, JPG, PNG</span>
                    </p>
                    <label className="bg-[#2A1F1D] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-[#C06842] transition-all cursor-pointer active:scale-95">
                        Browse Files
                        <input type="file" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
                    </label>

                    {uploading && (
                        <div className="w-full max-w-xs mt-6 animate-fade-in">
                            <div className="flex justify-between text-[10px] font-bold text-[#8C7B70] mb-1 uppercase tracking-wider">
                                <span>Uploading...</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="h-1.5 bg-[#E3DACD] rounded-full overflow-hidden">
                                <div className="h-full bg-[#C06842] transition-all duration-300 ease-out" style={{ width: `${progress} % ` }}></div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Documents Grid */}
            <div>
                {documents.length === 0 ? (
                    <div className="glass-card rounded-[2rem] p-8 text-center text-[#8C7B70] border border-[#E3DACD] bg-[#F9F7F2]/50">
                        <FileText size={32} className="mx-auto mb-3 opacity-20" />
                        <p className="font-bold">No documents found.</p>
                        {allowUpload && <p className="text-xs mt-1">Upload one above to get started.</p>}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {documents.map(doc => (
                            <div key={doc.doc_id || doc.id} className="glass-card p-5 rounded-[1.5rem] border border-[#E3DACD]/50 shadow-sm hover:shadow-lg hover:border-[#C06842]/30 transition-all group relative flex flex-col h-full bg-white/60">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-[#F9F7F2] p-3 rounded-xl text-[#C06842] border border-[#E3DACD]/30 group-hover:bg-[#2A1F1D] group-hover:text-white transition-colors duration-300">
                                        <FileText size={20} strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        {doc.status === 'Approved' && <span className="bg-green-50 text-green-700 border border-green-100 text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider flex items-center gap-1"><CheckCircle size={10} />Verified</span>}
                                        {doc.status === 'Pending' && <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider flex items-center gap-1"><Clock size={10} />Review</span>}
                                        {doc.status === 'Rejected' && <span className="bg-red-50 text-red-700 border border-red-100 text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider flex items-center gap-1"><AlertTriangle size={10} />Action</span>}
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <h4 className="font-bold text-base text-[#2A1F1D] mb-1 leading-tight group-hover:text-[#C06842] transition-colors truncate">{doc.name}</h4>
                                    <p className="text-[10px] text-[#8C7B70] font-bold uppercase tracking-wider mt-2 bg-[#F9F7F2] w-fit px-2 py-0.5 rounded-md">File Size Unknown • {new Date(doc.created_at).toLocaleDateString()}</p>
                                </div>

                                <div className="pt-4 mt-4 border-t border-[#E3DACD]/50 flex justify-between items-center gap-3">
                                    <a
                                        href={`${import.meta.env.VITE_API_URL}/${doc.file_path}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-[#2A1F1D] hover:bg-[#C06842] py-2 rounded-lg transition-all shadow-md"
                                    >
                                        <Download size={14} /> View/Download
                                    </a>
                                    <button
                                        onClick={() => handleDelete(doc.doc_id || doc.id)}
                                        className="p-2 text-[#8C7B70] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100" title="Remove">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentManager;
