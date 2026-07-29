package service

import (
	"bytes"
	"context"
	"errors"

	"github.com/augustinsorel/gym-graphs/internal/database/db"
	"github.com/augustinsorel/gym-graphs/internal/session"
)

var ErrPasswordUpdateSessionNotFound = errors.New("password update session: invalid or not found")

type PasswordUpdateSession struct {
	ID     int32
	Secret []byte
}

type PasswordUpdateService struct {
	queries *db.Queries
}

func NewPasswordUpdateService(queries *db.Queries) *PasswordUpdateService {
	return &PasswordUpdateService{queries: queries}
}

func (s *PasswordUpdateService) Create(ctx context.Context, authSessionID int32) (PasswordUpdateSession, error) {
	rawSecret := session.GenerateSecret()
	secretHash := session.HashSecret(rawSecret)

	row, err := s.queries.CreatePasswordUpdateSession(ctx, db.CreatePasswordUpdateSessionParams{
		AuthSessionID: authSessionID,
		SecretHash:    secretHash,
	})
	if err != nil {
		return PasswordUpdateSession{}, err
	}

	return PasswordUpdateSession{
		ID:     row.ID,
		Secret: rawSecret,
	}, nil
}

func (s *PasswordUpdateService) GetByID(ctx context.Context, id int32) (db.PasswordUpdateSession, error) {
	return s.queries.GetPasswordUpdateSessionByID(ctx, id)
}

func (s *PasswordUpdateService) Cancel(ctx context.Context, id int32) error {
	_, err := s.queries.DeletePasswordUpdateSession(ctx, id)
	return err
}

func (s *PasswordUpdateService) MarkAsVerified(ctx context.Context, id int32) (db.PasswordUpdateSession, error) {
	return s.queries.MarkPasswordUpdateSessionAsVerified(ctx, id)
}

func (s *PasswordUpdateService) ValidateToken(ctx context.Context, token string) (db.PasswordUpdateSession, error) {
	sessionID, rawSecret, err := session.ParseToken(token)
	if err != nil {
		return db.PasswordUpdateSession{}, ErrPasswordUpdateSessionNotFound
	}

	updateSession, err := s.queries.GetPasswordUpdateSessionByID(ctx, sessionID)
	if err != nil {
		return db.PasswordUpdateSession{}, ErrPasswordUpdateSessionNotFound
	}

	secretHash := session.HashSecret(rawSecret)
	if !bytes.Equal(secretHash, updateSession.SecretHash) {
		return db.PasswordUpdateSession{}, ErrPasswordUpdateSessionNotFound
	}

	return updateSession, nil
}
