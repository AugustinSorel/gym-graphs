import gleam/bool
import gleam/float
import gleam/int
import gleam/result
import gym_graphs/domains/user.{
  type OneRepMaxAlgorithm, Adams, Baechle, Berger, Brown, Brzycki, Epley,
  Kemmler, Landers, Lombardi, Mayhew, Naclerio, Oconner, Wathen,
}

pub fn calculate(
  weight_in_grams: Int,
  repetitions: Int,
  algorithm: OneRepMaxAlgorithm,
) -> Float {
  use <- bool.guard(when: weight_in_grams <= 0 || repetitions <= 0, return: 0.0)

  let weight = int.to_float(weight_in_grams)
  let reps = int.to_float(repetitions)

  case algorithm {
    Adams -> safe_divide(weight, by: 1.0 -. 0.02 *. reps)
    Baechle -> weight *. { 1.0 +. 0.033 *. reps }
    Berger -> {
      let denominator =
        float.power(1.0261, of: 0.0262 *. reps) |> result.unwrap(0.0)
      weight /. denominator
    }
    Brown -> weight *. { 0.9849 +. 0.0328 *. reps }
    Brzycki -> safe_divide(weight *. 36.0, by: 37.0 -. reps)
    Epley -> weight *. { 1.0 +. reps /. 30.0 }
    Kemmler ->
      weight
      *. {
        0.988
        +. 0.0104
        *. reps
        +. 0.0019
        *. reps
        *. reps
        -. 0.0000584
        *. reps
        *. reps
        *. reps
      }
    Landers -> safe_divide(weight, by: 1.013 -. 0.0267123 *. reps)
    Lombardi -> {
      let multiplier = float.power(reps, of: 0.1) |> result.unwrap(0.0)
      weight *. multiplier
    }
    Mayhew ->
      100.0 *. weight /. { 52.2 +. 41.9 *. float.exponential(-0.055 *. reps) }
    Naclerio -> weight /. { 0.951 *. float.exponential(-0.021 *. reps) }
    Oconner -> weight *. { 1.0 +. 0.025 *. reps }
    Wathen ->
      100.0 *. weight /. { 48.8 +. 53.8 *. float.exponential(-0.075 *. reps) }
  }
}

fn safe_divide(value: Float, by denominator: Float) -> Float {
  case denominator <=. 0.0 {
    True -> 0.0
    False -> value /. denominator
  }
}
