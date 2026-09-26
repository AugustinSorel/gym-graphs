import identity/presentation/cookie.{type Cookie}
import wisp.{type Request, type Response}

pub fn get(req: Request, cookie: Cookie) -> Result(String, Nil) {
  wisp.get_cookie(req, name: cookie.name(cookie), security: wisp.Signed)
}

pub fn set(
  res: Response,
  req: Request,
  cookie: Cookie,
  value: String,
) -> Response {
  wisp.set_cookie(
    res,
    req,
    name: cookie.name(cookie),
    value:,
    security: wisp.Signed,
    max_age: cookie.max_age(cookie),
  )
}

pub fn clear(res: Response, req: Request, cookie: Cookie) -> Response {
  wisp.set_cookie(
    res,
    req,
    name: cookie.name(cookie),
    value: "",
    security: wisp.Signed,
    max_age: 0,
  )
}
