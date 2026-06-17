import app/ctx.{Ctx}
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

  let e = env.load()

  let pool_name = process.new_name("db_pool")
  let db = pog.named_connection(pool_name)

  let ctx = Ctx(db: db)

  let pool_child =
    pog.default_config(pool_name)
    |> pog.host(e.db_host)
    |> pog.port(e.db_port)
    |> pog.database(e.db_name)
    |> pog.user(e.db_user)
    |> pog.password(option.Some(e.db_password))
    |> pog.pool_size(5)
    |> pog.supervised

  let http_child =
    router.handle_request(_, ctx)
    |> wisp_mist.handler(e.secret_key_base)
    |> mist.new
    |> mist.port(8000)
    |> mist.supervised

  let assert Ok(_) =
    supervisor.new(supervisor.OneForOne)
    |> supervisor.add(pool_child)
    |> supervisor.add(http_child)
    |> supervisor.start

  process.sleep_forever()
}
