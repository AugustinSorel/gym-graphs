import gleam/result
import pog.{type QueryError, type Returned}

pub type DatabaseError {
  DatabaseFailure(QueryError)
  RowNotFound
}

pub fn extract_first_row(
  rows: Result(Returned(a), QueryError),
) -> Result(a, DatabaseError) {
  rows
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [session, ..]) -> Ok(session)
      pog.Returned(_, []) -> Error(RowNotFound)
    }
  })
}
