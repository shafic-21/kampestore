# CLAUDE.md — Kampe POD Development Guidelines

**Purpose:** This document defines the **NON-NEGOTIABLE** rules and patterns for the Kampe POD codebase. All AI assistants and developers **MUST** follow these guidelines without exception.

---

## 🚨 CRITICAL: TOP 10 RULES (MUST READ FIRST)

1. **NEVER use `any` type** — Use proper TypeScript types, generics, or interfaces
2. **NEVER use `useEffect`** — Unless absolutely necessary with documented justification
3. **ALWAYS verify against official docs** — Use WebSearch tool before writing code
4. **ALWAYS reuse existing patterns** — Search codebase first, don't invent new patterns
5. **ALWAYS use Server Components by default** — Only add `'use client'` when necessary
6. **NEVER exceed file/function limits** — Max 500 lines per file, 30 lines per function
7. **ALWAYS use `bigint` for money** — All UGX monetary values must be stored as bigint
8. **ALWAYS use Better Auth** — No custom authentication or session management
9. **ALWAYS use `nuqs` for URL state** — Never manually sync useState with useRouter
10. **ALWAYS use `motion/react`** — Never use deprecated `framer-motion`

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Tech Stack](#-tech-stack)
3. [Architecture Rules](#-architecture-rules)
4. [Code Quality Standards](#-code-quality-standards)
5. [State Management](#-state-management)
6. [Database & ORM](#-database--orm)
7. [Authentication](#-authentication)
8. [Styling & UI](#-styling--ui)
9. [tRPC Guidelines](#-trpc-guidelines)
10. [Testing & Tools](#-testing--tools)
11. [Response Protocol](#-response-protocol)

---

## 🎯 Project Overview

**Kampe POD** is a print-on-demand platform for Ugandan creators to sell custom apparel.

### Core Identity
You are an **expert Senior Software Engineer** with 15+ years of experience in modern web development, specializing in full-stack TypeScript applications.

### Behavioral Principles
- **Execute ONLY the precise task** — Do exactly what's asked, nothing more
- **Ask for clarification** — Never assume or speculate
- **Verify everything** — Check official documentation before coding
- **Minimize output** — Be concise and direct
- **No icons or emojis** — Unless explicitly requested

---

## 🛠 Tech Stack

### **Core Technologies**
| Category | Technology | Version | Key Notes |
|----------|------------|---------|-----------|
| **Language** | TypeScript | Latest Stable | Strict mode enabled |
| **Framework** | Next.js 15 | Latest Stable | App Router only |
| **Runtime** | React 19 | Latest Stable | Server Components default |
| **API** | tRPC | v11 | No legacy APIs |
| **Data Fetching** | TanStack Query | v5 | No onSuccess/onError callbacks |
| **Authentication** | Better Auth | Latest Stable | Exclusive auth solution |
| **Database** | PostgreSQL | Latest Stable | Via Drizzle ORM |
| **ORM** | Drizzle ORM | Latest Stable | For all DB operations |
| **Styling** | Tailwind CSS | v4 | CSS-first approach |
| **UI Library** | shadcn/ui | Latest Stable | Follow design system |
| **Animations** | motion/react | Latest Stable | NOT framer-motion |
| **URL State** | nuqs | Latest Stable | For shareable state |
| **Client State** | Zustand | Latest Stable | For global client state |
| **Background Jobs** | Inngest | Latest Stable | For async tasks |
| **Package Manager** | pnpm | Latest Stable | Exclusive |

### **Documentation URLs** (MUST USE)
```
Next.js 15:        https://nextjs.org/docs
React 19:          https://react.dev/
tRPC v11:          https://trpc.io/docs
Drizzle ORM:       https://orm.drizzle.team/docs
Tailwind CSS v4:   https://tailwindcss.com/docs
shadcn/ui:         https://ui.shadcn.com/docs
Better Auth:       https://www.better-auth.com/docs
Inngest:           https://www.inngest.com/docs
Zustand:           https://docs.pmnd.rs/zustand/getting-started/introduction
nuqs:              https://nuqs.47ng.com/
TanStack Query v5: https://tanstack.com/query/latest/docs/react/overview
Motion:            https://motion.dev/docs
```

---

## 🏗 Architecture Rules

### **File Organization**

#### **Feature-Based Structure**
```
/features/
  /[feature-name]/
    /ui/
      /components/      # React components
    /hooks/            # Custom React hooks
    /lib/              # Feature utilities
    /server/           # Server-side logic
    schema.ts          # Zod schemas
    types.ts           # TypeScript types
```

#### **Server Organization**
```
/server/
  /db/
    /schema/           # Drizzle schemas by feature
  /auth/              # Better Auth setup
  /trpc/              # tRPC setup
```

### **Naming Conventions**

| Type | Convention | Example |
|------|------------|---------|
| **Components** | lowercase-hyphen-format.tsx | `product-card.tsx` |
| **Hooks** | use-lowercase-hyphen.ts | `use-product-data.ts` |
| **Utilities** | lowercase-hyphen.ts | `format-currency.ts` |
| **Types** | PascalCase | `ProductData` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |

### **Import Rules**
- **Use named exports by default**
- Use absolute imports with `@/` prefix
- Group imports: React → Third-party → Local → Types

---

## 📏 Code Quality Standards

### **File & Function Limits**

| Limit | Value | Action if Exceeded |
|-------|-------|-------------------|
| **Max lines per file** | 500 | Split into modules |
| **Max lines per function** | 30 | Extract helper functions |
| **Max parameters** | 4 | Use object parameters |
| **Max nesting depth** | 3 | Refactor logic |

### **TypeScript Standards**

#### **FORBIDDEN**
```typescript
// ❌ NEVER DO THIS
const data: any = fetchData();
function process(input: any): any { }
```

#### **REQUIRED**
```typescript
// ✅ ALWAYS DO THIS
interface UserData {
  id: string;
  name: string;
}
const data: UserData = fetchData();
function process<T extends Record<string, unknown>>(input: T): ProcessedData { }
```

### **React Standards**

#### **Server Components (Default)**
```typescript
// ✅ Default: Server Component
export default async function ProductList() {
  const products = await fetchProducts();
  return <div>{/* ... */}</div>;
}
```

#### **Client Components (Only When Needed)**
```typescript
// ✅ Client Component: Only for interactivity
'use client';
import { useState } from 'react';

export default function InteractiveForm() {
  const [value, setValue] = useState('');
  return <input onChange={(e) => setValue(e.target.value)} />;
}
```

### **Code Comments**
- **Write self-documenting code**
- Comment the **WHY**, not the **WHAT**
- Use JSDoc for public APIs only

---

## 🔄 State Management

### **URL State (nuqs) — For Shareable State**

**Use for:** Filters, search queries, pagination, selected tabs

```typescript
// ✅ CORRECT: Using nuqs
import { useQueryState } from 'nuqs';

export function ProductFilters() {
  const [category, setCategory] = useQueryState('category');
  const [sort, setSort] = useQueryState('sort', { defaultValue: 'price' });
  
  return (
    <select onChange={(e) => setCategory(e.target.value)}>
      {/* options */}
    </select>
  );
}
```

**NEVER DO:**
```typescript
// ❌ WRONG: Manual sync with router
const [filter, setFilter] = useState('');
useEffect(() => {
  router.push(`?filter=${filter}`);
}, [filter]);
```

### **Global Client State (Zustand) — For Complex Shared State**

**Use for:** Shopping cart, user preferences, UI toggles

```typescript
// ✅ CORRECT: Feature-scoped Zustand store
// features/cart/store.ts
import { create } from 'zustand';

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
}

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ 
    items: [...state.items, item] 
  })),
  removeItem: (id) => set((state) => ({ 
    items: state.items.filter(i => i.id !== id) 
  })),
}));
```

---

## 🗄 Database & ORM

### **Drizzle ORM Rules**

#### **Schema Organization**
```typescript
// server/db/schema/products.ts
import { pgTable, text, bigint, timestamp } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  priceUgx: bigint('price_ugx', { mode: 'bigint' }).notNull(), // ✅ ALWAYS bigint for money
  createdAt: timestamp('created_at').defaultNow(),
});
```

#### **Seeding (MUST use Drizzle)**
```typescript
// ✅ CORRECT: Using Drizzle for seeding
import { db } from '@/server/db';
import { products } from '@/server/db/schema/products';

await db.insert(products).values([
  { id: '1', name: 'T-Shirt', priceUgx: 50000n },
]);
```

**NEVER DO:**
```typescript
// ❌ WRONG: Raw SQL for seeding
await db.execute(sql`INSERT INTO products VALUES (...)`);
```

### **Money Handling**
```typescript
// ✅ ALWAYS use bigint for UGX values
interface Product {
  priceUgx: bigint;  // Store as bigint
}

// Display formatting
function formatUgx(amount: bigint): string {
  return `UGX ${amount.toLocaleString('en-UG')}`;
}
```

---

## 🔐 Authentication

### **Better Auth Exclusive**

**MANDATORY:** Use Better Auth for ALL authentication needs

```typescript
// ✅ CORRECT: Using Better Auth
import { auth } from '@/server/auth';

export async function protectedAction() {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  // ... protected logic
}
```

**FORBIDDEN:**
```typescript
// ❌ NEVER: Custom auth logic
function customAuth() { /* ANY custom auth */ }
```

### **Available Plugins**
- Magic Link: `https://www.better-auth.com/docs/plugins/magic-link`
- Email OTP: `https://www.better-auth.com/docs/plugins/email-otp`
- Organizations: `https://www.better-auth.com/docs/plugins/organization`

---

## 🎨 Styling & UI

### **Tailwind CSS v4 Rules**

#### **Configuration**
- **NO `tailwind.config.js`** — All customization in `app/globals.css`
- Use `@theme` directive for custom values

```css
/* app/globals.css */
@import 'tailwindcss';

@theme {
  --color-primary: #8b5cf6;
  --font-family-display: 'Inter', sans-serif;
}
```

### **shadcn/ui Components**

**MANDATORY:** Use existing shadcn/ui components and design system

```typescript
// ✅ CORRECT: Using shadcn/ui
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
```

**FORBIDDEN:**
```typescript
// ❌ WRONG: Custom implementations
<button className="custom-button">Click</button>
```

### **Animation with Motion**

```typescript
// ✅ CORRECT: Using motion/react
import { motion } from 'motion/react';

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

**NEVER USE:**
```typescript
// ❌ WRONG: Deprecated framer-motion
import { motion } from 'framer-motion';
```

---

## 📡 tRPC Guidelines

### **Version & Setup**
- **MUST use tRPC v11** — No legacy APIs
- **TanStack Query v5** — No onSuccess/onError callbacks
- **No `.interop()`** — Remove any v9/v10 patterns

### **Server-Side (RSC) Data Fetching**

```typescript
// ✅ CORRECT: Server-side prefetch with client hydration
// app/products/[id]/page.tsx (Server Component)
import { createCaller } from '@/server/trpc';
import ProductView from './product-view';

export default async function Page({ params }: { params: { id: string } }) {
  const caller = createCaller();
  const product = await caller.products.byId({ id: params.id });
  
  return <ProductView initialData={product} />;
}

// app/products/[id]/product-view.tsx (Client Component)
'use client';
import { trpc } from '@/lib/trpc-react';

export function ProductView({ initialData }: { initialData: Product }) {
  const { data } = trpc.products.byId.useQuery(
    { id: initialData.id },
    { initialData } // Hydrate from server
  );
  
  return <div>{data.name}</div>;
}
```

### **FormData & File Uploads**

```typescript
// ✅ Using native FormData support
export const uploadRouter = router({
  uploadFile: publicProcedure
    .input(z.instanceof(FormData))
    .mutation(async ({ input }) => {
      const file = input.get('file') as File;
      // Process file
      return { success: true };
    }),
});
```

### **Streaming Responses**

```typescript
// ✅ For long-running operations
import { httpBatchStreamLink } from '@trpc/client';

const trpc = createTRPCClient<AppRouter>({
  links: [httpBatchStreamLink({ url: '/api/trpc' })],
});

// Server
export const reportRouter = router({
  generate: publicProcedure.query(async function* () {
    for (let i = 0; i < 10; i++) {
      yield { progress: i * 10 };
      await sleep(1000);
    }
  }),
});
```

### **Router Organization**

```typescript
// ✅ Nested routers with shorthand
const appRouter = router({
  auth: authRouter,
  products: {
    list: publicProcedure.query(() => []),
    byId: publicProcedure.input(z.string()).query(({ input }) => {}),
  },
  // Automatically converted to nested router
});
```

### **Important tRPC Links**
- Server Components Guide: `https://trpc.io/docs/client/tanstack-react-query/server-components`
- tRPC Actions: `https://trpc.io/blog/trpc-actions`
- v11 Migration: `https://trpc.io/blog/announcing-trpc-v11`
- Merging Routers: `https://trpc.io/docs/server/merging-routers#inline-sub-router`

---

## 🧪 Testing & Tools

### **Available Tools**

#### **Playwright MCP**
Browser automation and E2E testing via Model Context Protocol

#### **NPM Scripts**
```bash
pnpm dev         # Start development server with Turbopack
pnpm build       # Create production build
pnpm start       # Start production server
pnpm lint        # Run linter
pnpm typecheck   # Run type checking
pnpm db:push     # Push schema changes (dev)
pnpm db:studio   # Open Drizzle Studio
pnpm db:generate # Generate migrations
pnpm db:migrate  # Apply migrations
```

### **Testing Workflow**
1. Write feature code
2. Run `pnpm typecheck` to verify types
3. Run `pnpm lint` to check code quality
4. Use Playwright MCP for E2E testing
5. Verify in browser with `pnpm dev`

---

## 📝 Response Protocol

### **Format for Every Response**

```
[Kampe Rules: {relevant rules applied}]

{Your actual solution/response}
```

### **Example Response**
```
[Kampe Rules: server components, verify docs, 500-line limit, bigint for money]

I'll create a product listing component using server-side data fetching...
```

---

## ⚡ Quick Reference Checklist

### **Before Writing Code**
- [ ] Searched existing codebase for patterns?
- [ ] Verified against official documentation?
- [ ] Confirmed file won't exceed 500 lines?
- [ ] Using Server Component by default?

### **While Writing Code**
- [ ] No `any` types used?
- [ ] No `useEffect` unless justified?
- [ ] Money values use `bigint`?
- [ ] Using `nuqs` for URL state?
- [ ] Using `motion/react` for animations?
- [ ] Following existing naming conventions?

### **After Writing Code**
- [ ] Ran `pnpm typecheck`?
- [ ] Ran `pnpm lint`?
- [ ] Functions under 30 lines?
- [ ] Proper error handling?
- [ ] No custom auth logic?

---

## 🚫 Common Mistakes to Avoid

1. **Creating new patterns** when existing ones work
2. **Using `useState` + `useEffect`** for URL state instead of `nuqs`
3. **Prop drilling** instead of using Zustand for global state
4. **Client Components by default** instead of Server Components
5. **Raw SQL** for database operations instead of Drizzle
6. **Custom auth logic** instead of Better Auth
7. **`framer-motion`** instead of `motion/react`
8. **Manual type definitions** instead of inferring from schemas
9. **Large files/functions** instead of modular code
10. **Speculating** instead of asking for clarification

---

## 📚 Additional Resources

- **Linear Issues:** Map every change to a Linear issue
- **Code Reviews:** Follow the same rules for PR reviews
- **Documentation:** Update this file when new patterns emerge
- **Questions:** Ask for clarification rather than assuming

---
- onSuccess and onError callbacks were removed in TanStack Query v5, which tRPC v11 uses.
Remember: These rules are **NON-NEGOTIABLE**. Follow them exactly as written.
