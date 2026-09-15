{ pkgs, ... }:

{
  env.GREET = "devenv";

  packages = with pkgs;[
    goose
    tailwindcss_4
  ];

  languages.gleam.enable = true;

  processes.api = {
    exec = "gleam run ./";
    watch = {
      paths = [ ./src ];
      extensions = [ "gleam" ];
    };
  };
}
