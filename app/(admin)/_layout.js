import { Stack } from 'expo-router';

export default function AdminLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="gardenerApplications" />
            <Stack.Screen name="leadUnlockRequests" />
            <Stack.Screen name="submitBookingForCustomer" />
            <Stack.Screen name="helpboxRequests" />
            <Stack.Screen name="helpboxDetail" />
            <Stack.Screen name="partnershipApplications" />
            <Stack.Screen name="sendNotification" />
            <Stack.Screen name="popupBanner" />
            <Stack.Screen name="bookings" />
            <Stack.Screen name="superAdminHistory" />
            <Stack.Screen name="userManagement" />
            <Stack.Screen name="changePin" />
        </Stack>
    );
}
