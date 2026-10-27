import gleam/bool
import gleam/dict.{type Dict}
import gleam/dynamic/decode as dynamic_decode
import gleam/json
import gleam/list
import gleam/result
import gleam/string
import gleam/time/timestamp
import gym_graphs/domains/user.{type UserId}
import gym_graphs/repos/import_repo.{
  type Document, type ExerciseTag, type WorkoutSet,
}
import pog.{type Connection}

pub const schema_version = 1

pub type ImportError {
  InvalidJson
  UnsupportedVersion(Int)
  InvalidData(String)
  AccountNotEmpty
  ImportFailure
}

pub fn restore(
  input: BitArray,
  db: Connection,
  user_id: UserId,
) -> Result(Nil, ImportError) {
  use document <- result.try(decode(input))

  case import_repo.restore(db, user_id, document) {
    Ok(Nil) -> Ok(Nil)
    Error(pog.TransactionRolledBack(import_repo.AccountNotEmpty)) ->
      Error(AccountNotEmpty)
    Error(_) -> Error(ImportFailure)
  }
}

pub fn decode(input: BitArray) -> Result(Document, ImportError) {
  use version <- result.try(
    json.parse_bits(input, version_decoder())
    |> result.map_error(fn(_) { InvalidJson }),
  )
  use <- bool.guard(
    when: version != schema_version,
    return: Error(UnsupportedVersion(version)),
  )
  use document <- result.try(
    json.parse_bits(input, document_decoder())
    |> result.map_error(fn(_) { InvalidJson }),
  )

  validate(document)
}

fn validate(document: Document) -> Result(Document, ImportError) {
  use <- bool.guard(
    when: list.length(document.tags) > 10_000
      || list.length(document.exercises) > 10_000
      || list.length(document.exercise_tags) > 100_000
      || list.length(document.sets) > 100_000,
    return: Error(InvalidData("the export contains too many records")),
  )
  use tag_ids <- result.try(unique_ids(
    document.tags,
    id: fn(tag) { tag.id },
    entity: "tag",
  ))
  use exercise_ids <- result.try(unique_ids(
    document.exercises,
    id: fn(exercise) { exercise.id },
    entity: "exercise",
  ))
  use _set_ids <- result.try(unique_ids(
    document.sets,
    id: fn(set) { set.id },
    entity: "set",
  ))
  use _tag_names <- result.try(unique_names(
    document.tags,
    name: fn(tag) { tag.name },
    entity: "tag",
  ))
  use _exercise_names <- result.try(unique_names(
    document.exercises,
    name: fn(exercise) { exercise.name },
    entity: "exercise",
  ))
  use _links <- result.try(validate_exercise_tags(
    document.exercise_tags,
    tag_ids,
    exercise_ids,
    dict.new(),
  ))
  use Nil <- result.try(validate_sets(document.sets, exercise_ids))

  Ok(document)
}

const postgres_int_max = 2_147_483_647

const postgres_int_min = -2_147_483_648

fn unique_ids(
  items: List(a),
  id id: fn(a) -> Int,
  entity entity: String,
) -> Result(Dict(Int, Nil), ImportError) {
  unique_ids_loop(items, id, entity, dict.new())
}

fn unique_ids_loop(
  items: List(a),
  id: fn(a) -> Int,
  entity: String,
  seen: Dict(Int, Nil),
) -> Result(Dict(Int, Nil), ImportError) {
  case items {
    [] -> Ok(seen)
    [item, ..rest] -> {
      let value = id(item)
      case value <= 0 || value > postgres_int_max, dict.has_key(seen, value) {
        True, _ -> Error(InvalidData(entity <> " has an invalid id"))
        _, True -> Error(InvalidData(entity <> " ids must be unique"))
        False, False ->
          unique_ids_loop(rest, id, entity, dict.insert(seen, value, Nil))
      }
    }
  }
}

fn unique_names(
  items: List(a),
  name name: fn(a) -> String,
  entity entity: String,
) -> Result(Dict(String, Nil), ImportError) {
  unique_names_loop(items, name, entity, dict.new())
}

fn unique_names_loop(
  items: List(a),
  name: fn(a) -> String,
  entity: String,
  seen: Dict(String, Nil),
) -> Result(Dict(String, Nil), ImportError) {
  case items {
    [] -> Ok(seen)
    [item, ..rest] -> {
      let value = name(item)
      case
        value == string.trim(value) && value != "" && string.length(value) < 100,
        dict.has_key(seen, value)
      {
        False, _ -> Error(InvalidData(entity <> " has an invalid name"))
        _, True -> Error(InvalidData(entity <> " names must be unique"))
        True, False ->
          unique_names_loop(rest, name, entity, dict.insert(seen, value, Nil))
      }
    }
  }
}

fn validate_exercise_tags(
  links: List(ExerciseTag),
  tag_ids: Dict(Int, Nil),
  exercise_ids: Dict(Int, Nil),
  seen: Dict(#(Int, Int), Nil),
) -> Result(Dict(#(Int, Int), Nil), ImportError) {
  case links {
    [] -> Ok(seen)
    [link, ..rest] -> {
      let key = #(link.exercise_id, link.tag_id)
      case
        dict.has_key(exercise_ids, link.exercise_id),
        dict.has_key(tag_ids, link.tag_id),
        dict.has_key(seen, key)
      {
        False, _, _ ->
          Error(InvalidData("exercise tag references a missing exercise"))
        _, False, _ ->
          Error(InvalidData("exercise tag references a missing tag"))
        _, _, True -> Error(InvalidData("exercise tag links must be unique"))
        True, True, False ->
          validate_exercise_tags(
            rest,
            tag_ids,
            exercise_ids,
            dict.insert(seen, key, Nil),
          )
      }
    }
  }
}

fn validate_sets(
  sets: List(WorkoutSet),
  exercise_ids: Dict(Int, Nil),
) -> Result(Nil, ImportError) {
  case sets {
    [] -> Ok(Nil)
    [set, ..rest] ->
      case
        dict.has_key(exercise_ids, set.exercise_id),
        set.repetitions > 0
        && set.weight_in_g >= 0
        && is_postgres_int(set.repetitions)
        && is_postgres_int(set.weight_in_g)
      {
        False, _ -> Error(InvalidData("set references a missing exercise"))
        _, False ->
          Error(InvalidData("set has a number outside the valid range"))
        True, True -> validate_sets(rest, exercise_ids)
      }
  }
}

fn is_postgres_int(value: Int) -> Bool {
  value >= postgres_int_min && value <= postgres_int_max
}

fn version_decoder() {
  use version <- dynamic_decode.field("schema_version", dynamic_decode.int)
  dynamic_decode.success(version)
}

fn document_decoder() {
  use _version <- dynamic_decode.field("schema_version", dynamic_decode.int)
  use exported_at <- dynamic_decode.field("exported_at", timestamp_decoder())
  use account <- dynamic_decode.field("account", account_decoder())
  use tags <- dynamic_decode.field(
    "tags",
    dynamic_decode.list(of: tag_decoder()),
  )
  use exercises <- dynamic_decode.field(
    "exercises",
    dynamic_decode.list(of: exercise_decoder()),
  )
  use exercise_tags <- dynamic_decode.field(
    "exercise_tags",
    dynamic_decode.list(of: exercise_tag_decoder()),
  )
  use sets <- dynamic_decode.field(
    "sets",
    dynamic_decode.list(of: workout_set_decoder()),
  )
  dynamic_decode.success(import_repo.Document(
    exported_at:,
    account:,
    tags:,
    exercises:,
    exercise_tags:,
    sets:,
  ))
}

fn account_decoder() {
  use id <- dynamic_decode.field("id", dynamic_decode.int)
  use email_address <- dynamic_decode.field(
    "email_address",
    dynamic_decode.string,
  )
  use name <- dynamic_decode.field("name", dynamic_decode.string)
  use weight_unit <- dynamic_decode.field("weight_unit", dynamic_decode.string)
  use one_rep_max_algorithm <- dynamic_decode.field(
    "one_rep_max_algorithm",
    dynamic_decode.string,
  )
  use created_at <- dynamic_decode.field("created_at", timestamp_decoder())
  use updated_at <- dynamic_decode.field("updated_at", timestamp_decoder())
  dynamic_decode.success(import_repo.Account(
    id:,
    email_address:,
    name:,
    weight_unit:,
    one_rep_max_algorithm:,
    created_at:,
    updated_at:,
  ))
}

fn tag_decoder() {
  use id <- dynamic_decode.field("id", dynamic_decode.int)
  use name <- dynamic_decode.field("name", dynamic_decode.string)
  use created_at <- dynamic_decode.field("created_at", timestamp_decoder())
  use updated_at <- dynamic_decode.field("updated_at", timestamp_decoder())
  dynamic_decode.success(import_repo.Tag(id:, name:, created_at:, updated_at:))
}

fn exercise_decoder() {
  use id <- dynamic_decode.field("id", dynamic_decode.int)
  use name <- dynamic_decode.field("name", dynamic_decode.string)
  use created_at <- dynamic_decode.field("created_at", timestamp_decoder())
  use updated_at <- dynamic_decode.field("updated_at", timestamp_decoder())
  dynamic_decode.success(import_repo.Exercise(
    id:,
    name:,
    created_at:,
    updated_at:,
  ))
}

fn exercise_tag_decoder() {
  use exercise_id <- dynamic_decode.field("exercise_id", dynamic_decode.int)
  use tag_id <- dynamic_decode.field("tag_id", dynamic_decode.int)
  use created_at <- dynamic_decode.field("created_at", timestamp_decoder())
  dynamic_decode.success(import_repo.ExerciseTag(
    exercise_id:,
    tag_id:,
    created_at:,
  ))
}

fn workout_set_decoder() {
  use id <- dynamic_decode.field("id", dynamic_decode.int)
  use exercise_id <- dynamic_decode.field("exercise_id", dynamic_decode.int)
  use repetitions <- dynamic_decode.field("repetitions", dynamic_decode.int)
  use weight_in_g <- dynamic_decode.field("weight_in_g", dynamic_decode.int)
  use done_at <- dynamic_decode.field("done_at", timestamp_decoder())
  use created_at <- dynamic_decode.field("created_at", timestamp_decoder())
  use updated_at <- dynamic_decode.field("updated_at", timestamp_decoder())
  dynamic_decode.success(import_repo.WorkoutSet(
    id:,
    exercise_id:,
    repetitions:,
    weight_in_g:,
    done_at:,
    created_at:,
    updated_at:,
  ))
}

fn timestamp_decoder() {
  dynamic_decode.then(dynamic_decode.string, fn(value) {
    case timestamp.parse_rfc3339(value) {
      Ok(value) -> dynamic_decode.success(value)
      Error(_) ->
        dynamic_decode.failure(
          timestamp.from_unix_seconds(0),
          expected: "RFC 3339 timestamp",
        )
    }
  })
}
