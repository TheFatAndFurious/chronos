import { logOutHandler } from "@application/commands/auth/logout.handler";
import { refreshTokenHandler } from "@application/commands/auth/refresh-token.handler";
import {
  InvalidRefreshTokenError,
  UnknownRefreshTokenError,
} from "@domain/exceptions/domain.exceptions";
import { jwt } from "@elysiajs/jwt";
import { jwtConfig } from "@infrastructure/auth/jwt.service";
import Elysia, { t } from "elysia";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(jwt({ name: "jwt", ...jwtConfig }))
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
