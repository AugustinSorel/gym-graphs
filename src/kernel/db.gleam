import pog

pub fn extract_entity(res: Result(pog.Returned(a), pog.QueryError)) {
  case res {
    Ok(pog.Returned(_count, [entity, ..])) -> Ok(entity)
    Ok(pog.Returned(_count, [])) -> {
      Error(pog.PostgresqlError(
        code: "02000",
        name: "no_data_found",
        message: "query returned no rows",
      ))
    }
    Error(err) -> Error(err)
  }
}

pub fn extract_entities(res: Result(pog.Returned(a), pog.QueryError)) {
  case res {
    Ok(pog.Returned(_count, entities)) -> Ok(entities)
    Error(err) -> Error(err)
  }
}
