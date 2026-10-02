pub type MailerError {
  MailerError(reason: String)
}

pub type Mailer {
  Mailer(send: fn(String, String, String) -> Result(Nil, MailerError))
}
