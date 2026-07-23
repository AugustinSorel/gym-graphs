package session

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"strconv"
	"strings"
)

func CreateToken(sessionID int32, secret []byte) string {
	encodedSecret := base64.StdEncoding.EncodeToString(secret)
	return fmt.Sprintf("%d.%s", sessionID, encodedSecret)
}

func ParseToken(token string) (int32, []byte, error) {
	parts := strings.SplitN(token, ".", 2)
	if len(parts) != 2 {
		return -1, nil, errors.New("session token: invalid format")
	}

	id, err := strconv.ParseInt(parts[0], 10, 32)
	if err != nil {
		return -1, nil, fmt.Errorf("session token: invalid id: %w", err)
	}

	secret, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		return -1, nil, fmt.Errorf("session token: invalid secret: %w", err)
	}

	return int32(id), secret, nil
}

func GenerateSecret() []byte {
	secret := make([]byte, 32)
	rand.Read(secret)
	return secret
}

func HashSecret(secret []byte) []byte {
	digest := sha256.Sum256(secret)
	return digest[:]
}
