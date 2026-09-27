import identity/infrastructure/email_templates
import identity/domain/email_address.{type EmailAddress}
import identity/domain/events.{type IdentityEvent, SignUpVerificationCodeIssued}
import identity/domain/verification_code.{type VerificationCode}
import kernel/mailer.{type Mailer}
import wisp

pub fn handle(mailer: Mailer, event: IdentityEvent) -> Nil {
  case event {
    SignUpVerificationCodeIssued(email:, code:) ->
      send_verification_code(mailer, email, code)
  }
}

fn send_verification_code(
  mailer: Mailer,
  email: EmailAddress,
  code: VerificationCode,
) -> Nil {
  let result =
    mailer.send(
      email_address.to_string(email),
      "Your verification code",
      email_templates.verification_code(code),
    )

  case result {
    Ok(Nil) -> Nil
    Error(err) ->
      wisp.log_error(
        "failed to send sign-up verification email: " <> err.reason,
      )
  }
}
