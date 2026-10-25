import gleam/time/timestamp.{type Timestamp}
import gym_graphs/domains/weight.{type Weight}

pub type SetId {
  SetId(value: Int)
}

pub type PageCursor {
  PageCursor(done_at: Timestamp, id: SetId)
}

pub type PagePosition {
  FirstPage
  After(PageCursor)
}

pub type ExerciseSet {
  ExerciseSet(id: SetId, repetitions: Int, weight: Weight, done_at: Timestamp)
}
