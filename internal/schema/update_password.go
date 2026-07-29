package schema

type VerifyCurrentPassword struct {
	Password string
}

var VerifyCurrentPasswordInput = UserSchema.Pick("password")
