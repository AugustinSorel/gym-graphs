import app/auth_session/auth_session
import app/auth_session/sql as auth_session_sql
import app/crypto
import app/ctx.{type Ctx}
import app/sign_up_session/sign_up_session
import app/sign_up_session/sql as sign_up_session_sql
import app/ui
import app/user/sql as user_sql
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

type Shared {
  EmailNotVerified
}

pub fn view_set_password_page(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

  use session <- sign_up_session.require(req, ctx)

  let result = {
    let not_verified = option.is_none(session.email_address_verified_at)

    use <- bool.guard(when: not_verified, return: Error(EmailNotVerified))

    Ok(session)
  }

  case result {
    Ok(session) ->
      get_set_password_form()
      |> form.add_string("email_address", session.email_address)
      |> set_password_form()
      |> set_password_page()
      |> web.html(200)

    Error(EmailNotVerified) -> wisp.redirect("/sign-up/verify-email-address")
  }
}

type SetPasswordError {
  Validation(form: Form(SetPasswordForm))
  SetPasswordErrorShared(Shared)
  EmailAlreadyTaken
  DatabaseFailure(QueryError)
  UnexpectedDatabaseResult
}

pub fn set_password(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

  use session <- sign_up_session.require(req, ctx)
  use formdata <- wisp.require_form(req)

  let result = {
    use form <- result.try(
      get_set_password_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(Validation),
    )

    let not_verified = option.is_none(session.email_address_verified_at)

    use <- bool.guard(
      when: not_verified,
      return: Error(SetPasswordErrorShared(EmailNotVerified)),
    )

    use _ <- result.try(ensure_email_available(ctx.db, session.email_address))

    let salt = crypto.generate_hashing_salt()
    let password_hash = crypto.hash_user_password(form.password, salt)
    let secret = crypto.generate_session_secret()
    let secret_hash = crypto.hash_session_secret(secret)

    use auth_session <- result.try(
      pog.transaction(ctx.db, fn(tx) {
        use user <- result.try({
          create_user(tx, password_hash, salt, session.id)
        })

        use _ <- result.try(delete_sign_up_session(tx, session.id))

        use auth_session <- result.try({
          create_auth_session(tx, user.id, secret_hash)
        })

        Ok(auth_session)
      })
      |> result.map_error(fn(err) {
        case err {
          pog.TransactionRolledBack(e) -> e
          pog.TransactionQueryError(err) -> DatabaseFailure(err)
        }
      }),
    )

    Ok(#(auth_session, secret))
  }

  case result {
    Ok(#(auth_session, secret)) -> {
      let token = auth_session.encode_token(auth_session.id, secret)

      wisp.created()
      |> wisp.set_header("HX-Redirect", "/")
      |> sign_up_session.clear_cookie(req)
      |> auth_session.set_cookie(req, token)
    }

    Error(Validation(form:)) ->
      form
      |> set_password_form()
      |> web.html(422)

    Error(EmailAlreadyTaken) ->
      get_set_password_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("This email address is already taken."),
      )
      |> set_password_form()
      |> web.html(409)
    Error(SetPasswordErrorShared(EmailNotVerified)) ->
      wisp.redirect("/sign-up/verify-email-address")

    Error(UnexpectedDatabaseResult) | Error(DatabaseFailure(_)) -> {
      get_set_password_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong"))
      |> set_password_form()
      |> web.html(500)
    }
  }
}

fn ensure_email_available(db: pog.Connection, email: String) {
  user_sql.select_user_by_email_address(db, email)
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(user) {
    case user {
      pog.Returned(_, []) -> Ok(Nil)
      pog.Returned(_, [_, ..]) -> Error(EmailAlreadyTaken)
    }
  })
}

fn create_user(
  db: pog.Connection,
  raw_hash: BitArray,
  salt: BitArray,
  session_id: Int,
) {
  user_sql.create_user(db, raw_hash, salt, session_id)
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [user, ..]) -> Ok(user)
      pog.Returned(_, []) -> Error(UnexpectedDatabaseResult)
    }
  })
}

fn delete_sign_up_session(db: pog.Connection, session_id: Int) {
  sign_up_session_sql.delete_sign_up_session_by_id(db, session_id)
  |> result.map_error(DatabaseFailure)
  |> result.replace(Nil)
}

fn create_auth_session(
  db: pog.Connection,
  user_id: Int,
  secret_hash: BitArray,
) {
  auth_session_sql.create_auth_session(db, user_id, secret_hash)
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [session, ..]) -> Ok(session)
      pog.Returned(_, []) -> Error(UnexpectedDatabaseResult)
    }
  })
}

type SetPasswordForm {
  SetPasswordForm(password: String)
}

fn get_set_password_form() -> Form(SetPasswordForm) {
  let schema = {
    use password <- form.field("password", {
      form.parse_string
      |> form.check_not_empty
      |> form.check_string_length_more_than(7)
      |> form.check_string_length_less_than(72)
    })

    form.success(SetPasswordForm(password:))
  }

  form.new(schema) |> form.language(form.en_gb)
}

fn set_password_page(children: Element(a)) -> Element(a) {
  ui.layout(html.main([], [children]))
}

fn set_password_form(form: Form(SetPasswordForm)) -> Element(a) {
  let email_address = form.field_value(form, "email_address")
  let password_err = list.first(form.field_error_messages(form, "password"))
  let root_err = list.first(form.field_error_messages(form, "root"))

  html.form(
    [
      attribute.attribute("hx-post", "/sign-up/set-password"),
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
            html.text("set password"),
          ]),
          html.label(
            [
              attribute.class(
                "grid gap-1 has-[>[aria-invalid=true]]:text-error",
              ),
            ],
            [
              html.text("password:"),
              html.input([
                attribute.id("password_input"),
                attribute.type_("password"),
                attribute.class("border-b-2 border-current"),
                attribute.name("password"),
                attribute.placeholder("********"),
                attribute.value(form.field_value(form, "password")),
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
            html.text("set password"),
            ui.spinner(),
          ]),

          html.button(
            [
              attribute.type_("button"),
              attribute.attribute(
                "hx-post",
                "/sign-up/verify-email-address/cancel",
              ),
              attribute.attribute("hx-disable", "this"),
              attribute.class(
                "ml-auto underline hover:text-current/80 transition-colors cursor-pointer text-sm inline-flex items-center gap-1 disabled:opacity-50 disabled:pointer-events-none",
              ),
            ],
            [html.text("cancel"), ui.spinner()],
          ),
        ],
      ),
    ],
  )
}
