import { withTransaction } from "#/integrations/db/db";
import { Crypto } from "#/integrations/crypto/crypto";
import { Clock, Duration, Effect } from "effect";
import { UserRepo } from "../user/repo";
import { SessionRepo } from "../session/repo";
import {
  InvalidVerificationCode,
  VerificationCodeExpired,
  VerificationCodeNotFound,
} from "@gym-graphs/shared/verification-code/errors";
import type { User, VerificationCode } from "#/integrations/db/schema";
import { Email } from "#/integrations/email/client";
import { verifyAccountEmailContent } from "../auth/email";
import { VerificationCodeRepo } from "./repo";

export class VerificationCodeService extends Effect.Service<VerificationCodeService>()(
  "VerificationCodeService",
  {
    dependencies: [
      Crypto.Default,
      VerificationCodeRepo.Default,
      UserRepo.Default,
      SessionRepo.Default,
      Email.Default,
    ],
    accessors: true,
    effect: Effect.gen(function* () {
      const crypto = yield* Crypto;
      const verificationCodeRepo = yield* VerificationCodeRepo;
      const userRepo = yield* UserRepo;
      const sessionRepo = yield* SessionRepo;
      const email = yield* Email;

      return {
        verifyAccount: (
          candidateCode: VerificationCode["code"],
          userId: VerificationCode["userId"],
        ) =>
          withTransaction(
            Effect.gen(function* () {
              const verificationCodeOption =
                yield* verificationCodeRepo.selectByUserId(userId);

              const verificationCode = yield* Effect.mapError(
                verificationCodeOption,
                () => new VerificationCodeNotFound(),
              );

              const codeExpired = Duration.greaterThanOrEqualTo(
                yield* Clock.currentTimeMillis,
                verificationCode.expiresAt.getTime(),
              );

              if (codeExpired) {
                yield* verificationCodeRepo.deleteById(verificationCode.id);
                return yield* Effect.fail(new VerificationCodeExpired());
              }

              if (verificationCode.code !== candidateCode) {
                return yield* Effect.fail(new InvalidVerificationCode());
              }

              yield* verificationCodeRepo.deleteById(verificationCode.id);

              yield* userRepo.updateVerifiedAtById(userId);

              yield* sessionRepo.deleteByUserId(userId);

              const token = yield* crypto.generateId();
              const sessionId = yield* crypto.hashSHA256Hex(token);

              const session = yield* sessionRepo.create({
                id: sessionId,
                userId,
              });

              return { session, token };
            }),
          ).pipe(Effect.timeout(500)),

        sendVerificationCode: (user: Pick<User, "email" | "id">) =>
          withTransaction(
            Effect.gen(function* () {
              yield* verificationCodeRepo.deleteByUserId(user.id);

              const verificationCode = yield* verificationCodeRepo.create({
                userId: user.id,
                code: yield* crypto.generateCode(),
              });

              yield* email.send(
                [user.email],
                "Verification code",
                yield* verifyAccountEmailContent(verificationCode.code),
              );
            }),
          ).pipe(Effect.timeout(5000)),
      };
    }),
  },
) {}
