package schema

import (
	z "github.com/Oudwins/zog"
)

var UserSchema = z.Struct(z.Shape{
	"email": z.String().Required(z.Message("email is required.")).
		Email(z.Message("please enter a valid email address.")).
		Min(3, z.Message("email must be at least 3 characters.")).
		Max(255, z.Message("email must be at most 255 characters.")),
	"password": z.String().Required(z.Message("password is required.")).
		Min(8, z.Message("password must be at least 8 characters.")).
		Max(255, z.Message("password must be at most 255 characters.")),
	"name": z.String().Required(z.Message("name is required.")).
		Min(1, z.Message("name must be at least 1 character.")).
		Max(255, z.Message("name must be at most 255 characters.")),
})
