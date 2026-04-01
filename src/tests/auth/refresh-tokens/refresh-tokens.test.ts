import { afterEach, describe, expect, it } from "bun:test";
import { app } from "../../../app";
import { cleanupDatabase } from "../../setup";

const TEST_USER = {
  name: "TEST_USER",
  email: "refresh@example.com",
  password: "fakePassword123",
};

async function registerUser() {
  await app.handle(
    new Request("http://localhost/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(TEST_USER),
    })
  );
}

async function loginUser() {
  const response = await app.handle(
    new Request("http://localhost/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
      }),
    })
  );
  return response.json();
}

async function refreshTokens(refreshToken: string) {
  return app.handle(
    new Request("http://localhost/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
  );
}

describe("POST /auth/refresh", () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  it("should return 200 and new tokens for a valid refresh token", async () => {
    // Given
    await registerUser();
    const loginBody = await loginUser();

    // When
    const refreshResponse = await refreshTokens(loginBody.refreshToken);

    // Then
    expect(refreshResponse.status).toBe(200);
    const refreshBody = await refreshResponse.json();
    expect(refreshBody.accessToken).toBeDefined();
    expect(refreshBody.refreshToken).toBeDefined();
    expect(refreshBody.refreshToken).not.toBe(loginBody.refreshToken); // rotation
  });

  it("should return 401 for an invalid refresh token", async () => {
    // Given - no valid token exists
    // When
    const response = await refreshTokens("invalid-token-that-doesnt-exist");

    // Then
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Invalid or expired refresh token");
  });

  it("should return 401 for a non-existent refresh token (random UUID)", async () => {
    // Given
    await registerUser();

    // When - use a random UUID that was never issued
    const response = await refreshTokens("550e8400-e29b-41d4-a716-446655440000");

    // Then
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Invalid or expired refresh token");
  });

  it("should revoke token after use (rotation) and reject reuse", async () => {
    // Given
    await registerUser();
    const loginBody = await loginUser();
    const originalRefreshToken = loginBody.refreshToken;

    // When - first refresh succeeds
    const firstRefresh = await refreshTokens(originalRefreshToken);
    expect(firstRefresh.status).toBe(200);

    // Then - second use of same token fails (it's been revoked)
    const secondRefresh = await refreshTokens(originalRefreshToken);
    expect(secondRefresh.status).toBe(401);
    const body = await secondRefresh.json();
    expect(body.error).toBe("Invalid or expired refresh token");
  });

  it("should return new tokens that can be used for subsequent refreshes", async () => {
    // Given
    await registerUser();
    const loginBody = await loginUser();

    // When - refresh once
    const firstRefresh = await refreshTokens(loginBody.refreshToken);
    const firstBody = await firstRefresh.json();

    // Then - can refresh again with the new token
    const secondRefresh = await refreshTokens(firstBody.refreshToken);
    expect(secondRefresh.status).toBe(200);
    const secondBody = await secondRefresh.json();
    expect(secondBody.accessToken).toBeDefined();
    expect(secondBody.refreshToken).toBeDefined();
    expect(secondBody.refreshToken).not.toBe(firstBody.refreshToken);
  });

  it("should return 422 for missing refreshToken field", async () => {
    // When
    const response = await app.handle(
      new Request("http://localhost/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    );

    // Then
    expect(response.status).toBe(422);
  });
});
