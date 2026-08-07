package service

import (
	"context"

	"github.com/augustinsorel/gym-graphs/internal/database/db"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ExerciseService struct {
	queries *db.Queries
	pool    *pgxpool.Pool
}

func NewExerciseService(queries *db.Queries, pool *pgxpool.Pool) *ExerciseService {
	return &ExerciseService{queries: queries, pool: pool}
}

func (s *ExerciseService) Create(ctx context.Context, userID int32, name string, tagIDs []int32) (db.Exercise, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return db.Exercise{}, err
	}
	defer tx.Rollback(ctx)

	txq := db.New(tx)

	exercise, err := txq.CreateExercise(ctx, db.CreateExerciseParams{
		UserID: userID,
		Name:   name,
	})
	if err != nil {
		return db.Exercise{}, err
	}

	if len(tagIDs) > 0 {
		if err := txq.CreateExerciseTags(ctx, db.CreateExerciseTagsParams{
			ExerciseID: exercise.ID,
			Column2:    tagIDs,
		}); err != nil {
			return db.Exercise{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return db.Exercise{}, err
	}

	return exercise, nil
}
