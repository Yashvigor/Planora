import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, MessageSquare } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            removeToast(id);
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const value = { showToast, removeToast };

    return (
        <ToastContext.Provider value={value}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-24 right-6 z-[100] flex flex-col space-y-3 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

const ToastItem = ({ toast, onClose }) => {
    const variants = {
        initial: { opacity: 0, x: 50, scale: 0.9 },
        animate: { opacity: 1, x: 0, scale: 1 },
        exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
    };

    const styles = {
        success: { bg: 'bg-green-50', border: 'border-green-200', icon: <CheckCircle className="text-green-600" size={20} />, title: 'Success' },
        error: { bg: 'bg-red-50', border: 'border-red-200', icon: <AlertCircle className="text-red-600" size={20} />, title: 'Error' },
        info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: <Info className="text-blue-600" size={20} />, title: 'Info' },
        message: { bg: 'bg-white', border: 'border-[#D4C5B5]', icon: <MessageSquare className="text-[#A65D3B]" size={20} />, title: 'New Message' },
    };

    const style = styles[toast.type] || styles.info;

    return (
        <motion.div
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`pointer-events-auto w-80 p-4 rounded-xl border shadow-xl backdrop-blur-md flex items-start gap-3 ${style.bg} ${style.border}`}
        >
            <div className={`p-2 rounded-full bg-white/50`}>
                {style.icon}
            </div>
            <div className="flex-1">
                <h4 className={`text-sm font-bold opacity-90 text-[#2C2420]`}>{style.title}</h4>
                <p className="text-xs text-[#5D4037] mt-1 leading-relaxed opacity-80">{toast.message}</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                <X size={14} />
            </button>
        </motion.div>
    );
};
