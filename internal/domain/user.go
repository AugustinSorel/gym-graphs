package domain

import (
	z "github.com/Oudwins/zog"
)

type User struct {
	Email string
}

var UserSchema = z.Struct(z.Shape{
	"email": z.String().Required(z.Message("email is required.")).
		Email(z.Message("please enter a valid email address.")).
		Min(3, z.Message("email must be at least 3 characters.")).
		Max(255, z.Message("email must be at most 255 characters.")),
})
