// Design System - WideWordWeb
// Professional, elegant, warm palette with no emojis

export const colors = {
  // Primary Palette
  primary: '#40002B',      // Purple Tulip
  secondary: '#7B002C',     // Bordeaux
  accent: {
    red: '#BA0105',         // Bloody Mary
    orange: '#EA5814',      // Furious Tiger
  },
  background: '#FBEEDA',    // Organza Peach
  neutral: {
    50: '#FEFBF5',
    100: '#FDF6EB',
    200: '#FBEEDA',        // Same as background
    300: '#F9E6CA',
    400: '#F5D9B0',
    500: '#E8C99E',
    600: '#D4B88C',
    700: '#B89D7A',
    800: '#8B6E58',
    900: '#5D493C',
  },
  text: {
    primary: '#40002B',     // Purple Tulip
    secondary: '#7B002C',   // Bordeaux
    muted: '#8B6E58',
    inverse: '#FBEEDA',     // Organza Peach
  },
  status: {
    success: '#2D8532',
    warning: '#EA5814',     // Furious Tiger
    error: '#BA0105',       // Bloody Mary
    info: '#7B002C',        // Bordeaux
  }
};

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem',   // 96px
};

export const typography = {
  fontFamily: {
    sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(64, 0, 43, 0.05)',
  md: '0 4px 6px -1px rgba(64, 0, 43, 0.1)',
  lg: '0 10px 15px -3px rgba(64, 0, 43, 0.1)',
  xl: '0 20px 25px -5px rgba(64, 0, 43, 0.1)',
  '2xl': '0 25px 50px -12px rgba(64, 0, 43, 0.25)',
};

export const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.375rem',  // 6px
  lg: '0.5rem',    // 8px
  xl: '0.75rem',  // 12px
  '2xl': '1rem',   // 16px
  full: '9999px',
};

export const transitions = {
  fast: '150ms ease-in-out',
  normal: '250ms ease-in-out',
  slow: '350ms ease-in-out',
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

// Common component styles
export const componentStyles = {
  button: {
    primary: 'bg-secondary hover:bg-primary text-white font-medium transition-all duration-250 shadow-md hover:shadow-lg',
    secondary: 'bg-neutral-100 hover:bg-neutral-200 text-primary font-medium transition-all duration-250',
    outline: 'border-2 border-secondary text-secondary hover:bg-secondary hover:text-white font-medium transition-all duration-250',
  },
  input: {
    base: 'border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg transition-all duration-250',
    error: 'border-2 border-accent-red focus:ring-accent-red',
  },
  card: {
    base: 'bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-250',
    elevated: 'bg-white rounded-xl shadow-lg',
  },
};

export default {
  colors,
  spacing,
  typography,
  shadows,
  borderRadius,
  transitions,
  zIndex,
  componentStyles,
};

