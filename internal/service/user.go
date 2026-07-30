package service

import (
	"context"
	"errors"

	"github.com/augustinsorel/gym-graphs/internal/database/db"
	"github.com/augustinsorel/gym-graphs/internal/password"
	"github.com/jackc/pgx/v5"
)

var ErrEmailTaken = errors.New("email already taken")
var ErrUserNotFound = errors.New("user not found")

type UserService struct {
	queries *db.Queries
}

func NewUserService(queries *db.Queries) *UserService {
	return &UserService{queries: queries}
}

func (s *UserService) GetByEmail(ctx context.Context, email string) (db.User, error) {
	user, err := s.queries.GetUserByEmail(ctx, email)
	if errors.Is(err, pgx.ErrNoRows) {
		return db.User{}, ErrUserNotFound
	}
	if err != nil {
		return db.User{}, err
	}
	return user, nil
}

func (s *UserService) GetByID(ctx context.Context, id int32) (db.User, error) {
	user, err := s.queries.GetUserByID(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return db.User{}, ErrUserNotFound
	}
	if err != nil {
		return db.User{}, err
	}
	return user, nil
}

func (s *UserService) GetByPasswordResetSessionID(ctx context.Context, sessionID int32) (db.User, error) {
	user, err := s.queries.GetUserByPasswordResetSessionID(ctx, sessionID)
	if errors.Is(err, pgx.ErrNoRows) {
		return db.User{}, ErrUserNotFound
	}
	if err != nil {
		return db.User{}, err
	}
	return user, nil
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

func (s *UserService) UpdateName(ctx context.Context, userID int32, name string) error {
	return s.queries.UpdateUserName(ctx, db.UpdateUserNameParams{
		ID:   userID,
		Name: name,
	})
}

func (s *UserService) DeleteByAccountDeletionSessionID(ctx context.Context, deletionSessionID int32) error {
	_, err := s.queries.DeleteUserByAccountDeletionSessionID(ctx, deletionSessionID)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrUserNotFound
	}
	return err
}

func CreateUser(ctx context.Context, q *db.Queries, email string, pw string, name string, sessionID int32) (db.CreateUserRow, error) {
	salt := password.GenerateSalt()
	hash := password.Hash(pw, salt)

	return q.CreateUser(ctx, db.CreateUserParams{
		ID:           sessionID,
		Name:         name,
		PasswordHash: hash,
		PasswordSalt: salt,
	})
}
