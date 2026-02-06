import React, { useState } from 'react';
import { useMockApp } from '../../../hooks/useMockApp';
import { Calendar, Briefcase, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyProjects = () => {
    const { projects, lands, addProject } = useMockApp();
    const [view, setView] = useState('list'); // 'list' or 'create'
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        landId: '',
        type: 'House',
        budget: '',
        description: ''
    });

    const handleCreateSubmit = () => {
        addProject(formData);
        setView('list');
        setStep(1);
        setFormData({ name: '', landId: '', type: 'House', budget: '', description: '' });
    };

    if (view === 'create') {
        return (
            <div className="max-w-3xl mx-auto">
                <button onClick={() => setView('list')} className="mb-6 text-gray-500 hover:text-gray-800">
                    &larr; Back to Projects
                </button>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-gray-900 text-white p-6">
                        <h2 className="text-2xl font-bold">Create New Project</h2>
                        <p className="opacity-80">Step {step} of 2</p>
                    </div>

                    <div className="p-8">
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                <div>
                                    <label className="block font-medium text-gray-700 mb-2">Project Name</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Dream Villa Construction"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700 mb-2">Select Land</label>
                                    <select
                                        className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.landId}
                                        onChange={e => setFormData({ ...formData, landId: e.target.value })}
                                    >
                                        <option value="">-- Choose a land --</option>
                                        {lands.map(l => <option key={l.id} value={l.id}>{l.name} ({l.location})</option>)}
                                    </select>
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        disabled={!formData.name || !formData.landId}
                                        onClick={() => setStep(2)}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                        Next Step <ChevronRight size={18} className="ml-2" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-medium text-gray-700 mb-2">Project Type</label>
                                        <select
                                            className="w-full p-3 border rounded-lg"
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        >
                                            <option>House</option>
                                            <option>Apartment</option>
                                            <option>Commercial Complex</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block font-medium text-gray-700 mb-2">Est. Budget</label>
                                        <input
                                            type="text"
                                            className="w-full p-3 border rounded-lg"
                                            placeholder="$500,000"
                                            value={formData.budget}
                                            onChange={e => setFormData({ ...formData, budget: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700 mb-2">Description</label>
                                    <textarea
                                        className="w-full p-3 border rounded-lg h-32"
                                        placeholder="Describe your vision..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    ></textarea>
                                </div>

                                <div className="flex justify-between">
                                    <button onClick={() => setStep(1)} className="text-gray-600 hover:underline">Back</button>
                                    <button
                                        onClick={handleCreateSubmit}
                                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                                    >
                                        <Check size={18} className="mr-2" /> Create Project
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
                <button
                    onClick={() => setView('create')}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-600/30"
                >
                    <Briefcase className="w-5 h-5 mr-2" /> Start New Project
                </button>
            </div>

            <div className="grid gap-6">
                {projects.map(project => (
                    <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between hover:shadow-md transition-all">
                        <div className="mb-4 md:mb-0">
                            <h3 className="text-xl font-bold text-gray-900">{project.name}</h3>
                            <div className="flex items-center text-gray-500 mt-2 space-x-6 text-sm">
                                <span className="flex items-center"><Calendar size={14} className="mr-1" /> {new Date(project.id).toLocaleDateString()}</span>
                                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs uppercase font-semibold tracking-wide">{project.type}</span>
                            </div>
                            <p className="text-gray-600 mt-2 line-clamp-1">{project.description}</p>
                        </div>

                        <div className="flex items-center space-x-3">
                            <div className="text-right mr-4 hidden md:block">
                                <span className="block text-xs text-gray-400 uppercase">Status</span>
                                <span className="font-semibold text-blue-600">{project.status}</span>
                            </div>
                            <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">Manage</button>
                        </div>
                    </div>
                ))}

                {projects.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                        <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No projects yet</h3>
                        <p className="text-gray-500 mb-6">Create your first construction project to get started.</p>
                        <button onClick={() => setView('create')} className="text-blue-600 font-medium hover:underline">Create Project now</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyProjects;
