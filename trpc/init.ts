import { auth } from "@/server/auth";
import { initTRPC, TRPCError } from "@trpc/server";
import { cache } from "react";
import { headers } from "next/headers";

export const createTRPCContext = cache(async () => {
	/**
	 * @see: https://trpc.io/docs/server/context
	 */

	const headersList = await headers();
	const session = await auth.api.getSession({
		headers: headersList,
	});

	return {
		session,
		user: session?.user || null,
		userId: session?.user?.id || null,
	};
});
// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
const t = initTRPC.context<Context>().create({
	/**
	 * @see https://trpc.io/docs/server/data-transformers
	 */
	// transformer: superjson,
});

const isAuthenticated = t.middleware(({ ctx, next }) => {
	if (!ctx.session || !ctx.user || !ctx.userId) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}

	return next({
		ctx: {
			...ctx,
			user: ctx.user, // now guaranteed to exist
		},
	});
});

// Base router and procedure helpers
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthenticated);
export const createTRPCRouter = t.router;
