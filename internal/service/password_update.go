package service

import (
	"bytes"
	"context"
	"errors"

	"github.com/augustinsorel/gym-graphs/internal/database/db"
	"github.com/augustinsorel/gym-graphs/internal/password"
	"github.com/augustinsorel/gym-graphs/internal/session"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrPasswordUpdateSessionNotFound = errors.New("password update session: invalid or not found")

type PasswordUpdateSession struct {
	ID     int32
	Secret []byte
}

type PasswordUpdateService struct {
	queries *db.Queries
	pool    *pgxpool.Pool
}

func NewPasswordUpdateService(queries *db.Queries, pool *pgxpool.Pool) *PasswordUpdateService {
	return &PasswordUpdateService{queries: queries, pool: pool}
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

func (s *PasswordUpdateService) Complete(ctx context.Context, updateSessionID int32, newPassword string) error {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	txq := db.New(tx)

	salt := password.GenerateSalt()
	hash := password.Hash(newPassword, salt)

	if err := txq.UpdateUserPasswordByPasswordUpdateSessionID(ctx, db.UpdateUserPasswordByPasswordUpdateSessionIDParams{
		PasswordHash: hash,
		PasswordSalt: salt,
		ID:           updateSessionID,
	}); err != nil {
		return err
	}

	if _, err := txq.DeletePasswordUpdateSession(ctx, updateSessionID); err != nil {
		return err
	}

	return tx.Commit(ctx)
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
