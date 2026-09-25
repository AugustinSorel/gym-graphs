import aws4_request
import envoy
import gleam/int
import gleam/result
import kernel/email.{type Email}

type Env {
  Prod
  Dev
}

pub opaque type Config {
  Config(env: Env, database_url: String, secret_key_base: String, email: Email)
}

pub fn load() -> Result(Config, Nil) {
  use secret_key_base <- result.try(envoy.get("SECRET_KEY_BASE"))
  use database_url <- result.try(envoy.get("DATABASE_URL"))

  use env <- result.try(load_env())
  use email <- result.try(load_email(env))

  Ok(Config(env:, database_url:, secret_key_base:, email:))
}

pub fn get_database_url(config: Config) {
  config.database_url
}

pub fn get_email(config: Config) {
  config.email
}

pub fn get_secret_key_base(config: Config) {
  config.secret_key_base
}

fn load_env() {
  use env <- result.try(envoy.get("ENV"))

  case env {
    "prod" -> Ok(Prod)
    "dev" -> Ok(Dev)
    _ -> Error(Nil)
  }
}

fn load_email(env: Env) {
  case env {
    Prod -> load_ses_config()
    Dev -> load_smtp_config()
  }
}

fn load_smtp_config() {
  use host <- result.try(envoy.get("SMTP_HOST"))
  use port <- result.try(envoy.get("SMTP_PORT") |> result.try(int.parse))
  use from <- result.try(envoy.get("SMTP_FROM"))

  Ok(email.new_smpt(host, port, from))
}

fn load_ses_config() {
  use access_key_id <- result.try(envoy.get("AWS_ACCESS_KEY_ID"))
  use secret_access_key <- result.try(envoy.get("AWS_SECRET_ACCESS_KEY"))
  use region <- result.try(envoy.get("AWS_REGION"))
  use from <- result.try(envoy.get("SES_FROM_ADDRESS"))
  let service = "ses"

  let signer = {
    aws4_request.signer(access_key_id:, secret_access_key:, region:, service:)
  }

  Ok(email.new_ses(signer, from))
}
