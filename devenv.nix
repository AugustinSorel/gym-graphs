{ pkgs, ... }:

{
  env = {
    db_url = "postgres://" + builtins.getEnv "USER" + "@localhost:5433/gym_graphs";
    secret_key_base = "uNWfVw+UGU5BOS35wvyp3X9y1muaI3pu2wWoSS74i94=";
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
