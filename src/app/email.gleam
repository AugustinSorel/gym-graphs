import app/env.{type Env}
import aws4_request
import gleam/bit_array
import gleam/http
import gleam/http/request
import gleam/httpc
import gleam/int
import gleam/json
import gleam/result

pub type Email {
  Email(signer: aws4_request.Signer, from: String, region: String)
}

pub type SendEmailError {
  HttpError(httpc.HttpError)
  SesError(status: Int, body: String)
}

pub fn client(env: Env) -> Email {
  let signer =
    aws4_request.signer(
      access_key_id: env.aws_access_key_id,
      secret_access_key: env.aws_secret_access_key,
      region: env.aws_region,
      service: "ses",
    )

  Email(signer:, from: env.ses_from_address, region: env.aws_region)
}

pub fn send(
  email email: Email,
  to to: String,
  subject subject: String,
  html html: String,
) -> Result(Nil, SendEmailError) {
  let body =
    json.object([
      #("FromEmailAddress", json.string(email.from)),
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
    <> email.region
    <> ".amazonaws.com/v2/email/outbound-emails"

  let assert Ok(req) = request.to(url)

  let req =
    req
    |> request.set_method(http.Post)
    |> request.set_header("content-type", "application/json")
    |> request.set_body(body)
    |> aws4_request.sign_string(email.signer, _)

  case httpc.send_bits(req) {
    Error(err) -> Error(HttpError(err))
    Ok(resp) ->
      case resp.status {
        200 -> Ok(Nil)
        status -> {
          let body =
            bit_array.to_string(resp.body)
            |> result.unwrap(int.to_string(status))
          Error(SesError(status:, body:))
        }
      }
  }
}
