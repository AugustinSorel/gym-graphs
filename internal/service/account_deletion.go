package service

import (
	"bytes"
	"context"
	"errors"

	"github.com/augustinsorel/gym-graphs/internal/database/db"
	"github.com/augustinsorel/gym-graphs/internal/session"
)

var ErrAccountDeletionSessionNotFound = errors.New("account deletion session: invalid or not found")

type AccountDeletionSession struct {
	ID     int32
	Secret []byte
}

type AccountDeletionService struct {
	queries *db.Queries
}

func NewAccountDeletionService(queries *db.Queries) *AccountDeletionService {
	return &AccountDeletionService{queries: queries}
}

func (s *AccountDeletionService) Create(ctx context.Context, authSessionID int32) (AccountDeletionSession, error) {
	rawSecret := session.GenerateSecret()
	secretHash := session.HashSecret(rawSecret)

	row, err := s.queries.CreateAccountDeletionSession(ctx, db.CreateAccountDeletionSessionParams{
		AuthSessionID: authSessionID,
		SecretHash:    secretHash,
	})
	if err != nil {
		return AccountDeletionSession{}, err
	}

	return AccountDeletionSession{
		ID:     row.ID,
		Secret: rawSecret,
	}, nil
}

func (s *AccountDeletionService) GetByID(ctx context.Context, id int32) (db.AccountDeletionSession, error) {
	return s.queries.GetAccountDeletionSessionByID(ctx, id)
}

func (s *AccountDeletionService) Cancel(ctx context.Context, id int32) error {
	_, err := s.queries.DeleteAccountDeletionSession(ctx, id)
	return err
}

func (s *AccountDeletionService) MarkAsVerified(ctx context.Context, id int32) (db.AccountDeletionSession, error) {
	return s.queries.MarkAccountDeletionSessionAsVerified(ctx, id)
}

func (s *AccountDeletionService) ValidateToken(ctx context.Context, token string) (db.AccountDeletionSession, error) {
	sessionID, rawSecret, err := session.ParseToken(token)
	if err != nil {
		return db.AccountDeletionSession{}, ErrAccountDeletionSessionNotFound
	}

	deletionSession, err := s.queries.GetAccountDeletionSessionByID(ctx, sessionID)
	if err != nil {
		return db.AccountDeletionSession{}, ErrAccountDeletionSessionNotFound
	}

	secretHash := session.HashSecret(rawSecret)
	if !bytes.Equal(secretHash, deletionSession.SecretHash) {
		return db.AccountDeletionSession{}, ErrAccountDeletionSessionNotFound
	}

	return deletionSession, nil
}
