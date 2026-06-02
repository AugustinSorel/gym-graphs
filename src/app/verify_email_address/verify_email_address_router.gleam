import app/ctx.{type Ctx}
import app/sign_up_session/sign_up_session_cookie
import app/sign_up_session/sign_up_session_token
import app/verify_email_address/ui
import app/verify_email_address/verify_email_address
import app/verify_email_address/verify_email_address_error
import app/web
import formal/form
import gleam/list
import gleam/option
import gleam/result
import wisp.{type Request}

//TODO: protect routes

pub fn view_page(req: Request, ctx: Ctx) {
  let result = {
    let session =
      sign_up_session_cookie.parse(req)
      |> result.try(sign_up_session_token.decode)
      |> result.replace_error(verify_email_address_error.InvalidCookie)
      |> result.try(fn(token) {
        sign_up_session_token.verify(token, ctx)
        |> result.replace_error(verify_email_address_error.InvalidSignUpSeesion)
      })

    use session <- result.try(session)

    Ok(session)
  }

  case result {
    Ok(_) -> {
      ui.get_verify_email_address_form()
      |> ui.verify_email_address_form()
      |> ui.verify_email_address_page()
      |> web.html(200)
    }
    Error(verify_email_address_error.InvalidCookie) -> {
      wisp.redirect("/sign-up") |> sign_up_session_cookie.clear(req)
    }
    Error(verify_email_address_error.InvalidSignUpSeesion) -> {
      ui.get_verify_email_address_form()
      |> ui.verify_email_address_form()
      |> ui.verify_email_address_page()
      |> web.html(401)
      |> sign_up_session_cookie.clear(req)
    }
    Error(verify_email_address_error.DatabaseFailure(error:)) -> {
      ui.get_verify_email_address_form()
      |> ui.verify_email_address_form()
      |> ui.verify_email_address_page()
      |> web.html(500)
    }
  }
}

pub fn verify(req: Request, ctx: Ctx) {
  use formdata <- wisp.require_form(req)

  let raw_form =
    ui.get_verify_email_address_form()
    |> form.add_values(formdata.values)

  let result = {
    let form =
      raw_form
      |> form.run()
      |> result.map_error(
        verify_email_address_error.VerifyEmailAddressValidation,
      )

    use form <- result.try(form)

    let session =
      sign_up_session_cookie.parse(req)
      |> result.try(sign_up_session_token.decode)
      |> result.replace_error(
        verify_email_address_error.VerifyEmailAddressInvalidCookie,
      )
      |> result.try(fn(token) {
        sign_up_session_token.verify(token, ctx)
        |> result.replace_error(
          verify_email_address_error.VerifyEmailAddressInvalidSignUpSeesion,
        )
      })

    use session <- result.try(session)

    let verify =
      verify_email_address.verify(
        ctx.db,
        session.id,
        session.email_address_verification_code,
        form.code,
      )
      |> result.map_error(fn(e) {
        case e {
          verify_email_address.InvalidCode ->
            verify_email_address_error.VerifyEmailAddressInvalidCode
          verify_email_address.AlreadyVerified ->
            verify_email_address_error.VerifyEmailAddressAlreadyVerified
          verify_email_address.DatabaseError(e) ->
            verify_email_address_error.VerifyEmailAddressDatabaseFailure(e)
          verify_email_address.UnexpectedDatabaseResult ->
            verify_email_address_error.VerifyEmailAddressUnexpectedDatabaseResult
        }
      })

    use _ <- result.try(verify)

    Ok(Nil)
  }

  case result {
    Ok(_) -> {
      wisp.ok() |> wisp.set_header("HX_Redirect", "/set-password")
    }
    Error(verify_email_address_error.VerifyEmailAddressAlreadyVerified) -> {
      wisp.redirect("/set-password")
    }
    Error(verify_email_address_error.VerifyEmailAddressValidation(form:)) -> {
      form
      |> form.add_string("root_err", "something went wrong")
      |> ui.verify_email_address_form()
      |> ui.verify_email_address_page()
      |> web.html(422)
    }
    Error(verify_email_address_error.VerifyEmailAddressInvalidCookie) -> {
      wisp.redirect("/sign-up") |> sign_up_session_cookie.clear(req)
    }
    Error(verify_email_address_error.VerifyEmailAddressInvalidSignUpSeesion) -> {
      raw_form
      |> form.add_string("root_err", "invalid session")
      |> ui.verify_email_address_form()
      |> ui.verify_email_address_page()
      |> web.html(401)
    }
    Error(verify_email_address_error.VerifyEmailAddressDatabaseFailure(error:)) -> {
      raw_form
      |> form.add_string("root_err", "something went wrong")
      |> ui.verify_email_address_form()
      |> ui.verify_email_address_page()
      |> web.html(500)
    }
    Error(verify_email_address_error.VerifyEmailAddressInvalidCode) ->
      raw_form
      |> form.add_string("root_err", "Invalide code")
      |> ui.verify_email_address_form()
      |> ui.verify_email_address_page()
      |> web.html(401)

    Error(verify_email_address_error.VerifyEmailAddressUnexpectedDatabaseResult) -> {
      raw_form
      |> form.add_string("root_err", "something went wrong")
      |> ui.verify_email_address_form()
      |> ui.verify_email_address_page()
      |> web.html(500)
    }
  }
}
// pub fn resend_verification_code(req: Request, ctx: Ctx) {
//   use formdata <- wisp.require_form(req)

//   let candidate_form =
//     ui.get_verify_email_address_form()
//     |> form.add_values(formdata.values)

//   let session =
//     sign_up_session_cookie.parse(req)
//     |> result.try(sign_up_session_token.decode)
//     |> result.replace_error(
//       wisp.redirect("/sign-up") |> sign_up_session_cookie.clear(req),
//     )
//     |> result.try(fn(token) {
//       sign_up_session_token.verify(token, ctx)
//       |> result.map_error(invalid_sign_up_session_response(req, _))
//     })

//   use session <- web.require_ok(session)

//   //TODO: send verification with email
//   echo session.email_address_verification_code

//   ui.verify_email_address_form(
//     ui.VerifyEmailAddressForm(code: form.field_value(candidate_form, "code")),
//     option.None,
//     option.Some(ui.RootSuccess(
//       msg: "a new verification code has been sent to your email address",
//     )),
//   )
//   |> web.html(200)
// }

// pub fn cancel_verify_email_address(req: Request, ctx: Ctx) {
//   use formdata <- wisp.require_form(req)

//   let candidate_form =
//     ui.get_verify_email_address_form()
//     |> form.add_values(formdata.values)

//   let session =
//     sign_up_session_cookie.parse(req)
//     |> result.try(sign_up_session_token.decode)
//     |> result.replace_error(
//       wisp.redirect("/sign-up") |> sign_up_session_cookie.clear(req),
//     )
//     |> result.try(fn(token) {
//       sign_up_session_token.verify(token, ctx)
//       |> result.map_error(invalid_sign_up_session_response(req, _))
//     })

//   use session <- web.require_ok(session)

//   let result =
//     verify_email_address.cancel(ctx.db, session.id)
//     |> result.map_error(fn(_) { cancel_error_response(candidate_form) })

//   use _ <- web.require_ok(result)

//   wisp.ok()
//   |> sign_up_session_cookie.clear(req)
//   |> wisp.set_header("HX-Redirect", "/sign-up")
// }

// fn verify_error_response(form, err) {
//   case err {
//     verify_email_address.InvalidCode -> {
//       echo "E"

//       form
//       |> ui.verify_email_address_form(
//         field_errors: option.None,
//         root_msg: option.Some(ui.RootErr(msg: "invalid code")),
//       )
//       |> ui.verify_email_address_page()
//       |> web.html(401)
//     }

//     verify_email_address.AlreadyVerified -> wisp.redirect("/set-password")

//     verify_email_address.DatabaseError(_) -> {
//       form
//       |> ui.verify_email_address_form(
//         field_errors: option.None,
//         root_msg: option.Some(ui.RootErr(msg: "something went wrong")),
//       )
//       |> ui.verify_email_address_page()
//       |> web.html(500)
//     }

//     verify_email_address.UnexpectedDatabaseResult -> {
//       form
//       |> ui.verify_email_address_form(
//         field_errors: option.None,
//         root_msg: option.Some(ui.RootErr(msg: "something went wrong")),
//       )
//       |> ui.verify_email_address_page()
//       |> web.html(500)
//     }
//   }
// }
// fn cancel_error_response(form) {
//   ui.VerifyEmailAddressForm(code: form.field_value(form, "code"))
//   |> ui.verify_email_address_form(
//     field_errors: option.None,
//     root_msg: option.Some(ui.RootErr(msg: "something went wrong")),
//   )
//   |> ui.verify_email_address_page()
//   |> web.html(500)
// }
