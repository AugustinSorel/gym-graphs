import aws4_request.{type Signer}
import gleam/bit_array
import gleam/http
import gleam/http/request
import gleam/httpc
import gleam/int
import gleam/json
import gleam/result
import gleam/string
import kernel/mailer.{type Mailer, type MailerError, Mailer, MailerError}

type Config {
  Config(signer: Signer, from: String)
}

pub fn new(signer: Signer, from: String) -> Mailer {
  let config = Config(signer:, from:)
  Mailer(send: fn(to, subject, html) { send(config, to, subject, html) })
}

fn send(
  config: Config,
  to: String,
  subject: String,
  html: String,
) -> Result(Nil, MailerError) {
  let body =
    json.object([
      #("FromEmailAddress", json.string(config.from)),
      #(
        "Destination",
        json.object([#("ToAddresses", json.array([to], json.string))]),
      ),
      #(
        "Content",
        json.object([
          #(
            "Simple",
            json.object([
              #(
                "Subject",
                json.object([
                  #("Data", json.string(subject)),
                  #("Charset", json.string("UTF-8")),
                ]),
              ),
              #(
                "Body",
                json.object([
                  #(
                    "Html",
                    json.object([
                      #("Data", json.string(html)),
                      #("Charset", json.string("UTF-8")),
                    ]),
                  ),
                ]),
              ),
            ]),
          ),
        ]),
      ),
    ])
    |> json.to_string

  let url =
    "https://email."
    <> config.signer.region
    <> ".amazonaws.com/v2/email/outbound-emails"

  let assert Ok(req) = request.to(url)

  let req =
    req
    |> request.set_method(http.Post)
    |> request.set_header("content-type", "application/json")
    |> request.set_body(body)
    |> aws4_request.sign_string(config.signer, _)

  case httpc.send_bits(req) {
    Error(err) ->
      Error(MailerError(reason: "SES HTTP error: " <> string.inspect(err)))
    Ok(resp) ->
      case resp.status {
        200 -> Ok(Nil)
        status -> {
          let resp_body =
            bit_array.to_string(resp.body)
            |> result.unwrap(int.to_string(status))
          Error(MailerError(
            reason: "SES error " <> int.to_string(status) <> ": " <> resp_body,
          ))
        }
      }
  }
}
