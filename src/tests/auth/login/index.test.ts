import { describe, expect, it } from "bun:test";
import { app } from "../../../app";

const TEST_NAME = "GOLDORAK";
const TEST_EMAIL = "therealslimshady@gmail.com";
const TEST_PASSWORD = "notSoSecureHuh";
const TEST_INVALID_EMAIL = "babakar#gmail.com";

describe("POST /auth/login", () => {
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

  it("should return 401 for invalid credentials", async () => {
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

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Invalid credentials");
  });
});
