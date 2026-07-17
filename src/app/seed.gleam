import app/db
import app/exercise/exercise
import app/set/set
import app/tag/tag
import gleam/list
import gleam/option
import gleam/result
import pog.{type Connection}

// ---- Tags -------------------------------------------------------------------

const default_tags = [
  "compound", "isolation", "push", "pull", "legs", "upper body", "lower body",
  "core", "cardio",
]

// ---- Sets data --------------------------------------------------------------
// Weights are stored in grams. A realistic progression over ~12 sessions.
// Bench press: 60–80 kg range, 3–5 reps
// Deadlift:    100–140 kg range, 3–5 reps
// Squat:       80–110 kg range, 3–5 reps

const bench_sets = [
  #(5, 60_000), #(5, 62_500), #(5, 65_000), #(4, 67_500), #(5, 67_500),
  #(4, 70_000), #(5, 70_000), #(3, 72_500), #(4, 72_500), #(5, 75_000),
  #(4, 77_500), #(3, 80_000),
]

const deadlift_sets = [
  #(5, 100_000), #(5, 105_000), #(5, 110_000), #(4, 112_500), #(5, 115_000),
  #(4, 117_500), #(5, 120_000), #(3, 122_500), #(4, 125_000), #(5, 130_000),
  #(4, 135_000), #(3, 140_000),
]

const squat_sets = [
  #(5, 80_000), #(5, 82_500), #(5, 85_000), #(4, 87_500), #(5, 90_000),
  #(4, 92_500), #(5, 95_000), #(3, 97_500), #(4, 100_000), #(5, 105_000),
  #(4, 107_500), #(3, 110_000),
]

// ---- Error type -------------------------------------------------------------

pub type SeedError {
  SeedTagFailed(name: String, cause: db.DatabaseError)
  SeedExerciseFailed(name: String, cause: db.DatabaseError)
  SeedSetFailed(exercise_id: Int, cause: db.DatabaseError)
  SeedTagAttachFailed(exercise_id: Int, cause: db.ExtractRowsError)
}

// ---- Public API -------------------------------------------------------------

/// Seeds a freshly-created user account with:
///   - Default tags (compound, isolation, push, pull, legs, …)
///   - 3 exercises: Bench Press, Deadlift, Squat
///   - ~12 sets per exercise showing a realistic weight progression
///   - Relevant tags attached to each exercise
///
/// Designed to be called inside an existing transaction — the caller is
/// responsible for the transaction boundary, so a failure here will roll
/// back the entire account creation.
pub fn seed_user(db: Connection, user_id: Int) -> Result(Nil, SeedError) {
  // 1. Create all default tags
  use tags <- result.try(create_tags(db, user_id))

  // 2. Build a lookup helper: tag name -> id (silently ignores missing names)
  let find_tag = fn(name) {
    tags
    |> list.find(fn(t) { t.name == name })
    |> result.map(fn(t) { t.id })
    |> option.from_result
  }

  // 3. Create exercises
  use bench <- result.try(
    exercise.create(db, user_id, "Bench Press")
    |> result.map_error(fn(e) { SeedExerciseFailed("Bench Press", e) }),
  )

  use deadlift <- result.try(
    exercise.create(db, user_id, "Deadlift")
    |> result.map_error(fn(e) { SeedExerciseFailed("Deadlift", e) }),
  )

  use squat <- result.try(
    exercise.create(db, user_id, "Squat")
    |> result.map_error(fn(e) { SeedExerciseFailed("Squat", e) }),
  )

  // 4. Attach tags to exercises
  use _ <- result.try(attach_tags(db, bench.id, [
    find_tag("compound"),
    find_tag("push"),
    find_tag("upper body"),
  ]))

  use _ <- result.try(attach_tags(db, deadlift.id, [
    find_tag("compound"),
    find_tag("pull"),
    find_tag("lower body"),
  ]))

  use _ <- result.try(attach_tags(db, squat.id, [
    find_tag("compound"),
    find_tag("legs"),
    find_tag("lower body"),
  ]))

  // 5. Insert sets for each exercise
  use _ <- result.try(create_sets(db, bench.id, bench_sets))
  use _ <- result.try(create_sets(db, deadlift.id, deadlift_sets))
  use _ <- result.try(create_sets(db, squat.id, squat_sets))

  Ok(Nil)
}

// ---- Helpers ----------------------------------------------------------------

type TagRow {
  TagRow(id: Int, name: String)
}

fn create_tags(
  db: Connection,
  user_id: Int,
) -> Result(List(TagRow), SeedError) {
  list.try_map(default_tags, fn(name) {
    tag.create(db, user_id, name)
    |> result.map(fn(row) { TagRow(id: row.id, name: row.name) })
    |> result.map_error(fn(e) { SeedTagFailed(name, e) })
  })
}

fn attach_tags(
  db: Connection,
  exercise_id: Int,
  tag_options: List(option.Option(Int)),
) -> Result(Nil, SeedError) {
  let tag_ids = list.filter_map(tag_options, fn(o) { option.to_result(o, Nil) })

  exercise.attach_tags(db, exercise_id, tag_ids)
  |> result.map(fn(_) { Nil })
  |> result.map_error(fn(e) { SeedTagAttachFailed(exercise_id, e) })
}

fn create_sets(
  db: Connection,
  exercise_id: Int,
  entries: List(#(Int, Int)),
) -> Result(Nil, SeedError) {
  list.try_map(entries, fn(entry) {
    let #(reps, weight_in_g) = entry
    set.create(db, exercise_id, reps, weight_in_g)
    |> result.map(fn(_) { Nil })
    |> result.map_error(fn(e) { SeedSetFailed(exercise_id, e) })
  })
  |> result.map(fn(_) { Nil })
}
