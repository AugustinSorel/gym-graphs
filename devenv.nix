{ pkgs, ... }:

{
  env = {
    PORT = 8000;

    GOOSE_DRIVER = "postgres";
    GOOSE_DBSTRING = "postgres://localhost:5432/gym_graphs";
    GOOSE_MIGRATION_DIR = ./internal/database/migrations;

    DATABASE_URL = "postgres://@localhost:5432/gym_graphs";

    SMTP_HOST = "127.0.0.1";
    SMTP_PORT = "1025";
    SMTP_FROM = "no-reply@gym-graphs.com";
  };

  packages = with pkgs; [
    goose
    tailwindcss_4
    templ
    sqlc
  ];

  languages.go = {
    enable = true;
  };

  services.mailpit = {
    enable = true;
  };

  services.postgres = {
    enable = true;
    listen_addresses = "127.0.0.1";
    initialDatabases = [
      {
        name = "gym_graphs";
      }
    ];
  };

  processes.api = {
    exec = "go run ./cmd/api/main.go";
    restart = {
      on = "always";
    };
    watch = {
      paths = [ ./cmd ./internal ./web ];
      extensions = [ "go" "templ" ];
    };
  };

  processes.html = {
    exec = "templ generate";
    watch = {
      paths = [ ./web ];
      extensions = [ "templ" ];
    };
  };

  processes.sql = {
    exec = "sqlc generate";
    watch = {
      paths = [ ./internal/db/queries ];
      extensions = [ "sql" ];
    };
  };

  processes.styles = {
    exec = "tailwindcss -i web/styles/styles.css -o web/assets/css/styles.css";
    watch = {
      paths = [ ./web ];
      extensions = [ "templ" ];
    };
  };
}
