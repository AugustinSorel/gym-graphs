import aws/services/sesv2.{type Client}
import gleam/option

pub type Email {
  Email(client: Client, from: String)
}

pub fn client(from: String) {
  let assert Ok(client) = sesv2.new()

  Email(client:, from:)
}

pub fn send(
  email email: Email,
  to to: String,
  subject subject: String,
  body body: String,
) {
  let content =
    sesv2.EmailContent(
      ..sesv2.email_content_default(),
      simple: option.Some(sesv2.message_default(
        subject: sesv2.content_default(data: subject),
        body: sesv2.Body(
          text: option.Some(sesv2.content_default(data: body)),
          html: option.None,
        ),
      )),
    )

  let request =
    sesv2.SendEmailRequest(
      ..sesv2.send_email_request_default(content: content),
      from_email_address: option.Some(email.from),
      destination: option.Some(
        sesv2.Destination(
          ..sesv2.destination_default(),
          to_addresses: option.Some([to]),
        ),
      ),
    )

  case sesv2.send_email(email.client, request) {
    Ok(_) -> Ok(Nil)
    Error(err) -> {
      echo err
      Error(err)
    }
  }
}
