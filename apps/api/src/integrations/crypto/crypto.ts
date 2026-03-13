import { Data, Effect } from "effect";
import { randomBytes, scrypt } from "node:crypto";

class CryptoHashError extends Data.TaggedError("CryptoHashError")<{
  cause: unknown;
}> {}

export class Crypto extends Effect.Service<Crypto>()("Crypto", {
  effect: Effect.gen(function* () {
    return {
      generateSalt: () => randomBytes(16).toString("hex").normalize(),

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
    };
  }),
  accessors: true,
}) {}
