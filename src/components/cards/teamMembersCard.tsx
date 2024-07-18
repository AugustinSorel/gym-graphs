import type { RouterOutputs } from "@/trpc/react";
import { Card } from "../ui/card";
import type { ComponentPropsWithoutRef } from "react";
import type { User } from "next-auth";
import { getUserDisplayName } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export const TeamMembersCard = (
  props: Pick<RouterOutputs["team"]["get"], "usersToTeams">,
) => {
  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>members ({props.usersToTeams.length})</Card.Title>
      </Card.Header>

      <MemberList>
        {props.usersToTeams.map((member) => (
          <MemberItem key={member.user.id} member={member.user} />
        ))}
      </MemberList>
    </Card.Root>
  );
};

const MemberItem = ({ member }: { member: User }) => {
  return (
    <li className="grid grid-cols-[auto_1fr] grid-rows-[auto_auto] items-center gap-x-3 text-left">
      <Avatar className="row-span-2">
        <AvatarImage src={member.image ?? ""} alt={`${member.email} avatar'`} />
        <AvatarFallback>{getUserDisplayName(member).at(0)}</AvatarFallback>
      </Avatar>

      <p className="truncate capitalize">{getUserDisplayName(member)}</p>

      <p className="truncate text-sm text-muted-foreground">{member.email}</p>
    </li>
  );
};

const MemberList = (props: ComponentPropsWithoutRef<"ul">) => {
  return (
    <ul
      className="divide-y-muted-foreground max-h-full space-y-3 divide-y overflow-auto p-5 [&>*:not(:first-child)]:pt-3"
      {...props}
    />
  );
};
