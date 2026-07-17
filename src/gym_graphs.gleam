import app/ctx.{Ctx}
import app/email
import app/env
import app/router
import gleam/erlang/process
import gleam/option
import gleam/otp/static_supervisor as supervisor
import mist
import pog
import wisp
import wisp/wisp_mist

pub fn main() -> Nil {
  wisp.configure_logger()

  let env = env.load()
  let email = email.client(env)

  let pool_name = process.new_name("db_pool")
  let db = pog.named_connection(pool_name)

  let ctx = Ctx(db:, email:)

  let pool_child =
    pog.default_config(pool_name)
    |> pog.host(env.db_host)
    |> pog.port(env.db_port)
    |> pog.database(env.db_name)
    |> pog.user(env.db_user)
    |> pog.password(option.Some(env.db_password))
    |> pog.pool_size(5)
    |> pog.supervised

  let http_child =
    router.handle_request(_, ctx)
    |> wisp_mist.handler(env.secret_key_base)
    |> mist.new
    |> mist.bind("0.0.0.0")
    |> mist.port(8000)
    |> mist.supervised

  let assert Ok(_) =
    supervisor.new(supervisor.OneForOne)
    |> supervisor.add(pool_child)
    |> supervisor.add(http_child)
    |> supervisor.start

  process.sleep_forever()
}
//TODO: home page
//TODO: search
//TODO: filter by tags

