{ pkgs, ... }:

{
  env =
    let
      DATABASE_URL = "postgres://" + builtins.getEnv "USER" + "@localhost:5432/gym_graphs";
    in
    {
      DATABASE_URL = DATABASE_URL;
      SECRET_KEY_BASE = "51ab65e573f8a9f5454c31327d917fbb04ea1594507f0b35d32af7f956a7c503";

      ENV = "dev";

      SMTP_HOST = "localhost";
      SMTP_PORT = "1025";
      SMTP_FROM = "noreply@localhost";

      GOOSE_DRIVER = "postgres";
      GOOSE_DBSTRING = DATABASE_URL;
      GOOSE_MIGRATION_DIR = ./migrations;
    };

  packages = with pkgs;[
    goose
    tailwindcss_4
  ];

  languages.gleam.enable = true;

  services.mailpit = {
    enable = true;
  };

  services.postgres = {
    enable = true;
    port = 5432;
    listen_addresses = "127.0.0.1";
    initialDatabases = [
      {
        name = "gym_graphs";
      }
    ];
  };

  processes.api = {
    exec = "gleam run ./";
    watch = {
      paths = [ ./src ];
      extensions = [ "gleam" ];
    };
  };

  processes.sql = {
    exec = "gleam run -m squirrel";
    watch = {
      paths = [ ./src ];
      extensions = [ "sql" ];
    };
  };

  processes.styles = {
    exec = "tailwindcss -i ./src/styles.css  -o ./priv/static/styles.css";
    watch = {
      paths = [ ./src ];
      extensions = [ "gleam" ];
    };
  };
}
