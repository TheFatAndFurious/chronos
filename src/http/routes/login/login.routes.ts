import jwt from "@elysiajs/jwt";
import Elysia, { t, validationDetail } from "elysia";
import { userRepository } from "../../../infrastructure/persistence/schemas/users/repository";

export const loginRoutes = new Elysia({ prefix: "auth" })
  .use(
    jwt({
      name: "jwt",
      secret: "insanely-secure-secret",
    }),
  )
  .post(
    "login",
    async ({ body, set, jwt }) => {
      console.debug("Attempting to login user...");
      const existing = await userRepository.findByEmail(body.email);

      if (!existing) {
        set.status = 401;
        console.error("Login attempt with non-existent email:", body.email);
        return { error: "Invalid credentials" };
      }
      console.debug("User found, verifying password...");

      const validPassword = await Bun.password.verify(
        body.password,
        existing.passwordHash,
        "argon2id",
      );

      if (!validPassword) {
        set.status = 401;
        console.error("Invalid password attempt for user:", body.email);
        return { error: "Invalid credentials" };
      }

      console.debug("User authenticated, generating token...");

      const token = await jwt.sign({ id: existing.id });

      console.debug("Token generated successfully for user:", body.email);
      return { token };
    },
    {
      body: t.Object({
        email: t.String({
          format: "email",
          error: validationDetail("must be a valid email"),
        }),
        password: t.String({ minLength: 8 }),
      }),
    },
  );
