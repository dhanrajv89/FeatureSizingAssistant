import { Alert } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useParams } from "react-router-dom";

import { FullScreenSpinner } from "@/components/common/FullScreenSpinner";
import { EstimateDetailView } from "@/components/estimates/EstimateDetailView";
import { AppShell } from "@/components/layout/AppShell";
import { getEstimate, getProjectVersions } from "@/lib/api";
import { EstimateDTO } from "@/types/estimates";

export const EstimateDetailPage = () => {
  const { estimateId } = useParams<{ estimateId: string }>();

  const estimateQuery = useQuery({
    queryKey: ["estimate", estimateId],
    queryFn: async () => {
      const response = await getEstimate(estimateId ?? "");
      return response.estimate;
    },
    enabled: Boolean(estimateId),
  });

  const versionsQuery = useQuery({
    queryKey: ["estimate-versions", estimateQuery.data?.projectName],
    queryFn: async () => {
      if (!estimateQuery.data) {
        return [] as EstimateDTO[];
      }
      const response = await getProjectVersions(estimateQuery.data.projectName);
      return response.estimates;
    },
    enabled: Boolean(estimateQuery.data?.projectName),
  });

  const isLoading = estimateQuery.isLoading || versionsQuery.isLoading;
  const hasError = estimateQuery.isError || versionsQuery.isError;

  const versions = useMemo(() => {
    if (versionsQuery.data && versionsQuery.data.length > 0) {
      return versionsQuery.data;
    }
    return estimateQuery.data ? [estimateQuery.data] : [];
  }, [versionsQuery.data, estimateQuery.data]);

  return (
    <AppShell>
      {isLoading ? <FullScreenSpinner /> : null}
      {hasError ? (
        <Alert severity="error">
          We couldn't load this estimate. Please refresh or try again later.
        </Alert>
      ) : null}
      {!isLoading && !hasError && estimateQuery.data ? (
        <EstimateDetailView estimate={estimateQuery.data} versions={versions} />
      ) : null}
    </AppShell>
  );
};
