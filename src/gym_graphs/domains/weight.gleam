import gleam/float
import gleam/int
import gym_graphs/domains/user.{type WeightUnit, Kg, Lbs}

pub fn unit_abbreviation(unit: WeightUnit) -> String {
  case unit {
    Kg -> "kg"
    Lbs -> "lbs"
  }
}

pub fn unit_name(unit: WeightUnit) -> String {
  case unit {
    Kg -> "kilograms"
    Lbs -> "pounds"
  }
}

fn convert_weight(grams: Int, unit: WeightUnit) -> Float {
  case unit {
    Kg -> int.to_float(grams) /. 1000.0
    Lbs -> int.to_float(grams) *. 0.00220462
  }
}

pub fn format_grams(grams: Int, unit: WeightUnit) -> String {
  convert_weight(grams, unit)
  |> round_to_two_decimals()
  |> float.to_string()
}

fn round_to_two_decimals(value: Float) -> Float {
  let shifted = value *. 100.0

  let rounded = float.round(shifted)

  int.to_float(rounded) /. 100.0
}
