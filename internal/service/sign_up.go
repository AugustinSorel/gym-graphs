package service

import (
	"bytes"
	"context"
	"crypto/subtle"
	"errors"

	"github.com/augustinsorel/gym-graphs/internal/database/db"
	"github.com/augustinsorel/gym-graphs/internal/domain"
	"github.com/augustinsorel/gym-graphs/internal/otp"
	"github.com/augustinsorel/gym-graphs/internal/session"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrInvalidVerificationCode = errors.New("invalid verification code")
var ErrInvalidSignUpSession = errors.New("sign up session: invalid or not found")

type SignUpSession struct {
	ID               int32
	Secret           []byte
	VerificationCode string
}

type SignUpService struct {
	queries *db.Queries
	pool    *pgxpool.Pool
}

func NewSignUpService(queries *db.Queries, pool *pgxpool.Pool) *SignUpService {
	return &SignUpService{queries: queries, pool: pool}
}

func (s *SignUpService) Create(ctx context.Context, email string) (SignUpSession, error) {
	rawSecret := session.GenerateSecret()
	secretHash := session.HashSecret(rawSecret)

	verificationCode := otp.GenerateEmailAddressVerificationCode()

	params := db.CreateSignUpSessionParams{
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
		Secret:           rawSecret,
		VerificationCode: verificationCode,
	}

	return signUpSession, nil
}

func (s *SignUpService) Cancel(ctx context.Context, id int32) error {
	_, err := s.queries.DeleteSignUpSession(ctx, id)
	return err
}

func (s *SignUpService) GetByID(ctx context.Context, id int32) (db.SignUpSession, error) {
	return s.queries.GetSignUpSessionByID(ctx, id)
}

func (s *SignUpService) ValidateSecret(signUpSession db.SignUpSession, rawSecret []byte) error {
	secretHash := session.HashSecret(rawSecret)
	if !bytes.Equal(secretHash, signUpSession.SecretHash) {
		return ErrInvalidSignUpSession
	}
	return nil
}

func (s *SignUpService) ValidateToken(ctx context.Context, token string) (db.SignUpSession, error) {
	sessionID, rawSecret, err := session.ParseToken(token)
	if err != nil {
		return db.SignUpSession{}, ErrInvalidSignUpSession
	}

	signUpSession, err := s.queries.GetSignUpSessionByID(ctx, sessionID)
	if err != nil {
		return db.SignUpSession{}, ErrInvalidSignUpSession
	}

	if err := s.ValidateSecret(signUpSession, rawSecret); err != nil {
		return db.SignUpSession{}, err
	}

	return signUpSession, nil
}

func (s *SignUpService) VerifyCode(storedCode, inputCode string) error {
	ok := subtle.ConstantTimeCompare([]byte(storedCode), []byte(inputCode)) == 1

	if !ok {
		return ErrInvalidVerificationCode
	}
	return nil
}

func (s *SignUpService) MarkEmailAsVerified(ctx context.Context, id int32) (db.SignUpSession, error) {
	return s.queries.VerifySignUpSession(ctx, id)
}

func (s *SignUpService) Complete(ctx context.Context, session db.SignUpSession, password string) (AuthSession, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return AuthSession{}, err
	}
	defer tx.Rollback(ctx)

	txq := db.New(tx)

	name := domain.InferNameFromEmail(session.EmailAddress)

	user, err := CreateUser(ctx, txq, session.EmailAddress, password, name, session.ID)
	if err != nil {
		return AuthSession{}, err
	}

	if _, err := txq.DeleteSignUpSession(ctx, session.ID); err != nil {
		return AuthSession{}, err
	}

	seedSvc := &SeedService{queries: txq}
	if err := seedSvc.SeedUser(ctx, user.ID); err != nil {
		return AuthSession{}, err
	}

	authSvc := &AuthSessionService{queries: txq}
	authSession, err := authSvc.Create(ctx, user.ID)

	if err != nil {
		return AuthSession{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return AuthSession{}, err
	}

	return authSession, nil
}
