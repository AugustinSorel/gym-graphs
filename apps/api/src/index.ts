import { Elysia } from "elysia";

new Elysia()
  .get("/", "Hello Elysia")
  .get("/user/:id", ({ params: { id } }) => id)
  .post("/form", ({ body }) => body)
  .listen(3000);
