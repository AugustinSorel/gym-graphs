package schema

type UpdateName struct {
	Name string
}

var UpdateNameInput = UserSchema.Pick("name")
