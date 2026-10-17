import aws4_request
import gleam/bit_array
import gleam/http
import gleam/http/request
import gleam/httpc
import gleam/json
import gleam/result
import gleam/string
import gym_graphs/mailer.{type Email, type Mailer}

pub fn new(
  access_key_id: String,
  secret_access_key: String,
  region: String,
  from_address: String,
) -> Mailer {
  let signer =
    aws4_request.signer(access_key_id, secret_access_key, region, "ses")

  mailer.new(fn(email) { send(signer, region, from_address, email) })
}

fn send(
  signer: aws4_request.Signer,
  region: String,
  from_address: String,
  email: Email,
) {
  let body =
    json.object([
      #("FromEmailAddress", json.string(from_address)),
      #(
        "Destination",
        json.object([
          #("ToAddresses", json.array([email.to], of: json.string)),
        ]),
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
                  #("Data", json.string(email.subject)),
                  #("Charset", json.string("UTF-8")),
                ]),
              ),
              #(
                "Body",
                json.object([
                  #(
                    "Html",
                    json.object([
                      #("Data", json.string(email.html)),
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

  let request =
    request.new()
    |> request.set_method(http.Post)
    |> request.set_host("email." <> region <> ".amazonaws.com")
    |> request.set_path("/v2/email/outbound-emails")
    |> request.set_header("content-type", "application/json")
    |> request.set_body(body)
  let request = aws4_request.sign_string(signer, request)

  use response <- result.try(
    httpc.send_bits(request)
    |> result.map_error(fn(error) {
      mailer.SendError("SES request failed: " <> string.inspect(error))
    }),
  )

  case response.status >= 200 && response.status < 300 {
    True -> Ok(Nil)
    False -> {
      let response_body =
        response.body
        |> bit_array.to_string
        |> result.unwrap("invalid response body")
      Error(mailer.SendError(
        "SES rejected the email with status "
        <> string.inspect(response.status)
        <> ": "
        <> response_body,
      ))
    }
  }
}
