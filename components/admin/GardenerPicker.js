import { useTheme } from '@/context/ThemeContext';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

// Searchable list of Active professionals for an admin to pick one — same UI
// as the Private picker inside reviewBooking.js. excludePhone hides a
// professional who shouldn't be offered (e.g. the current assignee).
export default function GardenerPicker({ gardeners, excludePhone, picked, onPick }) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [search, setSearch] = useState('');

    const q = search.trim().toLowerCase();
    const visible = gardeners.filter((g) => {
        if (g.status !== 'Active' || g.phone === excludePhone) return false;
        if (!q) return true;
        return (g.fullName || '').toLowerCase().includes(q) || (g.phone || '').includes(q);
    });

    return (
        <>
            <TextInput
                style={styles.input}
                value={search}
                onChangeText={setSearch}
                placeholder="Search by name or phone"
                placeholderTextColor={colors.textMuted}
            />
            <FlatList
                data={visible}
                keyExtractor={(item) => String(item.phone)}
                style={styles.list}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.row, picked?.phone === item.phone && styles.rowActive]}
                        onPress={() => onPick(item)}
                    >
                        <Text style={styles.name}>{item.fullName}</Text>
                        <Text style={styles.phone}>{item.phone}</Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.empty}>No professionals found.</Text>}
            />
        </>
    );
}

const createStyles = (colors) => StyleSheet.create({
    input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, fontSize: 14, color: colors.textPrimary },
    list: { maxHeight: 220, marginTop: 8, marginBottom: 4 },
    row: { paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10, borderBottomWidth: 1, borderBottomColor: colors.divider },
    rowActive: { backgroundColor: colors.surfaceMuted },
    name: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
    phone: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    empty: { textAlign: 'center', color: colors.textMuted, marginTop: 20 },
});
