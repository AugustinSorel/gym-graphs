import { dashboardTable } from "~/db/db.schemas";
import type { Dashboard } from "~/db/db.schemas";
import type { Db } from "~/libs/db";

const create = async (userId: Dashboard["userId"], db: Db) => {
  const [dashboard] = await db
    .insert(dashboardTable)
    .values({ userId })
    .returning();

  if (!dashboard) {
    throw new Error("dashboard returned by db is null");
  }

  return dashboard;
};

export const dashboardRepo = {
  create,
};
