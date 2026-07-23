{ pkgs, ... }:

{
  env = {
    PORT = 8000;

    GOOSE_DRIVER = "postgres";
    GOOSE_DBSTRING = "postgres://localhost:5432/gym_graphs";
    GOOSE_MIGRATION_DIR = ./internal/database/migrations;

    DB_HOST = "localhost";
    DB_PORT = "5432";
    DB_DATABASE = "gym_graphs";
    DB_USERNAME = "";
    DB_PASSWORD = "";
    DB_SCHEMA = "public";
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
    watch = {
      paths = [ ./cmd ./internal ./web ];
      extensions = [ "go" ];
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
