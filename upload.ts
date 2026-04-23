import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { storagePut } from "../storage";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

export const uploadRouter = router({
  /**
   * Upload an image to S3 storage
   */
  image: adminProcedure
    .input(
      z.object({
        filename: z.string().min(1),
        data: z.string(), // base64 encoded image data
        mimeType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Validate image mime type
        const validMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!validMimeTypes.includes(input.mimeType)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid image format. Supported formats: JPEG, PNG, WebP, GIF",
          });
        }

        // Convert base64 to buffer
        const buffer = Buffer.from(input.data, "base64");

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (buffer.length > maxSize) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Image size must be less than 5MB",
          });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const sanitizedFilename = input.filename.replace(/[^a-zA-Z0-9.-]/g, "_");
        const uniqueFilename = `products/${timestamp}-${sanitizedFilename}`;

        // Upload to S3
        const { url } = await storagePut(uniqueFilename, buffer, input.mimeType);

        return {
          url,
          filename: sanitizedFilename,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload image",
        });
      }
    }),
});
