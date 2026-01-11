import { test, expect } from "@playwright/test";

test.describe("Featured API", () => {
  test.describe("GET /api/featured/{year}/{month}", () => {
    test.describe("Unauthenticated", () => {
      test("should return 401 for unauthenticated requests", async ({
        request,
      }) => {
        const response = await request.get("/api/featured/2026/1");

        expect(response.status()).toBe(401);
        const body = await response.json();
        expect(body.error).toBe("Unauthorized");
      });

      test("should return 401 even for invalid year (auth first)", async ({
        request,
      }) => {
        const response = await request.get("/api/featured/invalid/1");

        expect(response.status()).toBe(401);
      });

      test("should return 401 even for invalid month (auth first)", async ({
        request,
      }) => {
        const response = await request.get("/api/featured/2026/13");

        expect(response.status()).toBe(401);
      });
    });

    // Note: Validation tests (400 responses) require authenticated requests
    // These would be tested with authenticated storage state in production
  });
});
