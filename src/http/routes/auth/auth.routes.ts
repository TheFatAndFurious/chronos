import { jwt } from "@elysiajs/jwt";
import Elysia, { t, validationDetail } from "elysia";
import { logOutHandler } from "../../../application/commands/logout.handler";
import { refreshTokenHandler } from "../../../application/commands/refresh-token.handler";
import { registerUserHandler } from "../../../application/commands/register-user.handler";
import {
  EmailAlreadyExistsError,
  InvalidRefreshTokenError,
  UnknownRefreshTokenError,
} from "../../../domain/exceptions/domain.exceptions";
import { jwtConfig } from "../../../infrastructure/auth/jwt.service";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(jwt({ name: "jwt", ...jwtConfig }))
  .post(
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
  )
  .post(
    "/refresh",
    async ({ body, jwt, set }) => {
      try {
        const result = await refreshTokenHandler(body);
        const accessToken = await jwt.sign({ userId: result.userId });

        return {
          accessToken,
          refreshToken: result.refreshToken,
        };
      } catch (error) {
        if (error instanceof InvalidRefreshTokenError) {
          set.status = 401;
          return { error: "Invalid or expired refresh token" };
        }
        throw error;
      }
    },
    {
      body: t.Object({
        refreshToken: t.String(),
      }),
    },
  )
  .post(
    "/logout",
    async ({ body, set }) => {
      try {
        const refreshToken = body.refreshToken;

        await logOutHandler({ refreshToken });
        return { success: true };
      } catch (error) {
        if (error instanceof UnknownRefreshTokenError) {
          set.status = 401;
          return { error: "Refresh token is unknown" };
        }
      }
    },
    {
      body: t.Object({
        refreshToken: t.String(),
      }),
    },
  );
