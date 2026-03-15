import { Duration, Effect } from "effect";
import { SessionRepo } from "./repo";
import { Crypto } from "#/integrations/crypto/crypto";
import { Unauthorized } from "../auth/errors";

export class SessionService extends Effect.Service<SessionService>()(
  "SessionService",
  {
    accessors: true,
    dependencies: [Crypto.Default, SessionRepo.Default],
    effect: Effect.gen(function* () {
      const crypto = yield* Crypto;
      const sessionRepo = yield* SessionRepo;

      return {
        validateToken: (candidateToken: string) => {
          return Effect.gen(function* () {
            const candidateSessionId =
              yield* crypto.hashSHA256Hex(candidateToken);

            const sessionOption = yield* sessionRepo
              .selectById(candidateSessionId)
              .pipe(Effect.timeout(500));

            const session = yield* Effect.mapError(
              sessionOption,
              () => new Unauthorized(),
            );

            const sessionExpired = Duration.greaterThanOrEqualTo(
              Date.now(),
              session.expiresAt.getTime(),
            );

            if (sessionExpired) {
              yield* sessionRepo
                .deleteById(session.id)
                .pipe(Effect.timeout(500));

              return yield* Effect.fail(new Unauthorized());
            }

            const sessionNearExpiry = Duration.lessThanOrEqualTo(
              Duration.millis(session.expiresAt.getTime() - Date.now()),
              Duration.days(15),
            );

            if (sessionNearExpiry) {
              yield* sessionRepo
                .refreshExpiryDateBySessionId(session.id)
                .pipe(Effect.timeout(500));
            }

            return session;
          });
        },
      };
    }),
  },
) {}
