import { SmileIcon } from "~/ui/icons";
import { Badge } from "~/ui/badge";
import { Button } from "~/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/ui/dropdown-menu";
import { useUser } from "~/user/hooks/use-user";
import { useTeam } from "~/team/hooks/use-team";
import { CatchBoundary, getRouteApi } from "@tanstack/react-router";
import { teamEventReactionsSchema } from "~/team/team.schemas";
import { convertWeightsInText } from "~/weight-unit/weight-unit.utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createTeamEventReactionAction,
  removeTeamEventReactionAction,
} from "~/team/team.actions";
import { selectTeamById } from "~/team/team.services";
import { teamQueries } from "~/team/team.queries";
import { ToggleGroup, ToggleGroupItem } from "~/ui/toggle-group";
import { cn } from "~/styles/styles.utils";
import type { ComponentProps } from "react";
import type { TeamEventReaction, User } from "~/db/db.schemas";
import type { ErrorComponentProps } from "@tanstack/react-router";

export const TeamEventsTimeline = () => {
  const params = routeApi.useParams();
  const team = useTeam(params.teamId);
  const user = useUser();

  if (!team.data.events.length) {
    return <NoEventsMsg>no events</NoEventsMsg>;
  }

  return (
    <Timeline>
      {team.data.events.map((event) => (
        <CatchBoundary
          errorComponent={EventFallback}
          getResetKey={() => "reset"}
          key={event.id}
        >
          <Event>
            <EventName>{event.name}</EventName>
            <EventDescription>
              {convertWeightsInText(event.description, user.data.weightUnit)}
            </EventDescription>

            <EventReactionsContainer>
              <EventReactionPicker event={event} />
              <EventReactions reactions={event.reactions} />
            </EventReactionsContainer>
          </Event>
        </CatchBoundary>
      ))}
    </Timeline>
  );
};

const routeApi = getRouteApi("/(teams)/teams_/$teamId");

type Event = Readonly<
  NonNullable<Awaited<ReturnType<typeof selectTeamById>>>["events"][number]
>;

const EventReactionPicker = (props: { event: Event }) => {
  const addReaction = useAddReaction();
  const removeReaction = useRemoveReaction();
  const user = useUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className="size-8 shrink-0 rounded-full"
          aria-label="pick an emoji to react"
        >
          <SmileIcon className="stroke-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="flex items-center gap-2" align="start">
        {teamEventReactionsSchema.shape.emoji.options.map((emoji) => (
          <DropdownMenuItem
            key={emoji}
            onClick={() => {
              const reactionAlreadyAdded = props.event.reactions.some(
                (reaction) => {
                  return (
                    reaction.emoji === emoji && reaction.userId === user.data.id
                  );
                },
              );

              if (reactionAlreadyAdded) {
                removeReaction.mutate({
                  data: {
                    emoji,
                    teamEventId: props.event.id,
                  },
                });
              } else {
                addReaction.mutate({
                  data: {
                    emoji,
                    teamEventId: props.event.id,
                  },
                });
              }
            }}
          >
            {emoji}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const useAddReaction = () => {
  const params = routeApi.useParams();
  const team = useTeam(params.teamId);
  const queryClient = useQueryClient();
  const user = useUser();

  return useMutation({
    mutationFn: createTeamEventReactionAction,
    onMutate: (variables) => {
      const queries = {
        team: teamQueries.get(team.data.id).queryKey,
      } as const;

      queryClient.setQueryData(queries.team, (team) => {
        if (!team) {
          return team;
        }

        return {
          ...team,
          events: team.events.map((event) => {
            if (event.id === variables.data.teamEventId) {
              return {
                ...event,
                reactions: [
                  ...event.reactions,
                  {
                    emoji: variables.data.emoji,
                    teamEventId: variables.data.teamEventId,
                    user: user.data,
                    userId: user.data.id,
                    createdAt: new Date(),
                    updateAt: new Date(),
                  },
                ],
              };
            }

            return event;
          }),
        };
      });
    },
    onSettled: () => {
      const queries = {
        team: teamQueries.get(team.data.id),
      } as const;

      void queryClient.invalidateQueries(queries.team);
    },
  });
};

const useRemoveReaction = () => {
  const params = routeApi.useParams();
  const team = useTeam(params.teamId);
  const queryClient = useQueryClient();
  const user = useUser();

  return useMutation({
    mutationFn: removeTeamEventReactionAction,
    onMutate: (variables) => {
      const queries = {
        team: teamQueries.get(team.data.id).queryKey,
      } as const;

      queryClient.setQueryData(queries.team, (team) => {
        if (!team) {
          return team;
        }

        return {
          ...team,
          events: team.events.map((event) => {
            if (event.id === variables.data.teamEventId) {
              return {
                ...event,
                reactions: event.reactions.filter((reaction) => {
                  return (
                    reaction.emoji !== variables.data.emoji ||
                    reaction.userId !== user.data.id
                  );
                }),
              };
            }

            return event;
          }),
        };
      });
    },
    onSettled: () => {
      const queries = {
        team: teamQueries.get(team.data.id),
      } as const;

      void queryClient.invalidateQueries(queries.team);
    },
  });
};

const EventReactionsContainer = (props: ComponentProps<"div">) => {
  return <div className="mt-2 flex items-center gap-2" {...props} />;
};

const EventReactions = (props: {
  reactions: ReadonlyArray<TeamEventReaction>;
}) => {
  const user = useUser();
  const removeReaction = useRemoveReaction();
  const addReaction = useAddReaction();

  const reactions = groupReactionsByEmoji(props.reactions);

  if (!reactions.length) {
    return <p className="text-muted-foreground text-sm">👈 show some love</p>;
  }

  return (
    <ToggleGroup
      type="multiple"
      value={reactions.map((reaction) => reaction.emoji)}
      className="max-w-full flex-wrap justify-start gap-0"
      onValueChange={(newEmojis) => {
        const currentEmojis = reactions.map((reaction) => reaction.emoji);

        const currentEmojisSet = new Set(currentEmojis);
        const newEmojisSet = new Set(newEmojis);

        const emojiCliked = Array.from(
          currentEmojisSet.difference(newEmojisSet),
        ).at(0);

        const reactionClicked = reactions.find((reaction) => {
          return reaction.emoji === emojiCliked;
        });

        if (!reactionClicked) {
          throw new Error("reaction not found");
        }

        const emojiAlreadyAdded = reactionClicked.likedBy.includes(
          user.data.id,
        );

        if (emojiAlreadyAdded) {
          removeReaction.mutate({
            data: {
              emoji: reactionClicked.emoji,
              teamEventId: reactionClicked.teamEventId,
            },
          });
        } else {
          addReaction.mutate({
            data: {
              emoji: reactionClicked.emoji,
              teamEventId: reactionClicked.teamEventId,
            },
          });
        }
      }}
    >
      {reactions
        .sort((a, b) => b.likedBy.length - a.likedBy.length)
        .map((reaction) => (
          <ToggleGroupItem
            key={reaction.emoji}
            className="flex-wrap data-[state=on]:bg-transparent"
            value={reaction.emoji}
          >
            <Badge
              key={reaction.emoji}
              variant={
                reaction.likedBy.includes(user.data.id) ? "default" : "outline"
              }
              className="text-sm tracking-widest whitespace-nowrap"
            >
              {reaction.emoji} {reaction.likedBy.length}
            </Badge>
          </ToggleGroupItem>
        ))}
    </ToggleGroup>
  );
};

const groupReactionsByEmoji = (reactions: ReadonlyArray<TeamEventReaction>) => {
  return reactions.reduce<
    Array<{
      emoji: TeamEventReaction["emoji"];
      likedBy: Array<User["id"]>;
      teamEventId: TeamEventReaction["teamEventId"];
    }>
  >((acc, curr) => {
    const reaction = acc.find((reaction) => reaction.emoji === curr.emoji);

    if (!reaction) {
      const newRow = {
        emoji: curr.emoji,
        likedBy: [curr.userId],
        teamEventId: curr.teamEventId,
      };

      acc.push(newRow);
    } else {
      reaction.likedBy.push(curr.userId);
    }

    return acc;
  }, []);
};

const Timeline = (props: ComponentProps<"ol">) => {
  return <ol {...props} />;
};

const Event = ({ className, ...props }: ComponentProps<"li">) => {
  return (
    <li
      className={cn(
        "before:border-input before:bg-background hover:bg-accent after:bg-input hover:before:border-muted-foreground relative rounded-lg border border-transparent py-5 pr-16 pl-12 not-last:pb-10 before:absolute before:left-3.5 before:z-10 before:mt-2.5 before:size-3 before:rounded-full before:border-2 before:transition-colors after:absolute after:top-0 after:bottom-0 after:left-4.75 after:w-0.5",
        className,
      )}
      {...props}
    />
  );
};

const EventName = (props: ComponentProps<"h2">) => {
  return (
    <h2
      className="truncate text-lg font-semibold first-letter:capitalize"
      {...props}
    />
  );
};

const EventDescription = (props: ComponentProps<"p">) => {
  return <p className="text-muted-foreground" {...props} />;
};

const NoEventsMsg = (props: ComponentProps<"p">) => {
  return (
    <p
      className="text-muted-foreground rounded-md border p-6 text-center"
      {...props}
    />
  );
};

const ErrorMsg = (props: ComponentProps<"code">) => {
  return <code className="overflow-auto" {...props} />;
};

const EventFallback = (props: ErrorComponentProps) => {
  return (
    <Event className="border-destructive bg-destructive/10 hover:bg-destructive/15 before:border-destructive after:bg-destructive before:bg-destructive/10 hover:before:border-destructive border before:backdrop-blur-md">
      <EventName>something went wrong</EventName>
      <ErrorMsg>{props.error.message}</ErrorMsg>
    </Event>
  );
};
