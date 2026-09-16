import { Stack } from 'expo-router';

export default function AllLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false
            }}
        >
            <Stack.Screen
                name="notifications"
                options={{
                    title: "Notification",
                    href: null
                }}
            />

            <Stack.Screen
                name="adminLogin"
                options={{
                    title: "Admin Login",
                    href: null
                }}
            />
            <Stack.Screen
                name="customerLogin"
                options={{
                    title: "Login",
                    href: null
                }}
            />
            <Stack.Screen
                name="terms"
                options={{
                    title: "Terms and Conditions",
                    href: null
                }}
            />
            <Stack.Screen
                name="phoneVerification"
                options={{
                    title: "Phone Verification",
                    href: null
                }}
            />
            <Stack.Screen
                name="resetPin"
                options={{
                    title: "Reset Pin",
                    href: null
                }}
            />
            <Stack.Screen
                name="updateProfile"
                options={{
                    title: "Update Profile",
                    href: null
                }}
            />
            <Stack.Screen
                name="myBookings"
                options={{
                    title: "My Bookings",
                    href: null
                }}
            />
            <Stack.Screen
                name="myBookingDetail"
                options={{
                    title: "Booking Details",
                    href: null
                }}
            />
        </Stack>
    );
}