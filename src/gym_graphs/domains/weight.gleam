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

pub fn to_display_value(weight: Weight, unit: WeightUnit) -> Float {
  grams_to_display_value(int.to_float(weight.grams), unit)
}

pub fn grams_to_display_value(grams: Float, unit: WeightUnit) -> Float {
  case unit {
    Kg -> grams /. 1000.0
    Lbs -> grams *. 0.00220462
  }
}

pub fn display(weight: Weight, unit: WeightUnit) -> DisplayWeight {
  let value =
    to_display_value(weight, unit)
    |> round_to_two_decimals()
    |> float.to_string()

  DisplayWeight(value:, unit:)
}

fn round_to_two_decimals(value: Float) -> Float {
  let shifted = value *. 100.0

  let rounded = float.round(shifted)

  int.to_float(rounded) /. 100.0
}
