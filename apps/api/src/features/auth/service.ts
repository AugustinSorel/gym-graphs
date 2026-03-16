import { withTransaction } from "#/integrations/db/db";
import { Crypto } from "#/integrations/crypto/crypto";
import { Duration, Effect } from "effect";
import { inferNameFromEmail } from "../user/utils";
import { UserRepo } from "../user/repo";
import { SessionRepo } from "../session/repo";
import { InvalidCredentials } from "./errors";
import type { SignUpPayload, SignInPayload } from "./api";
import type { Session, VerificationCode } from "#/integrations/db/schema";
import { Email } from "#/integrations/email/client";
import { emailVerificationEmailBody } from "./email";
import { VerificationCodeRepo } from "../verification-code/repo";
import {
  InvalidVerificationCode,
  VerificationCodeExpired,
  VerificationCodeNotFound,
} from "#/features/verification-code/errors";

export class AuthService extends Effect.Service<AuthService>()("AuthService", {
  accessors: true,
  dependencies: [
    Crypto.Default,
    UserRepo.Default,
    SessionRepo.Default,
    VerificationCodeRepo.Default,
    Email.Default,
  ],
  effect: Effect.gen(function* () {
    const crypto = yield* Crypto;
    const userRepo = yield* UserRepo;
    const sessionRepo = yield* SessionRepo;
    const verificationCodeRepo = yield* VerificationCodeRepo;

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

              yield* Email.send(
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
        }).pipe(Effect.timeout(500)),

      signIn: (input: typeof SignInPayload.Type) => {
        return Effect.gen(function* () {
          const userOption = yield* userRepo.findByEmail(input.email);

          const user = yield* Effect.mapError(
            userOption,
            () => new InvalidCredentials(),
          );

          if (!user.verifiedAt) {
            return yield* Effect.fail(new InvalidCredentials());
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

              if (verificationCode.code !== candidateCode) {
                return yield* Effect.fail(new InvalidVerificationCode());
              }

              yield* verificationCodeRepo.deleteById(userId);

              const codeExpired = Duration.greaterThanOrEqualTo(
                Date.now(),
                verificationCode.expiresAt.getTime(),
              );

              if (codeExpired) {
                return yield* Effect.fail(new VerificationCodeExpired());
              }

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
    };
  }),
}) {}
