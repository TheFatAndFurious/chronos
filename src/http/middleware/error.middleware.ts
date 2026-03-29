// import Elysia from "elysia";

// export const errorMiddleware = new Elysia({ name: "error-middleware" }).onError(
//   ({ code, error, set }) => {
//     if (code === "VALIDATION") {
//       set.status = 422;
//       return {
//         error: "Validation failed",
//         details: error.message,
//       };
//     }
//   },
// );
