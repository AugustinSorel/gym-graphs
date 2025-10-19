import { exerciseRepo } from "~/domains/exercise/exercise.repo";
import { tileRepo } from "./tile.repo";
import type { Db } from "~/libs/db";
import type { Tile } from "~/db/db.schemas";

const createExerciseTile = async (
  name: Tile["name"],
  dashboardId: Tile["dashboardId"],
  db: Db,
) => {
  await db.transaction(async (tx) => {
    const exercise = await exerciseRepo.create(tx);

    await tileRepo.create(name, "exercise", exercise.id, dashboardId, tx);
  });
};

export const tileService = {
  createExerciseTile,
};
