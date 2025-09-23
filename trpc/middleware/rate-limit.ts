import { TRPCError } from "@trpc/server";
import { publicProcedure } from "../init";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
	maxRequests: number;
	windowMs: number;
	keyExtractor?: (input: any) => string;
}

export function createRateLimitMiddleware(config: RateLimitConfig) {
	const {
		maxRequests,
		windowMs,
		keyExtractor = (input) => input?.email || "unknown",
	} = config;

	return publicProcedure.use(({ input, next }) => {
		const clientId = keyExtractor(input);
		const now = Date.now();

		const existing = rateLimitMap.get(clientId);
		if (existing && now < existing.resetTime) {
			if (existing.count >= maxRequests) {
				throw new TRPCError({
					code: "TOO_MANY_REQUESTS",
					message:
						"Too many requests. We have a lot of traffic right now, please try again later.",
				});
			}
			existing.count += 1;
		} else {
			rateLimitMap.set(clientId, {
				count: 1,
				resetTime: now + windowMs,
			});
		}

		return next();
	});
}
