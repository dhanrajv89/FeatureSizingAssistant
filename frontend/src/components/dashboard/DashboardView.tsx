
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import LeaderboardRoundedIcon from "@mui/icons-material/LeaderboardRounded";
import FunctionsRoundedIcon from "@mui/icons-material/FunctionsRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import HelpCenterRoundedIcon from "@mui/icons-material/HelpCenterRounded";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  CreateEstimatePayload,
  ReestimatePayload,
  createEstimate,
  deleteEstimate as deleteEstimateApi,
  getEstimates,
  reestimate,
} from "@/lib/api";
import { EstimateDTO } from "@/types/estimates";

import { EstimateComposer } from "./EstimateComposer";
import { EstimateHistory } from "./EstimateHistory";
import { EstimatePreview } from "./EstimatePreview";
import { ReestimateDialog } from "./ReestimateDialog";
import { ThemeToggle } from "@/components/common/ThemeToggle";

type SnackbarState = {
  message: string;
  severity: "success" | "error";
};

const sortEstimates = (estimates: EstimateDTO[]) =>
  [...estimates].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

export const DashboardView = () => {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<EstimateDTO | null>(null);

  const estimatesQuery = useQuery({
    queryKey: ["estimates"],
    queryFn: async () => {
      const response = await getEstimates();
      return sortEstimates(response.estimates);
    },
    initialData: [],
  });

  const estimates = useMemo(
    () => estimatesQuery.data ?? [],
    [estimatesQuery.data],
  );

  useEffect(() => {
    if (!selectedId && estimates.length > 0) {
      setSelectedId(estimates[0].id);
    }
  }, [estimates, selectedId]);

  const selectedEstimate = useMemo(
    () =>
      estimates.find((estimate) => estimate.id === selectedId) ??
      estimates[0] ??
      null,
    [estimates, selectedId],
  );

  const moduleCount = selectedEstimate?.modules.length ?? 0;
  const riskCount = selectedEstimate?.risks.length ?? 0;
  const questionCount = selectedEstimate?.missingItems.length ?? 0;

  const summaryItems = [
    {
      label: "Overall Effort",
      value: selectedEstimate?.summary.overallSizing ?? "--",
      helper: selectedEstimate
        ? "AI assessment of project scale."
        : "Generate an estimate to see insights.",
      avatarColor: "primary.main",
      icon: <LeaderboardRoundedIcon fontSize="small" />,
    },
    {
      label: "Total Points",
      value: selectedEstimate
        ? `${selectedEstimate.totals.totalPoints} pts`
        : "--",
      helper: selectedEstimate
        ? `${moduleCount} modules sized.`
        : "No modules yet.",
      avatarColor: "secondary.main",
      icon: <FunctionsRoundedIcon fontSize="small" />,
    },
    {
      label: "Risks Identified",
      value: String(riskCount),
      helper:
        riskCount > 0
          ? "Review mitigation with the team."
          : "No risks captured.",
      avatarColor: "error.main",
      icon: <WarningAmberRoundedIcon fontSize="small" />,
    },
    {
      label: "Open Questions",
      value: String(questionCount),
      helper:
        questionCount > 0
          ? "Follow up with stakeholders."
          : "All clarifications resolved.",
      avatarColor: "info.main",
      icon: <HelpCenterRoundedIcon fontSize="small" />,
    },
  ];

  const updateEstimatesCache = (estimate: EstimateDTO) => {
    queryClient.setQueryData<EstimateDTO[]>(["estimates"], (current = []) =>
      sortEstimates([
        estimate,
        ...current.filter((item) => item.id !== estimate.id),
      ]),
    );
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateEstimatePayload) =>
      createEstimate(payload).then((response) => response.estimate),
    onSuccess: (estimate) => {
      updateEstimatesCache(estimate);
      setSelectedId(estimate.id);
      setSnackbar({
        message: "Estimate generated successfully.",
        severity: "success",
      });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "We couldn't generate the estimate. Try again.";

      setSnackbar({
        message,
        severity: "error",
      });
    },
  });

  const reestimateMutation = useMutation({
    mutationFn: (input: { estimateId: string; payload: ReestimatePayload }) =>
      reestimate(input.estimateId, input.payload).then(
        (response) => response.estimate,
      ),
    onSuccess: (estimate) => {
      updateEstimatesCache(estimate);
      setSelectedId(estimate.id);
      setSnackbar({
        message: "Created new version successfully.",
        severity: "success",
      });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to generate new version.";

      setSnackbar({
        message,
        severity: "error",
      });
    },
    onSettled: () => setDialogOpen(false),
  });

  const deleteMutation = useMutation({
    mutationFn: (estimateId: string) => deleteEstimateApi(estimateId),
    onMutate: (estimateId) => {
      setDeleteTargetId(estimateId);
    },
    onSuccess: (_response, estimateId) => {
      const updated =
        queryClient.setQueryData<EstimateDTO[]>(["estimates"], (current = []) =>
          current.filter((item) => item.id !== estimateId),
        ) ?? [];

      setSnackbar({
        message: "Estimate deleted.",
        severity: "success",
      });

      setSelectedId((previous) => {
        if (previous === estimateId) {
          return updated[0]?.id ?? null;
        }
        return previous;
      });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to delete estimate.";

      setSnackbar({
        message,
        severity: "error",
      });
    },
    onSettled: () => {
      setDeleteTargetId(null);
    },
  });

  const handleCreate = async (payload: CreateEstimatePayload) => {
    await createMutation.mutateAsync(payload);
  };

  const handleSelect = (estimate: EstimateDTO) => {
    setSelectedId(estimate.id);
  };

  const handleReestimate = async (payload: ReestimatePayload) => {
    if (!selectedEstimate) {
      return;
    }

    await reestimateMutation.mutateAsync({
      estimateId: selectedEstimate.id,
      payload,
    });
  };

  const handleDelete = (estimate: EstimateDTO) => {
    if (deleteMutation.isPending) {
      return;
    }
    setDeleteCandidate(estimate);
  };

  const handleConfirmDelete = async () => {
    if (!deleteCandidate) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(deleteCandidate.id);
      setDeleteCandidate(null);
    } catch {
      // error handled via mutation onError
    }
  };

  const handleCancelDelete = () => {
    if (deleteMutation.isPending) {
      return;
    }
    setDeleteCandidate(null);
  };

  const closeSnackbar = () => setSnackbar(null);

  return (
    <Stack spacing={4}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
      >
        <Stack spacing={1}>
          <Typography variant="h4" fontWeight={700}>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Size new features, review risks, and keep track of estimation
            versions for every project.
          </Typography>
        </Stack>
        <ThemeToggle />
      </Stack>
      <Box
        sx={{
          display: "grid",
          gap: { xs: 3, md: 3 },
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 2.1fr) minmax(0, 1fr)" },
          alignItems: "start",
        }}
      >
        <Stack spacing={3}>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
            }}
          >
            {summaryItems.map((item) => (
              <Box key={item.label} sx={{ display: "flex" }}>
                <Card sx={{ flexGrow: 1 }}>
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar
                        variant="rounded"
                        sx={{
                          bgcolor: item.avatarColor,
                          color: "common.white",
                          width: 48,
                          height: 48,
                        }}
                      >
                        {item.icon}
                      </Avatar>
                      <Stack spacing={0.5}>
                        <Typography variant="overline" color="text.secondary">
                          {item.label}
                        </Typography>
                        <Typography variant="h6">{item.value}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.helper}
                        </Typography>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
          <EstimatePreview
            estimate={selectedEstimate}
            onRequestReestimate={() => setDialogOpen(true)}
          />
        </Stack>
        <Stack spacing={3} sx={{ height: "100%" }}>
          <EstimateComposer
            onSubmit={handleCreate}
            isSubmitting={createMutation.isPending}
          />
          <EstimateHistory
            estimates={estimates}
            onSelect={handleSelect}
            selectedEstimateId={selectedEstimate?.id}
            onDelete={handleDelete}
            deletingEstimateId={deleteTargetId}
          />
        </Stack>
      </Box>
      <ReestimateDialog
        open={isDialogOpen}
        estimate={selectedEstimate}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleReestimate}
        isSubmitting={reestimateMutation.isPending}
      />
      <Dialog
        open={Boolean(deleteCandidate)}
        onClose={handleCancelDelete}
        aria-labelledby="delete-estimate-title"
      >
        <DialogTitle id="delete-estimate-title">Delete estimate</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {deleteCandidate
              ? `Delete ${deleteCandidate.projectName} (v${deleteCandidate.version})? This removes the selected version from history.`
              : ""}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {snackbar
          ? (
              <Alert
                severity={snackbar.severity}
                onClose={closeSnackbar}
                variant="filled"
                sx={{ width: "100%" }}
              >
                {snackbar.message}
              </Alert>
            )
          : undefined}
      </Snackbar>
    </Stack>
  );
};
