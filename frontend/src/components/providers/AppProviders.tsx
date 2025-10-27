import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "@/providers/AuthProvider";
import { ThemeModeProvider } from "@/providers/ThemeModeProvider";

type AppProvidersProps = {
  children: ReactNode;
};

export const AppProviders = ({ children }: AppProvidersProps) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeModeProvider>
        <AuthProvider>{children}</AuthProvider>
      </ThemeModeProvider>
    </QueryClientProvider>
  );
};
