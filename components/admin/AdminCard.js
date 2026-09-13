import { useTheme } from '@/context/ThemeContext';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

export default function AdminCard({ style, children }) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    return <View style={[styles.card, style]}>{children}</View>;
}

const createStyles = (colors) => StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 14,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
});
