import gleam/float
import gleam/list
import gleam/string

pub type Curve {
  Linear
  MonotoneX
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
    MonotoneX -> monotone_x_path(points)
  }
}

fn fmt(v: Float) -> String {
  float.to_string(v)
}

fn pt(x: Float, y: Float) -> String {
  fmt(x) <> "," <> fmt(y)
}

fn list_get(l: List(a), i: Int) -> Result(a, Nil) {
  l |> list.drop(i) |> list.first
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

fn monotone_x_path(points: List(#(Float, Float))) -> String {
  case points {
    [] -> ""
    [_] -> linear_path(points)
    [a, b] -> linear_path([a, b])
    _ -> {
      let n = list.length(points)

      // Step 1: secant slopes
      let deltas =
        list.window_by_2(points)
        |> list.map(fn(pair) {
          let #(p, q) = pair
          let dx = q.0 -. p.0
          case dx {
            0.0 -> 0.0
            _ -> { q.1 -. p.1 } /. dx
          }
        })

      // Step 2: initial tangents
      // m_0 = delta_0
      // m_i = (delta_{i-1} + delta_i) / 2   for 0 < i < n-1
      // m_{n-1} = delta_{n-2}
      let init_tangents =
        list.index_map(points, fn(_, i) {
          case i {
            0 ->
              case list.first(deltas) {
                Ok(d) -> d
                Error(_) -> 0.0
              }
            _ if i == n - 1 ->
              case list.last(deltas) {
                Ok(d) -> d
                Error(_) -> 0.0
              }
            _ -> {
              let d0 = list_get(deltas, i - 1)
              let d1 = list_get(deltas, i)
              case d0, d1 {
                Ok(a), Ok(b) -> { a +. b } /. 2.0
                Ok(a), _ -> a
                _, Ok(b) -> b
                _, _ -> 0.0
              }
            }
          }
        })

      // Step 3: Fritsch-Carlson monotonicity constraint
      // If delta_i = 0, set m_i = m_{i+1} = 0.
      // Otherwise clamp: if alpha^2 + beta^2 > 9, scale tangent down.
      let tangents =
        list.index_map(init_tangents, fn(m, i) {
          case list_get(deltas, i) {
            Error(_) -> m
            Ok(0.0) -> 0.0
            Ok(delta) -> {
              let alpha_k = m /. delta
              let beta_k = case list_get(init_tangents, i + 1) {
                Ok(m_next) -> m_next /. delta
                Error(_) -> alpha_k
              }
              let sq = alpha_k *. alpha_k +. beta_k *. beta_k
              case sq >. 9.0 {
                True -> {
                  let tau = case float.square_root(sq) {
                    Ok(root) -> 3.0 /. root
                    Error(_) -> 1.0
                  }
                  m *. tau
                }
                False -> m
              }
            }
          }
        })

      // Step 4: emit cubic Béziers
      let indexed = list.index_map(points, fn(p, i) { #(i, p) })

      let segments =
        list.window_by_2(indexed)
        |> list.map(fn(pair) {
          let #(#(i, p1), #(_, p2)) = pair
          let m1 = case list_get(tangents, i) {
            Ok(t) -> t
            Error(_) -> 0.0
          }
          let m2 = case list_get(tangents, i + 1) {
            Ok(t) -> t
            Error(_) -> 0.0
          }
          let dx = p2.0 -. p1.0
          let cp1x = p1.0 +. dx /. 3.0
          let cp1y = p1.1 +. m1 *. dx /. 3.0
          let cp2x = p2.0 -. dx /. 3.0
          let cp2y = p2.1 -. m2 *. dx /. 3.0
          "C"
          <> pt(cp1x, cp1y)
          <> " "
          <> pt(cp2x, cp2y)
          <> " "
          <> pt(p2.0, p2.1)
        })

      case points {
        [first, ..] -> {
          let start = "M" <> pt(first.0, first.1)
          [start, ..segments] |> string.join(with: " ")
        }
        [] -> ""
      }
    }
  }
}
