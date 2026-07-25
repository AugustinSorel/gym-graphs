package schema

type ResetPassword struct {
	Email string
}

var ResetPasswordInput = UserSchema.Pick("email")
