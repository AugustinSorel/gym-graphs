import app/auth_session/auth_session
import app/auth_session/sql as auth_session_sql
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

type SharedError {
  NotVerified
  UserNotFound
}

pub fn view_set_new_password_page(req: Request, ctx: Ctx) -> Response {
  use session <- password_reset_session.require(req, ctx)

  let result = {
    let not_verified = option.is_none(session.user_identity_verified_at)

    use <- bool.guard(when: not_verified, return: Error(NotVerified))

    use user <- result.try(select_user(ctx.db, session.id))

    Ok(user)
  }

  case result {
    Ok(user) ->
      get_set_new_password_form()
      |> form.add_string("email_address", user.email_address)
      |> set_new_password_form()
      |> set_new_password_page()
      |> web.html(200)

    Error(NotVerified) -> wisp.redirect("/reset-password/verify-email-code")

    Error(_) ->
      get_set_new_password_form()
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> set_new_password_form()
      |> set_new_password_page()
      |> web.html(500)
  }
}

type SetNewPasswordError {
  Validation(form: Form(SetNewPasswordForm))
  SetNewPasswordSharedError(SharedError)
  DatabaseFailure(QueryError)
  UnexpectedDatabaseResult
}

pub fn set_new_password(req: Request, ctx: Ctx) -> Response {
  use session <- password_reset_session.require(req, ctx)
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      get_set_new_password_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(Validation),
    )

    let not_verified = option.is_none(session.user_identity_verified_at)

    use <- bool.guard(
      when: not_verified,
      return: Error(SetNewPasswordSharedError(NotVerified)),
    )

    let salt = crypto.generate_hashing_salt()
    let password_hash = crypto.hash_user_password(input.password, salt)
    let secret = crypto.generate_session_secret()
    let secret_hash = crypto.hash_session_secret(secret)

    use new_auth_session <- result.try(
      pog.transaction(ctx.db, fn(tx) {
        use _ <- result.try(update_password(tx, password_hash, salt, session.id))

        use _ <- result.try(delete_reset_session(tx, session.id))

        use new_auth_session <- result.try(
          create_auth_session(tx, session.user_id, secret_hash),
        )

        Ok(new_auth_session)
      })
      |> result.map_error(fn(err) {
        case err {
          pog.TransactionRolledBack(e) -> e
          pog.TransactionQueryError(err) -> DatabaseFailure(err)
        }
      }),
    )

    Ok(#(new_auth_session, secret))
  }

  case result {
    Ok(#(new_auth_session, secret)) -> {
      let token = password_reset_session.encode_token(new_auth_session.id, secret)

      wisp.created()
      |> wisp.set_header("HX-Redirect", "/")
      |> password_reset_session.clear_cookie(req)
      |> auth_session.set_cookie(req, token)
    }

    Error(Validation(form:)) ->
      form
      |> set_new_password_form()
      |> web.html(422)

    Error(SetNewPasswordSharedError(NotVerified)) ->
      wisp.redirect("/reset-password/verify-email-code")

    Error(error) -> {
      wisp.log_error(
        "password reset: set new password error [session_id="
        <> string.inspect(session.id)
        <> "]: "
        <> string.inspect(error),
      )
      get_set_new_password_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> set_new_password_form()
      |> web.html(500)
    }
  }
}

fn update_password(
  db: pog.Connection,
  password_hash: BitArray,
  salt: BitArray,
  session_id: Int,
) -> Result(Nil, SetNewPasswordError) {
  password_reset_session_sql.update_user_password_by_id(
    db,
    password_hash,
    salt,
    session_id,
  )
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [_, ..]) -> Ok(Nil)
      pog.Returned(_, []) -> Error(UnexpectedDatabaseResult)
    }
  })
}

fn delete_reset_session(
  db: pog.Connection,
  session_id: Int,
) -> Result(Nil, SetNewPasswordError) {
  password_reset_session_sql.delete_password_reset_session_by_id(db, session_id)
  |> result.map_error(DatabaseFailure)
  |> result.map(fn(_) { Nil })
}

fn create_auth_session(
  db: pog.Connection,
  user_id: Int,
  secret_hash: BitArray,
) -> Result(auth_session_sql.CreateAuthSessionRow, SetNewPasswordError) {
  auth_session_sql.create_auth_session(db, user_id, secret_hash)
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [session, ..]) -> Ok(session)
      pog.Returned(_, []) -> Error(UnexpectedDatabaseResult)
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

type SetNewPasswordForm {
  SetNewPasswordForm(password: String)
}

fn get_set_new_password_form() -> Form(SetNewPasswordForm) {
  let schema = {
    use password <- form.field("password", {
      form.parse_string
      |> form.check_not_empty
      |> form.check_string_length_more_than(7)
      |> form.check_string_length_less_than(72)
    })

    form.success(SetNewPasswordForm(password:))
  }

  form.new(schema) |> form.language(form.en_gb)
}

fn set_new_password_page(children: Element(a)) -> Element(a) {
  ui.layout(html.main([], [children]))
}

fn set_new_password_form(form: Form(SetNewPasswordForm)) -> Element(a) {
  let email_address = form.field_value(form, "email_address")
  let password_err = list.first(form.field_error_messages(form, "password"))
  let root_err = list.first(form.field_error_messages(form, "root"))

  html.form(
    [
      attribute.attribute("hx-post", "/reset-password/set-new-password"),
      attribute.attribute("hx-disable", "find button[type='submit']"),
      attribute.attribute("hx-indicator", "find button[type='submit']"),
    ],
    [
      html.input([
        attribute.type_("hidden"),
        attribute.name("username"),
        attribute.attribute("autocomplete", "username"),
        attribute.value(email_address),
      ]),
      html.fieldset(
        [attribute.class("border-2 border-current flex flex-col p-10 gap-10")],
        [
          html.legend([attribute.class("text-sm border-2 px-4 py-1")], [
            html.text("set new password"),
          ]),
          html.label(
            [
              attribute.class(
                "grid gap-1 has-[>[aria-invalid=true]]:text-error",
              ),
            ],
            [
              html.text("new password:"),
              html.input([
                attribute.id("password_input"),
                attribute.type_("password"),
                attribute.class("border-b-2 border-current"),
                attribute.name("password"),
                attribute.placeholder("********"),
                attribute.value(form.field_value(form, "password")),
                attribute.attribute("autocomplete", "new-password"),
                attribute.aria_invalid(
                  string.lowercase(bool.to_string(result.is_ok(password_err))),
                ),
              ]),
              case password_err {
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
            html.text("set new password"),
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
