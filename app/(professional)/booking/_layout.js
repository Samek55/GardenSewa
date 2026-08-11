import { Stack } from 'expo-router';

export default function BookingLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#235A55',
                },
                headerTintColor: '#FFF',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Stack.Screen 
                name="index" 
                options={{ 
                    headerShown:false
                }} 
            />
            <Stack.Screen 
                name="[id]" 
                options={{ 
                    headerShown:false
                }} 
            />
        </Stack>
    );
}