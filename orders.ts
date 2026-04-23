import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getOrders,
  getUserOrders,
  getOrderItems,
  createOrder,
  createOrderItems,
  updateOrderStatus,
} from "../db";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

export const ordersRouter = router({
  /**
   * Get all orders with their items (admin only)
   */
  listAll: adminProcedure.query(async () => {
    const allOrders = await getOrders();
    
    // Fetch items for each order
    const ordersWithItems = await Promise.all(
      allOrders.map(async (order) => {
        const items = await getOrderItems(order.id);
        return {
          ...order,
          items,
        };
      })
    );
    
    return ordersWithItems;
  }),

  /**
   * Get orders for the current user
   */
  listMy: protectedProcedure.query(async ({ ctx }) => {
    const userOrders = await getUserOrders(ctx.user.id);
    
    // Fetch items for each order
    const ordersWithItems = await Promise.all(
      userOrders.map(async (order) => {
        const items = await getOrderItems(order.id);
        return {
          ...order,
          items,
        };
      })
    );
    
    return ordersWithItems;
  }),

  /**
   * Get a specific order with its items (admin or order owner)
   */
  getById: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ ctx, input }) => {
      const allOrders = await getOrders();
      const order = allOrders.find((o) => o.id === input.orderId);
      
      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      
      // Check authorization: admin or order owner
      if (ctx.user.role !== "admin" && order.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      
      const items = await getOrderItems(order.id);
      return { ...order, items };
    }),

  /**
   * Create a new order
   * Price values are stored as strings to preserve exact decimal format
   */
  create: protectedProcedure
    .input(
      z.object({
        buyerName: z.string().min(1),
        buyerEmail: z.string().email(),
        buyerPhone: z.string().optional(),
        totalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
        items: z.array(
          z.object({
            productId: z.number(),
            productName: z.string(),
            quantity: z.number().int().min(1),
            pricePerUnit: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create the order
      const orderResult = await createOrder({
        userId: ctx.user.id,
        buyerName: input.buyerName,
        buyerEmail: input.buyerEmail,
        buyerPhone: input.buyerPhone,
        totalAmount: input.totalAmount,
        currency: "GHC",
        status: "pending",
      });
      
      // Get the order ID from the result
      const orderId = (orderResult as any).insertId || 0;
      
      // Create order items
      const orderItemsData = input.items.map((item) => ({
        orderId,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
        currency: "GHC",
      }));
      
      await createOrderItems(orderItemsData);
      
      // Return the created order with items
      return {
        id: orderId,
        userId: ctx.user.id,
        buyerName: input.buyerName,
        buyerEmail: input.buyerEmail,
        buyerPhone: input.buyerPhone,
        totalAmount: input.totalAmount,
        currency: "GHC",
        status: "pending",
        items: orderItemsData,
      };
    }),

  /**
   * Update order status (admin only)
   */
  updateStatus: adminProcedure
    .input(
      z.object({
        orderId: z.number(),
        status: z.enum(["pending", "completed", "cancelled"]),
      })
    )
    .mutation(async ({ input }) => {
      await updateOrderStatus(input.orderId, input.status);
      return { success: true };
    }),
});
