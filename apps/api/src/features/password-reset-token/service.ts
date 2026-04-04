import { withTransaction } from "#/integrations/db/db";
import { Crypto } from "#/integrations/crypto/crypto";
import { Clock, Duration, Effect } from "effect";
import { UserRepo } from "../user/repo";
import { SessionRepo } from "../session/repo";
import { UserNotFound } from "@gym-graphs/shared/user/errors";
import {
  PasswordResetTokenExpired,
  PasswordResetTokenNotFound,
} from "@gym-graphs/shared/password-reset-token/errors";
import type { ResetPasswordPayload } from "@gym-graphs/shared/auth/schemas";
import type { User } from "#/integrations/db/schema";
import { Email } from "#/integrations/email/client";
import { resetPasswordEmailContent } from "../auth/email";
import { PasswordResetTokenRepo } from "./repo";

export class PasswordResetTokenService extends Effect.Service<PasswordResetTokenService>()(
  "PasswordResetTokenService",
  {
    dependencies: [
      Crypto.Default,
      PasswordResetTokenRepo.Default,
      UserRepo.Default,
      SessionRepo.Default,
      Email.Default,
    ],
    accessors: true,
    effect: Effect.gen(function* () {
      const crypto = yield* Crypto;
      const passwordResetTokenRepo = yield* PasswordResetTokenRepo;
      const userRepo = yield* UserRepo;
      const sessionRepo = yield* SessionRepo;
      const email = yield* Email;

      return {
        forgotPassword: (userEmail: User["email"]) =>
          withTransaction(
            Effect.gen(function* () {
              const userOption = yield* userRepo.findByEmail(userEmail);

              const user = yield* Effect.mapError(
                userOption,
                () => new UserNotFound(),
              );

              yield* passwordResetTokenRepo.deleteByUserId(user.id);

              const token = yield* crypto.generateId();
              const tokenHash = yield* crypto.hashSHA256Hex(token);

              yield* passwordResetTokenRepo.create({
                token: tokenHash,
                userId: user.id,
              });

              yield* email.send(
                [user.email],
                "Reset your password",
                yield* resetPasswordEmailContent(token),
              );
            }),
          ).pipe(Effect.timeout(5000)),

        resetPassword: (input: typeof ResetPasswordPayload.Type) =>
          withTransaction(
            Effect.gen(function* () {
              const tokenHash = yield* crypto.hashSHA256Hex(input.token);

              const passwordResetTokenOption =
                yield* passwordResetTokenRepo.selectByToken(tokenHash);

              const passwordResetToken = yield* Effect.mapError(
                passwordResetTokenOption,
                () => new PasswordResetTokenNotFound(),
              );

              yield* passwordResetTokenRepo.deleteByToken(
                passwordResetToken.token,
              );

              const codeExpired = Duration.greaterThanOrEqualTo(
                yield* Clock.currentTimeMillis,
                passwordResetToken.expiresAt.getTime(),
              );

              if (codeExpired) {
                return yield* Effect.fail(new PasswordResetTokenExpired());
              }

              yield* sessionRepo.deleteByUserId(passwordResetToken.userId);

              const salt = yield* crypto.generateSalt();
              const passwordHash = yield* crypto.hashSecret(
                input.password,
                salt,
              );

              yield* userRepo.updatePasswordAndSalt(
                passwordHash,
                salt,
                passwordResetToken.userId,
              );

              const token = yield* crypto.generateId();

              const session = yield* sessionRepo.create({
                id: yield* crypto.hashSHA256Hex(token),
                userId: passwordResetToken.userId,
              });

              return { token, session };
            }),
          ).pipe(Effect.timeout(5000)),
      };
    }),
  },
) {}
