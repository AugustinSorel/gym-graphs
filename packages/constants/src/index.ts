import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

const env = envSchema.parse(process.env);

export const constant = {
  url: {
    api:
      env.NODE_ENV === "development"
        ? "http://localhost:5000"
        : "https://api.gym-graphs.com",
    web:
      env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "https://gym-graphs.com",
  },
  cookie: {
    session: "session",
  },
  user: {
    oneRepMaxAlgo: [
      "adams",
      "baechle",
      "berger",
      "brown",
      "brzycki",
      "epley",
      "kemmler",
      "landers",
      "lombardi",
      "mayhew",
      "naclerio",
      "oConner",
      "wathen",
    ],
    dashboardView: ["graph", "trending"],
    weightUnit: ["kg", "lbs"],
  },
  dashboard: {
    tile: {
      types: [
        "exercise",
        "tilesToSetsCount",
        "tilesToTagsCount",
        "tilesSetsHeatMap",
        "tilesFunFacts",
      ],
    },
  },
  team: {
    visibilities: ["public", "private"],
    joinRequest: {
      statuses: ["pending", "accepted", "rejected"],
    },
    invitation: {
      statuses: ["pending", "accepted", "rejected"],
    },
    member: {
      roles: ["admin", "member"],
    },
    event: {
      reactions: ["🎯", "😤", "🔥", "🎉", "💪"],
    },
  },
} as const;
