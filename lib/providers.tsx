/* eslint-disable @typescript-eslint/no-explicit-any */
import { TRPCProvider } from "@/trpc/client";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";

type ProviderTuple = [React.ElementType, Record<string, any>?];

function composeProviders(
  ...providers: ProviderTuple[]
): React.FC<{ children: React.ReactNode }> {
  return ({ children }) =>
    providers.reduceRight(
      (child, [Provider, props = {}]) => (
        <Provider {...props}>{child}</Provider>
      ),
      <>{children}</>,
    );
}

export const AppProviders = composeProviders(
  [TRPCProvider],
  [NuqsAdapter],
  [
    NextThemesProvider,
    {
      attribute: "class",
      defaultTheme: "light",
      enableSystem: false,
      disableTransitionOnChange: true,
      enableColorScheme: true,
      storageKey: "theme",
    },
  ],
);
