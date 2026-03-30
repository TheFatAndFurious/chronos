import { afterEach, describe, expect, it } from "bun:test";
import { app } from "../../../app";
import { cleanupDatabase } from "../../setup";

const TEST_NAME = "GOLDORAK";
const TEST_EMAIL = "therealslimshady@gmail.com";
const TEST_PASSWORD = "notSoSecureHuh";
const TEST_INVALID_EMAIL = "babakar#gmail.com";

describe("POST /auth/login", () => {
  afterEach(async () => {
    await cleanupDatabase();
  });
  it("should return 200 and a token for valid credentiels", async () => {
    // GIVEN - user already exists
    const payload = {
      name: TEST_NAME,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    };

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
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.token).toBeDefined();
  });

  it("should return 401 for non-existent user", async () => {
    const response = await app.handle(
      new Request("http://localhost/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        }),
      }),
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Invalid credentials");
  });

  it("should return 401 for wrong password with existing user", async () => {
    // Given - user exists
    await app.handle(
      new Request("http://localhost/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: TEST_NAME,
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        }),
      }),
    );

    // When - login with wrong password
    const response = await app.handle(
      new Request("http://localhost/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: "wrongPassword",
        }),
      }),
    );

    // Then
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Invalid credentials");
  });

  it("should return 422 for invalid email format", async () => {
    const response = await app.handle(
      new Request("http://localhost/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: TEST_INVALID_EMAIL,
          password: TEST_PASSWORD,
        }),
      }),
    );

    expect(response.status).toBe(422);
  });

  it("should return 422 for password shorter than 8 characters", async () => {
    const response = await app.handle(
      new Request("http://localhost/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: "short",
        }),
      }),
    );

    expect(response.status).toBe(422);
  });

  it("should return 422 for missing email field", async () => {
    const response = await app.handle(
      new Request("http://localhost/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: TEST_PASSWORD,
        }),
      }),
    );

    expect(response.status).toBe(422);
  });

  it("should return 422 for missing password field", async () => {
    const response = await app.handle(
      new Request("http://localhost/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: TEST_EMAIL,
        }),
      }),
    );

    expect(response.status).toBe(422);
  });
});
