import identity/domain/email_address.{type EmailAddress}
import identity/domain/verification_code.{type VerificationCode}

pub type IdentityEvent {
  SignUpVerificationCodeIssued(email: EmailAddress, code: VerificationCode)
}
