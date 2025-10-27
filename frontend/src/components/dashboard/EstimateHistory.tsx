import {
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

import { EstimateDTO } from "@/types/estimates";

const columnWidths = {
  project: 100,
  version: 70,
  size: 60,
  points: 60,
  actions: 70,
};

type EstimateHistoryProps = {
  estimates: EstimateDTO[];
  onSelect: (estimate: EstimateDTO) => void;
  selectedEstimateId?: string;
  onDelete: (estimate: EstimateDTO) => void;
  deletingEstimateId?: string | null;
};

export const EstimateHistory = ({
  estimates,
  onSelect,
  selectedEstimateId,
  onDelete,
  deletingEstimateId,
}: EstimateHistoryProps) => (
  <Card id="history">
    <CardContent>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>
            Recent Estimates
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Version history per project is tracked automatically.
          </Typography>
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: columnWidths.project }}>Project</TableCell>
              <TableCell sx={{ width: columnWidths.version }}>Version</TableCell>
              <TableCell sx={{ width: columnWidths.size }}>Size</TableCell>
              <TableCell sx={{ width: columnWidths.points }}>Pts</TableCell>
              <TableCell sx={{ width: columnWidths.actions }} align="right">
                Delete
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {estimates.map((estimate) => {
              const isSelected = estimate.id === selectedEstimateId;
              return (
                <TableRow
                  key={estimate.id}
                  hover
                  selected={isSelected}
                  sx={{ cursor: "pointer" }}
                  onClick={() => onSelect(estimate)}
                >
                  <TableCell sx={{ minWidth: columnWidths.project }}>
                    <Typography fontWeight={600}>{estimate.projectName}</Typography>
                  </TableCell>
                  <TableCell sx={{ width: columnWidths.version }}>
                    <Chip size="small" label={`V${estimate.version}`} />
                  </TableCell>
                  <TableCell sx={{ width: columnWidths.size }}>
                    <Chip
                      size="small"
                      color="primary"
                      label={estimate.summary.overallSizing}
                    />
                  </TableCell>
                  <TableCell sx={{ width: columnWidths.points }}>
                    {estimate.totals.totalPoints}
                  </TableCell>
                  <TableCell sx={{ width: columnWidths.actions }} align="right">
                    <Tooltip title="Delete estimate">
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={deletingEstimateId === estimate.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            if (deletingEstimateId !== estimate.id) {
                              onDelete(estimate);
                            }
                          }}
                          sx={{
                            border: 1,
                            borderColor: "error.main",
                            backgroundColor: (theme) =>
                              deletingEstimateId === estimate.id
                                ? "transparent"
                                : theme.palette.mode === "light"
                                  ? "rgba(229, 57, 53, 0.08)"
                                  : "rgba(229, 115, 115, 0.1)",
                            "&:hover": {
                              backgroundColor: (theme) =>
                                theme.palette.mode === "light"
                                  ? "rgba(211, 47, 47, 0.16)"
                                  : "rgba(229, 115, 115, 0.2)",
                            },
                          }}
                        >
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
            {estimates.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
                    No estimates yet. Generate your first sizing above.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Stack>
    </CardContent>
  </Card>
);







