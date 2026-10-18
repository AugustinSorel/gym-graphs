import gleam/bit_array
import gleam/int
import gleam/list
import gleam/result
import gleam/string
import gym_graphs/mailers/mailer.{type Mailer, type MailerConfig}
import mug

const timeout = 10_000

pub fn new(host: String, port: Int, from_address: String) -> Mailer {
  mailer.new(fn(email) { send(host, port, from_address, email) })
}

fn send(
  host: String,
  port: Int,
  from_address: String,
  mailer_config: MailerConfig,
) -> Result(Nil, mailer.SendError) {
  use _ <- result.try(validate_header("from address", from_address))
  use _ <- result.try(validate_header("recipient", mailer_config.to))
  use _ <- result.try(validate_header("subject", mailer_config.subject))

  use socket <- result.try(
    mug.new(host, port: port)
    |> mug.timeout(timeout)
    |> mug.connect
    |> result.map_error(fn(error) {
      mailer.SendError("SMTP connection failed: " <> string.inspect(error))
    }),
  )

  let outcome = deliver(socket, from_address, mailer_config)
  let _ = mug.shutdown(socket)
  outcome
}

fn deliver(
  socket: mug.Socket,
  from_address: String,
  mailer_config: MailerConfig,
) -> Result(Nil, mailer.SendError) {
  use _ <- result.try(expect_response(socket, [220]))
  use _ <- result.try(command(socket, "EHLO localhost", [250]))
  use _ <- result.try(
    command(socket, "MAIL FROM:<" <> from_address <> ">", [250]),
  )
  use _ <- result.try(
    command(socket, "RCPT TO:<" <> mailer_config.to <> ">", [250, 251]),
  )
  use _ <- result.try(command(socket, "DATA", [354]))
  use _ <- result.try(send_data(
    socket,
    build_message(from_address, mailer_config),
  ))
  use _ <- result.try(expect_response(socket, [250]))
  use _ <- result.try(command(socket, "QUIT", [221]))
  Ok(Nil)
}

fn command(
  socket: mug.Socket,
  value: String,
  expected_codes: List(Int),
) -> Result(Nil, mailer.SendError) {
  use _ <- result.try(send_bytes(socket, value <> "\r\n"))
  expect_response(socket, expected_codes)
}

fn send_data(
  socket: mug.Socket,
  message: String,
) -> Result(Nil, mailer.SendError) {
  send_bytes(socket, message <> "\r\n.\r\n")
}

fn send_bytes(
  socket: mug.Socket,
  value: String,
) -> Result(Nil, mailer.SendError) {
  mug.send(socket, bit_array.from_string(value))
  |> result.map_error(fn(error) {
    mailer.SendError("SMTP send failed: " <> mug.describe_error(error))
  })
}

fn expect_response(
  socket: mug.Socket,
  expected_codes: List(Int),
) -> Result(Nil, mailer.SendError) {
  use response <- result.try(receive_response(socket, ""))
  use code <- result.try(
    response
    |> string.slice(at_index: 0, length: 3)
    |> int.parse
    |> result.map_error(fn(_) {
      mailer.SendError("Invalid SMTP response: " <> response)
    }),
  )

  case list.contains(expected_codes, code) {
    True -> Ok(Nil)
    False -> Error(mailer.SendError("SMTP rejected command: " <> response))
  }
}

fn receive_response(
  socket: mug.Socket,
  buffer: String,
) -> Result(String, mailer.SendError) {
  use chunk <- result.try(
    mug.receive(socket, timeout_milliseconds: timeout)
    |> result.map_error(fn(error) {
      mailer.SendError("SMTP receive failed: " <> mug.describe_error(error))
    }),
  )
  use chunk <- result.try(
    bit_array.to_string(chunk)
    |> result.map_error(fn(_) { mailer.SendError("Invalid SMTP response") }),
  )

  let response = buffer <> chunk
  case response_complete(response) {
    True -> Ok(response)
    False -> receive_response(socket, response)
  }
}

fn response_complete(response: String) -> Bool {
  response
  |> string.split(on: "\r\n")
  |> list.any(fn(line) {
    string.length(line) >= 4
    && string.slice(line, at_index: 3, length: 1) == " "
  })
}

fn build_message(from_address: String, mailer_config: MailerConfig) -> String {
  [
    "From: <" <> from_address <> ">",
    "To: <" <> mailer_config.to <> ">",
    "Subject: " <> mailer_config.subject,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    dot_stuff(mailer_config.html),
  ]
  |> string.join(with: "\r\n")
}

fn dot_stuff(body: String) -> String {
  body
  |> string.replace("\r\n", with: "\n")
  |> string.split(on: "\n")
  |> list.map(fn(line) {
    case string.starts_with(line, ".") {
      True -> "." <> line
      False -> line
    }
  })
  |> string.join(with: "\r\n")
}

fn validate_header(
  name: String,
  value: String,
) -> Result(Nil, mailer.SendError) {
  case string.contains(value, "\r") || string.contains(value, "\n") {
    True -> Error(mailer.SendError("Invalid email " <> name))
    False -> Ok(Nil)
  }
}
