import gleam/float
import gleam/list
import gleam/string

pub type Curve {
  Linear
}

pub opaque type Config(a) {
  Config(
    data: List(a),
    x_accessor: fn(a) -> Float,
    y_accessor: fn(a) -> Float,
    curve: Curve,
  )
}

pub fn new(data: List(a)) -> Config(a) {
  Config(
    data: data,
    x_accessor: fn(_) { 0.0 },
    y_accessor: fn(_) { 0.0 },
    curve: Linear,
  )
}

pub fn x(config: Config(a), accessor: fn(a) -> Float) -> Config(a) {
  Config(..config, x_accessor: accessor)
}

pub fn y(config: Config(a), accessor: fn(a) -> Float) -> Config(a) {
  Config(..config, y_accessor: accessor)
}

pub fn curve(config: Config(a), c: Curve) -> Config(a) {
  Config(..config, curve: c)
}

pub fn to_path(config: Config(a)) -> String {
  let points =
    list.map(config.data, fn(item) {
      #(config.x_accessor(item), config.y_accessor(item))
    })

  case config.curve {
    Linear -> linear_path(points)
  }
}

fn fmt(v: Float) -> String {
  float.to_string(v)
}

fn pt(x: Float, y: Float) -> String {
  fmt(x) <> "," <> fmt(y)
}

fn linear_path(points: List(#(Float, Float))) -> String {
  case points {
    [] -> ""
    [#(x, y), ..rest] -> {
      let start = "M" <> pt(x, y)
      let lines = list.map(rest, fn(p) { "L" <> pt(p.0, p.1) })

      [start, ..lines] |> string.join(with: " ")
    }
  }
}
