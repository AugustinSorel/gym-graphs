import { HTTPException } from "hono/http-exception";
import { oauthAccountTable } from "~/db/db.schemas";
import type { OAuthAccount } from "~/db/db.schemas";
import type { Db } from "~/libs/db";

const create = async (
  providerId: OAuthAccount["providerId"],
  providerUserId: OAuthAccount["providerUserId"],
  userId: OAuthAccount["userId"],
  db: Db,
) => {
  const [oauthTable] = await db
    .insert(oauthAccountTable)
    .values({
      providerId,
      providerUserId,
      userId,
    })
    .returning();

  if (!oauthTable) {
    throw new HTTPException(500, { message: "db did not return oauth table" });
  }

  return oauthTable;
};

export const oauthRepo = {
  create,
};
