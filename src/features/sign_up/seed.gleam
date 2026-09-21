import domains/exercise/exercise.{type Exercise}
import domains/exercise_tag/exercise_tag
import domains/set/set
import domains/tag/tag.{type Tag}
import gleam/list
import gleam/result
import gleam/time/duration
import gleam/time/timestamp
import pog.{type Connection}

pub fn seed_user(db: Connection, user_id: Int) {
  use #(legs, chest, calves) <- result.try(
    tag.insert_many(db, user_id, tags)
    |> result.try(extract_tags),
  )

  use #(bench, deadlift, squat) <- result.try({
    exercise.insert_many(db, user_id, exercise_names)
    |> result.try(extract_exercises)
  })

  use Nil <- result.try({
    let #(exercise_ids, tag_ids) =
      [
        #(bench.id, chest.id),
        #(squat.id, legs.id),
        #(deadlift.id, calves.id),
        #(deadlift.id, legs.id),
      ]
      |> list.unzip

    exercise_tag.insert_many(db, exercise_ids, tag_ids)
    |> result.replace(Nil)
  })

  use Nil <- result.try({
    let now = timestamp.system_time()
    let day = duration.hours(24)
    let yesterday = timestamp.subtract(now, day)
    let two_days_ago = timestamp.subtract(now, duration.add(day, day))

    let entries = [
      #(bench.id, 8, 60_000, now),
      #(bench.id, 8, 60_000, yesterday),
      #(bench.id, 8, 60_000, two_days_ago),

      #(deadlift.id, 5, 100_000, now),
      #(deadlift.id, 5, 100_000, yesterday),
      #(deadlift.id, 5, 100_000, two_days_ago),

      #(squat.id, 5, 80_000, now),
      #(squat.id, 5, 80_000, yesterday),
      #(squat.id, 5, 80_000, two_days_ago),
    ]

    let exercise_ids = list.map(entries, fn(e) { e.0 })
    let repetitions = list.map(entries, fn(e) { e.1 })
    let weights_in_g = list.map(entries, fn(e) { e.2 })
    let done_ats = list.map(entries, fn(e) { e.3 })

    set.insert_many(db, exercise_ids, repetitions, weights_in_g, done_ats)
    |> result.replace(Nil)
  })

  Ok(Nil)
}

const tags = [
  "legs",
  "chest",
  "biceps",
  "triceps",
  "back",
  "shoulders",
  "calves",
  "abs",
  "traps",
]

const exercise_names = [
  "bench press",
  "deadlift",
  "squat",
]

fn extract_tags(rows: List(Tag)) {
  case rows {
    [
      tag.Tag(id: _, name: "legs") as legs,
      tag.Tag(id: _, name: "chest") as chest,
      tag.Tag(id: _, name: "biceps"),
      tag.Tag(id: _, name: "triceps"),
      tag.Tag(id: _, name: "back"),
      tag.Tag(id: _, name: "shoulders"),
      tag.Tag(id: _, name: "calves") as calves,
      tag.Tag(id: _, name: "abs"),
      tag.Tag(id: _, name: "traps"),
    ] -> Ok(#(legs, chest, calves))
    _ ->
      Error(pog.PostgresqlError(
        "P0002",
        "no_data_found",
        "unexpected number or order of tag rows returned",
      ))
  }
}

fn extract_exercises(rows: List(Exercise)) {
  case rows {
    [
      exercise.Exercise(id: _, name: "bench press") as bench,
      exercise.Exercise(id: _, name: "deadlift") as deadlift,
      exercise.Exercise(id: _, name: "squat") as squat,
    ] -> Ok(#(bench, deadlift, squat))
    _ ->
      Error(pog.PostgresqlError(
        "P0002",
        "no_data_found",
        "unexpected number or order of exercise rows returned",
      ))
  }
}
