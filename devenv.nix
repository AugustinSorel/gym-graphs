{ pkgs, ... }:

{
  env =
    let
      db_url = "postgres://" + builtins.getEnv "USER" + "@localhost:5433/gym_graphs";
    in
    {
      db_url = db_url;
      secret_key_base = "51ab65e573f8a9f5454c31327d917fbb04ea1594507f0b35d32af7f956a7c503";

      GOOSE_DRIVER = "postgres";
      GOOSE_DBSTRING = db_url;
      GOOSE_MIGRATION_DIR = ./migrations;
    };

  packages = with pkgs;[
    goose
    tailwindcss_4
  ];

  languages.gleam.enable = true;


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
    exec = "gleam run ./";
    watch = {
      paths = [ ./src ];
      extensions = [ "gleam" ];
    };
  };
}
