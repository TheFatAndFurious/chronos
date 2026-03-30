import { EmailAlreadyExistsError } from "../../domain/exceptions/domain.exceptions";
import { userRepository } from "../../infrastructure/persistence";
import { User } from "../../infrastructure/persistence/schemas/users";

export type RegisterUserCommand = {
  name: string;
  email: string;
  password: string;
};

export type RegisterUserResult = Omit<
  User,
  "id" | "createdAt" | "passwordHash"
>;

export async function registerUserHandler(
  command: RegisterUserCommand,
): Promise<RegisterUserResult> {
  const { name, email, password } = command;
  const existing = await userRepository.findByEmail(email);

  if (existing) {
    console.error();
    throw new EmailAlreadyExistsError(email);
  }

  const hashedPassword = await Bun.password.hash(password, "argon2id");

  const user = await userRepository.create({
    email: email,
    name: name,
    passwordHash: hashedPassword,
  });

  return {
    email: user.email,
    name: user.name,
  };
}
