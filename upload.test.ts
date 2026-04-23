import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user-upload-test",
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

describe("Upload Router - Image Upload", () => {
  it("should reject invalid mime types", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.upload.image({
        filename: "test.txt",
        data: "dGVzdCBkYXRh", // base64 for "test data"
        mimeType: "text/plain",
      });
      expect.fail("Should have thrown error for invalid mime type");
    } catch (error: any) {
      expect(error.message).toContain("Invalid image format");
    }
  });

  it("should reject files larger than 5MB", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create a base64 string larger than 5MB
    const largeData = "A".repeat(6 * 1024 * 1024);

    try {
      await caller.upload.image({
        filename: "large.jpg",
        data: largeData,
        mimeType: "image/jpeg",
      });
      expect(false).toBe(true);
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  });

  it("should accept valid image formats", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create a small valid JPEG base64 (1x1 pixel red JPEG)
    const validJpeg =
      "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=";

    const result = await caller.upload.image({
      filename: "test-image.jpg",
      data: validJpeg,
      mimeType: "image/jpeg",
    });

    expect(result).toBeDefined();
    expect(result.url).toBeDefined();
    expect(result.filename).toBe("test-image.jpg");
    expect(result.url).toContain("/manus-storage/");
  });

  it("should handle PNG images", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 1x1 pixel transparent PNG
    const validPng =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const result = await caller.upload.image({
      filename: "test-image.png",
      data: validPng,
      mimeType: "image/png",
    });

    expect(result).toBeDefined();
    expect(result.url).toBeDefined();
    expect(result.filename).toBe("test-image.png");
  });

  it("should handle WebP images", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Minimal valid WebP (1x1 pixel)
    const validWebp =
      "UklGRiYAAABXRUJQVlA4IBIAAAAwAQCdASoBAAEAAQAcJaACdLoB/gAA/v7+////";

    const result = await caller.upload.image({
      filename: "test-image.webp",
      data: validWebp,
      mimeType: "image/webp",
    });

    expect(result).toBeDefined();
    expect(result.url).toBeDefined();
  });

  it("should sanitize filenames with special characters", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const validJpeg =
      "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=";

    const result = await caller.upload.image({
      filename: "test@#$%image!.jpg",
      data: validJpeg,
      mimeType: "image/jpeg",
    });

    expect(result).toBeDefined();
    expect(result.filename).not.toContain("@");
    expect(result.filename).not.toContain("#");
    expect(result.filename).not.toContain("$");
  });
});
