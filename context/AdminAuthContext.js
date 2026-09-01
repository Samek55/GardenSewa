import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useEffect, useState } from 'react';

export const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
    const [adminRole, setAdminRole] = useState(null);
    const [adminDisplayName, setAdminDisplayName] = useState(null);
    const [isAdminAuthLoading, setIsAdminAuthLoading] = useState(true);

    useEffect(() => {
        const loadAdminAuthState = async () => {
            try {
                const token = await AsyncStorage.getItem('adminSessionToken');
                const role = await AsyncStorage.getItem('adminRole');
                const displayName = await AsyncStorage.getItem('adminDisplayName');

                if (token && role) {
                    setIsAdminLoggedIn(true);
                    setAdminRole(role);
                    setAdminDisplayName(displayName);
                }
            } catch (error) {
                console.error('Failed to load admin auth state:', error);
            } finally {
                setIsAdminAuthLoading(false);
            }
        };

        loadAdminAuthState();
    }, []);

    const adminLoginSuccess = async ({ sessionToken, role, displayName }) => {
        setIsAdminLoggedIn(true);
        setAdminRole(role);
        setAdminDisplayName(displayName);

        await AsyncStorage.setItem('adminSessionToken', sessionToken);
        await AsyncStorage.setItem('adminRole', role);
        await AsyncStorage.setItem('adminDisplayName', displayName || '');
    };

    const adminLogoutLocal = async () => {
        setIsAdminLoggedIn(false);
        setAdminRole(null);
        setAdminDisplayName(null);

        await AsyncStorage.multiRemove(['adminSessionToken', 'adminRole', 'adminDisplayName']);
    };

    return (
        <AdminAuthContext.Provider
            value={{
                isAdminLoggedIn,
                adminRole,
                adminDisplayName,
                isAdminAuthLoading,
                adminLoginSuccess,
                adminLogoutLocal,
            }}
        >
            {children}
        </AdminAuthContext.Provider>
    );
};
