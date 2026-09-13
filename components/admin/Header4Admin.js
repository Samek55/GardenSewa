import { useTheme } from '@/context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Alert, Image, Linking, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AdminSideBar from './AdminSideBar';

const WHATSAPP_PHONE = '9852024365';
const WHATSAPP_MESSAGE = 'Hello! I am looking for a gardening service';

export default function Header4Admin() {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors, isDark, insets.top), [colors, isDark, insets.top]);
    const [menuOpen, setMenuOpen] = useState(false);
    const iconColor = isDark ? colors.brand : '#fff';

    const onWhatsappOpen = async () => {
        const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Error', 'WhatsApp is not installed on this device');
            }
        } catch (error) {
            console.error('An error occurred', error);
        }
    };

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor={isDark ? colors.surface : colors.brand} />
            <View style={styles.wrapper}>
                <View style={styles.left}>
                    <View style={styles.logoWrapper}>
                        <Image source={require('@/assets/images/gardensewa.webp')} style={styles.logo} />
                    </View>
                    <Text style={styles.brandBold}>GardenSewa</Text>
                </View>

                <View style={styles.right}>
                    <TouchableOpacity
                        style={styles.whatsappBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={onWhatsappOpen}
                    >
                        <Ionicons name="logo-whatsapp" size={26} color={iconColor} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={() => setMenuOpen(true)}
                    >
                        <Ionicons name="menu" size={30} color={iconColor} />
                    </TouchableOpacity>
                </View>
            </View>

            <AdminSideBar visible={menuOpen} onClose={() => setMenuOpen(false)} />
        </>
    );
}

const createStyles = (colors, isDark, topInset) => StyleSheet.create({
    wrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: isDark ? colors.surface : colors.brand,
        borderBottomWidth: isDark ? 1 : 0,
        borderBottomColor: colors.divider,
        // On Android with edge-to-edge enabled (and on any iPhone with a
        // notch/Dynamic Island), content draws behind the OS status bar
        // unless explicitly inset — without this, the status bar's own
        // icons overlap the logo/WhatsApp/menu icons instead of sitting
        // above them.
        paddingTop: topInset + 14,
        paddingBottom: 14,
        paddingHorizontal: 16,
    },
    left: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 10 },
    right: { flexDirection: 'row', alignItems: 'center', gap: 18 },
    whatsappBtn: { marginLeft: 10 },
    logoWrapper: {
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: '#fff',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
    },
    logo: { width: '100%', height: '100%' },
    brandBold: {
        fontSize: 22, fontWeight: '700',
        color: isDark ? colors.textPrimary : '#ffffff',
        letterSpacing: 0.3,
    },
});
