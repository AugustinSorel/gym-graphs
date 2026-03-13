import { Api } from "#/api";
import { withTransaction } from "#/integrations/db/db";
import { Crypto } from "#/integrations/crypto/crypto";
import { HttpApiBuilder, HttpApiError } from "@effect/platform";
import { Effect, pipe } from "effect";
import { inferNameFromEmail } from "../user/utils";
import { UserRepo } from "../user/repo";

export const AuthLive = HttpApiBuilder.group(Api, "Auth", (handlers) => {
  return handlers.handle("signUp", ({ payload }) => {
    return pipe(
      Effect.gen(function* () {
        const crypto = yield* Crypto;
        const userRepo = yield* UserRepo;

        const salt = crypto.generateSalt();
        const hashedPassword = yield* crypto.hashSecret(payload.password, salt);

        const name = inferNameFromEmail(payload.email);

        const res = yield* withTransaction(
          pipe(
            userRepo.createWithEmailAndPassword({
              email: payload.email,
              password: hashedPassword,
              name,
              salt,
            }),
            Effect.catchTag(
              "EffectDrizzleQueryError",
              () => new HttpApiError.InternalServerError(),
            ),
            Effect.catchTag(
              "NoSuchElementException",
              () => new HttpApiError.InternalServerError(),
            ),
          ),
        );

        console.log(res);

        return yield* Effect.succeed("hello world");
      }),
      Effect.catchTag(
        "CryptoHashError",
        () => new HttpApiError.InternalServerError(),
      ),
      Effect.catchTag("SqlError", () => new HttpApiError.InternalServerError()),
    );
  });
});
