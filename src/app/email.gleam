import aws4_request
import gleam/bit_array
import gleam/http
import gleam/http/request
import gleam/httpc
import gleam/int
import gleam/json
import gleam/list
import gleam/result
import gleam/string
import mug

pub type Email {
  Ses(signer: aws4_request.Signer, from: String)
  Smtp(host: String, port: Int, from: String)
}

pub type SendEmailError {
  // SES errors
  HttpError(httpc.HttpError)
  SesError(status: Int, body: String)
  // SMTP errors
  SmtpConnectError(mug.ConnectError)
  SmtpSendError(mug.Error)
  SmtpReceiveError(mug.Error)
  SmtpUnexpectedResponse(String)
}

pub fn send(
  email email: Email,
  to to: String,
  subject subject: String,
  html html: String,
) -> Result(Nil, SendEmailError) {
  case email {
    Ses(..) -> send_via_ses(email, to, subject, html)
    Smtp(..) -> send_via_smtp(email, to, subject, html)
  }
}

// ---------------------------------------------------------------------------
// SES backend
// ---------------------------------------------------------------------------

fn send_via_ses(
  email: Email,
  to: String,
  subject: String,
  html: String,
) -> Result(Nil, SendEmailError) {
  let assert Ses(signer:, from:) = email

  let body =
    json.object([
      #("FromEmailAddress", json.string(from)),
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
    <> signer.region
    <> ".amazonaws.com/v2/email/outbound-emails"

  let assert Ok(req) = request.to(url)

  let req =
    req
    |> request.set_method(http.Post)
    |> request.set_header("content-type", "application/json")
    |> request.set_body(body)
    |> aws4_request.sign_string(signer, _)

  case httpc.send_bits(req) {
    Error(err) -> Error(HttpError(err))
    Ok(resp) ->
      case resp.status {
        200 -> Ok(Nil)
        status -> {
          let resp_body =
            bit_array.to_string(resp.body)
            |> result.unwrap(int.to_string(status))
          Error(SesError(status:, body: resp_body))
        }
      }
  }
}

// ---------------------------------------------------------------------------
// SMTP backend (plain TCP, no TLS — for Mailpit locally)
// ---------------------------------------------------------------------------

const smtp_timeout_ms = 5000

fn send_via_smtp(
  email: Email,
  to: String,
  subject: String,
  html: String,
) -> Result(Nil, SendEmailError) {
  let assert Smtp(host:, port:, from:) = email

  use socket <- result.try(
    mug.new(host, port:)
    |> mug.timeout(milliseconds: smtp_timeout_ms)
    |> mug.connect()
    |> result.map_error(SmtpConnectError),
  )

  // Server greeting
  use _ <- result.try(read_ok(socket))

  // EHLO — identify ourselves; server responds with its capabilities
  use _ <- result.try(smtp_command(socket, "EHLO localhost"))

  // MAIL FROM
  use _ <- result.try(smtp_command(socket, "MAIL FROM:<" <> from <> ">"))

  // RCPT TO
  use _ <- result.try(smtp_command(socket, "RCPT TO:<" <> to <> ">"))

  // DATA — server replies 354 "go ahead"
  use _ <- result.try(smtp_command(socket, "DATA"))

  // Headers + blank line + body, terminated by a lone dot on its own line
  let message =
    "From: "
    <> from
    <> "\r\nTo: "
    <> to
    <> "\r\nSubject: "
    <> subject
    <> "\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n"
    <> html
    <> "\r\n.\r\n"

  use _ <- result.try(
    mug.send(socket, bit_array.from_string(message))
    |> result.map_error(SmtpSendError),
  )

  // Server ACKs the message
  use _ <- result.try(read_ok(socket))

  // QUIT — we don't care if this fails, connection is done either way
  use _ <- result.try(smtp_command(socket, "QUIT"))
  let _ = mug.shutdown(socket)

  Ok(Nil)
}

// Send a command line (appends CRLF) then reads and validates the response.
fn smtp_command(
  socket: mug.Socket,
  command: String,
) -> Result(String, SendEmailError) {
  use _ <- result.try(
    mug.send(socket, bit_array.from_string(command <> "\r\n"))
    |> result.map_error(SmtpSendError),
  )
  read_ok(socket)
}

// Read response lines from the server, accumulating until the final line
// (the one whose 4th character is a space rather than a dash — RFC 5321 §4.5.3).
// Then check that the leading code is 2xx or 3xx (success / continue).
fn read_ok(socket: mug.Socket) -> Result(String, SendEmailError) {
  use full <- result.try(read_full_response(socket, ""))
  // A valid SMTP response is at least 4 chars: "250 " or "354 "
  let code = string.slice(full, at_index: 0, length: 1)
  case code == "2" || code == "3" {
    True -> Ok(full)
    False -> Error(SmtpUnexpectedResponse(full))
  }
}

// Accumulate response lines until the terminating line (code + space + text).
// Multi-line responses use "250-..." for continuation and "250 ..." for the end.
fn read_full_response(
  socket: mug.Socket,
  acc: String,
) -> Result(String, SendEmailError) {
  use bytes <- result.try(
    mug.receive(socket, timeout_milliseconds: smtp_timeout_ms)
    |> result.map_error(SmtpReceiveError),
  )
  let chunk = bit_array.to_string(bytes) |> result.unwrap("")
  let combined = acc <> chunk
  case is_final_response(combined) {
    True -> Ok(combined)
    False -> read_full_response(socket, combined)
  }
}

// An SMTP response is complete when its last non-empty line has a space
// as the 4th character (position 3), i.e. "250 OK" not "250-MORE".
fn is_final_response(response: String) -> Bool {
  let last_line =
    string.split(response, "\n")
    |> list.filter(fn(l) { string.trim(l) != "" })
    |> list.last()
  case last_line {
    Error(_) -> False
    // Final line format: "XYZ <text>" — 4th char (index 3) is a space
    Ok(line) -> string.length(line) >= 4 && string.slice(line, 3, 1) == " "
  }
}
