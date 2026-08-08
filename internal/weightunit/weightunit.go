package weightunit

import "github.com/augustinsorel/gym-graphs/internal/database/db"

func Convert(weightInG float64, unit db.WeightUnit) float64 {
	if unit == db.WeightUnitLbs {
		return weightInG / 453.592
	}
	return weightInG / 1000
}

func Label(unit db.WeightUnit) string {
	if unit == db.WeightUnitLbs {
		return "lbs"
	}
	return "kg"
}
