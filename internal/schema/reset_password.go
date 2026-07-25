package schema

import z "github.com/Oudwins/zog"

var PasswordResetSchema = z.Struct(z.Shape{
	"code": z.String().Required(z.Message("password is required.")).
		Min(8, z.Message("password must be at least 8 characters.")).
		Max(255, z.Message("password must be at most 255 characters.")),
})

type ResetPassword struct {
	Email string
}

var ResetPasswordInput = UserSchema.Pick("email")

type VerifyPasswordResetCode struct {
	Code string
}

var VerifyPasswordResetCodeInput = PasswordResetSchema.Pick("code")
