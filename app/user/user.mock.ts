import type { selectClientUser } from "~/user/user.services";

export const userMock = {
  weightUnit: "kg",
  email: "john@email.com",
  name: "john",
  id: 1,
  dashboard: {
    id: 0,
  },
  tags: [
    {
      id: 172,
      userId: 27,
      name: "legs",
      createdAt: new Date(),
      updatedAt: new Date(),
      exercises: [
        {
          exerciseId: 64,
          tagId: 172,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          exerciseId: 65,
          tagId: 172,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    },
    {
      id: 173,
      userId: 27,
      name: "chest",
      createdAt: new Date(),
      updatedAt: new Date(),
      exercises: [
        {
          exerciseId: 63,
          tagId: 173,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    },
    {
      id: 174,
      userId: 27,
      name: "biceps",
      createdAt: new Date(),
      updatedAt: new Date(),
      exercises: [],
    },
    {
      id: 175,
      userId: 27,
      name: "triceps",
      createdAt: new Date(),
      updatedAt: new Date(),
      exercises: [],
    },
    {
      id: 176,
      userId: 27,
      name: "back",
      createdAt: new Date(),
      updatedAt: new Date(),
      exercises: [],
    },
    {
      id: 177,
      userId: 27,
      name: "shoulders",
      createdAt: new Date(),
      updatedAt: new Date(),
      exercises: [],
    },
    {
      id: 178,
      userId: 27,
      name: "calfs",
      createdAt: new Date(),
      updatedAt: new Date(),
      exercises: [
        {
          exerciseId: 65,
          tagId: 178,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    },
    {
      id: 179,
      userId: 27,
      name: "abs",
      createdAt: new Date(),
      updatedAt: new Date(),
      exercises: [],
    },
    {
      id: 180,
      userId: 27,
      name: "traps",
      createdAt: new Date(),
      updatedAt: new Date(),
      exercises: [],
    },
  ],
  oneRepMaxAlgo: "epley",
} as const satisfies Awaited<ReturnType<typeof selectClientUser>>;
