package service

import (
	"context"

	"github.com/augustinsorel/gym-graphs/internal/database/db"
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
