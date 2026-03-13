import { Api } from "#/api";
import { withTransaction } from "#/integrations/db/db";
import { Crypto } from "#/integrations/crypto/crypto";
import { HttpApiBuilder, HttpApiError } from "@effect/platform";
import { Effect } from "effect";
import { inferNameFromEmail } from "../user/utils";
import { UserRepo } from "../user/repo";
import { SessionRepo } from "../session/repo";
import { AuthCookies } from "./cookies";

export const AuthLive = HttpApiBuilder.group(Api, "Auth", (handlers) => {
  return handlers.handle("signUp", ({ payload }) => {
    return Effect.gen(function* () {
      const crypto = yield* Crypto;
      const userRepo = yield* UserRepo;
      const sessionRepo = yield* SessionRepo;

      const salt = yield* crypto.generateSalt();
      const hashedPassword = yield* crypto.hashSecret(payload.password, salt);

      const name = inferNameFromEmail(payload.email);

      const token = yield* crypto.generateId();
      const sessionId = yield* crypto.hashSHA256Hex(token);

      const res = yield* withTransaction(
        Effect.gen(function* () {
          const user = yield* userRepo.createWithEmailAndPassword({
            email: payload.email,
            password: hashedPassword,
            name,
            salt,
          });

          // await seedUserAccount(user.id, tx);

          // const emailVerificationCode = generateEmailVerificationCode();

          // const emailVerification = await emailVerificationRepo
          //   .create(emailVerificationCode, user.id, tx)
          //   .match((verificationCode) => verificationCode, dbErrorToHttp);

          // await sendEmail(
          //   [user.email],
          //   "Verification code",
          //   emailVerificationEmailBody(emailVerification.code),
          //   email,
          // );

          const session = yield* sessionRepo.create({
            id: sessionId,
            userId: user.id,
          });

          return { user, session };
        }),
      );

      yield* AuthCookies.setSessionCookie(token, res.session.expiresAt);
    }).pipe(
      Effect.mapError((e) => {
        if (e._tag === "DuplicateUser") {
          return e;
        }

        return new HttpApiError.InternalServerError();
      }),
    );
  });
});
