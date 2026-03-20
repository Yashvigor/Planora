import { useCallback } from 'react';

const useAuthValidation = () => {
    const validateEmail = useCallback((email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }, []);

    const checkPasswordStrength = useCallback((password) => {
        if (!password || password.length < 6) return 'Too Short';

        const hasLetters = /[a-zA-Z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);

        if (password.length >= 8 && hasUpper && hasLower && hasNumbers && hasSpecial) {
            return 'Strong';
        } else if (password.length >= 6 && hasLetters && hasNumbers) {
            return 'Medium';
        } else {
            return 'Easy';
        }
    }, []);

    const validateLogin = useCallback((email, password) => {
        if (!validateEmail(email)) return 'Please enter a valid email address.';
        if (!password) return 'Password is required.';
        return null; // No error
    }, [validateEmail]);

    const validateSignup = useCallback((formData) => {
        if (!validateEmail(formData.email)) return 'Please enter a valid email address.';
        if (formData.password !== formData.confirmPassword) return 'Passwords do not match.';

        const strength = checkPasswordStrength(formData.password);
        if (strength === 'Too Short') return 'Password must be at least 6 characters.';

        return null; // No error
    }, [validateEmail, checkPasswordStrength]);

    return {
        validateEmail,
        checkPasswordStrength,
        validateLogin,
        validateSignup
    };
};

export default useAuthValidation;
