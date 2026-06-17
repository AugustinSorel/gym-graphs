{
  description = "A very basic flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in
    {
      devShells = {
        ${system} = {
          default =

            let
              server-watch = pkgs.writeShellScriptBin "server_watch" ''
                watchexec --restart --verbose --wrap-process=session --stop-signal SIGTERM --exts gleam --debounce 500ms --watch src/ -- "gleam run"
              '';

              styles-watch = pkgs.writeShellScriptBin "styles_watch" ''
                tailwindcss -i ./src/styles.css -o ./priv/static/styles.css --watch
              '';
            in

            pkgs.mkShell
              {
                buildInputs = with pkgs;[
                  gleam
                  erlang
                  rebar3
                  watchexec
                  tailwindcss_4
                  goose

                  server-watch
                  styles-watch
                ];

                shellHook = ''
                  if [ -f .env ]; then
                    source .env
                  fi

                  export DATABASE_URL=postgres://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME

                  export GOOSE_DRIVER=postgres
                  export GOOSE_DBSTRING=$DATABASE_URL
                  export GOOSE_MIGRATION_DIR=./migrations
                '';
              };
        };
      };
    };
}
