import app/register_email/register_email_ui.{type EmailRegisterForm}
import formal/form.{type Form}
import pog.{type QueryError}

pub type RegisterEmailError {
  Validation(invalid_form: Form(EmailRegisterForm))
  DuplicateEmail
  DatabaseFailure(error: QueryError)
  UnexpectedDatabaseResult
}
