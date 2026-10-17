import formal/form.{type Form}
import gleam/option
import gleam/result
import gleam/string
import gym_graphs/ctx.{type Ctx}
import gym_graphs/domains/session
import gym_graphs/domains/sign_up_session
import gym_graphs/email_template
import gym_graphs/mailer.{type SendError}
import gym_graphs/repos/sign_up_session_repo
import gym_graphs/schemas/sign_up_session_schema.{type StartSchema}
import gym_graphs/views/sign_up_session_view
import lustre/element
import pog.{type QueryError}
import wisp.{type Request}

const sign_up_session_token_cookie = #("sign_up_session_token", 86_400)

pub fn view_start_page() {
  sign_up_session_schema.parse_start()
  |> sign_up_session_view.register_form()
  |> sign_up_session_view.register_page()
  |> element.to_string()
  |> wisp.html_response(200)
}

type StartError {
  StartValidationFailed(Form(StartSchema))
  EmailAlreadyUsed
  DatabaseFailure(QueryError)
  EmailFailure(SendError)
}

pub fn start(req: Request, ctx: Ctx) {
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      sign_up_session_schema.parse_start()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(StartValidationFailed),
    )

    let secret = session.generate_secret()
    let secret_hash = session.hash_secret(secret)
    let code = sign_up_session.generate_email_verification_code()

    use sign_up_session <- result.try({
      sign_up_session_repo.create(ctx.db, input.email, secret_hash, code)
      |> result.map_error(DatabaseFailure)
      |> result.try(option.to_result(_, EmailAlreadyUsed))
    })

    let #(subject, html) = email_template.verification_code(code)

    use Nil <- result.try(
      mailer.send(ctx.mailer, mailer.new_config(input.email, subject, html))
      |> result.map_error(EmailFailure),
    )

    Ok(session.encode_token(sign_up_session.id_to_int(sign_up_session), secret))
  }

  case result {
    Ok(token) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/sign-up/verify-email-address")
      |> wisp.set_cookie(
        req,
        name: sign_up_session_token_cookie.0,
        value: session.encoded_token_to_string(token),
        security: wisp.Signed,
        max_age: sign_up_session_token_cookie.1,
      )

    Error(StartValidationFailed(form)) -> {
      form
      |> sign_up_session_view.register_form()
      |> element.to_string()
      |> wisp.html_response(200)
    }
    Error(EmailAlreadyUsed) -> {
      sign_up_session_schema.parse_start()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Email address already taken."),
      )
      |> sign_up_session_view.register_form()
      |> element.to_string()
      |> wisp.html_response(409)
    }
    Error(DatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      sign_up_session_schema.parse_start()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> sign_up_session_view.register_form()
      |> element.to_string()
      |> wisp.html_response(500)
    }
    Error(EmailFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      sign_up_session_schema.parse_start()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> sign_up_session_view.register_form()
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}
