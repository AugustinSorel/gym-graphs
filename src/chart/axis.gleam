import gleam/float
import gleam/int
import gleam/list
import gleam/string

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

pub type Orientation {
  /// Ticks drawn below the axis line — for x axes.
  Bottom
  /// Ticks drawn to the left of the axis line — for y axes.
  Left
}

/// Geometry for a single tick.  All coordinates are in SVG pixel space,
/// relative to the `<g transform="translate(...)">` the caller places the
/// axis inside.
///
/// For a `Bottom` axis the caller should draw:
///   - a vertical line from `(position, 0)` to `(position, tick_length)`
///   - a text label centred at `(position, tick_length + label_offset)`
///   - if `grid_length > 0`, a vertical line from `(position, 0)` to
///     `(position, -grid_length)` (i.e. into the plot area)
///
/// For a `Left` axis the caller should draw:
///   - a horizontal line from `(-tick_length, position)` to `(0, position)`
///   - a text label right-aligned at `(-(tick_length + label_offset), position)`
///   - if `grid_length > 0`, a horizontal line from `(0, position)` to
///     `(grid_length, position)` (i.e. into the plot area)
pub type Tick {
  Tick(
    /// Pixel position along the axis (x for Bottom, y for Left).
    position: Float,
    /// Formatted label string.
    label: String,
    /// Length of the tick mark in pixels.
    tick_length: Float,
    /// Gap between the end of the tick mark and the label baseline.
    label_offset: Float,
    /// Length of the grid line drawn into the plot area.  0.0 means no grid line.
    grid_length: Float,
  )
}

pub opaque type Config {
  Config(
    orientation: Orientation,
    scale: fn(Float) -> Float,
    domain: #(Float, Float),
    tick_count: Int,
    format: fn(Float) -> String,
    tick_length: Float,
    label_offset: Float,
    grid_length: Float,
  )
}

// ---------------------------------------------------------------------------
// Constructor
// ---------------------------------------------------------------------------

/// Create a new axis config.
///
/// - `orientation` — `Bottom` for an x axis, `Left` for a y axis.
/// - `scale` — the scale function produced by `scale.linear(...)`.
/// - `domain` — the same `#(min, max)` you passed to `scale.linear`.
pub fn new(
  orientation orientation: Orientation,
  scale scale: fn(Float) -> Float,
  domain domain: #(Float, Float),
) -> Config {
  Config(
    orientation: orientation,
    scale: scale,
    domain: domain,
    tick_count: 5,
    format: default_format,
    tick_length: 4.0,
    label_offset: 4.0,
    grid_length: 0.0,
  )
}

// ---------------------------------------------------------------------------
// Builder setters
// ---------------------------------------------------------------------------

/// Number of evenly-spaced ticks to generate. Defaults to 5.
pub fn ticks(config: Config, count: Int) -> Config {
  Config(..config, tick_count: count)
}

/// Custom formatter for tick labels.  Receives the raw domain value and
/// returns the string to render.  Defaults to a compact numeric format.
pub fn format(config: Config, f: fn(Float) -> String) -> Config {
  Config(..config, format: f)
}

/// Draw a grid line of this pixel length at every tick into the plot area.
/// Defaults to 0.0 (no grid lines).
pub fn grid(config: Config, length: Float) -> Config {
  Config(..config, grid_length: length)
}

/// Length of the small tick mark in pixels. Defaults to 4.0.
pub fn tick_length(config: Config, length: Float) -> Config {
  Config(..config, tick_length: length)
}

/// Gap between the end of the tick mark and the label. Defaults to 4.0.
pub fn label_offset(config: Config, offset: Float) -> Config {
  Config(..config, label_offset: offset)
}

// ---------------------------------------------------------------------------
// Terminator
// ---------------------------------------------------------------------------

/// Compute the axis geometry as a list of `Tick` values.
/// Pass the result to your rendering layer to turn into SVG (or any other output).
pub fn to_ticks(config: Config) -> List(Tick) {
  compute_ticks(config.domain, config.tick_count)
  |> list.map(fn(v) {
    Tick(
      position: config.scale(v),
      label: config.format(v),
      tick_length: config.tick_length,
      label_offset: config.label_offset,
      grid_length: config.grid_length,
    )
  })
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/// Produces `count` evenly-spaced values across `domain`, inclusive of both
/// endpoints.  With count = 1 the single value is the midpoint.
fn compute_ticks(domain: #(Float, Float), count: Int) -> List(Float) {
  let #(d_min, d_max) = domain
  case count <= 1 {
    True -> [{ d_min +. d_max } /. 2.0]
    False -> {
      let step = { d_max -. d_min } /. int.to_float(count - 1)
      int_range(0, count - 1)
      |> list.map(fn(i) { d_min +. int.to_float(i) *. step })
    }
  }
}

fn int_range(from: Int, to: Int) -> List(Int) {
  int_range_loop(from, to, [])
}

fn int_range_loop(current: Int, to: Int, acc: List(Int)) -> List(Int) {
  case current > to {
    True -> list.reverse(acc)
    False -> int_range_loop(current + 1, to, [current, ..acc])
  }
}

/// Compact numeric formatter: integers render without a decimal point,
/// floats render with up to 2 significant decimal digits.
fn default_format(v: Float) -> String {
  let rounded = float.round(v *. 100.0)
  let as_int = rounded / 100
  let remainder = rounded % 100
  case remainder {
    0 -> int.to_string(as_int)
    _ -> {
      let decimal =
        string.pad_start(int.to_string(int.absolute_value(remainder)), 2, "0")
      int.to_string(as_int) <> "." <> decimal
    }
  }
}
