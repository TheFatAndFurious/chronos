import { UnknownRefreshTokenError } from "@domain/exceptions/domain.exceptions";
import { jwtService } from "@infrastructure/auth/jwt.service";
import { tokenRepository } from "@infrastructure/persistence/repository/token.repository";

export type LogoutCommand = {
  refreshToken: string;
};

export async function logOutHandler(command: LogoutCommand): Promise<void> {
  const { refreshToken } = command;

  const tokenHash = jwtService.hashToken(refreshToken);
  const storedToken = await tokenRepository.findByTokenHash(tokenHash);

  if (!storedToken) {
    throw new UnknownRefreshTokenError();
  }

  await tokenRepository.revoke(storedToken.id);
}
