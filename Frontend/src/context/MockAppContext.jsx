import React, { createContext, useContext, useState, useEffect } from 'react';
import socket from '../utils/socket';

/**
 * 📦 Mock App Context
 * 
 * Provides global state management across the Planora frontend.
 * 
 * Architecture Note:
 * This context currently uses a *hybrid* approach for demonstration purposes:
 * 1. Auth & Projects: Fetched from the real PostgreSQL backend.
 * 2. Messages, Documents, Site Progress: Simulated using browser LocalStorage to avoid 
 *    requiring a fully deployed database for non-core features during prototyping.
 */

const MockAppContext = createContext();

export { MockAppContext };

export const MockAppProvider = ({ children }) => {
    // 👤 CURRENT USER STATE
    // Hydrated from LocalStorage on initial load to maintain session across refreshes.
    const [currentUser, setCurrentUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem('planora_current_user');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (error) {
            console.error("Failed to parse user from local storage", error);
            return null;
        }
    });

    // 👥 MOCK USERS DATABASE (LocalStorage fallback)
    const [users, setUsers] = useState(() => {
        try {
            const savedUsers = localStorage.getItem('planora_users');
            return savedUsers ? JSON.parse(savedUsers) : [];
        } catch (error) {
            console.error("Failed to parse users from local storage", error);
            return [];
        }
    });

    // 🏗️ REAL DATA (Fetched via API)
    const [projects, setProjects] = useState([]);
    const [lands, setLands] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [pendingTasksCount, setPendingTasksCount] = useState(0);
    const [loadingData, setLoadingData] = useState(false);

    // 👷 MOCK PROFESSIONALS (ExpertMap fallback if API fails)
    const [professionals, setProfessionals] = useState([
        { id: 'p1', name: 'John Builder', role: 'contractor', rating: 4.8, distance: '2.5 km', avatar: '👷', email: 'john@builder.com' },
        { id: 'p2', name: 'Sarah Architect', role: 'architect', rating: 4.9, distance: '5.0 km', avatar: '👩‍🎨', email: 'sarah@design.com' },
        { id: 'p3', name: 'Mike Engineer', role: 'engineer', rating: 4.7, distance: '3.2 km', avatar: '👷‍♂️', email: 'mike@engineer.com' },
        { id: 'p4', name: 'Elite Designs', role: 'designer', rating: 4.9, distance: '1.2 km', avatar: '🎨', email: 'elite@design.com' },
    ]);

    // 📄 MOCK DOCUMENTS (LocalStorage)
    const [documents, setDocuments] = useState(() => {
        try {
            const savedDocs = localStorage.getItem('planora_documents');
            return savedDocs ? JSON.parse(savedDocs) : [];
        } catch (error) {
            console.error("Failed to parse documents from local storage", error);
            return [];
        }
    });

    // 💬 MOCK MESSAGES (LocalStorage)
    const [messages, setMessages] = useState(() => {
        try {
            const savedMessages = localStorage.getItem('planora_messages');
            return savedMessages ? JSON.parse(savedMessages) : [];
        } catch (error) {
            console.error("Failed to parse messages from local storage", error);
            return [];
        }
    });

    // --- DATA FETCHING ACTIONS ---
    const refreshProjects = async (uid) => {
        const userId = uid || currentUser?.user_id || currentUser?.id;
        if (!userId) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/user/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
            }
        } catch (err) {
            console.error("Error refreshing projects:", err);
        }
    };

    const refreshLands = async (uid) => {
        const userId = uid || currentUser?.user_id || currentUser?.id;
        if (!userId) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/lands/user/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setLands(data);
            }
        } catch (err) {
            console.error("Error refreshing lands:", err);
        }
    };

    const refreshNotifications = async (uid) => {
        const userId = uid || currentUser?.user_id || currentUser?.id;
        if (!userId) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (err) {
            console.error("Error refreshing notifications:", err);
        }
    };

    const refreshPendingTasksCount = async (uid) => {
        const userId = uid || currentUser?.user_id || currentUser?.id;
        if (!userId) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/pending-count/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setPendingTasksCount(data.count || 0);
            }
        } catch (err) {
            console.error("Error refreshing task counts:", err);
        }
    };

    const refreshAllData = async (uid) => {
        const userId = uid || currentUser?.user_id || currentUser?.id;
        if (!userId) return;
        setLoadingData(true);
        await Promise.all([
            refreshProjects(userId), 
            refreshLands(userId), 
            refreshNotifications(userId),
            refreshPendingTasksCount(userId)
        ]);
        setLoadingData(false);
    };

    // --- EFFECTS: REAL DATA FETCHING ---
    useEffect(() => {
        if (currentUser) {
            const uid = currentUser.user_id || currentUser.id;
            refreshAllData(uid);

            // Socket connection for real-time updates - improved stability
            if (!socket.connected) {
                socket.connect();
            }
            socket.emit('join', uid); 

            const handleStatusChange = (data) => {
                setCurrentUser(prev => prev ? ({ 
                    ...prev, 
                    status: data.status, 
                    rejection_reason: data.reason || prev.rejection_reason 
                }) : null);
            };

            const handleProjectUpdate = () => refreshProjects(uid);
            const handleLandUpdate = () => refreshLands(uid);

            socket.on('account_status_changed', handleStatusChange);
            socket.on('new_notification', (noti) => {
                refreshNotifications(uid);
                if (noti.type?.includes('task') || noti.type?.includes('project')) {
                    refreshProjects(uid);
                    refreshPendingTasksCount(uid);
                }
            });

            const handleNotiRead = () => refreshNotifications(uid);
            window.addEventListener('planora_notification_read', handleNotiRead);

            return () => {
                socket.off('account_status_changed', handleStatusChange);
                socket.off('new_notification');
                window.removeEventListener('planora_notification_read', handleNotiRead);
            };
        } else {
            if (socket.connected) socket.disconnect();
            setProjects([]);
            setLands([]);
        }
    }, [currentUser?.user_id || currentUser?.id]);

    // 🚧 MOCK SITE PROGRESS (LocalStorage)
    const [siteProgress, setSiteProgress] = useState(() => {
        try {
            const savedProgress = localStorage.getItem('planora_site_progress');
            return savedProgress ? JSON.parse(savedProgress) : [];
        } catch (error) {
            console.error("Failed to parse site progress from local storage", error);
            return [];
        }
    });

    // --- EFFECTS: LOCAL STORAGE PERSISTENCE ---
    // Sync simulated state arrays back to the browser's LocalStorage automatically whenever they change.
    useEffect(() => {
        localStorage.setItem('planora_users', JSON.stringify(users));
    }, [users]);

    useEffect(() => {
        localStorage.setItem('planora_messages', JSON.stringify(messages));
    }, [messages]);

    useEffect(() => {
        localStorage.setItem('planora_site_progress', JSON.stringify(siteProgress));
    }, [siteProgress]);

    useEffect(() => {
        localStorage.setItem('planora_documents', JSON.stringify(documents));
    }, [documents]);

    useEffect(() => {
        if (currentUser) {
            localStorage.setItem('planora_current_user', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('planora_current_user'); // Clear session on logout
        }
    }, [currentUser]);


    // --- STATE MUTATION ACTIONS ---

    const signup = (userData) => {
        const cleanEmail = userData.email.trim();
        // Check if email already exists
        if (users.find(u => u.email === cleanEmail)) {
            throw new Error("User with this email already exists.");
        }

        const newUser = {
            id: `user_${Date.now()}`,
            ...userData, // name, email, password, role
            email: cleanEmail,
            createdAt: new Date().toISOString()
        };

        setUsers(prev => [...prev, newUser]);
        setCurrentUser(newUser); // Auto-login after signup
        return newUser;
    };

    const login = (email, password) => {
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) {
            throw new Error("Invalid email or password.");
        }
        setCurrentUser(user);
        return user;
    };

    /**
     * Auth Login Sync
     * Called by Auth.jsx AFTER a successful backend login to update the global session.
     */
     const setAuthUser = (userData) => {
        if (typeof userData === 'function') {
            setCurrentUser(prev => {
                const updated = userData(prev);
                if (updated && updated.email) {
                    setUsers(all => {
                        const idx = all.findIndex(u => u.email === updated.email);
                        if (idx === -1) return [...all, updated];
                        const next = [...all];
                        next[idx] = { ...next[idx], ...updated };
                        return next;
                    });
                }
                return updated;
            });
        } else {
            setCurrentUser(userData);
            if (userData && userData.email) {
                setUsers(prev => {
                    const idx = prev.findIndex(u => u.email === userData.email);
                    if (idx === -1) return [...prev, userData];
                    const next = [...prev];
                    next[idx] = { ...next[idx], ...userData };
                    return next;
                });
            }
        }
    };

    const logout = () => {
        setCurrentUser(null);
        setProjects([]);
        localStorage.removeItem('planora_token');
    };

    const addLand = (landData) => {
        const newLand = { ...landData, id: Date.now(), ownerId: currentUser.id || currentUser.user_id };
        setLands([...lands, newLand]);
    };

    /**
     * Create Real Project
     * Saves to the PostgreSQL backend first. If it succeeds, syncs the React state.
     * If networking fails, falls back to a temporary LocalStorage mock object to prevent UI freezing.
     */
    const addProject = async (projectData) => {
        const uid = currentUser.user_id || currentUser.id;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    owner_id: uid,
                    ...projectData,
                    status: 'Planning'
                })
            });
            if (res.ok) {
                const newProj = await res.json();
                setProjects(prev => [newProj, ...prev]);
                return newProj;
            }
        } catch (err) {
            console.error("Error creating project:", err);
            // Fallback for UI responsiveness if backend is unreachable during dev
            const fallbackProj = {
                ...projectData,
                id: Date.now(),
                status: 'Planning',
                ownerId: uid,
                assignedTo: []
            };
            setProjects([...projects, fallbackProj]);
        }
    };

    const updateProfile = (updatedData) => {
        if (!currentUser) return;

        const updatedUser = { ...currentUser, ...updatedData };

        // Update users array
        const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
        setUsers(updatedUsers);
        setCurrentUser(updatedUser);
    };

    const updatePassword = (currentPassword, newPassword) => {
        if (!currentUser) return;

        // Check current password
        if (currentUser.password !== currentPassword) {
            throw new Error("Incorrect current password.");
        }

        const updatedUser = { ...currentUser, password: newPassword };

        // Update users array
        const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
        setUsers(updatedUsers);
        setCurrentUser(updatedUser);
    };

    const sendMessage = (senderEmail, receiverEmail, text, projectId = null) => {
        const newMessage = {
            id: Date.now(),
            projectId,
            sender: senderEmail,
            receiver: receiverEmail, // Optional if project-wide
            text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: Date.now(),
            read: false
        };
        setMessages(prev => [...prev, newMessage]);
    };

    const markAsRead = (senderEmail) => {
        if (!currentUser) return;
        setMessages(prev => prev.map(msg =>
            (msg.sender === senderEmail && msg.receiver === currentUser.email && !msg.read)
                ? { ...msg, read: true }
                : msg
        ));
    };

    const addSiteProgress = (progressData) => {
        const newProgress = {
            id: `prog_${Date.now()}`,
            ...progressData,
            date: new Date().toLocaleDateString(),
            timestamp: Date.now()
        };
        setSiteProgress(prev => [newProgress, ...prev]);
        return newProgress;
    };

    const uploadDocument = (docData) => {
        const newDoc = {
            id: `doc_${Date.now()}`,
            ...docData,
            uploadedBy: currentUser?.email || 'Unknown',
            status: 'Pending',
            date: new Date().toLocaleDateString()
        };
        setDocuments(prev => [...prev, newDoc]);
        return newDoc;
    };

    const verifyDocument = (docId, status) => { // status: 'Verified' | 'Rejected'
        setDocuments(prev => prev.map(d =>
            d.id === docId ? { ...d, status, verifiedBy: currentUser?.email } : d
        ));
    };

    const deleteDocument = (docId) => {
        setDocuments(prev => prev.filter(d => d.id !== docId));
    };

    const value = {
        currentUser,
        users,
        projects,
        setProjects,
        lands,
        setLands,
        notifications,
        pendingTasksCount,
        loadingData,
        refreshProjects,
        refreshLands,
        refreshNotifications,
        refreshPendingTasksCount,
        refreshAllData,
        professionals,
        messages,
        documents,
        siteProgress,
        login,
        signup,
        setAuthUser,
        logout,
        addLand,
        addProject,
        updateProfile,
        updatePassword,
        sendMessage,
        markAsRead,
        uploadDocument,
        verifyDocument,
        deleteDocument,
        addSiteProgress,
        socket
    };

    return (
        <MockAppContext.Provider value={value}>
            {children}
        </MockAppContext.Provider>
    );
};
