package service

import (
	"context"
	"crypto/rand"
	"encoding/binary"

	"github.com/augustinsorel/gym-graphs/internal/db/sqlc"
	"github.com/augustinsorel/gym-graphs/internal/token"
)

type SignUpSession struct {
	ID               int32
	Secret           []byte
	VerificationCode string
}

type SignUpService struct {
	queries *sqlc.Queries
}

func NewSignUpService(queries *sqlc.Queries) *SignUpService {
	return &SignUpService{queries: queries}
}

func (s *SignUpService) Create(ctx context.Context, email string) (SignUpSession, error) {
	secret := token.GenerateSecret()
	secretHash := token.HashSecret(secret)
	verificationCode := generateEmailAddressVerificationCode()

	params := sqlc.CreateSignUpSessionParams{
		SecretHash:                   secretHash,
		EmailAddress:                 email,
		EmailAddressVerificationCode: verificationCode,
	}

	row, err := s.queries.CreateSignUpSession(ctx, params)

	if err != nil {
		return SignUpSession{}, err
	}

	signUpSession := SignUpSession{
		ID:               row.ID,
		Secret:           secret,
		VerificationCode: verificationCode,
	}

	return signUpSession, nil
}

func (s *SignUpService) Cancel(ctx context.Context, id int32) error {
	_, err := s.queries.DeleteSignUpSession(ctx, id)
	return err
}

func generateEmailAddressVerificationCode() string {
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
