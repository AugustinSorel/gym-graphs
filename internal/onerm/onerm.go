package onerm

import (
	"math"

	"github.com/augustinsorel/gym-graphs/internal/database/db"
)

func Compute(weightInG float64, reps float64, algorithm db.OneRepMaxAlgorithm) float64 {
	if reps <= 0 || weightInG <= 0 {
		return 0
	}
	w := weightInG
	r := reps
	switch algorithm {
	case db.OneRepMaxAlgorithmAdams:
		return w / (1 - 0.02*r)
	case db.OneRepMaxAlgorithmBaechle:
		return w * (1 + 0.033*r)
	case db.OneRepMaxAlgorithmBerger:
		return w / math.Pow(1.0261, 0.0262*r)
	case db.OneRepMaxAlgorithmBrown:
		return w * (0.9849 + 0.0328*r)
	case db.OneRepMaxAlgorithmBrzycki:
		return w * (36 / (37 - r))
	case db.OneRepMaxAlgorithmEpley:
		return w * (1 + r/30)
	case db.OneRepMaxAlgorithmKemmler:
		return w * (0.988 + 0.0104*r + 0.0019*r*r - 0.0000584*r*r*r)
	case db.OneRepMaxAlgorithmLanders:
		return w / (1.013 - 0.0267123*r)
	case db.OneRepMaxAlgorithmLombardi:
		return w * math.Pow(r, 0.1)
	case db.OneRepMaxAlgorithmMayhew:
		return (100 * w) / (52.2 + 41.9*math.Exp(-0.055*r))
	case db.OneRepMaxAlgorithmNaclerio:
		return w / (0.951 * math.Exp(-0.021*r))
	case db.OneRepMaxAlgorithmOconner:
		return w * (1 + 0.025*r)
	case db.OneRepMaxAlgorithmWathen:
		return (100 * w) / (48.8 + 53.8*math.Exp(-0.075*r))
	default:
		return w * (1 + r/30)
	}
}
