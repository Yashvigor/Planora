import React, { useState, useEffect } from 'react';
// import { useMockApp } from '../../../hooks/useMockApp';
import { Calendar, Briefcase, ChevronRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyProjects = () => {
    // const { projects, lands, addProject } = useMockApp(); // Removed
    const [projects, setProjects] = useState([]);
    const [lands, setLands] = useState([]);
    const [loading, setLoading] = useState(true);

    const [view, setView] = useState('list'); // 'list' or 'create'
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        landId: '',
        type: 'House',
        budget: '',
        description: ''
    });

    const storedUser = localStorage.getItem('planora_current_user') || localStorage.getItem('user');
    const userData = storedUser ? JSON.parse(storedUser) : null;
    const userId = userData ? (userData.user_id || userData.id) : null;

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            if (!userId) return;
            try {
                const [projectsRes, landsRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/api/projects/user/${userId}`),
                    fetch(`${import.meta.env.VITE_API_URL}/api/lands/user/${userId}`)
                ]);

                if (projectsRes.ok) {
                    const pData = await projectsRes.json();
                    setProjects(pData);
                }
                if (landsRes.ok) {
                    const lData = await landsRes.json();
                    setLands(lData);
                }
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [userId]);

    const handleCreateSubmit = async () => {
        if (!userId) {
            alert("Please log in.");
            return;
        }

        // Find selected land to get location
        const selectedLand = lands.find(l => l.land_id === formData.landId || l.id === formData.landId);
        const locationStr = selectedLand ? `${selectedLand.name}, ${selectedLand.location}` : "Unknown Location";

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    owner_id: userId,
                    name: formData.name,
                    type: formData.type,
                    description: formData.description,
                    budget: formData.budget,
                    location: locationStr
                }),
            });

            if (res.ok) {
                const newProject = await res.json();
                setProjects([newProject, ...projects]);
                setView('list');
                setStep(1);
                setFormData({ name: '', landId: '', type: 'House', budget: '', description: '' });
                alert("Project created successfully!");
            } else {
                alert("Failed to create project.");
            }
        } catch (err) {
            console.error("Error creating project:", err);
            alert("Error creating project.");
        }
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
                                        {lands.map(l => (
                                            <option key={l.land_id || l.id} value={l.land_id || l.id}>
                                                {l.name} ({l.location})
                                            </option>
                                        ))}
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

    // Fetch Team for a project
    const fetchTeam = async (projectId) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}/team`);
            if (res.ok) {
                const team = await res.json();
                return team;
            }
        } catch (err) {
            console.error("Error fetching team:", err);
        }
        return [];
    };

    // Component to display project team
    const ProjectCard = ({ project }) => {
        const [team, setTeam] = useState([]);
        const [showTeam, setShowTeam] = useState(false);

        useEffect(() => {
            if (showTeam && team.length === 0) {
                fetchTeam(project.project_id || project.id).then(setTeam);
            }
        }, [showTeam, project]);

        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="mb-4 md:mb-0">
                        <h3 className="text-xl font-bold text-gray-900">{project.name}</h3>
                        <div className="flex items-center text-gray-500 mt-2 space-x-6 text-sm">
                            <span className="flex items-center">
                                <Calendar size={14} className="mr-1" />
                                {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'Date N/A'}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs uppercase font-semibold tracking-wide">{project.type}</span>
                        </div>
                        <p className="text-gray-600 mt-2 line-clamp-1">{project.description}</p>
                    </div>

                    <div className="flex items-center space-x-3">
                        <div className="text-right mr-4 hidden md:block">
                            <span className="block text-xs text-gray-400 uppercase">Status</span>
                            <span className="font-semibold text-blue-600">{project.status}</span>
                        </div>
                        <button
                            onClick={() => setShowTeam(!showTeam)}
                            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
                        >
                            {showTeam ? 'Hide Team' : 'View Team'}
                        </button>
                    </div>
                </div>

                {/* Team Section */}
                {showTeam && (
                    <div className="mt-6 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                        <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Assigned Professionals</h4>

                        {team.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {team.map(member => (
                                    <div key={member.user_id} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs mr-3">
                                            {member.name?.[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                                            <p className="text-xs text-gray-500">{member.assigned_role}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                <p className="text-sm text-gray-500">No professionals assigned yet.</p>
                                <Link to="/dashboard/find-pros" className="text-blue-600 text-xs font-semibold hover:underline mt-1 block">
                                    Find Professionals
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

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
                    <ProjectCard key={project.project_id || project.id} project={project} />
                ))}

                {!loading && projects.length === 0 && (
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
