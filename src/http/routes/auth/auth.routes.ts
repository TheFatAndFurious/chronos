import Elysia, { t, validationDetail } from "elysia";
import { userRepository } from "../../../infrastructure/persistence/schemas/users/repository";

export const authRoutes = new Elysia({ prefix: "/auth" }).post(
  "/register",
  async ({ body, set }) => {
    // check if email already exists in the DB
    const existing = await userRepository.findByEmail(body.email);

    if (existing) {
      set.status = 409;
      return { error: "Email already registered" };
    }

    const hashedPassword = await Bun.password.hash(body.password, "argon2id");

    const user = await userRepository.create({
      email: body.email,
      name: body.name,
      passwordHash: hashedPassword,
    });

    set.status = 201;
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
    };
  },
  {
    body: t.Object({
      name: t.String(),
      email: t.String({
        format: "email",
        error: validationDetail("must be a valid email"),
      }),
      password: t.String({ minLength: 8 }),
    }),
  },
);
