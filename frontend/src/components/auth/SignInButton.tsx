import { useState } from "react";
import { Button, CircularProgress } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";

import { useAuth } from "@/providers/AuthProvider";

export const SignInButton = () => {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    void signIn()
      .catch((error) => {
        console.error("Google sign-in failed", error);
      })
      .finally(() => setLoading(false));
  };

  return (
    <Button
      variant="contained"
      size="large"
      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <GoogleIcon />}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? "Signing in..." : "Continue with Google"}
    </Button>
  );
};
