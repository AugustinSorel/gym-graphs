import envoy
import gleam/int
import gleam/result

pub type Env {
  Prod
  Dev
}

pub type Config {
  Config(
    env: Env,
    database_url: String,
    secret_key_base: String,
    mailer: MailerConfig,
  )
}

pub type MailerConfig {
  SmtpMailer(host: String, port: Int, from_address: String)
  SesMailer(
    access_key_id: String,
    secret_access_key: String,
    region: String,
    from_address: String,
  )
}

pub fn load() -> Result(Config, Nil) {
  use secret_key_base <- result.try(envoy.get("SECRET_KEY_BASE"))
  use database_url <- result.try(envoy.get("DATABASE_URL"))

  use env <- result.try(load_env())
  use mailer <- result.try(load_mailer(env))

  Ok(Config(env:, database_url:, secret_key_base:, mailer:))
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

fn load_mailer(env: Env) {
  case env {
    Dev -> load_smtp_mailer()
    Prod -> load_ses_mailer()
  }
}

fn load_smtp_mailer() {
  use host <- result.try(envoy.get("SMTP_HOST"))
  use port <- result.try(envoy.get("SMTP_PORT") |> result.try(int.parse))
  use from_address <- result.try(envoy.get("SMTP_FROM"))

  Ok(SmtpMailer(host:, port:, from_address:))
}

fn load_ses_mailer() {
  use access_key_id <- result.try(envoy.get("AWS_ACCESS_KEY_ID"))
  use secret_access_key <- result.try(envoy.get("AWS_SECRET_ACCESS_KEY"))
  use region <- result.try(envoy.get("AWS_REGION"))
  use from_address <- result.try(envoy.get("SES_FROM_ADDRESS"))

  Ok(SesMailer(access_key_id:, secret_access_key:, region:, from_address:))
}
