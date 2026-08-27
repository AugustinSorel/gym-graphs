package password

import (
	"bytes"
	"crypto/rand"

	"golang.org/x/crypto/argon2"
)

func GenerateSalt() []byte {
	saltBytes := make([]byte, 32)
	rand.Read(saltBytes)
	return saltBytes
}

func Hash(password string, salt []byte) []byte {
	return argon2.IDKey([]byte(password), salt, 1, 16*1024, 3, 32)
}

func Verify(password string, hash []byte, salt []byte) bool {
	candidate := Hash(password, salt)
	return bytes.Equal(candidate, hash)
}
