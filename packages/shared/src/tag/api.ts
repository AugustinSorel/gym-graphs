import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import {
  CreateTagPayload,
  PatchTagPayload,
  TagSchema,
  TagSuccessSchema,
  TagWithCountSchema,
} from "./schemas";
import { RequireVerifiedSession } from "#/auth/middlewares";
import { DuplicateTag, TagNotFound } from "./errors";
import { Schema } from "effect";

export const tagApi = HttpApiGroup.make("Tag")
  .add(
    HttpApiEndpoint.post("create", "/")
      .setPayload(CreateTagPayload)
      .addError(DuplicateTag)
      .addSuccess(TagSuccessSchema),
  )
  .add(
    HttpApiEndpoint.get("all", "/").addSuccess(
      TagWithCountSchema.pipe(Schema.Array),
    ),
  )
  .add(
    HttpApiEndpoint.del("delete", "/:tagId")
      .setPath(
        Schema.Struct({
          tagId: Schema.NumberFromString.pipe(
            Schema.compose(TagSchema.fields.id),
          ),
        }),
      )
      .addError(TagNotFound),
  )
  .add(
    HttpApiEndpoint.patch("patch", "/:tagId")
      .setPath(
        Schema.Struct({
          tagId: Schema.NumberFromString.pipe(
            Schema.compose(TagSchema.fields.id),
          ),
        }),
      )
      .setPayload(PatchTagPayload)
      .addError(TagNotFound),
  )
  .middleware(RequireVerifiedSession)
  .prefix("/tags");
