package schema

type SignIn struct {
	Email    string
	Password string
}

var SignInInput = UserSchema.Pick("email", "password")
