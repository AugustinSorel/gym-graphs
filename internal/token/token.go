package token

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"
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
	sessionToken := string(sessionId) + "." + encodedSessionSecret
	return sessionToken
}

func ParseSessionToken(sessionToken string) (string, []byte, error) {
	sessionTokenParts := strings.Split(sessionToken, ".")
	if len(sessionTokenParts) != 2 {
		return "", nil, errors.New("invalid part count")
	}
	sessioId := sessionTokenParts[0]
	encodedSessionSecret := sessionTokenParts[1]
	sessionSecret, err := base64.StdEncoding.DecodeString(encodedSessionSecret)
	if err != nil {
		return "", nil, fmt.Errorf("failed to decode secret: %s", err.Error())
	}

	return sessioId, sessionSecret, nil
}
