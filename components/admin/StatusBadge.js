import { useTheme } from '@/context/ThemeContext';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

// variant: 'success' | 'warning' | 'danger' | 'neutral'
export default function StatusBadge({ label, variant = 'neutral' }) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const variantStyle = {
        success: { backgroundColor: colors.successBg, color: colors.success },
        warning: { backgroundColor: colors.warningBg, color: colors.warning },
        danger: { backgroundColor: colors.dangerBg, color: colors.danger },
        neutral: { backgroundColor: colors.surfaceMuted, color: colors.textSecondary },
    }[variant];

    return (
        <View style={[styles.badge, { backgroundColor: variantStyle.backgroundColor }]}>
            <Text style={[styles.text, { color: variantStyle.color }]}>{label}</Text>
        </View>
    );
}

const createStyles = () => StyleSheet.create({
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    text: { fontSize: 11, fontWeight: '700' },
});
