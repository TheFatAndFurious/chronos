import { afterEach, describe, expect, it } from "bun:test";
import { app } from "../../../app";
import { cleanupDatabase } from "../../setup";

const TEST_NAME = "GOLDORAK";
const TEST_EMAIL = "therealslimshady@gmail.com";
const TEST_PASSWORD = "notSoSecureHuh";
const TEST_INVALID_EMAIL = "babakar#gmail.com";

describe("POST /auth/register", () => {
  afterEach(async () => {
    await cleanupDatabase();
  });
  it("should create a user and return a 201 with user id", async () => {
    // GIVEN
    const payload = {
      name: TEST_NAME,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    };

    // WHEN
    const response = await app.handle(
      new Request("http://localhost/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );

    //THEN
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.userId).toBeDefined();
    expect(body.email).toBe(TEST_EMAIL);
    expect(body.password).toBeUndefined();
    expect(body.passwordHash).toBeUndefined();
  });

  it("should return 409 when email already exists", async () => {
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

    // WHEN - same email again
    const response = await app.handle(
      new Request("http://localhost/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "bob",
          email: TEST_EMAIL,
          password: "anotherPassword",
        }),
      }),
    );

    // THEN - conflict
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toBe("Email already registered");
  });

  it("should return 422 when email format is invalid", async () => {
    // GIVEN
    const payload = {
      name: TEST_NAME,
      email: TEST_INVALID_EMAIL,
      password: TEST_PASSWORD,
    };

    const response = await app.handle(
      new Request("http://localhost/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );

    // THEN
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.message).toBe("must be a valid email");
  });
});
