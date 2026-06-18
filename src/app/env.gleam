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
    ses_from_address: String,
    aws_region: String,
    aws_access_key_id: String,
    aws_secret_access_key: String,
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
    ses_from_address: require_str("SES_FROM_ADDRESS"),
    aws_region: require_str("AWS_REGION"),
    aws_access_key_id: require_str("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key: require_str("AWS_SECRET_ACCESS_KEY"),
  )
}

fn require_str(key: String) -> String {
  case envoy.get(key) {
    Ok(value) -> value
    Error(_) -> panic as { "Missing required environment variable: " <> key }
  }
}

fn require_int(key: String) -> Int {
  let value = require_str(key)

  case int.parse(value) {
    Ok(value) -> value
    Error(_) -> {
      panic as { "Parsing to int failed for environment variable: " <> key }
    }
  }
}
