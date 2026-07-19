import Ionicons from '@expo/vector-icons/Ionicons'
import { Tabs } from 'expo-router'

const TabLayout = () => {
    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: '#245d5a',
            tabBarInactiveTintColor: '#a3a1a1',
            headerShown: false,
            tabBarItemStyle: {
                flex: 1
            }

        }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",

                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons size={24} color="black" name={focused ? 'home-outline' : 'home-outline'} />
                    )
                }}>
            </Tabs.Screen>
            <Tabs.Screen
                name="services"
                options={{
                    title: "Services",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons size={24} color="black" name={focused ? 'construct-outline' : 'construct-outline'} />
                    )
                }}
            />
            <Tabs.Screen
                name="book"
                options={{
                    title: "Book",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons size={24} color="black" name={focused ? 'add-circle-outline' : 'add-circle-outline'} />
                    )
                }}
            />
            <Tabs.Screen
                name="about"
                options={{
                    title: "About",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons size={24} color="black" name={focused ? 'information-circle-outline' : 'information-circle-outline'} />
                    )
                }}
            />
            <Tabs.Screen
                name="contact"
                options={{
                    title: "Contact",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons size={24} color="black" name={focused ? 'call-outline' : 'call-outline'} />
                    )
                }}
            />
            <Tabs.Screen
                name="faq"
                options={{
                    title: "Faq",
                    href: null
                }}
            />

            <Tabs.Screen
                name="notifications"
                options={{
                    title: "Notification",
                    href: null
                }}
            />

            <Tabs.Screen
                name="joinasaprofessional"
                options={{
                    title: "Join as a Professional",
                    href: null
                }}
            />

        </Tabs>
    )
}

export default TabLayout
