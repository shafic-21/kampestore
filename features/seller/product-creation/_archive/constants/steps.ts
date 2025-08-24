export const STEPS = [
  "", 
  "existing/search",
  "existing/variants",
  "existing/offer",
  "unique/basic-info",
  "unique/detailed-info",
  "unique/variants",
  "unique/images",
  "unique/offer",
] as const;

export type Step = (typeof STEPS)[number];

export function resolveStep(segments?: string[]): Step | null {
  const joined = segments?.join("/") ?? "";
  return (STEPS as readonly string[]).includes(joined)
    ? (joined as Step)
    : null;
}
