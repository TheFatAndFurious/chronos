import Elysia, { t, validationDetail } from "elysia";
import { registerUserHandler } from "../../../application/commands/register-user.handler";
import { EmailAlreadyExistsError } from "../../../domain/exceptions/domain.exceptions";

export const authRoutes = new Elysia({ prefix: "/auth" }).post(
  "/register",
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
    }
  },
  {
    body: t.Object({
      name: t.String(),
      email: t.String({
        format: "email",
        error: validationDetail("must be a valid email"),
      }),
      password: t.String({ minLength: 8 }),
    }),
  },
);
// .post("/refresh-tokens", async ({ body, set }) => {});
