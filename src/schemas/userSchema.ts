import { z } from "zod";

export const userId = z
  .string({
    required_error: "id is required",
    invalid_type_error: "id must be a uuid",
  })
  .uuid("uuid is not valid");
