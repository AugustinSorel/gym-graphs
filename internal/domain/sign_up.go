package domain

type SignUpInput struct {
	Email string
}

var SignUpSchema = UserSchema.Pick("email")
