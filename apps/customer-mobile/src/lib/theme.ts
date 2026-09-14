import { MD3LightTheme } from 'react-native-paper';

export const appTheme = {
  ...MD3LightTheme,
  roundness: 16,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1A365D',
    secondary: '#0D9488',
    tertiary: '#F59E0B',
    error: '#D64545',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceVariant: '#E9EEF5',
    onSurface: '#172033',
    onSurfaceVariant: '#5B6575',
    outline: '#D5DCE6',
  },
};
