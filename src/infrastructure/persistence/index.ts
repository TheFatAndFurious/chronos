import { db } from "../../../db";

import { eq } from "drizzle-orm";
import { User, users } from "../../users";

export const userRepository = {
  async findByEmail(email: string): Promise<User | null> {
    const [result] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return result;
  },

  async create(data: Omit<User, "id" | "createdAt">): Promise<User> {
    const [createdUser] = await db.insert(users).values(data).returning();

    return createdUser;
  },
};
