import formal/form
import gleam/string
import gym_graphs/domains/weight.{type Weight}

pub type ExerciseId {
  ExerciseId(value: Int)
}

pub type Exercise {
  Exercise(id: ExerciseId, name: Name)
}

pub type BestSet {
  BestSet(weight: Weight, repetitions: Int)
}

pub type ExerciseFacts {
  ExerciseFacts(
    total_sets: Int,
    total_sessions: Int,
    average_repetitions: Float,
    best_one_rep_max: Weight,
    best_set: BestSet,
  )
}

pub type Name {
  Name(value: String)
}

pub fn parse_name() {
  form.parse_string
  |> form.map(string.trim)
  |> form.check_not_empty
  |> form.check_string_length_less_than(100)
  |> form.map(Name)
}
