import envoy
import gleam/result

pub type Env {
  Env(db_url: String, secret_key_base: String)
}

pub fn load() {
  use secret_key_base <- result.try(envoy.get("secret_key_base"))
  use db_url <- result.try(envoy.get("db_url"))

  Ok(Env(db_url, secret_key_base))
}
