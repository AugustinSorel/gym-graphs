import app/config
import app/ctx
import app/router
import gleam/erlang/process
import gleam/otp/static_supervisor as supervisor
import gleam/result
import gleam/string
import identity/infrastructure/auth_session_repo
import identity/infrastructure/sign_up_session_repo
import identity/infrastructure/user_repo
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

  let auth_session_repo = auth_session_repo.new(db)
  let user_repo = user_repo.new(db)
  let sign_up_session_repo = sign_up_session_repo.new(db)

  let repo = ctx.new_repo(auth_session_repo, sign_up_session_repo, user_repo)
  let ctx = ctx.new(config.get_email(config), repo)

  use pool_child <- result.try(
    pog.url_config(pool_name, config.get_database_url(config))
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
    supervisor.new(supervisor.OneForOne)
    |> supervisor.add(http_child)
    |> supervisor.add(pool_child)
    |> supervisor.start
    |> result.map_error(fn(e) {
      wisp.log_alert("failed to start supervisor " <> string.inspect(e))
      Error(Nil)
    }),
  )

  Ok(process.sleep_forever())
}
//TODO: cache
