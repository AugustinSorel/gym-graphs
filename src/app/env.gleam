import envoy
import gleam/int

pub type Env {
  Env(
    db_host: String,
    db_port: Int,
    db_name: String,
    db_user: String,
    db_password: String,
    secret_key_base: String,
  )
}

pub fn load() -> Env {
  Env(
    db_host: require_str("DB_HOST"),
    db_port: require_int("DB_PORT"),
    db_name: require_str("DB_NAME"),
    db_user: require_str("DB_USER"),
    db_password: require_str("DB_PASSWORD"),
    secret_key_base: require_str("SECRET_KEY_BASE"),
  )
}

fn require_str(key: String) -> String {
  let assert Ok(value) = envoy.get(key)
  value
}

fn require_int(key: String) -> Int {
  let assert Ok(value) = envoy.get(key)

  let assert Ok(value) = int.parse(value)

  value
}
