import sharp from "sharp";
import type { ColorProfile } from "../types/store.types";
import type {
	BulkMockupOptions,
	MockupGenerationOptions,
	MockupResult,
} from "../types/mockup.types";

export class MockupGenerator {
	/**
	 * Extract color profile and dimensions from design buffer.
	 * PUBLIC method - called during design upload only.
	 */
	static async extractColorProfileAndSize(designBuffer: Buffer): Promise<{
		colorProfile: ColorProfile;
		width: number;
		height: number;
	}> {
		try {
			const image = sharp(designBuffer);

			// Get image dimensions
			const metadata = await image.metadata();
			const { width, height } = metadata;

			if (!width || !height) {
				throw new Error("Unable to determine image dimensions");
			}

			// Get raw pixel data for color analysis
			const { data } = await image
				.raw()
				.ensureAlpha()
				.toBuffer({ resolveWithObject: true });

			// Sample ~1000 pixels for performance
			const colorMap = new Map<string, number>();
			const step = Math.max(1, Math.floor(data.length / (4 * 1000)));

			for (let i = 0; i < data.length; i += step * 4) {
				const r = data[i];
				const g = data[i + 1];
				const b = data[i + 2];
				const a = data[i + 3];

				// Skip transparent pixels
				if (a < 128) continue;

				// Quantize colors to reduce noise (group similar shades)
				const qR = Math.round(r / 32) * 32;
				const qG = Math.round(g / 32) * 32;
				const qB = Math.round(b / 32) * 32;

				const color = `rgb(${qR},${qG},${qB})`;
				colorMap.set(color, (colorMap.get(color) || 0) + 1);
			}

			// Get top 5 most frequent colors
			const sortedColors = Array.from(colorMap.entries())
				.sort((a, b) => b[1] - a[1])
				.slice(0, 5)
				.map(([color]) => color);

			const dominantColor = sortedColors[0] || "rgb(0,0,0)";

			// Classify color profile for auto-suggestions
			const [r, g, b] = dominantColor.match(/\d+/g)!.map(Number);
			const brightness = (r * 299 + g * 587 + b * 114) / 1000;
			const saturation = Math.max(r, g, b) - Math.min(r, g, b);

			let profile: ColorProfile["profile"];
			if (brightness < 85) profile = "dark";
			else if (brightness > 170) profile = "light";
			else if (saturation > 50) profile = "vibrant";
			else profile = "muted";

			return {
				colorProfile: { colors: sortedColors, dominantColor, profile },
				width,
				height,
			};
		} catch (error) {
			console.warn("Color extraction failed:", error);
			return {
				colorProfile: {
					colors: ["rgb(0,0,0)"],
					dominantColor: "rgb(0,0,0)",
					profile: "dark",
				},
				width: 100,
				height: 100,
			};
		}
	}

	/**
	 * Generate single mockup from design and template.
	 * PRIVATE method - used internally for both single and bulk generation.
	 */
	private static async generateSingleMockup(
		options: MockupGenerationOptions,
	): Promise<MockupResult> {
		const {
			designBuffer,
			templateBuffer,
			backgroundColor,
			templateSize,
			printArea,
			placement,
			outputFormat = "png",
			quality = 90,
		} = options;

		// Calculate design position within print area
		const designX = Math.round(printArea.x_px + placement.left);
		const designY = Math.round(printArea.y_px + placement.top);
		const designWidth = Math.round(placement.width);
		const designHeight = Math.round(placement.height);

		// Get design metadata
		const designMeta = await sharp(designBuffer).metadata();
		if (!designMeta.width || !designMeta.height) {
			throw new Error("Unable to read design dimensions");
		}

		const aspectRatio = designMeta.width / designMeta.height;
		const targetAspectRatio = designWidth / designHeight;

		let scaledWidth: number, scaledHeight: number;
		let offsetX = 0,
			offsetY = 0;

		// Maintain aspect ratio
		if (aspectRatio > targetAspectRatio) {
			scaledWidth = designWidth;
			scaledHeight = Math.round(designWidth / aspectRatio);
			offsetY = Math.round((designHeight - scaledHeight) / 2);
		} else {
			scaledHeight = designHeight;
			scaledWidth = Math.round(designHeight * aspectRatio);
			offsetX = Math.round((designWidth - scaledWidth) / 2);
		}

		// Resize design
		const scaledDesign = await sharp(designBuffer)
			.resize(scaledWidth, scaledHeight, {
				fit: "fill",
				kernel: sharp.kernel.lanczos3,
			})
			.toBuffer();

		// Apply rotation if needed
		let finalDesign = scaledDesign;
		if (placement.rotation !== 0) {
			finalDesign = await sharp(scaledDesign)
				.rotate(placement.rotation, {
					background: { r: 0, g: 0, b: 0, alpha: 0 },
				})
				.toBuffer();
		}

		// Get the actual dimensions of the final design after rotation
		const finalDesignMeta = await sharp(finalDesign).metadata();
		const finalDesignWidth = finalDesignMeta.width!;
		const finalDesignHeight = finalDesignMeta.height!;

		// Calculate the position where to place the design
		const compositeX = Math.max(
			0,
			Math.min(designX + offsetX, templateSize.width),
		);
		const compositeY = Math.max(
			0,
			Math.min(designY + offsetY, templateSize.height),
		);

		// If design extends beyond canvas, we need to extract only the visible part
		let visibleDesign = finalDesign;
		if (
			designX + offsetX < 0 ||
			designY + offsetY < 0 ||
			designX + offsetX + finalDesignWidth > templateSize.width ||
			designY + offsetY + finalDesignHeight > templateSize.height
		) {
			// Calculate the extraction region from the design
			const extractX = Math.max(0, -(designX + offsetX));
			const extractY = Math.max(0, -(designY + offsetY));
			const extractWidth = Math.min(
				finalDesignWidth - extractX,
				templateSize.width - Math.max(0, designX + offsetX),
			);
			const extractHeight = Math.min(
				finalDesignHeight - extractY,
				templateSize.height - Math.max(0, designY + offsetY),
			);

			// Extract only the visible portion of the design
			if (extractWidth > 0 && extractHeight > 0) {
				visibleDesign = await sharp(finalDesign)
					.extract({
						left: extractX,
						top: extractY,
						width: extractWidth,
						height: extractHeight,
					})
					.toBuffer();
			} else {
				// Design is completely outside visible area
				visibleDesign = Buffer.from([]);
			}
		}

		// Create background
		const background = await sharp({
			create: {
				width: templateSize.width,
				height: templateSize.height,
				channels: 4,
				background: backgroundColor,
			},
		})
			.png()
			.toBuffer();

		// Build composite operations array
		const compositeOps = [];

		// Add design if it's visible
		if (visibleDesign.length > 0) {
			// Check if we need to clip to print area
			const needsClipping =
				compositeX < printArea.x_px ||
				compositeY < printArea.y_px ||
				compositeX + finalDesignWidth > printArea.x_px + printArea.width_px ||
				compositeY + finalDesignHeight > printArea.y_px + printArea.height_px;

			if (needsClipping) {
				// Create a clipped version using mask
				const maskSvg = Buffer.from(
					`<svg width="${templateSize.width}" height="${templateSize.height}">
             <rect x="${printArea.x_px}" y="${printArea.y_px}"
                   width="${printArea.width_px}" height="${printArea.height_px}"
                   fill="white"/>
           </svg>`,
				);

				// First add the design
				const withDesign = await sharp(background)
					.composite([
						{
							input: visibleDesign,
							left: compositeX,
							top: compositeY,
							blend: "over",
						},
					])
					.png()
					.toBuffer();

				// Then apply mask to clip to print area
				const clipped = await sharp(withDesign)
					.composite([
						{
							input: maskSvg,
							blend: "dest-in",
						},
					])
					.png()
					.toBuffer();

				// Final composite with template
				const finalComposite = await sharp(background)
					.composite([
						{
							input: clipped,
							left: 0,
							top: 0,
							blend: "over",
						},
						{
							input: templateBuffer,
							left: 0,
							top: 0,
							blend: "over",
						},
					])
					[outputFormat]({ quality })
					.toBuffer();

				const metadata = await sharp(finalComposite).metadata();
				return {
					mockupBuffer: finalComposite,
					metadata: {
						width: metadata.width!,
						height: metadata.height!,
						size: finalComposite.length,
					},
				};
			} else {
				// No clipping needed, just composite normally
				compositeOps.push({
					input: visibleDesign,
					left: compositeX,
					top: compositeY,
					blend: "over" as const,
				});
			}
		}

		// Add template
		compositeOps.push({
			input: templateBuffer,
			left: 0,
			top: 0,
			blend: "over" as const,
		});

		// Final composite
		const finalComposite = await sharp(background)
			.composite(compositeOps)
			[outputFormat]({ quality })
			.toBuffer();

		const metadata = await sharp(finalComposite).metadata();

		return {
			mockupBuffer: finalComposite,
			metadata: {
				width: metadata.width!,
				height: metadata.height!,
				size: finalComposite.length,
			},
		};
	}
	/**
	 * Generate single mockup.
	 * PUBLIC method for single mockup generation.
	 */
	static async generateMockup(
		options: MockupGenerationOptions,
	): Promise<MockupResult> {
		return this.generateSingleMockup(options);
	}

	/**
	 * Generate multiple mockups with progress tracking.
	 * PUBLIC method for bulk mockup generation with Teespring-style progressive updates.
	 */
	static async generateBulkMockups(
		options: BulkMockupOptions,
	): Promise<Array<{ id: string; result: MockupResult }>> {
		const { designBuffer, placement, variants, onProgress } = options;
		const results: Array<{ id: string; result: MockupResult }> = [];

		let completed = 0;
		const total = variants.length;

		// Process in chunks for optimal performance and memory usage
		const chunkSize = 3;
		for (let i = 0; i < variants.length; i += chunkSize) {
			const chunk = variants.slice(i, i + chunkSize);

			// Process chunk in parallel
			await Promise.all(
				chunk.map(async (variant) => {
					try {
						const result = await this.generateSingleMockup({
							designBuffer,
							templateBuffer: variant.templateBuffer,
							backgroundColor: variant.backgroundColor,
							templateSize: variant.templateSize,
							printArea: variant.printArea,
							placement,
						});

						results.push({ id: variant.id, result });
						completed++;

						// Report progress for UI updates (Teespring-style)
						onProgress?.(completed, total, variant.id);
					} catch (error) {
						console.error(
							`Failed to generate mockup for variant ${variant.id}:`,
							error,
						);
						completed++;
						onProgress?.(completed, total, variant.id);
					}
				}),
			);

			// Yield to event loop between chunks to prevent blocking
			if (i + chunkSize < variants.length) {
				await new Promise((resolve) => setTimeout(resolve, 0));
			}
		}

		return results;
	}
}
