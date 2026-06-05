import gleam/float
import gleam/time/duration
import wisp.{type Request, type Response}

const name: String = "sign_up_session_token"

pub fn set(res: Response, req: Request, value: String) -> Response {
  wisp.set_cookie(
    res,
    req,
    name:,
    value:,
    security: wisp.Signed,
    max_age: duration.hours(24) |> duration.to_seconds() |> float.round(),
  )
}

pub fn clear(res: Response, req: Request) -> Response {
  wisp.set_cookie(res, req, name:, value: "", security: wisp.Signed, max_age: 0)
}

pub fn parse(req: Request) {
  wisp.get_cookie(req, name, wisp.Signed)
}
