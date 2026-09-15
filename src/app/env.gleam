import envoy
import gleam/result

pub type Env {
  Env(database_url: String, secret_key_base: String)
}

pub fn load() {
  use secret_key_base <- result.try(envoy.get("SECRET_KEY_BASE"))
  use database_url <- result.try(envoy.get("DATABASE_URL"))

  Ok(Env(database_url:, secret_key_base:))
}
