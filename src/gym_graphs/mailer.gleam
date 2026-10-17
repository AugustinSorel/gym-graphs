pub type Email {
  Email(to: String, subject: String, html: String)
}

pub type SendError {
  SendError(reason: String)
}

pub opaque type Mailer {
  Mailer(send: fn(Email) -> Result(Nil, SendError))
}

pub fn new(send: fn(Email) -> Result(Nil, SendError)) {
  Mailer(send:)
}

pub fn send(mailer: Mailer, email: Email) {
  mailer.send(email)
}
