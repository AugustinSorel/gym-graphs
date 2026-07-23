package service

import (
	"context"

	"github.com/augustinsorel/gym-graphs/internal/db/sqlc"
	"github.com/augustinsorel/gym-graphs/internal/session"
)

type AuthSession struct {
	ID     int32
	UserID int32
	Secret []byte
}

type AuthSessionService struct {
	queries *sqlc.Queries
}

func NewAuthSessionService(queries *sqlc.Queries) *AuthSessionService {
	return &AuthSessionService{queries: queries}
}

func (s *AuthSessionService) Create(ctx context.Context, userID int32) (AuthSession, error) {
	rawSecret := session.GenerateSecret()
	secretHash := session.HashSecret(rawSecret)

	row, err := s.queries.CreateAuthSession(ctx, sqlc.CreateAuthSessionParams{
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
