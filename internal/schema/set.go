package schema

import (
	"strings"
	"time"

	z "github.com/Oudwins/zog"
	p "github.com/Oudwins/zog/pkgs/internals"
)

type CreateSet struct {
	Weight      float32
	Repetitions int32
}

type CreateSets struct {
	Weight      []float32
	Repetitions []int32
}

var weightSchema = z.Float32().
	GT(0, z.Message("weight must be greater than 0.")).
	LTE(1000, z.Message("weight must be at most 1000 kg.")).
	TestFunc(maxThreeDecimalPlaces, z.Message("weight must have at most 3 decimal places."))

var repetitionsSchema = z.Int32().
	GT(0, z.Message("repetitions must be greater than 0.")).
	LT(1000, z.Message("repetitions must be less than 1000."))

var SetSchema = z.Struct(z.Shape{
	"weight":      weightSchema,
	"repetitions": repetitionsSchema,
})

var CreateSetInput = SetSchema.Pick("weight", "repetitions")

type UpdateSet struct {
	Weight      float32
	Repetitions int32
	Done_at     time.Time
}

const datetimeLocalLayout = "2006-01-02T15:04"

var UpdateSetInput = z.Struct(z.Shape{
	"weight":      weightSchema,
	"repetitions": repetitionsSchema,
	"done_at":     z.Time(z.Time.Format(datetimeLocalLayout)).Required(z.Message("done at is required.")),
})

var CreateSetsInput = z.Struct(z.Shape{
	"weight":      z.Slice(weightSchema).Min(1, z.Message("at least one set is required.")).Max(20, z.Message("at most 20 weight items is allowed")),
	"repetitions": z.Slice(repetitionsSchema).Min(1, z.Message("at least one set is required.")).Max(20, z.Message("at most 20 repetitions items is allowed")),
})

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
