package schema

import (
	z "github.com/Oudwins/zog"
)

var SignUpSession = z.Struct(z.Shape{
	"email": z.String().Required(z.Message("email is required.")).
		Email(z.Message("please enter a valid email address.")).
		Min(3, z.Message("email must be at least 3 characters.")).
		Max(255, z.Message("email must be at most 255 characters.")),
	"code": z.String().Required(z.Message("verification code is required.")).
		Min(8, z.Message("verification code must be 8 digits.")).
		Max(8, z.Message("verification code must be 8 digits.")),
})

type Start struct {
	Email string
}

var StartInput = SignUpSession.Pick("email")

type VerifyEmail struct {
	Code string
}

var VerifyEmailInput = SignUpSession.Pick("code")

type SetPassword struct {
	Password string
}

var SetPasswordInput = z.Struct(z.Shape{
	"password": z.String().Required(z.Message("password is required.")).
		Min(8, z.Message("password must be at least 8 characters.")).
		Max(255, z.Message("password must be at most 255 characters.")),
})
