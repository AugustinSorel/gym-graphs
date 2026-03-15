import { withTransaction } from "#/integrations/db/db";
import { Crypto } from "#/integrations/crypto/crypto";
import { Duration, Effect } from "effect";
import { inferNameFromEmail } from "../user/utils";
import { UserRepo } from "../user/repo";
import { SessionRepo } from "../session/repo";
import { InvalidCredentials } from "./errors";
import type { SignUpPayload, SignInPayload } from "./api";

export class AuthService extends Effect.Service<AuthService>()("AuthService", {
  accessors: true,
  dependencies: [Crypto.Default, UserRepo.Default, SessionRepo.Default],
  effect: Effect.gen(function* () {
    const crypto = yield* Crypto;
    const userRepo = yield* UserRepo;
    const sessionRepo = yield* SessionRepo;

    return {
      signUp: (input: typeof SignUpPayload.Type) =>
        Effect.gen(function* () {
          const salt = yield* crypto.generateSalt();

          const hashedPassword = yield* crypto.hashSecret(input.password, salt);

          const name = inferNameFromEmail(input.email);

          const token = yield* crypto.generateId();
          const sessionId = yield* crypto.hashSHA256Hex(token);

          const session = yield* withTransaction(
            Effect.gen(function* () {
              const user = yield* userRepo
                .createWithEmailAndPassword({
                  email: input.email,
                  password: hashedPassword,
                  name,
                  salt,
                })
                .pipe(Effect.timeout(Duration.millis(500)));

              const session = yield* sessionRepo
                .create({ id: sessionId, userId: user.id })
                .pipe(Effect.timeout(Duration.millis(500)));

              return session;
            }),
          );

          return { session, token };
        }),

      signIn: (input: typeof SignInPayload.Type) =>
        Effect.gen(function* () {
          const user = yield* userRepo.findByEmail(input.email).pipe(
            Effect.catchTag("NoSuchElementException", () => {
              return new InvalidCredentials();
            }),
          );

          if (!user.password || !user.salt) {
            return yield* Effect.fail(new InvalidCredentials());
          }

          const candidateHashed = yield* crypto.hashSecret(
            input.password,
            user.salt,
          );

          const validPassword = yield* crypto.verifySecret(
            candidateHashed,
            user.password,
          );

          if (!validPassword) {
            return yield* Effect.fail(new InvalidCredentials());
          }

          const token = yield* crypto.generateId();
          const sessionId = yield* crypto.hashSHA256Hex(token);

          const session = yield* sessionRepo
            .create({ id: sessionId, userId: user.id })
            .pipe(Effect.timeout(Duration.millis(500)));

          return { user, session, token };
        }),
    };
  }),
}) {}
