{ pkgs, ... }:

{
  env = {
    PORT = 8000;

    GOOSE_DRIVER = "postgres";
    GOOSE_DBSTRING = "postgres://localhost:5432/gym_graphs";
    GOOSE_MIGRATION_DIR = ./internal/database/migrations;

    SOPS_AGE_KEY_FILE = ./keys.txt;
  };

  packages = with pkgs; [
    goose
    tailwindcss_4
    templ
    sqlc
    age
    sops
  ];

  enterShell = ''
    if [ -f .env ]; then
      echo "🔒 Decrypting secrets directly into memory..."

      # 'set -a' automatically exports any variables that get defined
      set -a

      # Process substitution reads the SOPS output like a file, without writing to disk
      source <(sops -d --output-type dotenv .env)

      # Turn off auto-export
      set +a

      echo "✅ Secrets loaded into environment variables"
    fi
  '';

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
