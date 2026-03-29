import jwt from "@elysiajs/jwt";
import Elysia from "elysia";

export const authMiddleware = new Elysia({ name: "auth-middleware" })
  .use(jwt({ name: "jwt", secret: process.env.JWT_SECRET || "" }))
  .derive(async ({ jwt, headers, set }) => {
    console.log("🚀 ~ auth:");
    const auth = headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      set.status = 401;
      throw new Error("Authorization header missing or malformed");
    }
    console.log("i'ven been triggered");
    const token = auth.slice(7);
    const payload = await jwt.verify(token);
    if (!payload) {
      set.status = 401;
      throw new Error("Invalid token");
    }
    return { user: payload };
  });
