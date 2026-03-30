import { afterEach, describe, expect, it } from "bun:test";
import { app } from "../../../app";
import { cleanupDatabase } from "../../setup";

describe("POST /auth/refresh-tokens", () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  it("should return 200 and a new token for a valid refresh token", async () => {
    const payload = {
      name: "TEST_USER",
      email: "fake@example.com",
      password: "fakePassword123",
    };
    // Create a user and generate a refresh token for them
    await app.handle(
      new Request("http://localhost/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );

    const response = await app.handle(
      new Request("http://localhost/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: payload.email,
          password: payload.password,
        }),
      }),
    );
    const loginBody = await response.json();

    const refreshResponse = await app.handle(
      new Request("http://localhost/auth/refresh-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refreshToken: loginBody.token,
        }),
      }),
    );

    const refreshBody = await refreshResponse.json();
    expect(refreshResponse.status).toBe(200);
    expect(refreshBody.token).toBeDefined();
  });

  // GIVEN: a user exists and has a valid token
  // WHEN: the user requests a new token using the refresh token
  // THEN: a new token is returned and the old refresh token is revoked
  it("should return 401 for an invalid refresh token", async () => {
    // GIVEN: a user exists and has an invalid refresh token
    // WHEN: the user requests a new token using the invalid refresh token
    // THEN: a 401 error is returned
  });

  it("should return 401 for an expired refresh token", async () => {
    // GIVEN: a user exists and has an expired refresh token
    // WHEN: the user requests a new token using the expired refresh token
    // THEN: a 401 error is returned
  });

  it("should return 401 for a revoked refresh token", async () => {
    // GIVEN: a user exists and has a revoked refresh token
    // WHEN: the user requests a new token using the revoked refresh token
    // THEN: a 401 error is returned
  });

  it("should return 401 for a refresh token that does not exist", async () => {
    // GIVEN: a user exists and has a refresh token that does not exist
    // WHEN: the user requests a new token using the non-existent refresh token
    // THEN: a 401 error is returned
  });

  it("should revoke a token after use and not allow it to be used again", async () => {
    // GIVEN: a user exists and has a valid refresh token
    // WHEN: the user requests a new token using the refresh token
    // THEN: the old refresh token is revoked and cannot be used again
    // WHEN: the user attempts to use the revoked refresh token again
    // THEN: a 401 error is returned
  });

  it("should return 401 for a revoked token that is attempted to be used again", async () => {
    // GIVEN: a user exists and has a revoked refresh token
    // WHEN: the user attempts to use the revoked refresh token again
    // THEN: a 401 error is returned
  });

  it("should return 401 for a refresh token that belongs to a non-existent user", async () => {
    // GIVEN: a user exists and has a refresh token that belongs to a non-existent user
    // WHEN: the user requests a new token using the refresh token
    // THEN: a 401 error is returned
  });
});
