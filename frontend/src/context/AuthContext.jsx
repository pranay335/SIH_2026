import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user from localStorage on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('civicmind_user');
        const savedRole = localStorage.getItem('civicmind_role');
        if (savedUser && savedRole) {
            setUser(JSON.parse(savedUser));
            setRole(savedRole);
        }
        setLoading(false);
    }, []);

    const login = (userData, userRole) => {
        setUser(userData);
        setRole(userRole);
        localStorage.setItem('civicmind_user', JSON.stringify(userData));
        localStorage.setItem('civicmind_role', userRole);
    };

    const logout = () => {
        setUser(null);
        setRole(null);
        localStorage.removeItem('civicmind_user');
        localStorage.removeItem('civicmind_role');
    };

    const value = {
        user,
        role,
        loading,
        login,
        logout,
        isAuthenticated: !!user && !!role
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
