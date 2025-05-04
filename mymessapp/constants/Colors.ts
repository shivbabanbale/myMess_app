/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    tintLight: 'rgba(10, 126, 164, 0.1)',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    grayDark: '#687076',
    grayLight: '#E6E8EB',
    success: '#16a34a',
    successLight: '#dcfce7',
    warning: '#ea580c',
    warningLight: '#ffedd5',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    tintLight: 'rgba(255, 255, 255, 0.1)',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    grayDark: '#9BA1A6',
    grayLight: '#2C2F31',
    success: '#22c55e',
    successLight: '#132a1c',
    warning: '#f97316',
    warningLight: '#2e1b10',
  },
};
