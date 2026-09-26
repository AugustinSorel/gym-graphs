import gleam/bit_array
import gleam/list
import gleam/result
import gleam/string
import identity/application/mailer.{
  type Mailer, type MailerError, Mailer, MailerError,
}
import mug

type Config {
  Config(host: String, port: Int, from: String)
}

const smtp_timeout_ms = 5000

/// Plain TCP, no TLS — for Mailpit locally.
pub fn new(host: String, port: Int, from: String) -> Mailer {
  let config = Config(host:, port:, from:)
  Mailer(send: fn(to, subject, html) { send(config, to, subject, html) })
}

fn send(
  config: Config,
  to: String,
  subject: String,
  html: String,
) -> Result(Nil, MailerError) {
  use socket <- result.try(
    mug.new(config.host, port: config.port)
    |> mug.timeout(milliseconds: smtp_timeout_ms)
    |> mug.connect()
    |> result.map_error(fn(err) {
      MailerError(reason: "SMTP connect error: " <> string.inspect(err))
    }),
  )

  // Server greeting
  use _ <- result.try(read_ok(socket))

  // EHLO — identify ourselves; server responds with its capabilities
  use _ <- result.try(smtp_command(socket, "EHLO localhost"))

  // MAIL FROM
  use _ <- result.try(smtp_command(socket, "MAIL FROM:<" <> config.from <> ">"))

  // RCPT TO
  use _ <- result.try(smtp_command(socket, "RCPT TO:<" <> to <> ">"))

  // DATA — server replies 354 "go ahead"
  use _ <- result.try(smtp_command(socket, "DATA"))

  // Headers + blank line + body, terminated by a lone dot on its own line
  let message =
    "From: "
    <> config.from
    <> "\r\nTo: "
    <> to
    <> "\r\nSubject: "
    <> subject
    <> "\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n"
    <> html
    <> "\r\n.\r\n"

  use _ <- result.try(
    mug.send(socket, bit_array.from_string(message))
    |> result.map_error(fn(err) {
      MailerError(reason: "SMTP send error: " <> string.inspect(err))
    }),
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
) -> Result(String, MailerError) {
  use _ <- result.try(
    mug.send(socket, bit_array.from_string(command <> "\r\n"))
    |> result.map_error(fn(err) {
      MailerError(reason: "SMTP send error: " <> string.inspect(err))
    }),
  )
  read_ok(socket)
}

// Read response lines from the server, accumulating until the final line
// (the one whose 4th character is a space rather than a dash — RFC 5321 §4.5.3).
// Then check that the leading code is 2xx or 3xx (success / continue).
fn read_ok(socket: mug.Socket) -> Result(String, MailerError) {
  use full <- result.try(read_full_response(socket, ""))
  // A valid SMTP response is at least 4 chars: "250 " or "354 "
  let code = string.slice(full, at_index: 0, length: 1)
  case code == "2" || code == "3" {
    True -> Ok(full)
    False -> Error(MailerError(reason: "SMTP unexpected response: " <> full))
  }
}

// Accumulate response lines until the terminating line (code + space + text).
// Multi-line responses use "250-..." for continuation and "250 ..." for the end.
fn read_full_response(
  socket: mug.Socket,
  acc: String,
) -> Result(String, MailerError) {
  use bytes <- result.try(
    mug.receive(socket, timeout_milliseconds: smtp_timeout_ms)
    |> result.map_error(fn(err) {
      MailerError(reason: "SMTP receive error: " <> string.inspect(err))
    }),
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
