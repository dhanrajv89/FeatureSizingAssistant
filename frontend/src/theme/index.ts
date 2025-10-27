"use client";

import { PaletteMode, createTheme } from "@mui/material/styles";

const getBackground = (mode: PaletteMode) =>
  mode === "light"
    ? {
        default: "#F7F9FC",
        paper: "#FFFFFF",
      }
    : {
        default: "#0B1324",
        paper: "#111C2D",
      };

export const createAppTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: "#1565C0",
      },
      secondary: {
        main: "#FF8F00",
      },
      background: getBackground(mode),
      ...(mode === "dark"
        ? {
            text: {
              primary: "#E6ECF5",
              secondary: "#A9B4C6",
            },
          }
        : {}),
    },
    shape: {
      borderRadius: 12,
    },
    typography: {
      fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      button: {
        fontWeight: 600,
        textTransform: "none",
      },
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 10,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow:
              mode === "light"
                ? "0 10px 30px rgba(21, 101, 192, 0.08)"
                : "0 12px 32px rgba(9, 17, 34, 0.65)",
          },
        },
      },
    },
  });
