import gleam/float
import gleam/list
import gleam/string

pub opaque type Config(a) {
  Config(data: List(a), x_accessor: fn(a) -> Float, y_accessor: fn(a) -> Float)
}

pub fn new(data: List(a)) -> Config(a) {
  Config(data: data, x_accessor: fn(_) { 0.0 }, y_accessor: fn(_) { 0.0 })
}

pub fn x(config: Config(a), accessor: fn(a) -> Float) -> Config(a) {
  Config(..config, x_accessor: accessor)
}

pub fn y(config: Config(a), accessor: fn(a) -> Float) -> Config(a) {
  Config(..config, y_accessor: accessor)
}

pub fn to_path(config: Config(a)) -> String {
  let points = {
    list.map(config.data, fn(item) {
      let x = config.x_accessor(item)
      let y = config.y_accessor(item)

      #(x, y)
    })
  }

  case points {
    [] -> ""
    [#(x, y), ..rest] -> {
      let start = "M" <> float.to_string(x) <> "," <> float.to_string(y)

      let lines = {
        list.map(rest, fn(p) {
          let #(x, y) = p
          "L" <> float.to_string(x) <> "," <> float.to_string(y)
        })
      }

      [start, ..lines] |> string.join(with: " ")
    }
  }
}
