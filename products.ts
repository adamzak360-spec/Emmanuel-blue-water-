import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../db";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

export const productsRouter = router({
  /**
   * Get all products (public)
   */
  list: publicProcedure.query(async () => {
    return getProducts();
  }),

  /**
   * Get a single product by ID (public)
   */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const product = await getProductById(input.id);
      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return product;
    }),

  /**
   * Create a new product (admin only)
   * Price is stored as a string to preserve exact decimal format
   */
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.string().min(1).transform(p => p.trim()),  // Accept any non-empty price string
        stock: z.number().int().min(0),
        image: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await createProduct({
        name: input.name,
        description: input.description,
        price: input.price,
        stock: input.stock,
        image: input.image,
        currency: "GHC",
      });
      return result;
    }),

  /**
   * Update a product (admin only)
   * Price is stored as a string to preserve exact decimal format
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        price: z.string().min(1).transform(p => p.trim()).optional(),  // Accept any non-empty price string
        stock: z.number().int().min(0).optional(),
        image: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      await updateProduct(id, updates);
      return getProductById(id);
    }),

  /**
   * Delete a product (admin only)
   */
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteProduct(input.id);
      return { success: true };
    }),
});
