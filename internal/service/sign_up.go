package service

import (
	"context"

	"github.com/augustinsorel/gym-graphs/internal/db/sqlc"
	"github.com/augustinsorel/gym-graphs/internal/domain"
	"github.com/augustinsorel/gym-graphs/internal/otp"
	"github.com/augustinsorel/gym-graphs/internal/session"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SignUpSession struct {
	ID               int32
	Secret           []byte
	VerificationCode string
}

type SignUpService struct {
	queries *sqlc.Queries
	pool    *pgxpool.Pool
}

func NewSignUpService(queries *sqlc.Queries, pool *pgxpool.Pool) *SignUpService {
	return &SignUpService{queries: queries, pool: pool}
}

func (s *SignUpService) Create(ctx context.Context, email string) (SignUpSession, error) {
	rawSecret := session.GenerateSecret()
	secretHash := session.HashSecret(rawSecret)

	verificationCode := otp.GenerateEmailAddressVerificationCode()

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
		Secret:           rawSecret,
		VerificationCode: verificationCode,
	}

	return signUpSession, nil
}

func (s *SignUpService) Cancel(ctx context.Context, id int32) error {
	_, err := s.queries.DeleteSignUpSession(ctx, id)
	return err
}

func (s *SignUpService) GetByID(ctx context.Context, id int32) (sqlc.SignUpSession, error) {
	return s.queries.GetSignUpSessionByID(ctx, id)
}

func (s *SignUpService) Complete(ctx context.Context, session sqlc.SignUpSession, password string) (AuthSession, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return AuthSession{}, err
	}
	defer tx.Rollback(ctx)

	txq := sqlc.New(tx)

	name := domain.InferNameFromEmail(session.EmailAddress)

	user, err := CreateUser(ctx, txq, session.EmailAddress, password, name)
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
