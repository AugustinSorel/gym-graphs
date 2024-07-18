import type { TeamRandomFactsProps } from "@/components/graphs/teamRandomFacts";
import type { WeightUnit } from "@/context/weightUnit";
import type { ExerciseData, ExerciseWithData } from "@/server/db/types";
import { getUserDisplayName } from "./utils";
import type { RouterOutputs } from "@/trpc/react";

const LBS_CONVERTION = 2.2046244;

export const calculateOneRepMax = (
  weightLifted: ExerciseData["weightLifted"],
  numberOfReps: ExerciseData["numberOfRepetitions"],
) => {
  return +(weightLifted * (1 + numberOfReps / 30)).toFixed(2);
};

export const convertWeight = (weight: number, unit: WeightUnit) => {
  if (unit === "lb") {
    return +(weight * LBS_CONVERTION).toFixed(2);
  }

  return weight;
};

export const convertWeightToKg = (weight: number, unit: WeightUnit) => {
  if (unit === "lb") {
    return +(weight / LBS_CONVERTION).toFixed(2);
  }

  return weight;
};

export const prepareUserRandomFactsData = (
  exercises: Array<ExerciseWithData>,
) => {
  return {
    amountOfWeightLifted: exercises.reduce((prev, curr) => {
      return (
        prev +
        curr.data.reduce((prev, curr) => {
          return prev + curr.weightLifted;
        }, 0)
      );
    }, 0),

    numberOfRepetitionsMade: exercises.reduce((prev, curr) => {
      return (
        prev +
        curr.data.reduce((prev, curr) => {
          return prev + curr.numberOfRepetitions;
        }, 0)
      );
    }, 0),

    numberOfDays: exercises.reduce((prev, curr) => {
      curr.data.forEach((x) => prev.add(x.doneAt));

      return prev;
    }, new Set<string>()).size,

    numberOfExercisesCreated: exercises.length,

    numberOfDataLogged: exercises.reduce((prev, curr) => {
      return prev + curr.data.length;
    }, 0),
  };
};

export const prepareTeamRandomFactsData = (
  members: RouterOutputs["team"]["get"]["usersToTeams"],
) => {
  const facts: TeamRandomFactsProps["facts"] = {
    userWhoLiftedTheMostWeight: { value: 0, name: null },
    userWhoDidTheMostOfReps: { value: 0, name: null },
    userWithTheMostActivity: { value: 0, name: null },
    userWhoCreatedTheMostExercises: { value: 0, name: null },
    userWithTheMostdataLogged: { value: 0, name: null },
  };

  for (const member of members) {
    if (
      member.user.stats.numberOfRepetitionsMade >
      facts.userWhoLiftedTheMostWeight.value
    ) {
      facts.userWhoLiftedTheMostWeight.name = getUserDisplayName(member.user);
      facts.userWhoLiftedTheMostWeight.value =
        member.user.stats.numberOfRepetitionsMade;
    }

    if (
      member.user.stats.numberOfRepetitionsMade >
      facts.userWhoDidTheMostOfReps.value
    ) {
      facts.userWhoDidTheMostOfReps.name = getUserDisplayName(member.user);
      facts.userWhoDidTheMostOfReps.value =
        member.user.stats.numberOfRepetitionsMade;
    }

    if (member.user.stats.numberOfDays > facts.userWithTheMostActivity.value) {
      facts.userWithTheMostActivity.name = getUserDisplayName(member.user);
      facts.userWithTheMostActivity.value = member.user.stats.numberOfDays;
    }

    if (
      member.user.stats.numberOfExercisesCreated >
      facts.userWhoCreatedTheMostExercises.value
    ) {
      facts.userWhoCreatedTheMostExercises.name = getUserDisplayName(
        member.user,
      );
      facts.userWhoCreatedTheMostExercises.value =
        member.user.stats.numberOfExercisesCreated;
    }

    if (
      member.user.stats.numberOfDataLogged >
      facts.userWithTheMostdataLogged.value
    ) {
      facts.userWithTheMostdataLogged.name = getUserDisplayName(member.user);
      facts.userWithTheMostdataLogged.value =
        member.user.stats.numberOfDataLogged;
    }
  }

  return facts;
};
