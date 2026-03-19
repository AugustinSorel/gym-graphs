import { Config, Effect, pipe, Redacted } from "effect";

const smtpConfig = Config.all({
  host: Config.string("HOST"),
  user: Config.string("USER"),
  password: Config.redacted("PASSWORD"),
  from: Config.string("FROM"),
});

const githubClientConfig = Config.all({
  id: Config.string("ID"),
  secret: Config.redacted("SECRET"),
});

const dbConfig = pipe(
  Config.all({
    user: Config.string("USER").pipe(Config.withDefault("postgres")),
    password: Config.redacted("PASSWORD").pipe(
      Config.withDefault(Redacted.make("postgres")),
    ),
    host: Config.string("HOST").pipe(Config.withDefault("localhost")),
    name: Config.string("NAME").pipe(Config.withDefault("gym_graphs")),
    port: Config.number("PORT").pipe(Config.withDefault(5432)),
  }),
  Config.map((db) => {
    const url = `postgresql://${db.user}:${Redacted.value(db.password)}@${db.host}:${db.port}/${db.name}`;

    return {
      ...db,
      url: Redacted.make(url),
    };
  }),
);

const config = Config.all({
  nodeEnv: Config.literal(
    "development",
    "production",
    "test",
  )("NODE_ENV").pipe(Config.withDefault("development")),
  port: Config.number("PORT").pipe(Config.withDefault(5000)),
  db: Config.nested(dbConfig, "DB"),
  smtp: Config.nested(smtpConfig, "SMTP"),
  githubClient: Config.nested(githubClientConfig, "GITHUB_CLIENT"),
}).pipe(
  Config.map((config) => ({
    ...config,
    url: {
      web:
        config.nodeEnv === "production"
          ? "https://gym-graphs.com"
          : `http://localhost:3000`,
    },
  })),
);

export class ServerConfig extends Effect.Service<ServerConfig>()(
  "ServerConfig",
  {
    effect: Effect.gen(function* () {
      return yield* config;
    }),
    accessors: true,
  },
) {}
