import { oauthAccountTable } from "~/schemas";
import { ResultAsync } from "neverthrow";
import { buildError } from "~/error";
import { extractEntityFromRows } from "~/utils";
import type { OAuthAccount } from "~/schemas";
import type { Db } from "~/db";

const create = (
  providerId: OAuthAccount["providerId"],
  providerUserId: OAuthAccount["providerUserId"],
  userId: OAuthAccount["userId"],
  db: Db,
) => {
  return ResultAsync.fromPromise(
    db
      .insert(oauthAccountTable)
      .values({
        providerId,
        providerUserId,
        userId,
      })
      .returning(),
    (e) => buildError("internal", e),
  ).andThen(extractEntityFromRows);
};

export const oauthRepo = {
  create,
};
