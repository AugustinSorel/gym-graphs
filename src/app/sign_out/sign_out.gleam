import app/auth_session/auth_session
import app/auth_session/auth_session_cookie
import app/auth_session/sql as auth_session_sql
import app/ctx.{type Ctx}
import app/ui
import app/web
import gleam/result
import lustre/element/html
import pog.{type QueryError}
import wisp.{type Request, type Response}

type SignInError {
  DatabaseFailure(QueryError)
}

pub fn sign_out(req: Request, ctx: Ctx) -> Response {
  use session <- auth_session.require(req, ctx)

  let result = {
    use _ <- result.try(
      auth_session_sql.delete_auth_session_by_id(ctx.db, session.id)
      |> result.map_error(DatabaseFailure),
    )

    Ok(Nil)
  }

  case result {
    Ok(_) -> {
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/sign-in")
      |> auth_session_cookie.clear(req)
    }
    Error(DatabaseFailure(query_error)) -> {
      ui.alert([
        ui.alert_title(html.text("Something went wrong")),
        ui.alert_description(html.text("unexpected error")),
      ])
      |> web.html(500)
    }
  }
}
