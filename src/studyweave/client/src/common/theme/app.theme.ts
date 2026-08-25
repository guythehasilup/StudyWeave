import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  direction: 'rtl',
  spacing: 8,
  shape: {
    borderRadius: 14,
  },
  palette: {
    mode: 'dark',
    primary: {
      main: '#7557F6',
      light: '#A996FF',
      dark: '#6244DD',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#0B1020',
      paper: '#141D33',
    },
    text: {
      primary: '#F7F8FC',
      secondary: '#ADB8D2',
    },
    divider: 'rgba(132, 149, 190, 0.20)',
    error: {
      main: '#FF9B9B',
    },
    success: {
      main: '#8CE5BD',
    },
  },
  typography: {
    fontFamily: 'Arial',
    h1: {
      fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
      fontWeight: 800,
      lineHeight: 1.2,
      letterSpacing: '-0.03em',
    },
    button: {
      fontWeight: 800,
      textTransform: 'none',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          minWidth: 320,
          minHeight: '100%',
          backgroundColor: '#0B1020',
        },
        body: {
          minWidth: 320,
          minHeight: '100vh',
          backgroundColor: '#0B1020',
          fontFamily: 'Arial',
        },
        'button, input, textarea, select': {
          fontFamily: 'inherit',
        },
        '*:focus-visible': {
          outline: '3px solid rgba(117, 87, 246, 0.55)',
          outlineOffset: 2,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 52,
          borderRadius: 14,
          boxShadow: 'none',
          fontFamily: 'Arial',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          minHeight: 52,
          backgroundColor: '#1B2742',
          transition: 'border-color 160ms ease, background-color 160ms ease',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#53648C',
          },
          '&.Mui-focused': {
            backgroundColor: '#202D4B',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
          },
        },
        input: {
          fontFamily: 'Arial',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontFamily: 'Arial',
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          marginInline: 0,
          fontFamily: 'Arial',
          lineHeight: 1.55,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 14,
        },
        message: {
          fontFamily: 'Arial',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: 'Arial',
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: '#A996FF',
          fontFamily: 'Arial',
          fontWeight: 700,
          textUnderlineOffset: 4,
          '&:hover': {
            color: '#C1B5FF',
          },
        },
      },
    },
  },
});
