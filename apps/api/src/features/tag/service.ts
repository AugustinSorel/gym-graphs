import { Effect } from "effect";
import type { Tag } from "#/integrations/db/schema";
import type {
  CreateTagPayload,
  PatchTagPayload,
} from "@gym-graphs/shared/tag/schemas";
import { TagRepo } from "./repo";

export class TagService extends Effect.Service<TagService>()("TagService", {
  accessors: true,
  dependencies: [TagRepo.Default],
  effect: Effect.gen(function* () {
    const tagRepo = yield* TagRepo;

    return {
      create: (
        payload: typeof CreateTagPayload.Type,
        userId: Tag["userId"],
      ) => {
        return tagRepo
          .create({ name: payload.name, userId })
          .pipe(Effect.timeout(5000));
      },

      selectAll: (userId: Tag["userId"]) => {
        return tagRepo.selectAll(userId).pipe(Effect.timeout(5000));
      },

      deleteByTagId: (tagId: Tag["id"], userId: Tag["userId"]) => {
        return tagRepo.deleteByTagId(tagId, userId).pipe(Effect.timeout(5000));
      },

      patchByTagId: (
        payload: typeof PatchTagPayload.Type,
        tagId: Tag["id"],
        userId: Tag["userId"],
      ) => {
        return tagRepo
          .patchByTagId(payload, tagId, userId)
          .pipe(Effect.timeout(5000));
      },
    };
  }),
}) {}
