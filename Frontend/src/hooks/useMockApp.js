import { useContext } from 'react';
import { MockAppContext } from '../context/MockAppContext';

export const useMockApp = () => {
    const context = useContext(MockAppContext);
    if (!context) {
        throw new Error('useMockApp must be used within a MockAppProvider');
    }
    return context;
};
