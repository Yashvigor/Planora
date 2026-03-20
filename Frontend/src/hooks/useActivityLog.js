import { useState, useEffect } from 'react';

export const useActivityLog = (userId) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchHistory = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/activity-log/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setHistory(data);
            }
        } catch (error) {
            console.error("Failed to fetch activity log", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [userId]);

    const logAction = async (action, details = '', projectId = null) => {
        // Backend logging is handled in the API routes now, 
        // but we can refresh the local state after an action
        setTimeout(fetchHistory, 1000); 
    };

    const clearHistory = async () => {
        if (!userId) return;
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/activity-log/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                setHistory([]);
            } else {
                const data = await response.json();
                alert(data.error || "Failed to clear history");
            }
        } catch (error) {
            console.error("Failed to clear activity log", error);
        }
    };

    return { history, logAction, clearHistory, loading, refresh: fetchHistory };
};
