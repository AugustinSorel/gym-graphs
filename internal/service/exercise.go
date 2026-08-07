package service

import (
	"context"
	"math"

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

const ExercisesPageSize = 30

type ExercisesPage struct {
	Rows        []db.Exercise
	TotalCount  int64
	NextCursor  int32
	HasNextPage bool
	FirstIndex  int32
}

const InitialCursor = math.MaxInt32

func (s *ExerciseService) GetPage(ctx context.Context, userID int32, cursor int32) (ExercisesPage, error) {
	rows, err := s.queries.GetExercisesPageByUserID(ctx, db.GetExercisesPageByUserIDParams{
		UserID: userID,
		Index:  cursor,
		Limit:  ExercisesPageSize + 1,
	})
	if err != nil {
		return ExercisesPage{}, err
	}

	hasNextPage := len(rows) > ExercisesPageSize
	if hasNextPage {
		rows = rows[:ExercisesPageSize]
	}

	// NextCursor is the smallest index on this page; the next page fetches index < that.
	var nextCursor int32
	if hasNextPage {
		nextCursor = rows[len(rows)-1].Index
	}

	count, err := s.queries.GetExercisesCountByUserID(ctx, userID)
	if err != nil {
		return ExercisesPage{}, err
	}

	var firstIndex int32
	if len(rows) > 0 {
		firstIndex = rows[0].Index
	}

	return ExercisesPage{
		Rows:        rows,
		TotalCount:  count,
		NextCursor:  nextCursor,
		HasNextPage: hasNextPage,
		FirstIndex:  firstIndex,
	}, nil
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
