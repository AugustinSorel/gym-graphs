import { Data, Effect } from "effect";
import {
  createHash,
  randomBytes,
  scrypt,
  timingSafeEqual,
  randomInt,
} from "node:crypto";

class CryptoHashError extends Data.TaggedError("CryptoHashError")<{
  cause: unknown;
}> {}

export class Crypto extends Effect.Service<Crypto>()("Crypto", {
  effect: Effect.succeed({
    generateSalt: () => {
      return Effect.sync(() => {
        return randomBytes(16).toString("hex").normalize();
      });
    },

    generateId: () => {
      return Effect.sync(() => {
        return randomBytes(20).toString("base64url");
      });
    },

    generateCode: () => {
      return Effect.sync(() => {
        return Array.from({ length: 6 }, () => randomInt(0, 10)).join("");
      });
    },

    hashSecret: (input: string, salt: string) => {
      return Effect.async<string, CryptoHashError>((resume) => {
        scrypt(input.normalize(), salt, 64, (error, hash) => {
          if (error) {
            resume(Effect.fail(new CryptoHashError({ cause: error })));
            return;
          }

          resume(Effect.succeed(hash.toString("hex").normalize()));
        });
      });
    },

    verifySecret: (candidateHashed: string, hashedSecret: string) => {
      return Effect.gen(function* () {
        return timingSafeEqual(
          Buffer.from(candidateHashed, "hex"),
          Buffer.from(hashedSecret, "hex"),
        );
      });
    },

    hashSHA256Hex: (input: string) => {
      return Effect.sync(() => {
        return createHash("sha256").update(input, "utf-8").digest("hex");
      });
    },
  }),
  accessors: true,
}) {}
