# claude.md — tRPC v11 tips for Kampe

**Scope:** Tips and guardrails for using **tRPC v11** with **Next.js 15 / React 19 / TanStack Query v5** in the Kampe POD codebase. This is written for agentic dev tools (Claude Code, Cursor) to follow without hallucinating legacy APIs.

---

## Core Principles

* **Verify-first:** Always check current official tRPC docs before suggesting patterns.
* **No legacy APIs:** Do **not** use v9 `.interop()` or outdated client hooks/APIs.
* **Keep diffs small:** Prefer focused changes; map every change to a Linear issue.
* **Server-first:** Use RSC (App Router) patterns where possible; hydrate client cache with provided helpers.

---

## Packages & Setup

* Use `@trpc/server`, `@trpc/client`, and `@trpc/react-query` v11.
* React Query must be **TanStack Query v5**. Enable Suspense at the hook call where appropriate.
* Links: default to `httpBatchLink`; for streaming use `httpBatchStreamLink`.

**Client bootstrap (example):**

```ts
// lib/trpc.ts
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/server/router";

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({ url: "/api/trpc" }),
  ],
});
```

**React integration (Query v5):**

```tsx
// app/providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const qc = new QueryClient();
export function Providers({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}
```

---

## FormData & Non‑JSON Content Types

* v11 supports **FormData** and binary types (Blob, File, Uint8Array) without custom transports.
* Use `z.instanceof(FormData)` for FormData inputs.
* For binary streams, use `octetInputParser` from `@trpc/server/http`.

```ts
// server/router.ts
import { router, publicProcedure } from './trpc';
import { z } from 'zod';
import { octetInputParser } from '@trpc/server/http';

export const appRouter = router({
  uploadFormData: publicProcedure
    .input(z.instanceof(FormData))
    .mutation(async ({ input }) => {
      // handle fields/files from FormData
      return { ok: true };
    }),

  uploadBinary: publicProcedure
    .input(octetInputParser)
    .mutation(async ({ input }) => {
      // input: ReadableStream
      return { bytes: 0 };
    }),
});
```

**Agent note:** Prefer FormData for mixed text/files from browsers; prefer octet streams for server‑to‑server or large uploads.

---

## RSC + App Router Prefetch/Hydration

* Start the procedure on the **server** (RSC), then hydrate the **client** cache.
* Use server helpers to prefetch, then continue on the client with React Query hooks (no waterfalls).

```tsx
// app/(shop)/products/[id]/page.tsx (RSC)
import { createCaller } from '@/server/trpc';
import { getServerAuth } from '@/server/auth';
import ProductView from './product-view';

export default async function Page({ params }: { params: { id: string } }) {
  const ctx = { auth: await getServerAuth() };
  const caller = createCaller(ctx);
  const product = await caller.products.byId.query({ id: params.id });
  return <ProductView initialProduct={product} />;
}
```

```tsx
// app/(shop)/products/[id]/product-view.tsx (client)
'use client';
import { trpcReact } from '@/lib/trpc-react';

export default function ProductView({ initialProduct }: { initialProduct: any }) {
  const { data } = trpcReact.products.byId.useQuery(
    { id: initialProduct.id },
    { initialData: initialProduct }
  );
  return <div>{data.name}</div>;
}
```

**Agent note:** Prefer `createCaller` in RSC for secure, server‑only work; use client hooks only for dynamic interactivity.

---

## Streaming Responses

* Use `httpBatchStreamLink` to stream query/mutation output (progressive rendering, large lists, long‑running jobs).

```ts
// client
import { createTRPCClient, httpBatchStreamLink } from '@trpc/client';

const trpc = createTRPCClient<AppRouter>({
  links: [httpBatchStreamLink({ url: '/api/trpc' })],
});

const iter = await trpc.reports.generate.query();
for await (const chunk of iter) {
  console.log('progress', chunk);
}
```

**Server generator:**

```ts
// server
const appRouter = router({
  reports: {
    generate: publicProcedure.query(async function* () {
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 300));
        yield { step: i };
      }
    }),
  },
});
```

---

## Subscriptions via SSE (Recommended)

* Prefer **SSE** over WebSockets for simple real‑time updates.
* Write subscription handlers using **generators**; add **output validators** for safety.

```ts
export const appRouter = router({
  priceTicker: publicProcedure.subscription(async function* () {
    while (true) {
      await new Promise(r => setTimeout(r, 1000));
      yield { price: Math.random() };
    }
  }),
});
```

---

## Shorthand Router Definitions

* You can nest sub‑routers via plain objects; tRPC converts them under the hood.

```ts
const appRouter = router({
  products: {
    byId: publicProcedure.query(() => '...'),
  },
  // equivalent to router({ products: router({ byId: ... }) })
});
```

---

## Next.js Integration Notes (Kampe)

* Use **App Router**; avoid legacy pages router patterns.
* Place server router/context under `server/trpc` and feature routers beside feature code.
* Pass Better Auth session/user on `ctx` for authz.
* Keep files ≤ 500 lines; functions ≤ 30 lines; enforce with ESLint rules and agent prompts.

---

## Migration Watch‑outs (v10 → v11)

* Remove any v9 `.interop()` remnants.
* Ensure all React Query usage is **v5** style (changed APIs around suspense, mutation options, etc.).
* Audit custom uploads; prefer new FormData/binary support before introducing bespoke endpoints.
* If you used WebSockets for simple push updates, evaluate switching to **SSE subscriptions**.

---

## Agent Guardrails (paste into .cursorrules or Claude project rules)

* Always assume **tRPC v11**.
* Prefer **SSE subscriptions**; only use WebSockets if bi‑directional is required.
* For uploads, prefer **FormData** or **octetInputParser**.
* For RSC pages, use **createCaller** and hydrate via React Query on the client.
* Use **httpBatchStreamLink** for long‑running or progressive results.
* No undocumented APIs. If unsure, ask for clarification and cite tRPC docs.

---

## Done‑ness Checklist

* [ ] Uses v11 server/client packages.
* [ ] React Query is v5 + hooks configured correctly.
* [ ] No deprecated `.interop()` usage.
* [ ] Upload paths use FormData or octet streams.
* [ ] RSC prefetch + client hydration pattern in place where applicable.
* [ ] Streaming or SSE used where they simplify code.
