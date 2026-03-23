import { Effect } from "effect";
import { UserRepo } from "../user/repo";
import type { User } from "#/integrations/db/schema";
import type { PatchUserByIdPayload } from "@gym-graphs/shared/user/schemas";

export class UserService extends Effect.Service<UserService>()("UserService", {
  accessors: true,
  dependencies: [UserRepo.Default],
  effect: Effect.gen(function* () {
    const userRepo = yield* UserRepo;

    return {
      patchByUserId: (
        payload: typeof PatchUserByIdPayload.Type,
        userId: User["id"],
      ) => {
        return Effect.gen(function* () {
          const user = yield* userRepo.patchByUserId(payload, userId);

          return user;
        }).pipe(Effect.timeout(5000));
      },
    };
  }),
}) {}
