package service

import (
	"bytes"
	"context"
	"errors"

	"github.com/augustinsorel/gym-graphs/internal/database/db"
	"github.com/augustinsorel/gym-graphs/internal/session"
)

var ErrInvalidAuthSession = errors.New("auth session: invalid or not found")

type AuthSession struct {
	ID     int32
	UserID int32
	Secret []byte
}

type AuthSessionService struct {
	queries *db.Queries
}

func NewAuthSessionService(queries *db.Queries) *AuthSessionService {
	return &AuthSessionService{queries: queries}
}

func (s *AuthSessionService) Create(ctx context.Context, userID int32) (AuthSession, error) {
	rawSecret := session.GenerateSecret()
	secretHash := session.HashSecret(rawSecret)

	row, err := s.queries.CreateAuthSession(ctx, db.CreateAuthSessionParams{
		UserID:     userID,
		SecretHash: secretHash,
	})

	if err != nil {
		return AuthSession{}, err
	}

	return AuthSession{
		ID:     row.ID,
		UserID: row.UserID,
		Secret: rawSecret,
	}, nil
}

func (s *AuthSessionService) Validate(ctx context.Context, sessionID int32, rawSecret []byte) (AuthSession, error) {
	row, err := s.queries.GetAuthSessionByID(ctx, sessionID)
	if err != nil {
		return AuthSession{}, ErrInvalidAuthSession
	}

	secretHash := session.HashSecret(rawSecret)
	if !bytes.Equal(secretHash, row.SecretHash) {
		return AuthSession{}, ErrInvalidAuthSession
	}

	return AuthSession{
		ID:     row.ID,
		UserID: row.UserID,
	}, nil
}
