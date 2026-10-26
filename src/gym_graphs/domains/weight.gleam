import gleam/float
import gleam/int
import gym_graphs/domains/user.{type WeightUnit, Kg, Lbs}

pub opaque type Weight {
  Weight(grams: Int)
}

pub type DisplayWeight {
  DisplayWeight(value: String, unit: WeightUnit)
}

pub fn from_grams(grams: Int) -> Weight {
  Weight(grams)
}

pub fn from_display_value(value: Float, unit: WeightUnit) -> Weight {
  let grams = case unit {
    Kg -> value *. 1000.0
    Lbs -> value /. 0.00220462
  }

  Weight(float.round(grams))
}

pub fn in_grams(weight: Weight) -> Int {
  weight.grams
}

pub fn is_zero(weight: Weight) -> Bool {
  weight.grams == 0
}

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

fn convert_weight(weight: Weight, unit: WeightUnit) -> Float {
  case unit {
    Kg -> int.to_float(weight.grams) /. 1000.0
    Lbs -> int.to_float(weight.grams) *. 0.00220462
  }
}

pub fn display(weight: Weight, unit: WeightUnit) -> DisplayWeight {
  let value =
    convert_weight(weight, unit)
    |> round_to_two_decimals()
    |> float.to_string()

  DisplayWeight(value:, unit:)
}

fn round_to_two_decimals(value: Float) -> Float {
  let shifted = value *. 100.0

  let rounded = float.round(shifted)

  int.to_float(rounded) /. 100.0
}
