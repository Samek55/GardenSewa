import { listMyNotificationsAsCustomer, listMyNotificationsAsStaff } from '@/api/PostApiNotification';
import { AdminAuthContext } from '@/context/AdminAuthContext';
import { AuthContext } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useContext, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const formatDateTime = (iso) => {
    const d = new Date(iso);
    const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { date, time };
};

const NotificationsInbox = () => {
    const { isAdminLoggedIn, isAdminAuthLoading } = useContext(AdminAuthContext);
    const { user, isLoading: isCustomerAuthLoading } = useContext(AuthContext);

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            const result = isAdminLoggedIn
                ? await listMyNotificationsAsStaff()
                : await listMyNotificationsAsCustomer(user?.phone);
            if (result.success) setNotifications(result.notifications || []);
        } catch (error) {
            console.error('Could not load notifications:', error);
        }
    }, [isAdminLoggedIn, user?.phone]);

    useFocusEffect(
        useCallback(() => {
            if (isAdminAuthLoading || isCustomerAuthLoading) return;
            setLoading(true);
            load().finally(() => setLoading(false));
        }, [isAdminAuthLoading, isCustomerAuthLoading, load])
    );

    const handleRefresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

    const handlePress = (item) => {
        if (item.screen) router.push(item.screen);
    };

    return (
        <ScrollView
            style={styles.scrollview}
            contentContainerStyle={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
            <View style={styles.fullContainer}>
                <View style={styles.headerRow}>
                    <Text style={styles.pageHeader}>Notifications</Text>
                    <Ionicons name="notifications-outline" size={28} color="#1a1a1a" />
                </View>

                <Text style={styles.subHeaderText}>Garden Sewa Notifications</Text>

                {loading || isAdminAuthLoading || isCustomerAuthLoading ? (
                    <ActivityIndicator style={{ marginTop: 30 }} size="large" color="#245d5a" />
                ) : notifications.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-off-outline" size={36} color="#94A3B8" />
                        <Text style={styles.emptyText}>No notifications yet.</Text>
                    </View>
                ) : (
                    notifications.map((notification) => {
                        const { date, time } = formatDateTime(notification.created_at);
                        return (
                            <TouchableOpacity
                                key={notification.id}
                                style={styles.notificationCard}
                                activeOpacity={notification.screen ? 0.7 : 1}
                                onPress={() => handlePress(notification)}
                            >
                                <View style={styles.cardContent}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.notificationTitle}>{notification.title}</Text>
                                        <Text style={styles.notificationText}>{notification.body}</Text>
                                    </View>

                                    <View style={styles.dateTimeContainer}>
                                        <Text style={styles.dateTimeText}>{date}</Text>
                                        <Text style={styles.dateTimeText}>{time}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollview: {
        flex: 1,
        backgroundColor: '#ffffff'
    },
    container: {
        paddingHorizontal: 16,
        paddingVertical: 24
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    pageHeader: {
        fontSize: 32,
        color: '#1a1a1a',
        fontWeight: '700',
    },
    subHeaderText: {
        fontSize: 14,
        color: '#58677b',
        fontWeight: '400',
        marginBottom: 24
    },
    fullContainer: {
        width: '100%',
        gap: 12,
        paddingHorizontal: 8,
        borderRadius: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        gap: 10,
    },
    emptyText: {
        color: '#58677b',
        fontSize: 14,
    },
    notificationCard: {
        backgroundColor: '#f0f7f6',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2f0ee',
        paddingHorizontal: 16,
        paddingVertical: 16,
        minHeight: 60,
        justifyContent: 'center',
        shadowColor: '#1b4744',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 1,
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
    },
    notificationTitle: {
        color: '#1b4744',
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
    },
    notificationText: {
        color: '#1b4744',
        fontSize: 13,
        fontWeight: '500',
        lineHeight: 18,
    },
    dateTimeContainer: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    dateTimeText: {
        fontSize: 12,
        color: '#58677b',
        fontWeight: '400',
        lineHeight: 16,
    }
});

export default NotificationsInbox;
