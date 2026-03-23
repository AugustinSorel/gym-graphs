import { HttpApiSchema } from "@effect/platform";
import { Schema } from "effect";

export class DuplicateTag extends Schema.TaggedError<DuplicateTag>()(
  "DuplicateTag",
  { message: Schema.String },
  HttpApiSchema.annotations({ status: 409 }),
) {
  static withName(name: string) {
    return new DuplicateTag({
      message: `Tag with name ${name} already exists`,
    });
  }
}

export class TagNotFound extends Schema.TaggedError<TagNotFound>()(
  "TagNotFound",
  {
    message: Schema.optionalWith(Schema.String, {
      default: () => "Tag not found.",
    }),
  },
  HttpApiSchema.annotations({ status: 404 }),
) {}
