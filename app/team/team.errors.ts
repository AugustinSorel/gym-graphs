import { z } from "zod";
import { AppError } from "~/libs/error";

export class TeamNotFoundError extends AppError {
  constructor() {
    super("team not found", 404);
  }
}

export class TeamDuplicateError extends AppError {
  public static check = (e: unknown) => {
    return z
      .object({ constraint: z.string() })
      .refine((e) => e.constraint === "team_name_unique")
      .safeParse(e).success;
  };

  constructor() {
    super("team already created", 409);
  }
}

export class TeamMemberNotFoundError extends AppError {
  constructor() {
    super("team member not found", 404);
  }
}

export class TeamMemberAlreadyInTeamError extends AppError {
  constructor() {
    super("team member already in team", 409);
  }
}

export class TeamInvitationNotFoundError extends AppError {
  constructor() {
    super("team invitation not found", 404);
  }
}

export class TeamInvitationAdminInviterError extends AppError {
  constructor() {
    super("only admins are allowed to invite new members", 403);
  }
}

export class TeamInvitationExpiredError extends AppError {
  constructor() {
    super("invitation expired", 403);
  }
}

export class TeamJoinRequestRejectPrivilegeError extends AppError {
  constructor() {
    super("only admin can reject team request", 403);
  }
}

export class TeamJoinRequestAcceptPrivilegeError extends AppError {
  constructor() {
    super("only admin can accept team request", 403);
  }
}

export class TeamJoinRequestPrivateVisibilityError extends AppError {
  constructor() {
    super("cannot create join request as the team is private", 403);
  }
}

export class TeamEventReactionNotFoundError extends AppError {
  constructor() {
    super("team event reaction not found", 404);
  }
}
