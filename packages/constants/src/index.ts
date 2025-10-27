export const constant = {
  url: {
    api:
      process.env["NODE_ENV"] === "production" ||
      (import.meta as any)?.env?.PROD
        ? "https://api.gym-graphs.com"
        : "http://localhost:5000",
    web:
      process.env["NODE_ENV"] === "production" ||
      (import.meta as any)?.env?.PROD
        ? "https://h4co0c84sos8owgssc4g8k40.augustin-sorel.com"
        : // ? "https://gym-graphs.com"
          "http://localhost:3000",
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
