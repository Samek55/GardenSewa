// Same token shape/relationships as HomeSewa's theme/colors.ts, anchored to
// GardenSewa's own brand teal so the two apps share one design system without
// GardenSewa losing its identity.
export const lightColors = {
  background: '#F5F9F8',
  surface: '#FFFFFF',
  surfaceMuted: '#E8F4F3',
  border: '#E5E7EB',
  divider: '#F0F7F6',
  textPrimary: '#1C2B2A',
  textSecondary: '#5A7270',
  textMuted: '#9BBAB8',
  brand: '#245d5a',
  brandDark: '#1B4644',
  danger: '#ef4444',
  success: '#22c55e',
  warning: '#E8A317',
  // Pill/badge backgrounds — HomeSewa hardcodes these as literals per-screen
  // rather than tokenizing them; GardenSewa needs them as real tokens so
  // status badges stay legible in dark mode instead of a light pastel bg
  // trapping light-mode-only text on top of it.
  successBg: '#DFF5E1',
  warningBg: '#FFF3D6',
  dangerBg: '#FCE1E1',
};

export const darkColors = {
  background: '#0F1716',
  surface: '#182422',
  surfaceMuted: '#1F2E2B',
  border: '#2A3B38',
  divider: '#233330',
  textPrimary: '#EAF3F1',
  textSecondary: '#9FB8B5',
  textMuted: '#6E8A87',
  brand: '#3FA79C',
  brandDark: '#245d5a',
  danger: '#f87171',
  success: '#4ade80',
  warning: '#f2b84b',
  successBg: '#1F3D2A',
  warningBg: '#4A3A15',
  dangerBg: '#4A2020',
};
