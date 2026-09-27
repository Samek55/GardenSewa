import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { createContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { setAdminSessionEndedHandler } from '../api/functionsClient';
import { OneSignal } from '../lib/oneSignal';

export const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
    const [adminRole, setAdminRole] = useState(null);
    const [adminDisplayName, setAdminDisplayName] = useState(null);
    const [adminPhone, setAdminPhone] = useState(null);
    const [isAdminAuthLoading, setIsAdminAuthLoading] = useState(true);

    useEffect(() => {
        const loadAdminAuthState = async () => {
            try {
                const token = await AsyncStorage.getItem('adminSessionToken');
                const role = await AsyncStorage.getItem('adminRole');
                const displayName = await AsyncStorage.getItem('adminDisplayName');
                const phone = await AsyncStorage.getItem('adminPhone');

                if (token && role) {
                    setIsAdminLoggedIn(true);
                    setAdminRole(role);
                    setAdminDisplayName(displayName);
                    setAdminPhone(phone);
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
        setAdminPhone(phone || null);

        await AsyncStorage.setItem('adminSessionToken', sessionToken);
        await AsyncStorage.setItem('adminRole', role);
        await AsyncStorage.setItem('adminDisplayName', displayName || '');
        await AsyncStorage.setItem('adminPhone', phone || '');

        // Associates this device with the admin's phone (OneSignal external_id) so
        // send-notification can target them directly — see its 'gardener-application-
        // received' purpose, which looks up admin phones by role and pushes via
        // include_aliases rather than a broad tag filter.
        if (OneSignal && phone) {
            OneSignal.login(phone);
            OneSignal.User.addTag('role', role);
        }
    };

    // Called after Update Profile saves a new name, so the drawer's "logged in
    // as" line and anywhere else reading adminDisplayName reflect it without
    // requiring a re-login.
    const updateAdminDisplayName = async (displayName) => {
        setAdminDisplayName(displayName);
        await AsyncStorage.setItem('adminDisplayName', displayName || '');
    };

    const adminLogoutLocal = async () => {
        setIsAdminLoggedIn(false);
        setAdminRole(null);
        setAdminDisplayName(null);
        setAdminPhone(null);

        await AsyncStorage.multiRemove(['adminSessionToken', 'adminRole', 'adminDisplayName', 'adminPhone']);

        if (OneSignal) {
            OneSignal.logout();
        }
    };

    // The server has dropped this session — usually because a Super Admin
    // disabled the account. Signing back in shows why (admin-login's
    // "Account Disabled" message), so this just gets them there.
    useEffect(() => {
        setAdminSessionEndedHandler(async () => {
            await adminLogoutLocal();
            router.replace('/adminLogin');
            Alert.alert('Signed Out', 'Your session has ended. Please log in again.');
        });
        return () => setAdminSessionEndedHandler(null);
    }, []);

    return (
        <AdminAuthContext.Provider
            value={{
                isAdminLoggedIn,
                adminRole,
                adminDisplayName,
                adminPhone,
                isAdminAuthLoading,
                adminLoginSuccess,
                adminLogoutLocal,
                updateAdminDisplayName,
            }}
        >
            {children}
        </AdminAuthContext.Provider>
    );
};
