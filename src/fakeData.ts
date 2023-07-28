export type Exercise = {
  id: string;
  name: string;
  data: ExerciseData[];
  gridIndex: number;
};

export type ExerciseData = {
  id: string;
  date: string;
  weight: number;
  numberOfReps: number;
  oneRepMax: number;
};

const exercises: Exercise[] = [
  {
    id: "1",
    name: "bench press",
    gridIndex: 0,
    data: [
      {
        id: "3a2c2058-0dea-4940-a99a-ae6103ba512a",
        date: "2023/07/01",
        weight: 100,
        numberOfReps: 10,
        oneRepMax: 130,
      },
      {
        id: "d4c1a5f0-8f6f-4c7a-8e9b-5a5b8e2c4e5c",
        date: "2023/07/02",
        weight: 50,
        numberOfReps: 20,
        oneRepMax: 100,
      },
      {
        id: "8e2c4e5c-d4c1a5f0-8f6f-4c7a-8e9b-5a5b",
        date: "2023/07/03",
        weight: 70,
        numberOfReps: 15,
        oneRepMax: 120,
      },
      {
        id: "a2c2058-0dea-4940-a99a-ae6103ba512a",
        date: "2023/07/05",
        weight: 90,
        numberOfReps: 12,
        oneRepMax: 125,
      },
      {
        id: "5a5b8e2c4e5c-d4c1a5f0-8f6f-4c7a-8e9b",
        date: "2023/07/06",
        weight: 80,
        numberOfReps: 18,
        oneRepMax: 115,
      },
    ],
  },
  {
    id: "2",
    name: "squat",
    gridIndex: 1,
    data: [
      {
        id: "83ba512a-3a2c2058-0dea-4940-a99a-ae61",
        date: "2023/06/25",
        weight: 150,
        numberOfReps: 8,
        oneRepMax: 180,
      },
      {
        id: "f0-8f6f-4c7a-8e9b-5a5b8e2c4e5c-d4c1a5",
        date: "2023/07/02",
        weight: 100,
        numberOfReps: 12,
        oneRepMax: 150,
      },
      {
        id: "7a-8e9b-5a5b8e2c4e5c-d4c1a5f0-8f6f-4c",
        date: "2023/07/04",
        weight: 120,
        numberOfReps: 10,
        oneRepMax: 170,
      },
      {
        id: "2c2058-0dea-4940-a99a-ae6103ba512a-3a",
        date: "2023/07/05",
        weight: 140,
        numberOfReps: 6,
        oneRepMax: 175,
      },
      {
        id: "5b8e2c4e5c-d4c1a5f0-8f6f-4c7a-8e9b-5a",
        date: "2023/07/10",
        weight: 130,
        numberOfReps: 8,
        oneRepMax: 160,
      },
      {
        id: "83ba512a-3a2c2058-0dea-4940-a99a-ae61",
        date: "2023/05/25",
        weight: 150,
        numberOfReps: 8,
        oneRepMax: 180,
      },
    ],
  },
  {
    id: "3",
    name: "deadlift",
    gridIndex: 2,
    data: [
      {
        id: "5a512a-3a2c2058-0dea-4940-a99a-ae6103b",
        date: "2023/06/25",
        weight: 180,
        numberOfReps: 6,
        oneRepMax: 210,
      },
      {
        id: "4e5c-d4c1a5f0-8f6f-4c7a-8e9b-5a5b8e2c",
        date: "2023/06/26",
        weight: 180,
        numberOfReps: 8,
        oneRepMax: 190,
      },
      {
        id: "c4e5c-d4c1a5f0-8f6f-4c7a-8e9b-5a5b8e2",
        date: "2023/06/27",
        weight: 160,
        numberOfReps: 6,
        oneRepMax: 205,
      },
      {
        id: "3a5b8e2c4e5c-d4c1a5f0-8f6f-4c7a-8e9b-5a5",
        date: "2023/06/28",
        weight: 200,
        numberOfReps: 4,
        oneRepMax: 220,
      },
      {
        id: "a5f0-8f6f-4c7a-8e9b-5a5b8e2c4e5c-d4c1",
        date: "2023/06/29",
        weight: 180,
        numberOfReps: 6,
        oneRepMax: 210,
      },
    ],
  },
  {
    id: "4",
    name: "shoulder press",
    gridIndex: 3,
    data: [
      {
        id: "5b8e2c4e5c-d4c1a5f0-8f6f-4c7a-8e9b-5a5b8",
        date: "2023/06/25",
        weight: 60,
        numberOfReps: 12,
        oneRepMax: 80,
      },
      {
        id: "2c4e5c-d4c1a5f0-8f6f-4c7a-8e9b-5a5b8e2c",
        date: "2023/06/26",
        weight: 40,
        numberOfReps: 15,
        oneRepMax: 70,
      },
      {
        id: "e5c-d4c1a5f0-8f6f-4c7a-8e9b-5a5b8e2c4",
        date: "2023/06/27",
        weight: 50,
        numberOfReps: 14,
        oneRepMax: 75,
      },
      {
        id: "8e2c4e5c-d4c1a5f0-8f6f-4c7a-8e9b-5a5b8e",
        date: "2023/06/28",
        weight: 55,
        numberOfReps: 12,
        oneRepMax: 70,
      },
    ],
  },

  {
    id: "5",
    name: "dumbbell curls",
    gridIndex: 4,
    data: [
      {
        id: "f4a39b9d-61c3-4f94-862a-79b968f3c73a",
        date: "2023/02/27",
        weight: 20,
        numberOfReps: 8,
        oneRepMax: 25,
      },
      {
        id: "83179c5b-4d13-44e4-9e19-35a06ff8e70b",
        date: "2023/02/28",
        weight: 15,
        numberOfReps: 10,
        oneRepMax: 20,
      },
      {
        id: "c1c785da-33fc-49dd-977e-7f1c8a24eac6",
        date: "2023/07/04",
        weight: 17.5,
        numberOfReps: 12,
        oneRepMax: 22.5,
      },
      {
        id: "5dce1b8d-3f4c-4f65-82ea-0c6c195fbf72",
        date: "2023/07/05",
        weight: 22.5,
        numberOfReps: 6,
        oneRepMax: 27.5,
      },
      {
        id: "9a12be84-9c0e-4e6f-b9e3-6809e7803d9f",
        date: "2023/07/07",
        weight: 25,
        numberOfReps: 8,
        oneRepMax: 30,
      },
      {
        id: "f4a39b9d-61c3-4f94-862a-79b968f3c73a",
        date: "2023/02/01",
        weight: 20,
        numberOfReps: 8,
        oneRepMax: 25,
      },
    ],
  },
];

export const getExercises = () => {
  return exercises.map((exercise) => ({
    ...exercise,
    data: exercise.data.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    ),
  }));
};

export const getExercise = (name: string) => {
  const res = exercises.find((e) => e.name === name);
  if (!res) {
    throw new Error("exercise not found in fake data file");
  }

  return {
    ...res,
    data: res.data.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    ),
  };
};

export const addNewExercise = (
  exercise: Pick<Exercise, "name" | "gridIndex">
) => {
  const newExercise = {
    ...exercise,
    id: Math.random().toString(),
    data: [],
  };
  exercises.push(newExercise);
};
