"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Checkbox,
  Stack,
  TextField,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";

import { EstimateDTO } from "@/types/estimates";
import { ReestimatePayload } from "@/lib/api";

const schema = z.object({
  projectName: z.string().optional(),
  inputText: z.string().optional(),
  platformWeb: z.boolean().optional(),
  platformMobile: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

type ReestimateDialogProps = {
  open: boolean;
  estimate: EstimateDTO | null;
  onClose: () => void;
  onSubmit: (payload: ReestimatePayload) => Promise<void>;
  isSubmitting: boolean;
};

export const ReestimateDialog = ({
  open,
  estimate,
  onClose,
  onSubmit,
  isSubmitting,
}: ReestimateDialogProps) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      projectName: estimate?.projectName,
      inputText: estimate?.inputText,
      platformWeb: estimate?.platformWeb,
      platformMobile: estimate?.platformMobile,
    },
  });

  useEffect(() => {
    if (estimate) {
      reset({
        projectName: estimate.projectName,
        inputText: estimate.inputText,
        platformWeb: estimate.platformWeb,
        platformMobile: estimate.platformMobile,
      });
    }
  }, [estimate, reset, open]);

  const submitHandler = async (values: FormValues) => {
    await onSubmit(values);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Re-estimate “{estimate?.projectName}”</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Controller
            name="projectName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Project name"
                helperText={errors.projectName?.message ?? "Update if the project label changed"}
                disabled={isSubmitting}
              />
            )}
          />
          <Controller
            name="inputText"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Feature description"
                multiline
                minRows={5}
                helperText={
                  errors.inputText?.message ??
                  "Adjust scope to explore alternative sizing assumptions."
                }
                disabled={isSubmitting}
              />
            )}
          />
          <Stack direction="row" spacing={2}>
            <Controller
              name="platformWeb"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={field.value ?? false}
                      onChange={(event) => field.onChange(event.target.checked)}
                      disabled={isSubmitting}
                    />
                  }
                  label="Web"
                />
              )}
            />
            <Controller
              name="platformMobile"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={field.value ?? false}
                      onChange={(event) => field.onChange(event.target.checked)}
                      disabled={isSubmitting}
                    />
                  }
                  label="Mobile"
                />
              )}
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(submitHandler)}
          variant="contained"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Re-estimating…" : "Generate new version"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
