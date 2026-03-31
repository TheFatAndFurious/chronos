import { eq } from "drizzle-orm";
import { db } from "../db";
import {
  NewRefreshToken,
  RefreshToken,
  refreshTokens,
} from "../schemas/refresh-tokens";

export const tokenRepository = {
  async findByTokenHash(hash: string): Promise<RefreshToken | null> {
    const [result] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.token_hash, hash));
    return result || null;
  },

  async create(data: NewRefreshToken): Promise<RefreshToken> {
    const [createdToken] = await db
      .insert(refreshTokens)
      .values(data)
      .returning();

    return createdToken;
  },

  async revoke(tokenId: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.id, tokenId))
      .returning();
  },

  async revokeAllForUser(userId: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.user_id, userId))
      .returning();
  },
};
