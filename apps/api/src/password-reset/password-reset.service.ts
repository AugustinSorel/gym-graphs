import { passwordResetRepo } from "~/password-reset/password-reset.repo";
import { generatePasswordResetToken } from "~/password-reset/password-reset.utils";
import { HTTPException } from "hono/http-exception";
import { hashSHA256Hex } from "~/libs/crypto";
import { passwordResetEmailBody } from "~/password-reset/password-reset.email";
import { userRepo } from "~/user/user.repo";
import type { User } from "~/db/db.schemas";
import type { Db } from "~/libs/db";
import type { Email } from "~/libs/email";

const create = async (input: Pick<User, "email">, db: Db, email: Email) => {
  await db.transaction(async (tx) => {
    const user = await userRepo.selectByEmail(input.email, tx);

    if (!user) {
      throw new HTTPException(404, { message: "user not found" });
    }

    await passwordResetRepo.deleteByUserId(user.id, tx);

    const token = generatePasswordResetToken();
    const tokenHash = hashSHA256Hex(token);

    const passwordReset = await passwordResetRepo.create(
      tokenHash,
      user.id,
      db,
    );

    const config = email.buildConfig(
      [user.email],
      "Reset your password",
      passwordResetEmailBody(passwordReset.token),
    );

    await email.client.send(config);
  });
};

export const passwordResetService = {
  create,
};
