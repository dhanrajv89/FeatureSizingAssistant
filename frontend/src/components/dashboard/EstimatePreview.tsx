import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import HelpRoundedIcon from "@mui/icons-material/HelpRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { Link as RouterLink } from "react-router-dom";

import { EstimateDTO } from "@/types/estimates";
import { getApiUrl } from "@/lib/api";

type EstimatePreviewProps = {
  estimate: EstimateDTO | null;
  onRequestReestimate: () => void;
  showDetailLink?: boolean;
};

const severityColor: Record<string, "success" | "warning" | "error" | "info"> = {
  Low: "success",
  Medium: "warning",
  High: "error",
};

export const EstimatePreview = ({
  estimate,
  onRequestReestimate,
  showDetailLink = true,
}: EstimatePreviewProps) => {
  if (!estimate) {
    return (
      <Card sx={{ height: "100%" }}>
        <CardContent sx={{ minHeight: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Stack spacing={2} alignItems="center" textAlign="center">
            <AssessmentRoundedIcon color="primary" fontSize="large" />
            <Typography variant="h6">
              Generate an estimate to preview sizing, risks, and questions here.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Results appear instantly after the AI assistant completes sizing.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  const handleDownloadXlsx = () => {
    const url = getApiUrl(`/api/estimates/${estimate.id}/export?format=xlsx`);
    window.open(url, "_blank");
  };

  const featureDescription =
    estimate.inputText && estimate.inputText.trim().length > 0
      ? estimate.inputText
      : "Not provided";

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Stack spacing={2.5}>
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <Stack spacing={0.5}>
              <Typography variant="h5" fontWeight={600}>
                {estimate.projectName}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip label={`V${estimate.version}`} size="small" />
                <Chip
                  label={`Overall: ${estimate.summary.overallSizing}`}
                  color="primary"
                  size="small"
                />
                <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
                  <CalendarMonthRoundedIcon fontSize="small" />
                  <Typography variant="caption">
                    {new Date(estimate.createdAt).toLocaleString()}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<FileDownloadRoundedIcon fontSize="small" />}
                onClick={handleDownloadXlsx}
              >
                XLSX
              </Button>
              <Button
                variant="contained"
                startIcon={<EditNoteRoundedIcon fontSize="small" />}
                onClick={onRequestReestimate}
              >
                Re-estimate
              </Button>
            </Stack>
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ whiteSpace: "pre-wrap" }}
          >
            <strong>Feature Description (Input):</strong> {featureDescription}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Assumptions: {estimate.summary.assumptions.length > 0 ? estimate.summary.assumptions.join(", ") : "Not specified"}
          </Typography>
          <Divider />
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">Modules</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {estimate.totals.totalPoints} pts
                  </Typography>
                </Stack>
                <List disablePadding>
                  {estimate.modules.map((module) => (
                    <ListItem key={module.id} disableGutters sx={{ alignItems: "flex-start" }}>
                      <ListItemAvatar>
                        <Chip label={module.size} color="primary" size="small" sx={{ mt: 0.5 }} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                            <Typography fontWeight={600}>{module.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {module.points} pts
                            </Typography>
                          </Stack>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            {module.description}
                            <br />
                            <strong>Rationale:</strong> {module.rationale}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6} sx={{ pr: 3 }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Risks
                  </Typography>
                  <List disablePadding>
                    {estimate.risks.map((risk) => (
                      <ListItem key={risk.id} disableGutters>
                        <ListItemAvatar>
                          <ReportProblemRoundedIcon color={severityColor[risk.severity] ?? "info"} />
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              flexWrap="wrap"
                              useFlexGap
                              sx={{ minWidth: 0 }}
                            >
                              <Typography fontWeight={600} sx={{ flexGrow: 1, minWidth: 0, wordBreak: "break-word" }}>
                                {risk.title}
                              </Typography>
                              <Chip
                                label={risk.severity}
                                size="small"
                                color={severityColor[risk.severity] ?? ("default" as const)}
                              />
                            </Stack>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-word" }}>
                              {risk.detail}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Missing items
                  </Typography>
                  <List disablePadding>
                    {estimate.missingItems.map((missing) => (
                      <ListItem key={missing.id} disableGutters>
                        <ListItemAvatar>
                          <HelpRoundedIcon color="primary" />
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography fontWeight={600}>{missing.question}</Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              Category: {missing.category ?? "Other"}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Stack>
            </Grid>
          </Grid>
          <Divider />
          {showDetailLink ? (
            <Button
              component={RouterLink}
              to={`/estimates/${estimate.id}`}
              variant="text"
              endIcon={<OpenInNewRoundedIcon fontSize="small" />}
            >
              Open detailed view & history
            </Button>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
};
