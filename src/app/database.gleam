import gleam/dynamic/decode
import gleam/int
import gleam/list
import gleam/string
import pog

pub fn query_error_to_string(error: pog.QueryError) -> String {
  case error {
    pog.ConstraintViolated(message:, constraint:, detail:) ->
      "Constraint violated ("
      <> constraint
      <> "): "
      <> message
      <> ". "
      <> detail

    pog.PostgresqlError(code:, name:, message:) ->
      "PostgreSQL error " <> code <> " (" <> name <> "): " <> message

    pog.UnexpectedArgumentCount(expected:, got:) ->
      "Unexpected argument count: expected "
      <> int.to_string(expected)
      <> ", got "
      <> int.to_string(got)

    pog.UnexpectedArgumentType(expected:, got:) ->
      "Unexpected argument type: expected " <> expected <> ", got " <> got

    pog.UnexpectedResultType(decode_errors) ->
      "Unexpected result type: "
      <> string.join(list.map(decode_errors, decode_error_to_string), ", ")

    pog.QueryTimeout -> "Query timed out"

    pog.ConnectionUnavailable -> "Database connection unavailable"
  }
}

fn decode_error_to_string(error: decode.DecodeError) -> String {
  "expected "
  <> error.expected
  <> " at path "
  <> string.join(error.path, ".")
  <> ", got "
  <> error.found
}
