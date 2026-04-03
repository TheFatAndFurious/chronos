import { InvalidRefreshTokenError } from "@domain/exceptions/domain.exceptions";
import { jwtService } from "@infrastructure/auth/jwt.service";
import { tokenRepository } from "@infrastructure/persistence/repository/token.repository";

export type RefreshTokenCommand = {
  refreshToken: string;
};

export type RefreshTokenResult = {
  userId: string;
  refreshToken: string;
};

export async function refreshTokenHandler(
  command: RefreshTokenCommand,
): Promise<RefreshTokenResult> {
  const { refreshToken } = command;

  // 1. Hash and find token
  const tokenHash = jwtService.hashToken(refreshToken);
  const storedToken = await tokenRepository.findByTokenHash(tokenHash);

  // 2. Validate
  if (!storedToken) {
    throw new InvalidRefreshTokenError();
  }
  if (storedToken.revoked) {
    throw new InvalidRefreshTokenError();
  }
  if (storedToken.expires_at < new Date()) {
    throw new InvalidRefreshTokenError();
  }

  // 3. Revoke old token (rotation)
  await tokenRepository.revoke(storedToken.id);

  // 4. Create new refresh token
  const newRefreshToken = jwtService.generateRefreshToken();
  const newTokenHash = jwtService.hashToken(newRefreshToken);
  await tokenRepository.create({
    user_id: storedToken.user_id,
    token_hash: newTokenHash,
    expires_at: jwtService.getRefreshTokenExpiry(),
  });

  // 5. Return userId (route will sign access token via Elysia JWT)
  return {
    userId: storedToken.user_id,
    refreshToken: newRefreshToken,
  };
}
