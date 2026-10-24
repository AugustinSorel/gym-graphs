import gleam/erlang/process
import gleam/otp/static_supervisor
import gleam/result
import gleam/string
import gym_graphs/config
import gym_graphs/ctx
import gym_graphs/mailers/ses
import gym_graphs/mailers/smtp
import gym_graphs/router
import mist
import pog
import wisp
import wisp/wisp_mist

pub fn main() {
  wisp.configure_logger()

  use config <- result.try(
    config.load()
    |> result.map_error(fn(err) {
      wisp.log_alert("failed to load config")
      Error(err)
    }),
  )

  let pool_name = process.new_name("db_pool")
  let db = pog.named_connection(pool_name)

  let mailer = case config.mailer {
    config.SmtpMailer(host:, port:, from_address:) -> {
      smtp.new(host, port, from_address)
    }
    config.SesMailer(access_key_id:, secret_access_key:, region:, from_address:) -> {
      ses.new(access_key_id, secret_access_key, region, from_address)
    }
  }
  let ctx = ctx.new(db, mailer)

  use pool_child <- result.try(
    pog.url_config(pool_name, config.database_url)
    |> result.map(pog.supervised)
    |> result.map_error(fn(e) {
      wisp.log_alert("failed to connect to db")
      Error(e)
    }),
  )

  let http_child =
    router.handle_request(_, ctx)
    |> wisp_mist.handler(config.get_secret_key_base(config))
    |> mist.new
    |> mist.bind("0.0.0.0")
    |> mist.port(8000)
    |> mist.supervised

  use _ <- result.try(
    static_supervisor.new(static_supervisor.OneForOne)
    |> static_supervisor.add(http_child)
    |> static_supervisor.add(pool_child)
    |> static_supervisor.start
    |> result.map_error(fn(e) {
      wisp.log_alert("failed to start static_supervisor " <> string.inspect(e))
      Error(Nil)
    }),
  )

  Ok(process.sleep_forever())
}
//TODO: cache
