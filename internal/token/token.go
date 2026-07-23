package token

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"strconv"
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
	sessionToken := fmt.Sprintf("%d.%s", sessionId, encodedSessionSecret)
	return sessionToken
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

	fmt.Println("HELLLOOOO")
	fmt.Printf("hello: %s", sessionIdStr)
	fmt.Println("HELLLOOOO")

	sessionId, err := strconv.ParseInt(sessionIdStr, 10, 32)
	if err != nil {
		return -1, nil, fmt.Errorf("invalid session id: %s", err.Error())
	}

	return int32(sessionId), sessionSecret, nil
}
