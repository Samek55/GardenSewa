import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { darkColors, lightColors } from '../theme/colors';

const STORAGE_KEY = 'themeMode';

const ThemeContext = createContext(undefined);

export function ThemeProvider({ children }) {
    const [mode, setMode] = useState(null);

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
            if (stored === 'light' || stored === 'dark') {
                setMode(stored);
            } else {
                // Dark mode isn't ready to ship yet — always start light regardless
                // of the device's system theme, until it's explicitly enabled.
                setMode('light');
            }
        });
    }, []);

    const toggle = () => {
        setMode((prev) => {
            const next = prev === 'dark' ? 'light' : 'dark';
            AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
            return next;
        });
    };

    if (mode === null) return null; // brief blank frame instead of a light-then-dark flash

    const isDark = mode === 'dark';
    const colors = isDark ? darkColors : lightColors;

    return (
        <ThemeContext.Provider value={{ colors, isDark, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
}
