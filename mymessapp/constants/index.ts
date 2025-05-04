// Export color constants
import { Colors } from './Colors';

// Define fonts
const FONTS = {
  h1: {
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: 'bold',
  },
  h2: {
    fontFamily: 'System',
    fontSize: 24,
    fontWeight: 'bold',
  },
  h3: {
    fontFamily: 'System',
    fontSize: 20,
    fontWeight: 'bold',
  },
  h4: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: 'bold',
  },
  body1: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: 'normal',
  },
  body2: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: 'normal',
  },
  body3: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: 'normal',
  },
  body4: {
    fontFamily: 'System',
    fontSize: 10,
    fontWeight: 'normal',
  },
};

// Define sizes for consistent spacing
const SIZES = {
  xSmall: 4,
  small: 8,
  medium: 16,
  large: 24,
  xLarge: 32,
  xxLarge: 40,
  xxxLarge: 64,
};

// Define colors for use throughout the app
const COLORS = {
  primary: Colors.light.tint,
  primaryLight: Colors.light.tintLight,
  secondary: '#0048BA',
  tertiary: '#ff7c43',
  
  // Text colors
  text: Colors.light.text,
  textLight: '#687076',
  
  // Background colors
  white: '#FFFFFF',
  lightWhite: '#F8F9FA',
  
  // Utility colors
  gray: '#687076',
  gray2: '#E6E8EB',
  black: '#000000',
  
  // Status colors
  success: Colors.light.success,
  successLight: Colors.light.successLight,
  error: '#DC2626',
  warning: Colors.light.warning,
  warningLight: Colors.light.warningLight,
};

export { COLORS, FONTS, SIZES }; 