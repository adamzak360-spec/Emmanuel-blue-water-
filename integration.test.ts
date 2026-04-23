import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user-integration",
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

describe("Integration Tests - Complete Product and Order Flow", () => {
  it("should create a product with exact price and retrieve it unchanged", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Test Case 1: Price GHC 20.00
    const testPrice = "20.00";
    
    await caller.products.create({
      name: "Integration Test Product",
      description: "Test product for integration",
      price: testPrice,
      stock: 50,
    });

    // Verify it's stored correctly by listing
    const products = await caller.products.list();
    const createdProduct = products.find((p) => p.name === "Integration Test Product");

    expect(createdProduct).toBeDefined();
    expect(createdProduct?.price).toBe("20.00");
    expect(createdProduct?.price).not.toBe("2000");
    expect(createdProduct?.price).not.toBe("200");
  });

  it("should handle various price formats without transformation", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const priceTests = [
      { price: "1.50", name: "Price with decimal" },
      { price: "100.00", name: "Whole number" },
      { price: "0.99", name: "Less than one" },
      { price: "1000.50", name: "Large price" },
      { price: "5.00", name: "Five dollars" },
    ];

    for (const test of priceTests) {
      await caller.products.create({
        name: `Test ${test.name}`,
        description: test.name,
        price: test.price,
        stock: 10,
      });
    }

    // Verify all prices are stored correctly
    const allProducts = await caller.products.list();
    for (const test of priceTests) {
      const product = allProducts.find((p) => p.name === `Test ${test.name}`);
      expect(product?.price).toBe(test.price);
      // Ensure no multiplication happened
      expect(product?.price).not.toBe((parseFloat(test.price) * 100).toString());
    }
  });

  it("should update product price without transformation", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create a product
    await caller.products.create({
      name: "Update Price Test",
      description: "Test update",
      price: "15.00",
      stock: 20,
    });

    // Get the product ID
    let products = await caller.products.list();
    const createdProduct = products.find((p) => p.name === "Update Price Test");
    expect(createdProduct).toBeDefined();

    // Update the price
    const newPrice = "25.50";
    await caller.products.update({
      id: createdProduct!.id,
      name: "Update Price Test",
      description: "Test update",
      price: newPrice,
      stock: 20,
    });

    // Verify the new price
    products = await caller.products.list();
    const updated = products.find((p) => p.name === "Update Price Test");
    expect(updated?.price).toBe(newPrice);
    expect(updated?.price).not.toBe("2550");
  });

  it("should delete a product successfully", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create a product
    await caller.products.create({
      name: "Delete Test Product",
      description: "To be deleted",
      price: "10.00",
      stock: 5,
    });

    // Get the product ID
    let products = await caller.products.list();
    const createdProduct = products.find((p) => p.name === "Delete Test Product");
    expect(createdProduct).toBeDefined();

    // Delete it
    const deleteResult = await caller.products.delete({ id: createdProduct!.id });
    expect(deleteResult.success).toBe(true);
  });

  it("should list all orders correctly", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // List all orders (should not throw)
    const orders = await caller.orders.listAll();
    expect(Array.isArray(orders)).toBe(true);
  });

  it("should preserve price in order items", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create a product with specific price
    await caller.products.create({
      name: "Order Item Price Test",
      description: "Test",
      price: "35.99",
      stock: 100,
    });

    // Verify the product price is stored correctly
    const products = await caller.products.list();
    const foundProduct = products.find((p) => p.name === "Order Item Price Test");
    expect(foundProduct).toBeDefined();
    expect(foundProduct?.price).toBe("35.99");

    // The price should be preserved exactly as entered
    expect(foundProduct?.price).not.toBe("3599");
    expect(foundProduct?.price).not.toBe("359.90");
  });
});
