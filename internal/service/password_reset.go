package service

import (
	"bytes"
	"context"
	"errors"

	"github.com/augustinsorel/gym-graphs/internal/database/db"
	"github.com/augustinsorel/gym-graphs/internal/otp"
	"github.com/augustinsorel/gym-graphs/internal/password"
	"github.com/augustinsorel/gym-graphs/internal/session"
)

var ErrPasswordResetSessionNotFound = errors.New("password reset session: invalid or not found")

type PasswordResetSession struct {
	ID     int32
	Secret []byte
	// EmailCode is the plaintext OTP — only available at creation time, used for sending the email.
	EmailCode string
}

type PasswordResetService struct {
	queries *db.Queries
}

func NewPasswordResetService(queries *db.Queries) *PasswordResetService {
	return &PasswordResetService{queries: queries}
}

func (s *PasswordResetService) Create(ctx context.Context, emailAddress string) (PasswordResetSession, error) {
	rawSecret := session.GenerateSecret()
	secretHash := session.HashSecret(rawSecret)

	emailCode := otp.GenerateEmailAddressVerificationCode()
	emailCodeSalt := password.GenerateSalt()
	emailCodeHash := password.Hash(emailCode, emailCodeSalt)

	params := db.CreatePasswordResetSessionParams{
		EmailAddress:  emailAddress,
		SecretHash:    secretHash,
		EmailCodeHash: emailCodeHash,
		EmailCodeSalt: emailCodeSalt,
	}

	row, err := s.queries.CreatePasswordResetSession(ctx, params)
	if err != nil {
		return PasswordResetSession{}, err
	}

	return PasswordResetSession{
		ID:        row.ID,
		Secret:    rawSecret,
		EmailCode: emailCode,
	}, nil
}

func (s *PasswordResetService) GetByID(ctx context.Context, id int32) (db.PasswordResetSession, error) {
	return s.queries.GetPasswordResetSessionByID(ctx, id)
}

func (s *PasswordResetService) Cancel(ctx context.Context, id int32) error {
	_, err := s.queries.DeletePasswordResetSession(ctx, id)
	return err
}

func (s *PasswordResetService) ValidateToken(ctx context.Context, token string) (db.PasswordResetSession, error) {
	sessionID, rawSecret, err := session.ParseToken(token)
	if err != nil {
		return db.PasswordResetSession{}, ErrPasswordResetSessionNotFound
	}

	resetSession, err := s.queries.GetPasswordResetSessionByID(ctx, sessionID)
	if err != nil {
		return db.PasswordResetSession{}, ErrPasswordResetSessionNotFound
	}

	secretHash := session.HashSecret(rawSecret)
	if !bytes.Equal(secretHash, resetSession.SecretHash) {
		return db.PasswordResetSession{}, ErrPasswordResetSessionNotFound
	}

	return resetSession, nil
}
