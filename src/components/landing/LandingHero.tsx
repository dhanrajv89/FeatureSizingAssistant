"use client";

import { Box, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

import { SignInButton } from "@/components/auth/SignInButton";

const features = [
  "Break features into scoped modules with AI assistance",
  "Spot risks and missing requirements before proposals go out",
  "Version estimates, export to XLSX, and keep history aligned",
];

export const LandingHero = () => (
  <Box
    sx={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      px: 2,
    }}
  >
    <Grid container spacing={6} maxWidth="lg">
      <Grid item xs={12} md={7}>
        <Stack spacing={3}>
          <Typography variant="h3" fontWeight={700}>
            Faster Feature Sizing for Pre-sales Teams
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Turn raw feature descriptions into scoped modules, risk callouts, and
            export-ready estimates powered by GPT or Gemini.
          </Typography>
          <Stack spacing={2}>
            {features.map((feature) => (
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                key={feature}
              >
                <CheckCircleRoundedIcon color="primary" />
                <Typography>{feature}</Typography>
              </Stack>
            ))}
          </Stack>
          <SignInButton />
        </Stack>
      </Grid>
      <Grid item xs={12} md={5}>
        <Card sx={{ borderRadius: 4, backdropFilter: "blur(12px)" }}>
          <CardContent>
            <Stack spacing={2}>
              <RocketLaunchRoundedIcon color="secondary" fontSize="large" />
              <Typography variant="h5" fontWeight={600}>
                How it works
              </Typography>
              <Typography color="text.secondary">
                1. Authenticate with Google.{"\n"}
                2. Describe the feature scope and select platforms.{"\n"}
                3. Let the assistant size modules, flag risks, and log
                questions.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All results are stored securely with PostgreSQL & Prisma. Export
                artifacts as XLSX to drop directly into proposals.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Box>
);
