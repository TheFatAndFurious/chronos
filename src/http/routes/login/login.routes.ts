import { jwt } from "@elysiajs/jwt";
import Elysia, { t, validationDetail } from "elysia";
import {
  InvalidCredentialsError,
  loginHandler,
} from "../../../application/commands/login.handler";
import { jwtConfig } from "../../../infrastructure/auth/jwt.service";

export const loginRoutes = new Elysia({ prefix: "/auth" })
  .use(jwt({ name: "jwt", ...jwtConfig }))
  .post(
    "/login",
    async ({ body, set, jwt }) => {
      try {
        const result = await loginHandler(body);
        const accessToken = await jwt.sign({ userId: result.userId });

        return {
          accessToken,
          refreshToken: result.refreshToken,
        };
      } catch (error) {
        if (error instanceof InvalidCredentialsError) {
          set.status = 401;
          return { error: "Invalid credentials" };
        }
        throw error;
      }
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
