import { inferNameFromEmail } from "~/user/user.utils";
import { generateSalt, hashSecret } from "~/session/session.utils";
import type { createUserModel } from "~/user/user.model";
import type { SignUpSchema } from "@gym-graphs/schemas/session";

export const createUserService = (
  model: ReturnType<typeof createUserModel>,
) => {
  return {
    signUpWithEmailAndPassword: async (input: SignUpSchema) => {
      const salt = generateSalt();
      const hashedPassword = await hashSecret(input.password, salt);

      const name = inferNameFromEmail(input.email);

      const user = await model.createWithEmailAndPassword(
        input.email,
        hashedPassword,
        salt,
        name,
      );

      return user;
    },
  };
};
