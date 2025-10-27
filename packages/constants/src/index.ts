const getWebUrl = () => {
  const prod = "https://gym-graphs.com";
  const dev = "http://localhost:3000";

  if (typeof process !== "undefined" && process.env.NODE_ENV) {
    return process.env.NODE_ENV === "development" ? dev : prod;
  }

  if (import.meta.env && import.meta.env["PROD"]) {
    return prod;
  }

  return dev;
};

const getApiUrl = () => {
  const prod = "https://api.gym-graphs.com";
  const dev = "http://localhost:5000";

  if (typeof process !== "undefined" && process.env.NODE_ENV) {
    return process.env.NODE_ENV === "development" ? dev : prod;
  }

  if (import.meta.env && import.meta.env["PROD"]) {
    return prod;
  }

  return dev;
};

export const constant = {
  url: {
    api: getApiUrl(),
    web: getWebUrl(),
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
