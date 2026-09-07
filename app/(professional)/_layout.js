import { AdminAuthContext } from '@/context/AdminAuthContext';
import { router, Stack } from 'expo-router';
import { useContext, useEffect } from 'react';

// Was previously wide open to anyone regardless of login state, since no real
// gardener login existed to gate it against. Now that admin-login can return
// role: 'gardener' (see approve-gardener + admin-login), this guards the
// whole group behind an actual authenticated gardener session — anyone else
// gets bounced to login rather than seeing a logged-in-professional screen.
export default function ProfessionalLayout() {
    const { isAdminLoggedIn, adminRole, isAdminAuthLoading } = useContext(AdminAuthContext);

    useEffect(() => {
        if (isAdminAuthLoading) return;
        if (!isAdminLoggedIn || adminRole !== 'gardener') {
            router.replace('/adminLogin');
        }
    }, [isAdminAuthLoading, isAdminLoggedIn, adminRole]);

    if (isAdminAuthLoading || !isAdminLoggedIn || adminRole !== 'gardener') return null;

    return (
        <Stack
            screenOptions={{
                headerShown:false
            }}
        >
            <Stack.Screen
                name="booking"
                options={{
                    headerShown: false
                }}
            />
            {/* <Stack.Screen
                name="favorites"
                options={{
                    title: 'Favorite Services'
                }}
            /> */}
        </Stack>
    );
}
