import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { OneSignal } from 'react-native-onesignal';

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

    const adminLoginSuccess = async ({ sessionToken, role, displayName, phone }) => {
        setIsAdminLoggedIn(true);
        setAdminRole(role);
        setAdminDisplayName(displayName);

        await AsyncStorage.setItem('adminSessionToken', sessionToken);
        await AsyncStorage.setItem('adminRole', role);
        await AsyncStorage.setItem('adminDisplayName', displayName || '');

        // Associates this device with the admin's phone (OneSignal external_id) so
        // send-notification can target them directly — see its 'gardener-application-
        // received' purpose, which looks up admin phones by role and pushes via
        // include_aliases rather than a broad tag filter.
        if (Platform.OS !== 'web' && phone) {
            OneSignal.login(phone);
            OneSignal.User.addTag('role', role);
        }
    };

    const adminLogoutLocal = async () => {
        setIsAdminLoggedIn(false);
        setAdminRole(null);
        setAdminDisplayName(null);

        await AsyncStorage.multiRemove(['adminSessionToken', 'adminRole', 'adminDisplayName']);

        if (Platform.OS !== 'web') {
            OneSignal.logout();
        }
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
