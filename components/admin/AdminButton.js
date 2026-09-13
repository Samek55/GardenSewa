import { useTheme } from '@/context/ThemeContext';
import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';

// variant: 'brand' | 'outline' | 'danger' | 'dangerOutline'
export default function AdminButton({ variant = 'brand', label, onPress, loading, disabled, style }) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const variantStyle = {
        brand: { button: { backgroundColor: colors.brand }, text: { color: '#fff' } },
        outline: { button: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.brand }, text: { color: colors.brand } },
        danger: { button: { backgroundColor: colors.danger }, text: { color: '#fff' } },
        dangerOutline: { button: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.danger }, text: { color: colors.danger } },
    }[variant];

    return (
        <TouchableOpacity
            style={[styles.button, variantStyle.button, (disabled || loading) && styles.disabled, style]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator size="small" color={variantStyle.text.color} />
            ) : (
                <Text style={[styles.text, variantStyle.text]}>{label}</Text>
            )}
        </TouchableOpacity>
    );
}

const createStyles = () => StyleSheet.create({
    button: {
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center', minWidth: 76,
    },
    text: { fontSize: 13, fontWeight: '700' },
    disabled: { opacity: 0.6 },
});
