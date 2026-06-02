// HomeGear のカラースキーム（recipe-app と差別化するためグリーン系）
export const COLORS = {
  primary: '#1B5E20',
  primaryDark: '#0F3D14',
  primaryLight: '#43A047',
  accent: '#FF8F00',
  warning: '#E65100',
  danger: '#C62828',
  success: '#2E7D32',
  bg: '#F5F7F4',
  surface: '#FFFFFF',
  border: '#E0E0E0',
  text: '#212121',
  textSub: '#616161',
  textMuted: '#9E9E9E',
  badge: {
    in_use: '#43A047',
    spare: '#90A4AE',
    broken: '#E53935',
    repairing: '#FB8C00',
    disposed: '#757575',
    sold: '#5C6BC0',
  } as Record<string, string>,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
};
