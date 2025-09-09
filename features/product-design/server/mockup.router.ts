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
      console.log('[MockupRouter] Starting single mockup generation');
      console.log('[MockupRouter] Input:', {
        designR2Key: input.designR2Key,
        templateR2Key: input.templateR2Key,
        backgroundColor: input.backgroundColor,
        templateSize: input.templateSize,
        printArea: input.printArea,
        placement: input.placement,
        outputFormat: input.outputFormat,
        quality: input.quality,
      });

      try {
        // Download design file
        console.log('[MockupRouter] Downloading design file:', input.designR2Key);
        let designBuffer;
        try {
          designBuffer = await downloadFile("PUBLIC", input.designR2Key);
          console.log('[MockupRouter] Design file downloaded successfully, size:', designBuffer.length);
        } catch (error) {
          console.error('[MockupRouter] Failed to download design file:', error);
          throw new Error(`Failed to download design file: ${error.message}`);
        }

        // Download template file
        console.log('[MockupRouter] Downloading template file:', input.templateR2Key);
        let templateBuffer;
        try {
          templateBuffer = await downloadFile("PUBLIC", input.templateR2Key);
          console.log('[MockupRouter] Template file downloaded successfully, size:', templateBuffer.length);
        } catch (error) {
          console.error('[MockupRouter] Failed to download template file:', error);
          throw new Error(`Failed to download template file: ${error.message}`);
        }

        // Generate mockup
        console.log('[MockupRouter] Calling MockupGenerator');
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

        console.log('[MockupRouter] Mockup generated successfully');
        const response = {
          mockupData: result.mockupBuffer.toString("base64"),
          contentType: `image/${input.outputFormat}`,
          metadata: result.metadata,
        };

        console.log('[MockupRouter] Response prepared, base64 size:', response.mockupData.length);
        return response;

      } catch (error) {
        console.error('[MockupRouter] Mockup generation failed:', error);
        console.error('[MockupRouter] Error stack:', error.stack);
        throw error;
      }
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
