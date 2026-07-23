package domain

import "strings"

type User struct {
	Email string
}

func InferNameFromEmail(email string) string {
	local, _, _ := strings.Cut(email, "@")
	name := strings.ReplaceAll(local, ".", " ")
	name = strings.ReplaceAll(name, "_", " ")
	name = strings.ReplaceAll(name, "-", " ")
	return name
}
