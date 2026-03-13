import { Api } from "#/api";
import { Database, CurrentDb, withTransaction } from "#/integrations/db/db";
import { Crypto } from "#/integrations/crypto/crypto";
import { HttpApiBuilder, HttpApiError } from "@effect/platform";
import { Effect } from "effect";
import { inferNameFromEmail } from "../user/utils";
import { UserRepo } from "../user/repo";

export const AuthLive = HttpApiBuilder.group(Api, "Auth", (handlers) => {
  return handlers.handle("signUp", ({ payload }) => {
    return Effect.gen(function* () {
      const crypto = yield* Crypto;
      const userRepo = yield* UserRepo;

      const salt = crypto.generateSalt();
      const hashedPassword = yield* crypto.hashSecret(payload.password, salt);

      const name = inferNameFromEmail(payload.email);

      yield* withTransaction(
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

          // const token = generateSessionToken();

          // const session = await sessionRepo
          //   .create(token, user.id, tx)
          //   .match((session) => session, dbErrorToHttp);

          return user;
        }),
      );

      return "hello world";
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
