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

type SetCursor struct {
	DoneAt pgtype.Timestamptz
	ID     int32
}

var InitialSetCursor = SetCursor{
	DoneAt: pgtype.Timestamptz{Time: time.Date(9999, 12, 31, 23, 59, 59, 0, time.UTC), Valid: true},
	ID:     math.MaxInt32,
}

type SetsPage struct {
	Rows        []db.Set
	NextCursor  SetCursor
	HasNextPage bool
	TotalCount  int
}

func (s *SetService) GetPageByExerciseID(ctx context.Context, exerciseID int32, cursor SetCursor, totalCount int) (SetsPage, error) {
	sets, err := s.queries.GetSetsPageByExerciseID(ctx, db.GetSetsPageByExerciseIDParams{
		ExerciseID: exerciseID,
		DoneAt:     cursor.DoneAt,
		ID:         cursor.ID,
		Limit:      SetsPageSize + 1,
	})
	if err != nil {
		return SetsPage{}, err
	}

	hasNextPage := len(sets) > SetsPageSize
	if hasNextPage {
		sets = sets[:SetsPageSize]
	}

	var nextCursor SetCursor
	if hasNextPage {
		last := sets[len(sets)-1]
		nextCursor = SetCursor{DoneAt: last.DoneAt, ID: last.ID}
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
		DoneAt:      pgtype.Timestamptz{Time: input.DoneAt, Valid: true},
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
