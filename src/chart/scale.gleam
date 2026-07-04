pub fn linear(
  domain domain: #(Float, Float),
  range range: #(Float, Float),
) -> fn(Float) -> Float {
  let #(d_min, d_max) = domain
  let #(r_min, r_max) = range

  fn(value: Float) -> Float {
    let percentage = { value -. d_min } /. { d_max -. d_min }
    r_min +. { percentage *. { r_max -. r_min } }
  }
}
