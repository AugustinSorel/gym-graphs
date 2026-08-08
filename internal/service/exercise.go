package service

import (
	"context"
	"math"

	"github.com/augustinsorel/gym-graphs/internal/database/db"
	"github.com/augustinsorel/gym-graphs/internal/onerm"
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

type ExerciseRow = db.GetExercisesPageByUserIDRow

type ExercisesPage struct {
	Rows               []ExerciseRow
	TotalCount         int64
	NextCursor         int32
	HasNextPage        bool
	FirstIndex         int32
	WeightUnit         db.WeightUnit
	OneRepMaxAlgorithm db.OneRepMaxAlgorithm
}

const InitialCursor = math.MaxInt32

func (s *ExerciseService) GetPage(ctx context.Context, user db.User, cursor int32) (ExercisesPage, error) {
	exercises, err := s.queries.GetExercisesPageByUserID(ctx, db.GetExercisesPageByUserIDParams{
		UserID: user.ID,
		Index:  cursor,
		Limit:  ExercisesPageSize + 1,
	})
	if err != nil {
		return ExercisesPage{}, err
	}

	hasNextPage := len(exercises) > ExercisesPageSize
	if hasNextPage {
		exercises = exercises[:ExercisesPageSize]
	}

	// NextCursor is the smallest index on this page; the next page fetches index < that.
	var nextCursor int32
	if hasNextPage {
		nextCursor = exercises[len(exercises)-1].Index
	}

	count, err := s.queries.GetExercisesCountByUserID(ctx, user.ID)
	if err != nil {
		return ExercisesPage{}, err
	}

	var firstIndex int32
	if len(exercises) > 0 {
		firstIndex = exercises[0].Index
	}

	return ExercisesPage{
		Rows:               exercises,
		TotalCount:         count,
		NextCursor:         nextCursor,
		HasNextPage:        hasNextPage,
		FirstIndex:         firstIndex,
		WeightUnit:         user.WeightUnit,
		OneRepMaxAlgorithm: user.OneRepMaxAlgorithm,
	}, nil
}

func (s *ExerciseService) GetByIDAndUserID(ctx context.Context, id int32, userID int32) (db.Exercise, error) {
	return s.queries.GetExerciseByIDAndUserID(ctx, db.GetExerciseByIDAndUserIDParams{
		ID:     id,
		UserID: userID,
	})
}

func (s *ExerciseService) UpdateName(ctx context.Context, id int32, userID int32, name string) (db.Exercise, error) {
	return s.queries.UpdateExerciseName(ctx, db.UpdateExerciseNameParams{
		ID:     id,
		UserID: userID,
		Name:   name,
	})
}

// Best1RM returns the highest computed 1RM across all sets for the exercise,
// expressed in grams. Returns 0 if the exercise has no sets.
func (s *ExerciseService) Best1RM(ctx context.Context, exerciseID int32, algorithm db.OneRepMaxAlgorithm) (float64, error) {
	sets, err := s.queries.GetSetsByExerciseID(ctx, exerciseID)
	if err != nil {
		return 0, err
	}

	var best float64
	for _, set := range sets {
		if set.WeightInG <= 0 || set.Repetitions <= 0 {
			continue
		}
		v := onerm.Compute(float64(set.WeightInG), float64(set.Repetitions), algorithm)
		if v > best {
			best = v
		}
	}
	return best, nil
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
