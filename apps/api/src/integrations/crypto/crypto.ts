import { Data, Effect } from "effect";
import { createHash, randomBytes, scrypt } from "node:crypto";

class CryptoHashError extends Data.TaggedError("CryptoHashError")<{
  cause: unknown;
}> {}

export class Crypto extends Effect.Service<Crypto>()("Crypto", {
  effect: Effect.gen(function* () {
    return {
      generateSalt: Effect.sync(() => {
        return randomBytes(16).toString("hex").normalize();
      }),

      generateId: Effect.sync(() => {
        return randomBytes(20).toString("base64");
      }),

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

      hashSHA256Hex: (input: string) => {
        return Effect.sync(() => {
          return createHash("sha256").update(input, "utf-8").digest("hex");
        });
      },
    };
  }),
  accessors: true,
}) {}
