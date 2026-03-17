import { withTransaction } from "#/integrations/db/db";
import { Crypto } from "#/integrations/crypto/crypto";
import { Clock, Duration, Effect } from "effect";
import { inferNameFromEmail } from "../user/utils";
import { UserRepo } from "../user/repo";
import { SessionRepo } from "../session/repo";
import { InvalidCredentials, AccountNotVerified } from "./errors";
import type { SignUpPayload, SignInPayload, ResetPassword } from "./api";
import type { Session, User, VerificationCode } from "#/integrations/db/schema";
import { Email } from "#/integrations/email/client";
import { emailVerificationEmailBody, passwordResetEmailBody } from "./email";
import { VerificationCodeRepo } from "../verification-code/repo";
import {
  InvalidVerificationCode,
  VerificationCodeExpired,
  VerificationCodeNotFound,
} from "#/features/verification-code/errors";
import type { CurrentSession } from "./security";
import { PasswordResetTokenRepo } from "../password-reset-token/repo";
import { UserNotFound } from "../user/errors";
import {
  PasswordResetTokenExpired,
  PasswordResetTokenNotFound,
} from "../password-reset-token/errors";

export class AuthService extends Effect.Service<AuthService>()("AuthService", {
  accessors: true,
  dependencies: [
    Crypto.Default,
    UserRepo.Default,
    SessionRepo.Default,
    VerificationCodeRepo.Default,
    PasswordResetTokenRepo.Default,
    Email.Default,
  ],
  effect: Effect.gen(function* () {
    const crypto = yield* Crypto;
    const userRepo = yield* UserRepo;
    const sessionRepo = yield* SessionRepo;
    const verificationCodeRepo = yield* VerificationCodeRepo;
    const passwordResetTokenRepo = yield* PasswordResetTokenRepo;
    const email = yield* Email;

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

              // await seedUserAccount(user.id, tx);

              const verificationCode = yield* verificationCodeRepo.create({
                userId: user.id,
                code: yield* crypto.generateCode(),
              });

              yield* email.send(
                [user.email],
                "Verification code",
                emailVerificationEmailBody(verificationCode.code),
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

      signIn: (input: typeof SignInPayload.Type) => {
        return Effect.gen(function* () {
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
        }).pipe(Effect.timeout(500));
      },

      signOut: (sessionId: Session["id"]) => {
        return Effect.gen(function* () {
          yield* sessionRepo.deleteById(sessionId);
        }).pipe(Effect.timeout(500));
      },

      verifyAccount: (
        candidateCode: VerificationCode["code"],
        userId: VerificationCode["userId"],
      ) => {
        return Effect.gen(function* () {
          return yield* withTransaction(
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
                yield* verificationCodeRepo.deleteById(userId);
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

              return yield* Effect.succeed({
                session,
                token,
              });
            }),
          );
        }).pipe(Effect.timeout(500));
      },

      sendVerificationCode: (
        user: Pick<CurrentSession["Type"]["user"], "email" | "id">,
      ) => {
        return Effect.gen(function* () {
          return yield* withTransaction(
            Effect.gen(function* () {
              yield* verificationCodeRepo.deleteByUserId(user.id);

              const verificationCode = yield* verificationCodeRepo.create({
                userId: user.id,
                code: yield* crypto.generateCode(),
              });

              yield* email.send(
                [user.email],
                "Verification code",
                emailVerificationEmailBody(verificationCode.code),
              );
            }),
          );
        }).pipe(Effect.timeout(5000));
      },

      forgotPassword: (userEmail: User["email"]) => {
        return Effect.gen(function* () {
          return yield* withTransaction(
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
                passwordResetEmailBody(token),
              );
            }),
          );
        }).pipe(Effect.timeout(5000));
      },

      resetPassword: (input: typeof ResetPassword.Type) => {
        return Effect.gen(function* () {
          return yield* withTransaction(
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

              return {
                token,
                session,
              };
            }),
          );
        }).pipe(Effect.timeout(5000));
      },
    };
  }),
}) {}
