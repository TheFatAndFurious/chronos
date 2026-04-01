import { app } from "./app";
import { checkDatabaseConnection } from "./infrastructure/persistence/db";

await checkDatabaseConnection();
console.info("Database connected");
app.listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
