"use client";

import { useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { CreateEstimatePayload } from "@/lib/api";

const schema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  inputText: z.string().min(1, "Feature description is required"),
  platformWeb: z.boolean().default(true),
  platformMobile: z.boolean().default(false),
});

type FormValues = z.infer<typeof schema>;

type EstimateComposerProps = {
  onSubmit: (payload: CreateEstimatePayload) => Promise<void> | void;
  isSubmitting: boolean;
};

export const EstimateComposer = ({
  onSubmit,
  isSubmitting,
}: EstimateComposerProps) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      projectName: "",
      inputText: "",
      platformWeb: true,
      platformMobile: false,
    },
  });

  useEffect(() => {
    if (!isSubmitting) {
      // keep current values for subsequent submissions
    }
  }, [isSubmitting]);

  const submitHandler = async (values: FormValues) => {
    await onSubmit(values);
  };

  const handleReset = () => {
    reset();
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h5" fontWeight={600}>
              New Estimate
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Describe the feature scope and select target platforms to generate sizing.
            </Typography>
          </Box>
          <Stack
            component="form"
            spacing={2.5}
            onSubmit={handleSubmit(submitHandler)}
          >
            <Controller
              name="projectName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Project name"
                  placeholder="e.g. Smart HR Portal"
                  error={Boolean(errors.projectName)}
                  helperText={errors.projectName?.message}
                  fullWidth
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
                  placeholder="List the modules, workflows, and integrations to scope…"
                  minRows={6}
                  multiline
                  error={Boolean(errors.inputText)}
                  helperText={errors.inputText?.message}
                  fullWidth
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
                        checked={field.value}
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
                        checked={field.value}
                        onChange={(event) => field.onChange(event.target.checked)}
                        disabled={isSubmitting}
                      />
                    }
                    label="Mobile"
                  />
                )}
              />
            </Stack>
            <Stack direction="row" spacing={1.5}>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Generating…" : "Calculate Estimate"}
              </Button>
              <Button
                type="button"
                variant="text"
                onClick={handleReset}
                disabled={isSubmitting}
              >
                Clear
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
