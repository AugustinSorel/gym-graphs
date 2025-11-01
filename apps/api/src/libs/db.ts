import { HTTPException } from "hono/http-exception";
import type { DbError } from "@gym-graphs/db/error";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export const dbErrorToHttp = (e: DbError) => {
  const httpErr = transformDbErrorToHttp(e);

  throw new HTTPException(httpErr.status, {
    message: httpErr.message,
    cause: e.cause,
  });
};

const transformDbErrorToHttp = (
  err: DbError,
): { status: ContentfulStatusCode; message: string } => {
  switch (err.type) {
    case "duplicate email":
      return { status: 409, message: "email is already used" };
    case "duplicate tile":
      return { status: 409, message: "tile is already used" };
    case "user not found":
      return { status: 404, message: "user not found" };
    case "session not found":
      return { status: 404, message: "session not found" };
    case "email verification code not found":
      return { status: 404, message: "email verification code not found" };
    case "exercise not found":
      return { status: 404, message: "exercise not found" };
    case "password reset not found":
      return { status: 404, message: "password reset not found" };
    case "duplicate tag name":
      return { status: 409, message: "tag name is already used" };
    case "internal":
    case "entity not returned":
      return { status: 500, message: "internal server error" };
  }
};
