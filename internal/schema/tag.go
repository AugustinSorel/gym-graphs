package schema

import (
	z "github.com/Oudwins/zog"
)

type CreateTag struct {
	Name string
}

type RenameTag struct {
	Name string
}

var tagSchema = z.Struct(z.Shape{
	"name": z.String().Required(z.Message("name is required.")).
		Min(1, z.Message("name must be at least 1 character.")).
		Max(255, z.Message("name must be at most 255 characters.")),
})

var CreateTagInput = tagSchema.Pick("name")
var RenameTagInput = tagSchema.Pick("name")
