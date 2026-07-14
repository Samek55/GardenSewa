import Ionicons from '@expo/vector-icons/Ionicons'
import { Tabs } from 'expo-router'

const TabLayout = () => {
    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: '#047754',
            tabBarInactiveTintColor: '#a3a1a1',
            headerShown: false

        }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",

                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons size={28} color="black" name={focused ? 'home-outline' : 'home-outline'} />
                    )
                }}>
            </Tabs.Screen>
            <Tabs.Screen
                name="services"
                options={{
                    title: "Services",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons size={28} color="black" name={focused ? 'construct-outline' : 'construct-outline'} />
                    )
                }}
            />
            <Tabs.Screen
                name="book"
                options={{
                    title: "Book",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons size={28} color="black" name={focused ? 'add-circle-outline' : 'add-circle-outline'} />
                    )
                }}
            />
            <Tabs.Screen
                name="about"
                options={{
                    title: "About",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons size={28} color="black" name={focused ? 'information-circle-outline' : 'information-circle-outline'} />
                    )
                }}
            />
            <Tabs.Screen
                name="contact"
                options={{
                    title: "Contact",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons size={28} color="black" name={focused ? 'call-outline' : 'call-outline'} />
                    )
                }}
            />


        </Tabs>
    )
}

export default TabLayout
