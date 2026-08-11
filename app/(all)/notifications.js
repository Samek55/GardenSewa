import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { notificationsData } from '../../data/servicesList'

const FAQ = () => {
    return (
        <ScrollView style={styles.scrollview} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.fullContainer}>
                <Text style={styles.pageHeader}>Notifications</Text>
                <Text style={styles.subHeaderText}>Garden Sewa Notifications</Text>
                {
                    notificationsData?.map((notification, key) => {
                        return (
                            <TouchableOpacity
                                key={notification.id || key}
                                style={styles.notificationCard}
                                activeOpacity={0.7}
                            >
                                <View style={styles.cardContent}>
                                    <Text style={styles.notificationText}>
                                        {notification.message}
                                    </Text>

                                    <View style={styles.dateTimeContainer}>
                                        <Text style={styles.dateTimeText}>{notification.date}</Text>
                                        <Text style={styles.dateTimeText}>{notification.time}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )
                    })
                }
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    scrollview: {
        flex: 1,
        backgroundColor: '#ffffff'
    },
    container: {
        paddingHorizontal: 16,
        paddingVertical: 24
    },
    pageHeader: {
        fontSize: 32,
        color: '#1a1a1a',
        fontWeight: '700',
        marginBottom: 8
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
    notificationText: {
        flex: 1,
        color: '#1b4744',
        fontSize: 15,
        fontWeight: '500',
        lineHeight: 20
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
})

export default FAQ