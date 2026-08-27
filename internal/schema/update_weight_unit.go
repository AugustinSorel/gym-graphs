package schema

type UpdateWeightUnit struct {
	WeightUnit string `form:"weight_unit"`
}

var UpdateWeightUnitInput = UserSchema.Pick("weightUnit")
