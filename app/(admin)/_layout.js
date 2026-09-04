import { Stack } from 'expo-router';

export default function AdminLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="gardenerApplications" />
            <Stack.Screen name="manageStaff" />
            <Stack.Screen name="leadUnlockRequests" />
        </Stack>
    );
}
