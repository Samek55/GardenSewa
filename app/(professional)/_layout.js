import { Stack } from 'expo-router';

export default function ProfessionalLayout() {
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
            <Stack.Screen 
                name="updateProfile" 
                options={{ 
                    title: 'Update Profile' 
                }} 
            />
        
        </Stack>
    );
}