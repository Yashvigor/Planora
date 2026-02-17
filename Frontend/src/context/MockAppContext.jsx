import React, { createContext, useContext, useState, useEffect } from 'react';

const MockAppContext = createContext();

export { MockAppContext };

export const MockAppProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem('planora_current_user');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (error) {
            console.error("Failed to parse user from local storage", error);
            return null;
        }
    });

    const [users, setUsers] = useState(() => {
        try {
            const savedUsers = localStorage.getItem('planora_users');
            return savedUsers ? JSON.parse(savedUsers) : [];
        } catch (error) {
            console.error("Failed to parse users from local storage", error);
            return [];
        }
    });

    const [lands, setLands] = useState([
        { id: 1, ownerId: 'user_1', name: 'Green Valley Plot', location: 'Austin, TX', area: '5000 sqft', type: 'Residential', documents: [] },
    ]);

    const [projects, setProjects] = useState([]);

    const [professionals, setProfessionals] = useState([
        { id: 'p1', name: 'John Builder', role: 'contractor', rating: 4.8, distance: '2.5 km', avatar: '👷', email: 'john@builder.com' },
        { id: 'p2', name: 'Sarah Architect', role: 'architect', rating: 4.9, distance: '5.0 km', avatar: '👩‍🎨', email: 'sarah@design.com' },
        { id: 'p3', name: 'Mike Engineer', role: 'engineer', rating: 4.7, distance: '3.2 km', avatar: '👷‍♂️', email: 'mike@engineer.com' },
        { id: 'p4', name: 'Elite Designs', role: 'designer', rating: 4.9, distance: '1.2 km', avatar: '🎨', email: 'elite@design.com' },
    ]);

    const [documents, setDocuments] = useState(() => {
        try {
            const savedDocs = localStorage.getItem('planora_documents');
            return savedDocs ? JSON.parse(savedDocs) : [];
        } catch (error) {
            console.error("Failed to parse documents from local storage", error);
            return [];
        }
    });

    const [messages, setMessages] = useState(() => {
        try {
            const savedMessages = localStorage.getItem('planora_messages');
            return savedMessages ? JSON.parse(savedMessages) : [];
        } catch (error) {
            console.error("Failed to parse messages from local storage", error);
            return [];
        }
    });

    // --- EFFECT: Fetch Real Data ---
    useEffect(() => {
        if (currentUser) {
            const uid = currentUser.user_id || currentUser.id;
            fetch(`${import.meta.env.VITE_API_URL}/api/projects/user/${uid}`)
                .then(res => res.json())
                .then(data => setProjects(data))
                .catch(err => console.error("Error fetching projects:", err));
        }
    }, [currentUser]);

    const [siteProgress, setSiteProgress] = useState(() => {
        try {
            const savedProgress = localStorage.getItem('planora_site_progress');
            return savedProgress ? JSON.parse(savedProgress) : [];
        } catch (error) {
            console.error("Failed to parse site progress from local storage", error);
            return [];
        }
    });

    // --- EFFECT: Persist Data ---
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
            localStorage.removeItem('planora_current_user');
        }
    }, [currentUser]);


    // --- ACTIONS ---

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

    const setAuthUser = (user) => {
        setCurrentUser(user);
        // Ensure user is in the local list for consistency if needed, 
        // but primarily set the current user session.
        if (!users.find(u => u.email === user.email)) {
            setUsers(prev => [...prev, { ...user, id: user.user_id || user.id || `user_${Date.now()}` }]);
        }
    };

    const logout = () => {
        setCurrentUser(null);
        setProjects([]);
    };

    const addLand = (landData) => {
        const newLand = { ...landData, id: Date.now(), ownerId: currentUser.id || currentUser.user_id };
        setLands([...lands, newLand]);
    };

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
            // Fallback for UI responsiveness if needed
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
        lands,
        projects,
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
        addSiteProgress
    };

    return (
        <MockAppContext.Provider value={value}>
            {children}
        </MockAppContext.Provider>
    );
};
