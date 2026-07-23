import { Stack } from 'expo-router';


export default function ServicesLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    headerShown:false,
                    title: 'Services'
                }}
            />
            <Stack.Screen
                name="[id]"
                options={{
                    headerShown:false,
                    title: 'Service Details',
                }}
            />
        </Stack>
    );
}