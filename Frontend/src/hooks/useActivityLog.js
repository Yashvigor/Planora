import { useState, useEffect } from 'react';

const STORAGE_KEY = 'user_activity_log';

export const useActivityLog = () => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setHistory(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse activity log", e);
                setHistory([]);
            }
        }
    }, []);

    const logAction = (action, details = '') => {
        const newEntry = {
            id: Date.now(),
            action,
            details,
            timestamp: new Date().toISOString()
        };

        setHistory(prev => {
            const updated = [newEntry, ...prev];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    const clearHistory = () => {
        localStorage.removeItem(STORAGE_KEY);
        setHistory([]);
    };

    return { history, logAction, clearHistory };
};
