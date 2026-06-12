import app/auth_session/auth_session
import app/crypto
import app/ctx.{type Ctx}
import app/sign_up_session/sign_up_session
import app/sign_up_session/sql as sign_up_session_sql
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

type SharedEmailError {
  EmailAlreadyVerified
}

pub fn view_verify_email_page(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

  use session <- sign_up_session.require(req, ctx)

  let result = {
    let already_verified = option.is_some(session.email_address_verified_at)

    use <- bool.guard(
      when: already_verified,
      return: Error(EmailAlreadyVerified),
    )

    Ok(session)
  }

  case result {
    Ok(_) ->
      get_verify_email_form()
      |> verify_email_form()
      |> verify_email_page()
      |> web.html(200)

    Error(EmailAlreadyVerified) -> wisp.redirect("/sign-up/set-password")
  }
}

type VerifyEmailError {
  Validation(form: Form(VerifyEmailAddressForm))
  InvalidVerificationCode
  VerifySharedError(SharedEmailError)
  VerifyInternalError(InternalError)
}

pub fn verify_email(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

  use session <- sign_up_session.require(req, ctx)
  use formdata <- wisp.require_form(req)

  let result = {
    use form <- result.try(
      get_verify_email_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(Validation),
    )

    let already_verified = option.is_some(session.email_address_verified_at)

    use <- bool.guard(
      when: already_verified,
      return: Error(VerifySharedError(EmailAlreadyVerified)),
    )

    verify_email_address(
      ctx.db,
      session.id,
      session.email_address_verification_code,
      form.code,
    )
  }

  case result {
    Ok(_) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/sign-up/set-password")

    Error(VerifySharedError(EmailAlreadyVerified)) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/sign-up/set-password")

    Error(Validation(form:)) ->
      form
      |> verify_email_form()
      |> web.html(422)

    Error(InvalidVerificationCode) ->
      get_verify_email_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError(
          "The verification code you entered is incorrect. Please try again.",
        ),
      )
      |> verify_email_form()
      |> web.html(422)

    Error(VerifyInternalError(DatabaseFailure(err))) -> {
      wisp.log_error("sign up: verify email error" <> string.inspect(err))
      get_verify_email_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> verify_email_form()
      |> web.html(500)
    }
  }
}

pub fn resend_verify_email_code(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

  use session <- sign_up_session.require(req, ctx)
  use form_data <- wisp.require_form(req)

  let result = {
    let already_verified = option.is_some(session.email_address_verified_at)

    use <- bool.guard(
      when: already_verified,
      return: Error(EmailAlreadyVerified),
    )

    Ok(session)
  }

  case result {
    Ok(session) -> {
      // TODO: send verification email with session.email_address_verification_code
      echo session.email_address_verification_code
      get_verify_email_form()
      |> form.add_values(form_data.values)
      |> form.add_string(
        "success_msg",
        "A new verification code has been sent to your email address.",
      )
      |> verify_email_form()
      |> web.html(200)
    }

    Error(EmailAlreadyVerified) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/sign-up/set-password")
  }
}

type CancelError {
  CancelSharedError(SharedEmailError)
  CancelInternal(InternalError)
}

pub fn cancel_verify_email(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

  use session <- sign_up_session.require(req, ctx)
  use form_data <- wisp.require_form(req)

  let result = {
    let already_verified = option.is_some(session.email_address_verified_at)

    use <- bool.guard(
      when: already_verified,
      return: Error(CancelSharedError(EmailAlreadyVerified)),
    )

    cancel_email(ctx.db, session.id)
  }

  case result {
    Ok(_) ->
      wisp.ok()
      |> sign_up_session.clear_cookie(req)
      |> wisp.set_header("HX-Redirect", "/sign-up")

    Error(CancelSharedError(EmailAlreadyVerified)) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/sign-up/set-password")
    Error(CancelInternal(DatabaseFailure(err))) -> {
      wisp.log_error("cancel verify email failed" <> string.inspect(err))
      get_verify_email_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> verify_email_form()
      |> web.html(500)
    }
  }
}

type VerifyEmailAddressForm {
  VerifyEmailAddressForm(code: String)
}

fn get_verify_email_form() -> Form(VerifyEmailAddressForm) {
  let schema = {
    use code <- form.field("code", {
      form.parse_string
      |> form.check_not_empty
      |> form.check_string_length_more_than(7)
      |> form.check_string_length_less_than(9)
    })

    form.success(VerifyEmailAddressForm(code:))
  }

  form.new(schema) |> form.language(form.en_gb)
}

fn verify_email_page(children: Element(a)) -> Element(a) {
  ui.layout(html.main([], [children]))
}

fn verify_email_form(form: Form(VerifyEmailAddressForm)) -> Element(a) {
  let code_err = list.first(form.field_error_messages(form, "code"))
  let root_err = list.first(form.field_error_messages(form, "root"))
  let success_msg = form.field_value(form, "success_msg")

  html.form(
    [
      attribute.attribute("hx-post", "/sign-up/verify-email-address"),
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
                attribute.attribute("inputmode", "numeric"),
                attribute.class("border-b-2 border-current"),
                attribute.placeholder("12345678"),
                attribute.name("code"),
                attribute.value(form.field_value(form, "code")),
                attribute.aria_invalid(
                  string.lowercase(bool.to_string(result.is_ok(code_err))),
                ),
              ]),
              case code_err {
                Ok(msg) -> {
                  html.p(
                    [
                      attribute.role("alert"),
                      attribute.class("text-error text-sm"),
                    ],
                    [html.text(msg)],
                  )
                }
                Error(_) -> element.none()
              },
            ],
          ),

          case root_err {
            Ok(msg) -> {
              ui.alert([
                ui.alert_title(element.text("something went wrong")),
                ui.alert_description(element.text(msg)),
              ])
            }
            Error(_) -> element.none()
          },

          case string.is_empty(success_msg) {
            False -> {
              ui.alert_variant(ui.AlertSuccess, [
                ui.alert_title(element.text("verification code sent")),
                ui.alert_description(element.text(success_msg)),
              ])
            }
            True -> element.none()
          },

          ui.button([attribute.type_("submit")], [
            html.text("verify"),
            ui.spinner(),
          ]),
          html.div([attribute.class("flex justify-between")], [
            html.button(
              [
                attribute.type_("button"),
                attribute.attribute(
                  "hx-post",
                  "/sign-up/verify-email-address/resend",
                ),
                attribute.attribute("hx-disable", "this"),
                attribute.attribute("hx-target", "closest form"),
                attribute.attribute("hx-swap", "outerHTML"),
                attribute.class(
                  "underline hover:text-current/80 transition-colors cursor-pointer text-sm inline-flex items-center gap-1 disabled:opacity-50 disabled:pointer-events-none",
                ),
              ],
              [html.text("resend verification code"), ui.spinner()],
            ),
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
          ]),
        ],
      ),
    ],
  )
}

fn verify_email_address(
  db: pog.Connection,
  session_id: Int,
  stored_code: String,
  submitted_code: String,
) {
  let is_valid = crypto.validate_verification_code(stored_code, submitted_code)

  use <- bool.guard(when: !is_valid, return: Error(InvalidVerificationCode))

  mark_email_verified(db, session_id)
}

fn mark_email_verified(db: pog.Connection, session_id: Int) {
  sign_up_session_sql.set_email_address_verified_at_to_now(db, session_id)
  |> result.map_error(fn(err) { VerifyInternalError(DatabaseFailure(err)) })
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [_, ..]) -> Ok(Nil)
      pog.Returned(_, []) -> Error(VerifySharedError(EmailAlreadyVerified))
    }
  })
}

fn cancel_email(db: pog.Connection, session_id: Int) {
  sign_up_session_sql.delete_sign_up_session_by_id(db, session_id)
  |> result.map_error(fn(err) { CancelInternal(DatabaseFailure(err)) })
  |> result.replace(Nil)
}
