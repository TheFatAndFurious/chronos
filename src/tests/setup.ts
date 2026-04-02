import { db } from "../infrastructure/persistence/db";
import { users } from "../infrastructure/persistence/schemas/users";
import { events } from "../infrastructure/persistence/schemas/events";

export async function cleanupDatabase() {
  await db.delete(events);
  await db.delete(users);
}
