import { test, expect } from "@playwright/test";

test.describe("Years API", () => {
  test.describe("GET /api/years", () => {
    test.describe("Unauthenticated", () => {
      test("should return 401 for unauthenticated requests", async ({
        request,
      }) => {
        const response = await request.get("/api/years");

        expect(response.status()).toBe(401);
        const body = await response.json();
        expect(body.error).toBe("Unauthorized");
      });

      test("should return 401 even with child_id param", async ({
        request,
      }) => {
        const response = await request.get(
          "/api/years?child_id=some-child-id"
        );

        expect(response.status()).toBe(401);
      });
    });

    // Note: Authenticated tests would require storage state setup
    // Response format validation:
    // {
    //   years: [
    //     { year: number, thumbnailUrl: string, photoCount: number }
    //   ]
    // }
  });
});
