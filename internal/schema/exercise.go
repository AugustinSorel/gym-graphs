package schema

import (
	z "github.com/Oudwins/zog"
)

type CreateExercise struct {
	Name string
}

var Exercise = z.Struct(z.Shape{
	"name": z.String().Trim().Required(z.Message("name is required.")).
		Min(1, z.Message("name must be at least 1 character.")).
		Max(100, z.Message("name must be at most 100 characters.")),
})

var CreateExerciseInput = Exercise.Pick("name")

type RenameExercise struct {
	Name string
}

var RenameExerciseInput = Exercise.Pick("name")
