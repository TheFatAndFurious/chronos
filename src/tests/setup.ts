import { db } from "../infrastructure/persistence/db";
import { users } from "../infrastructure/persistence/schemas/users";

export async function cleanupDatabase() {
  await db.delete(users);
}
