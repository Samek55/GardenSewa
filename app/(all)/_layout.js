import { Stack } from 'expo-router';

export default function AllLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false
            }}
        >
            <Stack.Screen
                name="faq"
                options={{
                    title: "Faq",
                    href: null
                }}
            />

            <Stack.Screen
                name="notifications"
                options={{
                    title: "Notification",
                    href: null
                }}
            />

            <Stack.Screen
                name="joinasaprofessional"
                options={{
                    title: "Join as a Professional",
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
                name="becomeAPartner"
                options={{
                    title: "Become a Partner",
                    href: null
                }}
            />
            <Stack.Screen
                name="glossary"
                options={{
                    title: "Glossary",
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
                name="favorites"
                options={{
                    title: "Favorites",
                    href: null
                }}
            />
        </Stack>
    );
}