import { HTTPException } from "hono/http-exception";
import { userRepo } from "~/user/user.repo";
import { passwordResetRepo } from "~/password-reset/password-reset.repo";
import { generatePasswordResetToken } from "~/password-reset/password-reset.utils";
import { hashSHA256Hex } from "~/session/session.utils";
import { passwordResetEmailBody } from "~/password-reset/password-reset.email";
import type { User } from "~/db/db.schemas";
import type { Db } from "~/libs/db";
import type { Email } from "~/libs/email";

const create = async (userEmail: User["email"], db: Db, email: Email) => {
  await db.transaction(async (tx) => {
    const user = await userRepo.selectByEmail(userEmail, tx);

    if (!user) {
      throw new HTTPException(404, { message: "user not found" });
    }

    await passwordResetRepo.deleteByUserId(user.id, tx);

    const token = generatePasswordResetToken();
    const tokenHash = hashSHA256Hex(token);

    await passwordResetRepo.create(tokenHash, user.id, tx);

    const config = email.buildConfig(
      [user.email],
      "Reset your password",
      passwordResetEmailBody(token),
    );

    await email.client.send(config);
  });
};

export const passwordResetService = {
  create,
};
