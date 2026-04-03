import { registerUserHandler } from "@application/commands/register/register-user.handler";
import { EmailAlreadyExistsError } from "@domain/exceptions/domain.exceptions";
import jwt from "@elysiajs/jwt";
import { jwtConfig } from "@infrastructure/auth/jwt.service";
import Elysia, { t, validationDetail } from "elysia";

export const authRoutes = new Elysia({ prefix: "/register" })
  .use(jwt({ name: "jwt", ...jwtConfig }))
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const result = await registerUserHandler(body);
        set.status = 201;
        return result;
      } catch (error) {
        if (error instanceof EmailAlreadyExistsError) {
          set.status = 409;
          return { error: "Email already registered" };
        }
        throw error;
      }
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String({
          format: "email",
          error: validationDetail("must be a valid email"),
        }),
        password: t.String({
          minLength: 8,
          error: validationDetail(
            "password must be at least 8 characters long",
          ),
        }),
      }),
    },
  );
