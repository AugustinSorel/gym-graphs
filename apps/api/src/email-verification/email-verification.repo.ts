import { HTTPException } from "hono/http-exception";
import { emailVerificationCodeTable } from "~/db/db.schemas";
import type { EmailVerificationCode } from "~/db/db.schemas";
import type { Db } from "~/libs/db";

const create = async (
  code: EmailVerificationCode["code"],
  userId: EmailVerificationCode["userId"],
  db: Db,
) => {
  const [emailVerification] = await db
    .insert(emailVerificationCodeTable)
    .values({
      userId,
      code,
    })
    .returning();

  if (!emailVerification) {
    throw new HTTPException(404, {
      message: "email verification code not found",
    });
  }

  return emailVerification;
};

export const emailVerificationRepo = {
  create,
};
