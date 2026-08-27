package schema

import (
	z "github.com/Oudwins/zog"
)

var SignUpSession = z.Struct(z.Shape{
	"code": z.String().Required(z.Message("verification code is required.")).
		Min(8, z.Message("verification code must be 8 digits.")).
		Max(8, z.Message("verification code must be 8 digits.")),
})

type Start struct {
	Email string
}

var StartInput = UserSchema.Pick("email")

type VerifyEmail struct {
	Code string
}

var VerifyEmailInput = SignUpSession.Pick("code")

type SetPassword struct {
	Password string
}

var SetPasswordInput = UserSchema.Pick("password")
