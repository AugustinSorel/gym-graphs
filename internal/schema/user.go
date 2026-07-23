package schema

import (
	z "github.com/Oudwins/zog"
)

var UserSchema = z.Struct(z.Shape{
	"password": z.String().Required(z.Message("password is required.")).
		Min(8, z.Message("password must be at least 8 characters.")).
		Max(255, z.Message("password must be at most 255 characters.")),
})
