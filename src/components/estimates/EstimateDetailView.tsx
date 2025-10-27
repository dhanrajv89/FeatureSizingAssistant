import { useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import HistoryEduRoundedIcon from "@mui/icons-material/HistoryEduRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { EstimatePreview } from "@/components/dashboard/EstimatePreview";
import { ReestimateDialog } from "@/components/dashboard/ReestimateDialog";
import { ReestimatePayload, reestimate } from "@/lib/api";
import { EstimateDTO } from "@/types/estimates";

type EstimateDetailViewProps = {
  estimate: EstimateDTO;
  versions: EstimateDTO[];
};

type SnackbarState = {
  message: string;
  severity: "success" | "error";
};

const sortVersions = (items: EstimateDTO[]) =>
  [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

export const EstimateDetailView = ({
  estimate,
  versions,
}: EstimateDetailViewProps) => {
  const queryClient = useQueryClient();
  const [versionList, setVersionList] = useState(() => sortVersions(versions));
  const [selectedId, setSelectedId] = useState(estimate.id);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);

  const selectedEstimate = useMemo(
    () => versionList.find((item) => item.id === selectedId) ?? versionList[0],
    [versionList, selectedId],
  );

  const updateDashboardCache = (updated: EstimateDTO) => {
    queryClient.setQueryData<EstimateDTO[]>(["estimates"], (current = []) =>
      sortVersions([updated, ...current.filter((item) => item.id !== updated.id)]),
    );
  };

  const reestimateMutation = useMutation({
    mutationFn: (input: { estimateId: string; payload: ReestimatePayload }) =>
      reestimate(input.estimateId, input.payload).then(
        (response) => response.estimate,
      ),
    onSuccess: (nextEstimate) => {
      setVersionList((prev) =>
        sortVersions([
          nextEstimate,
          ...prev.filter((item) => item.id !== nextEstimate.id),
        ]),
      );
      setSelectedId(nextEstimate.id);
      updateDashboardCache(nextEstimate);
      setSnackbar({
        message: `Generated ${nextEstimate.projectName} v${nextEstimate.version}`,
        severity: "success",
      });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to re-estimate project.";

      setSnackbar({
        message,
        severity: "error",
      });
    },
    onSettled: () => setDialogOpen(false),
  });

  const handleReestimate = async (payload: ReestimatePayload) => {
    await reestimateMutation.mutateAsync({
      estimateId: selectedEstimate.id,
      payload,
    });
  };

  const closeSnackbar = () => setSnackbar(null);

  return (
    <Stack spacing={4}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Button
          component={RouterLink}
          to="/dashboard"
          startIcon={<ArrowBackRoundedIcon />}
        >
          Back to dashboard
        </Button>
      </Stack>
      <Stack spacing={1}>
        <Typography variant="h4" fontWeight={700}>
          {selectedEstimate.projectName}
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <Chip label={`Version ${selectedEstimate.version}`} />
          <Chip
            label={`Overall size: ${selectedEstimate.summary.overallSizing}`}
            color="primary"
          />
          <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
            <CalendarMonthRoundedIcon fontSize="small" />
            <Typography variant="body2">
              {new Date(selectedEstimate.createdAt).toLocaleString()}
            </Typography>
          </Stack>
        </Stack>
      </Stack>
      <Grid container spacing={4}>
        <Grid item xs={12} lg={8}>
          <EstimatePreview
            estimate={selectedEstimate}
            onRequestReestimate={() => setDialogOpen(true)}
            showDetailLink={false}
          />
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TimelineRoundedIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Version history
                  </Typography>
                </Stack>
                <List dense disablePadding>
                  {versionList.map((version) => (
                    <ListItem key={version.id} disablePadding>
                      <ListItemButton
                        selected={version.id === selectedEstimate.id}
                        onClick={() => setSelectedId(version.id)}
                      >
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip size="small" label={`V${version.version}`} />
                              <Typography variant="body2" fontWeight={600}>
                                {version.summary.overallSizing}
                              </Typography>
                            </Stack>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {new Date(version.createdAt).toLocaleString()}
                            </Typography>
                          }
                        />
                        <Chip
                          label={`${version.totals.totalPoints} pts`}
                          size="small"
                          color="secondary"
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Stack>
            </CardContent>
          </Card>
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <HistoryEduRoundedIcon color="secondary" />
                  <Typography variant="h6" fontWeight={600}>
                    Summary
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {selectedEstimate.summary.assumptions.length > 0
                    ? selectedEstimate.summary.assumptions.join("\n")
                    : "No explicit assumptions captured."}
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>Platforms:</strong>{" "}
                    {[selectedEstimate.platformWeb && "Web", selectedEstimate.platformMobile && "Mobile"]
                      .filter(Boolean)
                      .join(", ") || "Not specified"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Total points:</strong> {selectedEstimate.totals.totalPoints}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <ReestimateDialog
        open={dialogOpen}
        estimate={selectedEstimate}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleReestimate}
        isSubmitting={reestimateMutation.isPending}
      />
      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {snackbar ? (
          <Alert
            severity={snackbar.severity}
            onClose={closeSnackbar}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        ) : null}
      </Snackbar>
    </Stack>
  );
};
