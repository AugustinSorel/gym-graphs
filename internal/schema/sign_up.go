package schema

import (
	z "github.com/Oudwins/zog"
)

type SignUpSchema struct {
	Email string
}

var SignUp = z.Struct(z.Shape{
	"email": z.String().Required(z.Message("email is required.")).
		Email(z.Message("please enter a valid email address.")).
		Min(3, z.Message("email must be at least 3 characters.")).
		Max(255, z.Message("email must be at most 255 characters.")),
})

type VerifyEmailSchema struct {
	Code string
}

var VerifyEmail = z.Struct(z.Shape{
	"code": z.String().Required(z.Message("verification code is required.")).
		Min(8, z.Message("verification code must be 8 digits.")).
		Max(8, z.Message("verification code must be 8 digits.")),
})
