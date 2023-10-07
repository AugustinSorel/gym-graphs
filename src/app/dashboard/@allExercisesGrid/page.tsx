import { db } from "@/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TimelineContainer } from "../timelineContainer";
import { Badge } from "@/components/ui/badge";
import type { ComponentProps } from "react";
import { Grid } from "./grid";
import type { User } from "@/db/types";
//TODO: optimistic update when adding / updating / removing exercise

const AllExercisesGrid = async () => {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.id) {
    return redirect("/");
  }

  const exercises = await getExercises(session.user.id);

  if (exercises.length < 1) {
    return (
      <Container>
        <Title>no data</Title>
        <Text>
          Your dashboard is empty
          <br />
          Start adding new data with the form above
        </Text>
      </Container>
    );
  }

  return (
    <TimelineContainer>
      <Badge variant="accent" className="mx-auto lg:ml-0 lg:mr-auto">
        <time dateTime="all">all</time>
      </Badge>

      <Grid exercises={exercises} />
    </TimelineContainer>
  );
};

export default AllExercisesGrid;

const Container = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="mt-10 flex flex-col items-center space-y-5 text-center"
    />
  );
};

const Title = (props: ComponentProps<"h1">) => {
  return <h1 {...props} className="text-6xl font-bold uppercase" />;
};

const Text = (props: ComponentProps<"p">) => {
  return <p {...props} className="text-xl text-muted-foreground" />;
};

const getExercises = async (userId: User["id"]) => {
  return (
    await db.query.exercises.findMany({
      where: (exercise, { eq }) => eq(exercise.userId, userId),
      with: {
        data: { orderBy: (data, { asc }) => [asc(data.doneAt)] },
        position: true,
      },
    })
  ).sort((a, b) => b.position.gridPosition - a.position.gridPosition);
};
