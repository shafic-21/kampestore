import { TRPCProvider } from "@/trpc/client";
import { ThemeProvider as NextThemesProvider } from "next-themes";

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
