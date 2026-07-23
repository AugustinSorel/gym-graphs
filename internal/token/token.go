package token

import (
	"bytes"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/binary"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"golang.org/x/crypto/argon2"
)

func GenerateSecret() []byte {
	secret := make([]byte, 32)
	rand.Read(secret)
	return secret
}

func HashSecret(secret []byte) []byte {
	secretHash := sha256.Sum256(secret)
	return secretHash[:]
}

func CreateSessionToken(sessionId int32, sessionSecret []byte) string {
	encodedSessionSecret := base64.StdEncoding.EncodeToString(sessionSecret)
	sessionToken := fmt.Sprintf("%d.%s", sessionId, encodedSessionSecret)
	return sessionToken
}

func VerifySecret(secret []byte, hash []byte) bool {
	return bytes.Equal(HashSecret(secret), hash)
}

func HashUserPassword(password string, salt []byte) []byte {
	passwordHash := argon2.IDKey([]byte(password), salt, 1, 16*1024, 3, 32)
	return passwordHash
}

func GenerateHashingSalt() []byte {
	saltBytes := make([]byte, 32)
	rand.Read(saltBytes)
	return saltBytes
}

func ParseSessionToken(sessionToken string) (int32, []byte, error) {
	sessionTokenParts := strings.Split(sessionToken, ".")
	if len(sessionTokenParts) != 2 {
		return -1, nil, errors.New("invalid part count")
	}
	sessionIdStr := sessionTokenParts[0]
	encodedSessionSecret := sessionTokenParts[1]
	sessionSecret, err := base64.StdEncoding.DecodeString(encodedSessionSecret)
	if err != nil {
		return -1, nil, fmt.Errorf("failed to decode secret: %s", err.Error())
	}

	sessionId, err := strconv.ParseInt(sessionIdStr, 10, 32)
	if err != nil {
		return -1, nil, fmt.Errorf("invalid session id: %s", err.Error())
	}

	return int32(sessionId), sessionSecret, nil
}

func GenerateEmailVerificationCode() string {
	for {
		randomBytes := make([]byte, 4)
		rand.Read(randomBytes)
		randomUint := binary.BigEndian.Uint32(randomBytes)
		randomUint >>= 5
		if randomUint < 100_000_000 {
			stringBytes := make([]byte, 8)
			stringBytes[0] = byte((randomUint/10_000_000)%10 + '0')
			stringBytes[1] = byte((randomUint/1_000_000)%10 + '0')
			stringBytes[2] = byte((randomUint/100_000)%10 + '0')
			stringBytes[3] = byte((randomUint/10_000)%10 + '0')
			stringBytes[4] = byte((randomUint/1_000)%10 + '0')
			stringBytes[5] = byte((randomUint/100)%10 + '0')
			stringBytes[6] = byte((randomUint/10)%10 + '0')
			stringBytes[7] = byte((randomUint)%10 + '0')
			return string(stringBytes)
		}
	}
}
