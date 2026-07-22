package service

import (
	"context"
	"errors"

	"github.com/augustinsorel/gym-graphs/internal/db/sqlc"
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
