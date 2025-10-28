import { teamRepo } from "~/domains/team/team.repo";
import type { Team, TeamMember } from "~/db/db.schemas";
import type { Db } from "~/libs/db";

const create = async (
  userId: TeamMember["userId"],
  name: Team["name"],
  visibility: Team["visibility"],
  db: Db,
) => {
  return db.transaction(async (tx) => {
    const team = await teamRepo.create(name, visibility, tx);

    await teamRepo.addMember(team.id, userId, "admin", tx);
  });
};

const selectInfinite = async (
  userId: TeamMember["userId"],
  name: Team["name"],
  page: number,
  db: Db,
) => {
  const pageSize = 100;

  const teams = await teamRepo.selectInfinite(userId, page, name, pageSize, db);

  const showNextPage = teams.length > pageSize - 1;
  const nextCursor = showNextPage ? page + 1 : null;

  return {
    teams,
    nextCursor,
  };
};

export const teamService = {
  create,
  selectInfinite,
};
