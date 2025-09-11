import { TRPCError } from "@trpc/server";

export class BaseSkuNotFoundError extends TRPCError {
	constructor(id: string) {
		super({
			code: "NOT_FOUND",
			message: `Base SKU with id '${id}' not found`,
		});
	}
}

export class ColorAttributeNotFoundError extends TRPCError {
	constructor() {
		super({
			code: "INTERNAL_SERVER_ERROR",
			message: "Color attribute not configured in system",
		});
	}
}

export class CategoryNotFoundError extends TRPCError {
	constructor(slug: string) {
		super({
			code: "NOT_FOUND",
			message: `Category with slug '${slug}' not found`,
		});
	}
}
