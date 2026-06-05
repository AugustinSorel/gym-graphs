import wisp.{type Request}

const name = "password_reset_session_token"

pub fn set(res, req, value) {
  wisp.set_cookie(
    res,
    req,
    name:,
    value:,
    security: wisp.Signed,
    max_age: 60 * 60 * 24,
  )
}

pub fn clear(res, req) {
  wisp.set_cookie(res, req, name:, value: "", security: wisp.Signed, max_age: 0)
}

pub fn parse(req: Request) {
  wisp.get_cookie(req, name, wisp.Signed)
}
