import { createHash, randomUUID } from "node:crypto";

const JWT_SECRET = process.env.JWT_SECRET!;
const ACCESS_TTL_SECONDS = Number(process.env.JWT_ACCESS_TTL) || 9000; // 15 min
const REFRESH_TTL_SECONDS = Number(process.env.JWT_REFRESH_TTL) || 604800; // 7 days

export type AccessTokenPayload = {
  userId: string;
};

export const jwtService = {
  generateRefreshToken(): string {
    return randomUUID();
  },

  hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  },

  getRefreshTokenExpiry(): Date {
    return new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);
  },
};

// Export config for Elysia JWT plugin
export const jwtConfig = {
  secret: JWT_SECRET,
  exp: `${ACCESS_TTL_SECONDS}s`,
};
