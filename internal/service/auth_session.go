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
	ID        int32
	UserID    int32
	RawSecret []byte
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
		ID:        row.ID,
		UserID:    row.UserID,
		RawSecret: rawSecret,
	}, nil
}

func (s *AuthSessionService) GetByID(ctx context.Context, sessionID int32) (db.AuthSession, error) {
	row, err := s.queries.GetAuthSessionByID(ctx, sessionID)
	if err != nil {
		return db.AuthSession{}, ErrInvalidAuthSession
	}

	return row, nil
}

func (s *AuthSessionService) ValidateSecret(authSession db.AuthSession, rawSecret []byte) error {
	secretHash := session.HashSecret(rawSecret)
	if !bytes.Equal(secretHash, authSession.SecretHash) {
		return ErrInvalidAuthSession
	}
	return nil
}
