import { withTransaction } from "#/integrations/db/db";
import { Crypto } from "#/integrations/crypto/crypto";
import { Effect } from "effect";
import { inferNameFromEmail } from "../user/utils";
import { UserRepo } from "../user/repo";
import { SessionRepo } from "../session/repo";
import {
  InvalidCredentials,
  AccountNotVerified,
} from "@gym-graphs/shared/auth/errors";
import {
  type SignUpPayload,
  type SignInPayload,
} from "@gym-graphs/shared/auth/schemas";
import type { Session } from "#/integrations/db/schema";
import { Email } from "#/integrations/email/client";
import { verifyAccountEmailContent } from "./email";
import { VerificationCodeRepo } from "../verification-code/repo";
import { SeedUserService } from "../user/service";
import { VerificationCodeService } from "../verification-code/service";
import { PasswordResetTokenService } from "../password-reset-token/service";

export class AuthService extends Effect.Service<AuthService>()("AuthService", {
  accessors: true,
  dependencies: [
    Crypto.Default,
    UserRepo.Default,
    SessionRepo.Default,
    VerificationCodeRepo.Default,
    Email.Default,
    SeedUserService.Default,
    VerificationCodeService.Default,
    PasswordResetTokenService.Default,
  ],
  effect: Effect.gen(function* () {
    const crypto = yield* Crypto;
    const userRepo = yield* UserRepo;
    const sessionRepo = yield* SessionRepo;
    const verificationCodeRepo = yield* VerificationCodeRepo;
    const email = yield* Email;
    const seedUserService = yield* SeedUserService;
    const verificationCodeService = yield* VerificationCodeService;
    const passwordResetTokenService = yield* PasswordResetTokenService;

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
              const user = yield* userRepo.createWithEmailAndPassword({
                email: input.email,
                password: hashedPassword,
                name,
                salt,
              });

              yield* seedUserService.seed(user.id);

              const verificationCode = yield* verificationCodeRepo.create({
                userId: user.id,
                code: yield* crypto.generateCode(),
              });

              yield* email.send(
                [user.email],
                "Verification code",
                yield* verifyAccountEmailContent(verificationCode.code),
              );

              const session = yield* sessionRepo.create({
                id: sessionId,
                userId: user.id,
              });

              return session;
            }),
          );

          return { session, token };
        }).pipe(Effect.timeout(5000)),

      signIn: (input: typeof SignInPayload.Type) =>
        Effect.gen(function* () {
          const userOption = yield* userRepo.findByEmail(input.email);

          const user = yield* Effect.mapError(
            userOption,
            () => new InvalidCredentials(),
          );

          if (!user.verifiedAt) {
            return yield* Effect.fail(new AccountNotVerified());
          }

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

          const session = yield* sessionRepo.create({
            id: sessionId,
            userId: user.id,
          });

          return { user, session, token };
        }).pipe(Effect.timeout(500)),

      signOut: (sessionId: Session["id"]) =>
        Effect.gen(function* () {
          yield* sessionRepo.deleteById(sessionId);
        }).pipe(Effect.timeout(500)),

      verifyAccount: verificationCodeService.verifyAccount,

      sendVerificationCode: verificationCodeService.sendVerificationCode,

      forgotPassword: passwordResetTokenService.forgotPassword,

      resetPassword: passwordResetTokenService.resetPassword,
    };
  }),
}) {}
