{ pkgs, ... }:

{
  env = {
    PORT = 8000;

    GOOSE_DRIVER = "postgres";
    GOOSE_DBSTRING = "postgres://localhost:5432/gym_graphs";
    GOOSE_MIGRATION_DIR = ./migrations;
  };

  packages = with pkgs; [ goose tailwindcss_4 ];

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
      paths = [ ./cmd ./internal ];
      extensions = [ "go" ];
    };
  };
}
