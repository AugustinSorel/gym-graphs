package weightunit

import (
	"fmt"
	"strings"

	"github.com/augustinsorel/gym-graphs/internal/database/db"
)

func Convert(weightInG float64, unit db.WeightUnit) float64 {
	if unit == db.WeightUnitLbs {
		return weightInG / 453.592
	}
	return weightInG / 1000
}

func Abbr(unit db.WeightUnit) string {
	if unit == db.WeightUnitLbs {
		return "lbs"
	}
	return "kg"
}

func Name(unit db.WeightUnit) string {
	if unit == db.WeightUnitLbs {
		return "pounds"
	}
	return "kilograms"
}

func Format(weightInG float64, unit db.WeightUnit) string {
	s := fmt.Sprintf("%.1f", Convert(weightInG, unit))
	// insert a space every 3 digits in the integer part
	dot := strings.Index(s, ".")
	intPart := s[:dot]
	fracPart := s[dot:]
	var b strings.Builder
	offset := len(intPart) % 3
	for i, ch := range intPart {
		if i > 0 && (i-offset)%3 == 0 {
			b.WriteByte(' ')
		}
		b.WriteRune(ch)
	}
	return b.String() + fracPart
}

func ToGrams(value float64, unit db.WeightUnit) float64 {
	if unit == db.WeightUnitLbs {
		return value * 453.592
	}
	return value * 1000
}
