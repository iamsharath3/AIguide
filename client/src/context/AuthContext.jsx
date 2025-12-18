import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            // In a real app, verify token with backend. For now, trust if exists.
            const savedUsername = localStorage.getItem('username');
            setUser({ username: savedUsername });
        }
        setLoading(false);
    }, [token]);

    const login = (newToken, username) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('username', username);
        setToken(newToken);
        setUser({ username });
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
