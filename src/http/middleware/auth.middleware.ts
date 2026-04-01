import jwt from "@elysiajs/jwt";
import Elysia from "elysia";
import { jwtConfig } from "../../infrastructure/auth/jwt.service";

export const authMiddleware = new Elysia({ name: "auth-middleware" })
  .use(jwt({ name: "jwt", ...jwtConfig }))
  .derive({ as: "scoped" }, async ({ jwt, headers, set }) => {
    const auth = headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      set.status = 401;
      throw new Error("Authorization header missing or malformed");
    }
    const token = auth.slice(7);
    const payload = await jwt.verify(token);
    if (!payload) {
      set.status = 401;
      throw new Error("Invalid token");
    }
    return { user: payload };
  });
