import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useEffect, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadAuthState = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('@auth_user');
                const storedToken = await AsyncStorage.getItem('@auth_token');

                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                    setIsLoggedIn(true);
                }
            } catch (error) {
                console.error('Failed to load auth state from storage:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadAuthState();
    }, []);

    const login = async (userData, token = 'dummy-auth-token') => {
        try {
            setUser(userData);
            setIsLoggedIn(true);

            await AsyncStorage.setItem('@auth_user', JSON.stringify(userData));
            await AsyncStorage.setItem('@auth_token', token);
        } catch (error) {
            console.error('Failed to save auth state:', error);
        }
    };

    const logout = async () => {
        try {
            setUser(null);
            setIsLoggedIn(false);

            await AsyncStorage.removeItem('@auth_user');
            await AsyncStorage.removeItem('@auth_token');
        } catch (error) {
            console.error('Failed to clear auth state:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                isLoggedIn,
                user,
                isLoading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};