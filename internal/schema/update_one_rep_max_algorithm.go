package schema

type UpdateOneRepMaxAlgorithm struct {
	OneRepMaxAlgorithm string `form:"one_rep_max_algorithm"`
}

var UpdateOneRepMaxAlgorithmInput = UserSchema.Pick("oneRepMaxAlgorithm")
