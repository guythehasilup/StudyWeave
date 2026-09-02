import { alpha, createTheme } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import type { TextDirection } from '../../shared/localization/localization';

/**
 * Build the application theme for the active localization direction.
 *
 * @param direction - Current LTR or RTL writing direction.
 * @returns A dark MUI theme containing the StudyWeave design tokens.
 * @example
 * const theme = createAppTheme('rtl');
 */
export const createAppTheme = (direction: TextDirection): Theme => {
  const baseTheme = createTheme({
    direction,
    spacing: 8,
    shape: { borderRadius: 14 },
    palette: {
      mode: 'dark',
      primary: {
        main: '#7557F6',
        light: '#A996FF',
        dark: '#6244DD',
        contrastText: '#FFFFFF',
      },
      background: { default: '#0B1020', paper: '#141D33' },
      text: { primary: '#F7F8FC', secondary: '#ADB8D2' },
      divider: 'rgba(132, 149, 190, 0.20)',
      error: { main: '#FF9B9B' },
      success: { main: '#8CE5BD' },
    },
    typography: {
      fontFamily: 'Arial, sans-serif',
      h1: {
        fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
        fontWeight: 800,
        lineHeight: 1.2,
        letterSpacing: '-0.03em',
      },
      button: { fontWeight: 800, textTransform: 'none' },
    },
  });

  return createTheme(baseTheme, {
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            minWidth: 320,
            minHeight: '100%',
            backgroundColor: baseTheme.palette.background.default,
          },
          body: {
            minWidth: 320,
            minHeight: '100vh',
            background: `radial-gradient(circle at 82% 8%, ${alpha(baseTheme.palette.primary.main, 0.17)}, transparent 32rem), ${baseTheme.palette.background.default}`,
          },
          '*:focus-visible': {
            outline: `3px solid ${alpha(baseTheme.palette.primary.main, 0.55)}`,
            outlineOffset: 2,
          },
          '@media (prefers-reduced-motion: reduce)': {
            '*, *::before, *::after': {
              scrollBehavior: 'auto !important',
              animationDuration: '0.01ms !important',
              animationIterationCount: '1 !important',
              transitionDuration: '0.01ms !important',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            minHeight: 52,
            borderRadius: baseTheme.shape.borderRadius,
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            minHeight: 52,
            backgroundColor: alpha(baseTheme.palette.primary.main, 0.08),
            transition: 'border-color 160ms ease, background-color 160ms ease',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: baseTheme.palette.primary.light,
            },
            '&.Mui-focused': {
              backgroundColor: alpha(baseTheme.palette.primary.main, 0.13),
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 2 },
          },
        },
      },
      MuiFormHelperText: {
        styleOverrides: { root: { marginInline: 0, lineHeight: 1.55 } },
      },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: baseTheme.shape.borderRadius } },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            color: baseTheme.palette.primary.light,
            fontWeight: 700,
            textUnderlineOffset: 4,
          },
        },
      },
    },
  });
};
