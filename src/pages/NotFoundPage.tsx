import { Box, Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export const NotFoundPage = () => (
  <Box
    sx={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Stack spacing={2} textAlign="center">
      <Typography variant="h3" fontWeight={700}>
        404
      </Typography>
      <Typography color="text.secondary">
        We couldn't find the page you were looking for.
      </Typography>
      <Button component={RouterLink} to="/" variant="contained">
        Back to home
      </Button>
    </Stack>
  </Box>
);
