import gleam/json
import gleam/result
import gleam/string
import gleam/time/duration
import gleam/time/timestamp.{type Timestamp}
import gym_graphs/domains/user.{type UserId}
import gym_graphs/repos/export_repo.{
  type Account, type DataExport, type Exercise, type ExerciseTag, type Tag,
  type WorkoutSet,
}
import pog.{type Connection}

pub const schema_version = 1

pub type PreparedExport {
  PreparedExport(filename: String, content: String)
}

pub fn prepare(db: Connection, user_id: UserId, exported_at: Timestamp) {
  use data <- result.try(export_repo.load(db, user_id))
  let date =
    exported_at
    |> timestamp.to_rfc3339(duration.seconds(0))
    |> string.slice(at_index: 0, length: 10)

  Ok(PreparedExport(
    filename: "gym-graphs-export-" <> date <> ".json",
    content: to_string(data, exported_at),
  ))
}

pub fn to_string(data: DataExport, exported_at: Timestamp) -> String {
  to_json(data, exported_at)
  |> json.to_string()
}

fn to_json(data: DataExport, exported_at: Timestamp) -> json.Json {
  json.object([
    #("schema_version", json.int(schema_version)),
    #("exported_at", timestamp_json(exported_at)),
    #("account", account_json(data.account)),
    #("tags", json.array(data.tags, of: tag_json)),
    #("exercises", json.array(data.exercises, of: exercise_json)),
    #("exercise_tags", json.array(data.exercise_tags, of: exercise_tag_json)),
    #("sets", json.array(data.sets, of: workout_set_json)),
  ])
}

fn account_json(account: Account) -> json.Json {
  json.object([
    #("id", json.int(account.id)),
    #("email_address", json.string(account.email_address)),
    #("name", json.string(account.name)),
    #(
      "weight_unit",
      json.string(user.weight_unit_to_string(account.weight_unit)),
    ),
    #(
      "one_rep_max_algorithm",
      json.string(user.one_rep_max_algorithm_to_string(
        account.one_rep_max_algorithm,
      )),
    ),
    #("created_at", timestamp_json(account.created_at)),
    #("updated_at", timestamp_json(account.updated_at)),
  ])
}

fn tag_json(tag: Tag) -> json.Json {
  json.object([
    #("id", json.int(tag.id)),
    #("name", json.string(tag.name)),
    #("created_at", timestamp_json(tag.created_at)),
    #("updated_at", timestamp_json(tag.updated_at)),
  ])
}

fn exercise_json(exercise: Exercise) -> json.Json {
  json.object([
    #("id", json.int(exercise.id)),
    #("name", json.string(exercise.name)),
    #("created_at", timestamp_json(exercise.created_at)),
    #("updated_at", timestamp_json(exercise.updated_at)),
  ])
}

fn exercise_tag_json(exercise_tag: ExerciseTag) -> json.Json {
  json.object([
    #("exercise_id", json.int(exercise_tag.exercise_id)),
    #("tag_id", json.int(exercise_tag.tag_id)),
    #("created_at", timestamp_json(exercise_tag.created_at)),
  ])
}

fn workout_set_json(set: WorkoutSet) -> json.Json {
  json.object([
    #("id", json.int(set.id)),
    #("exercise_id", json.int(set.exercise_id)),
    #("repetitions", json.int(set.repetitions)),
    #("weight_in_g", json.int(set.weight_in_g)),
    #("done_at", timestamp_json(set.done_at)),
    #("created_at", timestamp_json(set.created_at)),
    #("updated_at", timestamp_json(set.updated_at)),
  ])
}

fn timestamp_json(value: Timestamp) -> json.Json {
  value
  |> timestamp.to_rfc3339(duration.seconds(0))
  |> json.string()
}
