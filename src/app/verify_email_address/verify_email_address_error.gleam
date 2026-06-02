import app/verify_email_address/ui.{type VerifyEmailAddressForm}
import formal/form.{type Form}
import pog.{type QueryError}

pub type ViewPageError {
  InvalidCookie
  InvalidSignUpSeesion
  DatabaseFailure(error: QueryError)
}

pub type VerifyEmailAddressError {
  VerifyEmailAddressValidation(form: Form(VerifyEmailAddressForm))
  VerifyEmailAddressInvalidCookie
  VerifyEmailAddressInvalidSignUpSeesion
  VerifyEmailAddressDatabaseFailure(error: QueryError)
  VerifyEmailAddressInvalidCode
  VerifyEmailAddressUnexpectedDatabaseResult
  VerifyEmailAddressAlreadyVerified
}
