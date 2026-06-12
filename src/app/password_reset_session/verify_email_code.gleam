import app/crypto
import app/ctx.{type Ctx}
import app/password_reset_session/password_reset_session
import app/password_reset_session/sql as password_reset_session_sql
import app/ui
import app/web
import formal/form.{type Form}
import gleam/bool
import gleam/list
import gleam/option
import gleam/result
import gleam/string
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import pog.{type QueryError}
import wisp.{type Request, type Response}

type InternalError {
  DatabaseFailure(QueryError)
}

type SharedError {
  AlreadyVerified
  UserNotFound
}

pub fn view_verify_page(req: Request, ctx: Ctx) -> Response {
  use session <- password_reset_session.require(req, ctx)

  let result = {
    let already_verified = option.is_some(session.user_identity_verified_at)

    use <- bool.guard(when: already_verified, return: Error(AlreadyVerified))

    use user <- result.try(select_user(ctx.db, session.id))

    Ok(user)
  }

  case result {
    Ok(user) ->
      get_verify_form()
      |> verify_form(user.email_address)
      |> verify_page()
      |> web.html(200)

    Error(AlreadyVerified) -> wisp.redirect("/reset-password/set-new-password")

    Error(_) ->
      get_verify_form()
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> verify_form("")
      |> verify_page()
      |> web.html(500)
  }
}

type VerifyError {
  Validation(form: Form(VerifyEmailCodeForm))
  VerifySharedError(SharedError)
  VerifyInternalError(InternalError)
  IncorrectCode
}

pub fn verify(req: Request, ctx: Ctx) -> Response {
  use session <- password_reset_session.require(req, ctx)
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      get_verify_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(Validation),
    )

    let is_verified = option.is_some(session.user_identity_verified_at)

    use <- bool.guard(
      when: is_verified,
      return: Error(VerifySharedError(AlreadyVerified)),
    )

    let email_code_hash =
      crypto.hash_password_reset_email_code(input.code, session.email_code_salt)

    let code_correct =
      crypto.validate_session_secret(
        session.email_code_hash,
        email_code_hash.raw_hash,
      )

    use <- bool.guard(when: !code_correct, return: Error(IncorrectCode))

    mark_verified(ctx.db, session.id)
  }

  case result {
    Ok(_) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/reset-password/set-new-password")

    Error(VerifySharedError(AlreadyVerified)) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/reset-password/set-new-password")

    Error(Validation(form:)) ->
      form
      |> verify_form("")
      |> web.html(422)

    Error(IncorrectCode) ->
      get_verify_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError(
          "The verification code you entered is incorrect. Please try again.",
        ),
      )
      |> verify_form("")
      |> web.html(422)

    Error(VerifySharedError(UserNotFound)) | Error(VerifyInternalError(_)) -> {
      wisp.log_error(
        "password reset: verify error [session_id="
        <> string.inspect(session.id)
        <> "]",
      )
      get_verify_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> verify_form("")
      |> web.html(500)
    }
  }
}

type CancelError {
  CancelInternalError(InternalError)
}

pub fn cancel(req: Request, ctx: Ctx) -> Response {
  use session <- password_reset_session.require(req, ctx)
  use form_data <- wisp.require_form(req)

  let result =
    password_reset_session_sql.delete_password_reset_session_by_id(
      ctx.db,
      session.id,
    )
    |> result.map_error(fn(err) { CancelInternalError(DatabaseFailure(err)) })
    |> result.replace(Nil)

  case result {
    Ok(_) ->
      wisp.ok()
      |> password_reset_session.clear_cookie(req)
      |> wisp.set_header("HX-Redirect", "/reset-password")

    Error(CancelInternalError(_)) -> {
      get_verify_form()
      |> form.add_values(form_data.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> verify_form("")
      |> web.html(500)
    }
  }
}

type VerifyEmailCodeForm {
  VerifyEmailCodeForm(code: String)
}

fn get_verify_form() -> Form(VerifyEmailCodeForm) {
  let schema = {
    use code <- form.field("code", {
      form.parse_string
      |> form.map(string.uppercase)
      |> form.check_not_empty
      |> form.check_string_length_more_than(7)
      |> form.check_string_length_less_than(9)
    })

    form.success(VerifyEmailCodeForm(code:))
  }

  form.new(schema) |> form.language(form.en_gb)
}

fn verify_page(children: Element(a)) -> Element(a) {
  ui.layout(html.main([], [children]))
}

fn verify_form(form: Form(VerifyEmailCodeForm), email: String) -> Element(a) {
  let code_err = list.first(form.field_error_messages(form, "code"))
  let root_err = list.first(form.field_error_messages(form, "root"))

  html.form(
    [
      attribute.attribute("hx-post", "/reset-password/verify-email-code"),
      attribute.attribute("hx-disable", "find button[type='submit']"),
      attribute.attribute("hx-indicator", "find button[type='submit']"),
    ],
    [
      html.fieldset(
        [attribute.class("border-2 border-current flex flex-col p-10 gap-10")],
        [
          html.legend([attribute.class("text-sm border-2 px-4 py-1")], [
            html.text("verify email address"),
          ]),
          html.p([attribute.class("text-sm")], [
            html.text("We sent an 8-digit code to " <> email <> "."),
          ]),
          html.label(
            [
              attribute.class(
                "grid gap-1 has-[>[aria-invalid=true]]:text-error",
              ),
            ],
            [
              html.text("verification code:"),
              html.input([
                attribute.id("code_input"),
                attribute.type_("text"),
                attribute.class("border-b-2 border-current uppercase"),
                attribute.placeholder("A3KX7PQR"),
                attribute.name("code"),
                attribute.value(form.field_value(form, "code")),
                attribute.aria_invalid(
                  string.lowercase(bool.to_string(result.is_ok(code_err))),
                ),
              ]),
              case code_err {
                Ok(msg) ->
                  html.p(
                    [
                      attribute.role("alert"),
                      attribute.class("text-error text-sm"),
                    ],
                    [html.text(msg)],
                  )
                Error(_) -> element.none()
              },
            ],
          ),
          case root_err {
            Ok(msg) ->
              ui.alert([
                ui.alert_title(element.text("something went wrong")),
                ui.alert_description(element.text(msg)),
              ])
            Error(_) -> element.none()
          },
          ui.button([attribute.type_("submit")], [
            html.text("verify"),
            ui.spinner(),
          ]),
          html.div([attribute.class("flex justify-end")], [
            html.button(
              [
                attribute.type_("button"),
                attribute.attribute(
                  "hx-post",
                  "/reset-password/verify-email-code/cancel",
                ),
                attribute.attribute("hx-disable", "this"),
                attribute.attribute("hx-target", "closest form"),
                attribute.attribute("hx-swap", "outerHTML"),
                attribute.class(
                  "underline hover:text-current/80 transition-colors cursor-pointer text-sm inline-flex items-center gap-1 disabled:opacity-50 disabled:pointer-events-none",
                ),
              ],
              [html.text("cancel"), ui.spinner()],
            ),
          ]),
        ],
      ),
    ],
  )
}

fn mark_verified(
  db: pog.Connection,
  session_id: Int,
) -> Result(Nil, VerifyError) {
  password_reset_session_sql.set_password_reset_session_to_verified_by_id(
    db,
    session_id,
  )
  |> result.map_error(fn(err) { VerifyInternalError(DatabaseFailure(err)) })
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [_, ..]) -> Ok(Nil)
      pog.Returned(_, []) ->
        Error(VerifySharedError(AlreadyVerified))
    }
  })
}

fn select_user(
  db: pog.Connection,
  session_id: Int,
) -> Result(password_reset_session_sql.SelectUserByPasswordResetSessionIdRow, SharedError) {
  password_reset_session_sql.select_user_by_password_reset_session_id(
    db,
    session_id,
  )
  |> result.map_error(fn(_) { UserNotFound })
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [user, ..]) -> Ok(user)
      pog.Returned(_, []) -> Error(UserNotFound)
    }
  })
}
