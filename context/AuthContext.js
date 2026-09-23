import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useEffect, useState } from 'react';
import { invokeEdgeFunction } from '../api/functionsClient';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadAuthState = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('@auth_user');

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

    // sessionToken is the token customer-login mints after a real OTP check
    // (see 0029_customer_sessions.sql) — stored under the key
    // api/functionsClient.js reads for requireCustomerSession calls, so
    // list-my-bookings/submit-rating/send-booking-message/list-booking-messages
    // can verify this customer's identity server-side instead of trusting
    // whatever phone the client claims.
    const login = async (userData, sessionToken) => {
        try {
            setUser(userData);
            setIsLoggedIn(true);

            await AsyncStorage.setItem('@auth_user', JSON.stringify(userData));
            if (sessionToken) await AsyncStorage.setItem('customerSessionToken', sessionToken);
        } catch (error) {
            console.error('Failed to save auth state:', error);
        }
    };

    const logout = async () => {
        try {
            setUser(null);
            setIsLoggedIn(false);

            // Best-effort — actually revokes the token server-side, but a
            // failed call (offline, etc.) shouldn't block logging out locally.
            invokeEdgeFunction('customer-logout', {}, 'Logout failed', { requireCustomerSession: true }).catch(() => { });

            await AsyncStorage.removeItem('@auth_user');
            await AsyncStorage.removeItem('customerSessionToken');
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