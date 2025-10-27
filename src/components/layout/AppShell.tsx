import { MouseEvent, ReactNode, useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";

import { useAuth } from "@/providers/AuthProvider";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: <AssessmentRoundedIcon fontSize="small" /> },
];

const contentPadding = { xs: 2, sm: 4, lg: 6 };

type AppShellProps = {
  children: ReactNode;
};

export const AppShell = ({ children }: AppShellProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  const handleAvatarClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await signOut();
    handleClose();
    navigate("/");
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: "1px solid #e4e9f2" }}>
        <Container maxWidth={false} disableGutters sx={{ px: contentPadding }}>
          <Toolbar sx={{ gap: 2, px: 0 }}>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
              Feature Sizing Assistant
            </Typography>
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Button
                  key={item.href}
                  component={RouterLink}
                  to={item.href}
                  startIcon={item.icon}
                  color={isActive ? "primary" : "inherit"}
                  sx={{ fontWeight: isActive ? 700 : 500 }}
                >
                  {item.label}
                </Button>
              );
            })}
            <Tooltip title={user?.email ?? ""}>
              <IconButton onClick={handleAvatarClick} size="small">
                <Avatar src={user?.image ?? undefined}>
                  {user?.name?.[0]?.toUpperCase() ?? "U"}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
              <MenuItem disabled>{user?.name ?? user?.email ?? "Unknown user"}</MenuItem>
              <MenuItem onClick={handleLogout}>
                <LogoutRoundedIcon fontSize="small" sx={{ mr: 1 }} />
                Sign out
              </MenuItem>
            </Menu>
          </Toolbar>
        </Container>
      </AppBar>
      <Container
        component="main"
        maxWidth={false}
        disableGutters
        sx={{ flexGrow: 1, py: 4, px: contentPadding }}
      >
        {children}
      </Container>
    </Box>
  );
};
