package onerepmax

import "math"

// Point holds a single (reps, estimated 1RM) pair.
type Point struct {
	Reps float64 `json:"r"`
	ORM  float64 `json:"orm"`
}

// Calculate returns 10 data points (reps 1–10) for the given algorithm and
// reference weight. It returns nil if algorithm is unknown.
func Calculate(algorithm string, referenceWeight float64) []Point {
	formula, ok := formulas[algorithm]
	if !ok {
		return nil
	}

	points := make([]Point, 10)
	for i := range points {
		r := float64(i + 1)
		points[i] = Point{Reps: r, ORM: formula(referenceWeight, r)}
	}
	return points
}

type formulaFn func(w, r float64) float64

var formulas = map[string]formulaFn{
	"adams":    func(w, r float64) float64 { return w / (1 - 0.02*r) },
	"baechle":  func(w, r float64) float64 { return w * (1 + 0.033*r) },
	"berger":   func(w, r float64) float64 { return w / (1.0261 * math.Exp(-0.0262*r)) },
	"brown":    func(w, r float64) float64 { return w * (0.9849 + 0.0328*r) },
	"brzycki":  func(w, r float64) float64 { return w * (36 / (37 - r)) },
	"epley":    func(w, r float64) float64 { return w * (1 + r/30) },
	"kemmler":  func(w, r float64) float64 { return w * (0.988 + 0.0104*r + 0.0019*r*r - 0.0000584*r*r*r) },
	"landers":  func(w, r float64) float64 { return w / (1.013 - 0.0267123*r) },
	"lombardi": func(w, r float64) float64 { return w * math.Pow(r, 0.1) },
	"mayhew":   func(w, r float64) float64 { return (100 * w) / (52.2 + 41.9*math.Exp(-0.055*r)) },
	"naclerio": func(w, r float64) float64 { return w * (0.951*math.Exp(-0.021*r) + 0.068) },
	"oconner":  func(w, r float64) float64 { return w * (1 + 0.025*r) },
	"wathen":   func(w, r float64) float64 { return (100 * w) / (48.8 + 53.8*math.Exp(-0.075*r)) },
}
