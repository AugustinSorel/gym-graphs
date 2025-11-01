import { dashboardTable } from "~/schemas";
import { ResultAsync } from "neverthrow";
import { buildError } from "~/error";
import { extractEntityFromRows } from "~/utils";
import type { Dashboard } from "~/schemas";
import type { Db } from "~/db";

const create = (userId: Dashboard["userId"], db: Db) => {
  return ResultAsync.fromPromise(
    db.insert(dashboardTable).values({ userId }).returning(),
    (e) => buildError("internal", e),
  ).andThen(extractEntityFromRows);
};

export const dashboardRepo = {
  create,
};
