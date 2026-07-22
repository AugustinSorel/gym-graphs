package service

import (
	"context"

	"github.com/augustinsorel/gym-graphs/internal/db/sqlc"
)

type SignUpSession struct {
	ID               int32
	Secret           []byte
	VerificationCode string
}

type SignUpSessionService struct {
	queries *sqlc.Queries
}

func NewSignUpSessionService(queries *sqlc.Queries) *SignUpSessionService {
	return &SignUpSessionService{queries: queries}
}

func (s *SignUpSessionService) Create(ctx context.Context, email string) (SignUpSession, error) {
	secret := generateSessionSecret()
	secretHash := hashSessionSecret(secret)
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
