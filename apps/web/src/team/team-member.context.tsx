import { createContext, use } from "react";
import type { ComponentProps } from "react";
import type { TeamMember } from "~/db/db.schemas";

const Ctx = createContext<TeamMember | undefined>(undefined);

export const TeamMemberProvider = (props: ComponentProps<typeof Ctx>) => {
  return <Ctx {...props} />;
};

export const useTeamMember = () => {
  const ctx = use(Ctx);

  if (!ctx) {
    throw new Error("useMember must be wrapped within a <MemberProvider/>");
  }

  return ctx;
};
