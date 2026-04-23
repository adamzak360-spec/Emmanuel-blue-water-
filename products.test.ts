import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Products Router - Price Accuracy", () => {
  it("should store and retrieve product prices without transformation", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Test price: GHC 20.00
    const testPrice = "20.00";
    
    // Create a product with the exact price
    const createResult = await caller.products.create({
      name: "Test Product",
      description: "Test Description",
      price: testPrice,
      stock: 10,
    });

    // Verify the result
    expect(createResult).toBeDefined();

    // List products and verify price is stored correctly
    const products = await caller.products.list();
    const createdProduct = products.find((p) => p.name === "Test Product");

    expect(createdProduct).toBeDefined();
    expect(createdProduct?.price).toBe(testPrice);
    expect(createdProduct?.price).not.toBe("2000");
    expect(createdProduct?.price).not.toBe("200.00");
  });

  it("should handle various price formats correctly", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const testCases = [
      { price: "1.50", description: "Price with decimal" },
      { price: "100.00", description: "Whole number with decimals" },
      { price: "0.99", description: "Price less than 1" },
      { price: "1000.50", description: "Large price" },
    ];

    for (const testCase of testCases) {
      const result = await caller.products.create({
        name: `Test ${testCase.description}`,
        description: testCase.description,
        price: testCase.price,
        stock: 5,
      });

      expect(result).toBeDefined();
    }

    // Verify all prices are stored correctly
    const products = await caller.products.list();
    for (const testCase of testCases) {
      const product = products.find((p) => p.name === `Test ${testCase.description}`);
      expect(product?.price).toBe(testCase.price);
    }
  });
});

describe("Orders Router - Order Creation and Retrieval", () => {
  it("should retrieve all orders", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // List all orders - this should work even if there are no orders
    const orders = await caller.orders.listAll();
    expect(Array.isArray(orders)).toBe(true);
  });


});
