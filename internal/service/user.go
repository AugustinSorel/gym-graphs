package service

import (
	"context"
	"errors"

	"github.com/augustinsorel/gym-graphs/internal/db/sqlc"
	"github.com/augustinsorel/gym-graphs/internal/token"
	"github.com/jackc/pgx/v5"
)

var ErrEmailTaken = errors.New("email already taken")

type UserService struct {
	queries *sqlc.Queries
}

func NewUserService(queries *sqlc.Queries) *UserService {
	return &UserService{queries: queries}
}

func (s *UserService) IsEmailTaken(ctx context.Context, email string) (bool, error) {
	_, err := s.queries.GetUserByEmail(ctx, email)

	if errors.Is(err, pgx.ErrNoRows) {
		return false, nil
	}

	if err != nil {
		return false, err
	}

	return true, nil
}

func CreateUser(ctx context.Context, q *sqlc.Queries, email string, password string, name string) (sqlc.User, error) {
	salt := token.GenerateHashingSalt()
	hash := token.HashUserPassword(password, salt)

	return q.CreateUser(ctx, sqlc.CreateUserParams{
		EmailAddress: email,
		Name:         name,
		WeightUnit:   sqlc.WeightUnitKg,
		PasswordHash: hash,
		PasswordSalt: salt,
	})
}
