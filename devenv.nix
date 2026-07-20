{}:

{
  env = {
    PORT = 9000;
  };


  languages.go.enable = true;

  processes.api = {
    exec = "go run ./cmd/api/main.go";
    watch = {
      paths = [ ./cmd ./internal ];
      extensions = [ "go" ];
    };
  };
}
