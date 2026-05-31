import wisp

const name = "auth_session_token"

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
