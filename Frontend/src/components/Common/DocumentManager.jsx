import React, { useState } from 'react';
import { useMockApp } from '../../hooks/useMockApp';
import { Upload, FileText, CheckCircle, Clock, AlertTriangle, Download, Trash2 } from 'lucide-react';

const DocumentManager = ({ title = "Documents", filterType = null, allowUpload = true }) => {
    const { documents, uploadDocument, deleteDocument, currentUser } = useMockApp();
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    // Filter documents based on filterType (if provided) and user access
    // For now, we show documents uploaded by current user OR if they are relevant to the project
    // But per the original Documents.jsx, it filtered by uploadedBy === currentUser.email.
    // We will keep similar logic but maybe broaden it later.
    const myDocs = documents.filter(doc => {
        if (filterType && doc.type !== filterType) return false;
        return doc.uploadedBy === currentUser?.email;
    });

    const handleFile = (file) => {
        if (!file) return;
        setUploading(true);

        // Simulating upload progress
        let p = 0;
        const interval = setInterval(() => {
            p += Math.random() * 20;
            if (p > 100) {
                clearInterval(interval);
                // Actually "upload"
                uploadDocument({
                    name: file.name,
                    size: (file.size / 1024).toFixed(1) + ' KB',
                    type: filterType || 'User Upload',
                    uploadedBy: currentUser.email
                });
                setUploading(false);
                setProgress(0);
            } else {
                setProgress(p);
            }
        }, 300);
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
                    className={`border-3 border-dashed rounded-[2rem] p-8 flex flex-col items-center justify-center text-center transition-all duration-300 ${isDragging ? 'border-[#C06842] bg-[#C06842]/5 scale-[1.01] shadow-xl' : 'border-[#E3DACD] bg-[#FDFCF8] hover:border-[#C06842]/50 hover:bg-[#F9F7F2]'
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
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${isDragging ? 'bg-[#C06842] text-white' : 'bg-[#F9F7F2] text-[#C06842]'}`}>
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
                                <div className="h-full bg-[#C06842] transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Documents Grid */}
            <div>
                {myDocs.length === 0 ? (
                    <div className="glass-card rounded-[2rem] p-8 text-center text-[#8C7B70] border border-[#E3DACD] bg-[#F9F7F2]/50">
                        <FileText size={32} className="mx-auto mb-3 opacity-20" />
                        <p className="font-bold">No documents found.</p>
                        {allowUpload && <p className="text-xs mt-1">Upload one above to get started.</p>}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myDocs.map(doc => (
                            <div key={doc.id} className="glass-card p-5 rounded-[1.5rem] border border-[#E3DACD]/50 shadow-sm hover:shadow-lg hover:border-[#C06842]/30 transition-all group relative flex flex-col h-full bg-white/60">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-[#F9F7F2] p-3 rounded-xl text-[#C06842] border border-[#E3DACD]/30 group-hover:bg-[#2A1F1D] group-hover:text-white transition-colors duration-300">
                                        <FileText size={20} strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        {doc.status === 'Verified' && <span className="bg-green-50 text-green-700 border border-green-100 text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider flex items-center gap-1"><CheckCircle size={10} />Verified</span>}
                                        {doc.status === 'Pending' && <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider flex items-center gap-1"><Clock size={10} />Review</span>}
                                        {doc.status === 'Rejected' && <span className="bg-red-50 text-red-700 border border-red-100 text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider flex items-center gap-1"><AlertTriangle size={10} />Action</span>}
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <h4 className="font-bold text-base text-[#2A1F1D] mb-1 leading-tight group-hover:text-[#C06842] transition-colors truncate">{doc.name}</h4>
                                    <p className="text-[10px] text-[#8C7B70] font-bold uppercase tracking-wider mt-2 bg-[#F9F7F2] w-fit px-2 py-0.5 rounded-md">{doc.size || '350 KB'} • {doc.date}</p>
                                </div>

                                <div className="pt-4 mt-4 border-t border-[#E3DACD]/50 flex justify-between items-center gap-3">
                                    <button className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-[#2A1F1D] hover:bg-[#C06842] py-2 rounded-lg transition-all shadow-md">
                                        <Download size={14} /> Download
                                    </button>
                                    <button
                                        onClick={() => deleteDocument(doc.id)}
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
