import { useState } from "react";
import { Button, CircularProgress } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";

import { useAuth } from "@/providers/AuthProvider";

export const SignInButton = () => {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    signIn();
  };

  return (
    <Button
      variant="contained"
      size="large"
      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <GoogleIcon />}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? "Redirecting…" : "Continue with Google"}
    </Button>
  );
};
