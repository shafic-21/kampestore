import { publicProcedure } from "@/trpc/init";
import { MockupGenerator } from "./mockup-generator";
import z from "zod";
import { bulkMockupInputSchema, mockupInputSchema } from "./schema";
import { downloadFile } from "@/lib/r2";

export const mockupGeneratorRouter = {
  /**
   * Extract colors and dimensions from design during upload flow.
   * Called once when user uploads a design file.
   */
  extractColorsAndSize: publicProcedure
    .input(
      z.object({
        designR2Key: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const designBuffer = await downloadFile("PUBLIC", input.designR2Key);

      const result =
        await MockupGenerator.extractColorProfileAndSize(designBuffer);

      return result;
    }),

  /**
   * Generate single mockup for preview.
   * Uses cached color profile from layer data (no re-extraction).
   */
  generateMockup: publicProcedure
    .input(mockupInputSchema)
    .mutation(async ({ input }) => {
      const designBuffer = await downloadFile("PUBLIC", input.designR2Key);
      const templateBuffer = await downloadFile("PUBLIC", input.templateR2Key);

      const result = await MockupGenerator.generateMockup({
        designBuffer,
        templateBuffer,
        backgroundColor: input.backgroundColor,
        templateSize: input.templateSize,
        printArea: input.printArea,
        placement: input.placement,
        outputFormat: input.outputFormat,
        quality: input.quality,
      });
      return {
        mockupData: result.mockupBuffer.toString("base64"),
        contentType: `image/${input.outputFormat}`,
        metadata: result.metadata,
      };
    }),

  /**
   * Generate multiple mockups with progress updates.
   * Processes variants in chunks for optimal performance.
   */
  generateBulkMockups: publicProcedure
    .input(bulkMockupInputSchema)
    .mutation(async ({ input }) => {
      const designBuffer = await downloadFile("PUBLIC", input.designR2Key);

      const variants = await Promise.all(
        input.variants.map(async (variant) => ({
          ...variant,

          templateBuffer: await downloadFile("PUBLIC", variant.templateR2Key),
        })),
      );

      const results = await MockupGenerator.generateBulkMockups({
        designBuffer,
        placement: input.placement,
        variants,
        onProgress: (completed, total, variantId) => {
          // Progress handled on client via store updates
          console.log(`Mockup generated: ${variantId} (${completed}/${total})`);
        },
      });

      // TODO: Convert all buffers to blob URLs for client-side caching
      return results.map(({ id, result }) => ({
        id,
        mockupData: result.mockupBuffer.toString("base64"),
        contentType: "image/png",
        metadata: result.metadata,
      }));
    }),
};
