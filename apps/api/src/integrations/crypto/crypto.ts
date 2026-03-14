import { Data, Effect } from "effect";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

class CryptoHashError extends Data.TaggedError("CryptoHashError")<{
  cause: unknown;
}> {}

const generateSalt = () => {
  return Effect.sync(() => {
    return randomBytes(16).toString("hex").normalize();
  });
};

const generateId = () => {
  return Effect.sync(() => {
    return randomBytes(20).toString("base64");
  });
};

const hashSecret = (input: string, salt: string) => {
  return Effect.async<string, CryptoHashError>((resume) => {
    scrypt(input.normalize(), salt, 64, (error, hash) => {
      if (error) {
        resume(Effect.fail(new CryptoHashError({ cause: error })));
        return;
      }

      resume(Effect.succeed(hash.toString("hex").normalize()));
    });
  });
};

const verifySecret = (
  candidateSecret: string,
  hashedSecret: string,
  salt: string,
) => {
  return Effect.gen(function* () {
    const candidateHashed = yield* hashSecret(candidateSecret, salt);

    return timingSafeEqual(
      Buffer.from(candidateHashed, "hex"),
      Buffer.from(hashedSecret, "hex"),
    );
  });
};

const hashSHA256Hex = (input: string) => {
  return Effect.sync(() => {
    return createHash("sha256").update(input, "utf-8").digest("hex");
  });
};

export class Crypto extends Effect.Service<Crypto>()("Crypto", {
  effect: Effect.succeed({
    generateSalt,
    generateId,
    hashSecret,
    verifySecret,
    hashSHA256Hex,
  }),
  accessors: true,
}) {}
