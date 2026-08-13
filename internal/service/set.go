package service

import (
	"context"
	"math"
	"time"

	"github.com/augustinsorel/gym-graphs/internal/database/db"
	"github.com/jackc/pgx/v5/pgtype"
)

type SetService struct {
	queries *db.Queries
}

func NewSetService(queries *db.Queries) *SetService {
	return &SetService{queries: queries}
}

type CreateSetInput struct {
	ExerciseID  int32
	Repetitions int32
	WeightInG   int32
}

const SetsPageSize = 10
const InitialSetCursor = math.MaxInt32

type SetsPage struct {
	Rows        []db.Set
	NextCursor  int32
	HasNextPage bool
	TotalCount  int
}

func (s *SetService) GetPageByExerciseID(ctx context.Context, exerciseID int32, cursor int32, totalCount int) (SetsPage, error) {
	sets, err := s.queries.GetSetsPageByExerciseID(ctx, db.GetSetsPageByExerciseIDParams{
		ExerciseID: exerciseID,
		ID:         cursor,
		Limit:      SetsPageSize + 1,
	})
	if err != nil {
		return SetsPage{}, err
	}

	hasNextPage := len(sets) > SetsPageSize
	if hasNextPage {
		sets = sets[:SetsPageSize]
	}

	var nextCursor int32
	if hasNextPage {
		nextCursor = sets[len(sets)-1].ID
	}

	return SetsPage{
		Rows:        sets,
		NextCursor:  nextCursor,
		HasNextPage: hasNextPage,
		TotalCount:  totalCount,
	}, nil
}

func (s *SetService) GetByExerciseID(ctx context.Context, exerciseID int32) ([]db.Set, error) {
	return s.queries.GetSetsByExerciseID(ctx, exerciseID)
}

func (s *SetService) GetLastByExerciseID(ctx context.Context, exerciseID int32) (db.Set, error) {
	return s.queries.GetLastSetByExerciseID(ctx, exerciseID)
}

type UpdateSetInput struct {
	ID          int32
	UserID      int32
	Repetitions int32
	WeightInG   int32
	DoneAt      time.Time
}

func (s *SetService) GetByIDAndUserID(ctx context.Context, id int32, userID int32) (db.Set, error) {
	return s.queries.GetSetByIDAndUserID(ctx, db.GetSetByIDAndUserIDParams{
		ID:     id,
		UserID: userID,
	})
}

func (s *SetService) UpdateSet(ctx context.Context, input UpdateSetInput) (db.Set, error) {
	return s.queries.UpdateSetByIDAndUserID(ctx, db.UpdateSetByIDAndUserIDParams{
		ID:          input.ID,
		UserID:      input.UserID,
		Repetitions: input.Repetitions,
		WeightInG:   input.WeightInG,
		CreatedAt:   pgtype.Timestamptz{Time: input.DoneAt, Valid: true},
	})
}

func (s *SetService) DeleteSet(ctx context.Context, id int32, userID int32) error {
	return s.queries.DeleteSetByIDAndUserID(ctx, db.DeleteSetByIDAndUserIDParams{
		ID:     id,
		UserID: userID,
	})
}

func (s *SetService) CreateSets(ctx context.Context, inputs []CreateSetInput) ([]db.Set, error) {
	params := db.CreateSetsParams{
		Column1: make([]int32, len(inputs)),
		Column2: make([]int32, len(inputs)),
		Column3: make([]int32, len(inputs)),
	}
	for i, in := range inputs {
		params.Column1[i] = in.ExerciseID
		params.Column2[i] = in.Repetitions
		params.Column3[i] = in.WeightInG
	}
	return s.queries.CreateSets(ctx, params)
}
