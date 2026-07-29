package schema

type VerifyCurrentPassword struct {
	Password string
}

var VerifyCurrentPasswordInput = UserSchema.Pick("password")

type SetNewPassword struct {
	Password string
}

var SetNewPasswordInput = UserSchema.Pick("password")
