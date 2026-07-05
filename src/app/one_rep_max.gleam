import gleam/float
import gleam/int
import gleam/result

pub type Algorithm {
  Adams
  Baechle
  Berger
  Brown
  Brzycki
  Epley
  Kemmler
  Landers
  Lombardi
  Mayhew
  Naclerio
  OConner
  Wathen
}

pub fn calculate(algo algo: Algorithm, weight w: Int, repetitions r: Int) {
  let w = int.to_float(w)
  let r = int.to_float(r)

  case algo {
    Adams -> w /. { 1.0 -. 0.02 *. r }
    Baechle -> w *. { 1.0 +. 0.033 *. r }
    Berger ->
      w /. { float.power(1.0261, { 0.0262 *. r }) |> result.unwrap(1.0) }
    Brown -> w *. { 0.9849 +. 0.0328 *. r }
    Brzycki -> { w *. 36.0 } /. { 37.0 -. r }
    Epley -> w *. { 1.0 +. r /. 30.0 }
    Kemmler -> {
      w
      *. {
        0.988
        +. 0.0104
        *. r
        +. 0.0019
        *. { float.power(r, 2.0) |> result.unwrap(1.0) }
        -. 0.0000584
        *. { float.power(r, 3.0) |> result.unwrap(1.0) }
      }
    }
    Landers -> w /. { 1.013 -. 0.0267123 *. r }
    Lombardi -> w *. { float.power(r, 0.1) |> result.unwrap(1.0) }
    Mayhew -> w /. { 0.522 +. 0.419 *. float.exponential(-0.055 *. r) }
    Naclerio -> w /. { 0.951 *. float.exponential(-0.021 *. r) }
    OConner -> w *. { 1.0 +. 0.025 *. r }
    Wathen -> w /. { 0.488 +. 0.538 *. float.exponential(-0.075 *. r) }
  }
}
