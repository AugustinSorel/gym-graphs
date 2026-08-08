package schema

import (
	"strings"

	z "github.com/Oudwins/zog"
	p "github.com/Oudwins/zog/pkgs/internals"
)

var CreateSetWeights = z.Slice(
	z.Float32().
		GTE(0, z.Message("weight must be 0 or more.")).
		LTE(1000, z.Message("weight must be at most 1000 kg.")).
		TestFunc(maxThreeDecimalPlaces, z.Message("weight must have at most 3 decimal places.")),
)

var CreateSetRepetitions = z.Slice(
	z.Int32().
		GT(0, z.Message("repetitions must be greater than 0.")).
		LT(1000, z.Message("repetitions must be less than 1000.")),
)

func maxThreeDecimalPlaces(_ *float32, ctx z.Ctx) bool {
	raw, ok := ctx.(*p.SchemaCtx).Data.(string)
	if !ok {
		return true
	}
	if dot := strings.IndexByte(raw, '.'); dot != -1 {
		return len(raw)-dot-1 <= 3
	}
	return true
}
