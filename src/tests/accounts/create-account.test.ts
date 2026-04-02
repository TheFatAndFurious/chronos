import { afterEach, describe, expect, it } from "bun:test";
import { app } from "../../app";
import { cleanupDatabase } from "../setup";
import { eventStore } from "../../infrastructure/persistence/event-store";

describe("POST /accounts", () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  async function registerAndLogin() {
    await app.handle(
      new Request("http://localhost/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "John Doe",
          email: "john@example.com",
          password: "securepassword123",
        }),
      }),
    );

    const loginResponse = await app.handle(
      new Request("http://localhost/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "john@example.com",
          password: "securepassword123",
        }),
      }),
    );

    const { accessToken } = await loginResponse.json();
    return accessToken;
  }

  it("should create an account and return 201 with accountId", async () => {
    // Given
    const accessToken = await registerAndLogin();

    // When
    const response = await app.handle(
      new Request("http://localhost/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          accountName: "My Savings Account",
        }),
      }),
    );

    // Then
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.accountId).toBeDefined();
    expect(typeof body.accountId).toBe("string");
  });

  it("should persist AccountCreated event in event store", async () => {
    // Given
    const accessToken = await registerAndLogin();

    // When
    const response = await app.handle(
      new Request("http://localhost/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          accountName: "My Checking Account",
        }),
      }),
    );

    // Then
    const { accountId } = await response.json();
    const events = await eventStore.loadEvents(accountId);

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("AccountCreated");
    expect(events[0].payload.accountName).toBe("My Checking Account");
  });

  it("should return 401 without authorization header", async () => {
    // When
    const response = await app.handle(
      new Request("http://localhost/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountName: "My Account",
        }),
      }),
    );

    // Then
    expect(response.status).toBe(401);
  });

  it("should return 422 for missing accountName", async () => {
    // Given
    const accessToken = await registerAndLogin();

    // When
    const response = await app.handle(
      new Request("http://localhost/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
      }),
    );

    // Then
    expect(response.status).toBe(422);
  });
});
