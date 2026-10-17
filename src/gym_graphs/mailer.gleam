import gym_graphs/domains/user
import lustre/element

pub type MailerConfig {
  MailerConfig(to: String, subject: String, html: String)
}

pub type SendError {
  SendError(reason: String)
}

pub opaque type Mailer {
  Mailer(send: fn(MailerConfig) -> Result(Nil, SendError))
}

pub fn new(send: fn(MailerConfig) -> Result(Nil, SendError)) {
  Mailer(send:)
}

pub fn new_config(to: user.Email, subject: String, html: element.Element(a)) {
  MailerConfig(
    to: user.email_to_string(to),
    subject:,
    html: element.to_string(html),
  )
}

pub fn send(mailer: Mailer, config: MailerConfig) {
  mailer.send(config)
}
