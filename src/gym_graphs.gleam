import app/env
import app/router
import gleam/erlang/process
import gleam/otp/static_supervisor as supervisor
import gleam/result
import mist
import pog
import wisp
import wisp/wisp_mist

pub fn main() {
  wisp.configure_logger()

  let assert Ok(env) = env.load()

  let pool_name = process.new_name("db_pool")
  let db = pog.named_connection(pool_name)

  let assert Ok(pool_child) =
    pog.url_config(pool_name, env.db_url)
    |> result.map(pog.supervised)

  let http_child =
    router.handle_request
    |> wisp_mist.handler(env.secret_key_base)
    |> mist.new
    |> mist.bind("0.0.0.0")
    |> mist.port(8000)
    |> mist.supervised

  let assert Ok(_) =
    supervisor.new(supervisor.OneForOne)
    |> supervisor.add(http_child)
    |> supervisor.add(pool_child)
    |> supervisor.start

  process.sleep_forever()
}
