export const constant = {
  url: {
    api:
      process.env["NODE_ENV"] === "production" || (import.meta as any).env?.PROD
        ? "https://api.gym-graphs.com"
        : "http://localhost:5000",
    web:
      process.env["NODE_ENV"] === "production" || (import.meta as any).env?.PROD
        ? "https://web.gym-graphs.com"
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
} as const;
