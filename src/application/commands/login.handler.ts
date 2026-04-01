import { InvalidCredentialsError } from "../../domain/exceptions/domain.exceptions";
import { jwtService } from "../../infrastructure/auth/jwt.service";
import { tokenRepository } from "../../infrastructure/persistence/repository/token.repository";
import { userRepository } from "../../infrastructure/persistence/repository/user.repository";

export type LoginCommand = {
  email: string;
  password: string;
};

export type LoginResult = {
  userId: string;
  refreshToken: string;
};

export async function loginHandler(
  command: LoginCommand,
): Promise<LoginResult> {
  const { email, password } = command;

  // 1. Find user by email
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new InvalidCredentialsError();
  }

  // 2. Verify password
  const validPassword = await Bun.password.verify(
    password,
    user.passwordHash,
    "argon2id",
  );
  if (!validPassword) {
    throw new InvalidCredentialsError();
  }

  // 3. Create refresh token
  const refreshToken = jwtService.generateRefreshToken();
  const tokenHash = jwtService.hashToken(refreshToken);
  await tokenRepository.create({
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: jwtService.getRefreshTokenExpiry(),
  });

  // 4. Return userId + refreshToken (route signs access token)
  return {
    userId: user.id,
    refreshToken,
  };
}
export { InvalidCredentialsError };
