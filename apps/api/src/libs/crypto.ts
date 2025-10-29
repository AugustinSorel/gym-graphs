import { scrypt, randomBytes, createHash, timingSafeEqual } from "crypto";

export const generateSalt = () => {
  return randomBytes(16).toString("hex").normalize();
};

export const hashSecret = (input: string, salt: string) => {
  return new Promise<string>((resolve, reject) => {
    scrypt(input.normalize(), salt, 64, (error, hash) => {
      if (error) reject(error);

      resolve(hash.toString("hex").normalize());
    });
  });
};

export const verifySecret = async (
  candidateSecret: string,
  hashedSecret: string,
  salt: string,
) => {
  const candidateHashedSecret = await hashSecret(candidateSecret, salt);

  return timingSafeEqual(
    Buffer.from(candidateHashedSecret, "hex"),
    Buffer.from(hashedSecret, "hex"),
  );
};

export const hashSHA256Hex = (input: string) => {
  return createHash("sha256").update(input, "utf-8").digest("hex");
};
