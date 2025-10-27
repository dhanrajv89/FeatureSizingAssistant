"use client";

import { IconButton, Stack, Tooltip, Typography } from "@mui/material";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";

import { useThemeMode } from "@/providers/ThemeModeProvider";

export const ThemeToggle = () => {
  const { mode, toggleMode } = useThemeMode();
  const isLight = mode === "light";

  return (
    <Tooltip title={`Switch to ${isLight ? "dark" : "light"} mode`}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="body2" color="text.secondary">
          {isLight ? "Light" : "Dark"} mode
        </Typography>
        <IconButton
          color="primary"
          onClick={toggleMode}
          aria-label={`Toggle ${isLight ? "dark" : "light"} mode`}
          sx={{ border: 1, borderColor: "divider" }}
        >
          {isLight ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}
        </IconButton>
      </Stack>
    </Tooltip>
  );
};
