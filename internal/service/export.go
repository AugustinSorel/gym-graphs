package service

import (
	"context"
	"time"

	"github.com/augustinsorel/gym-graphs/internal/database/db"
)

type ExportService struct {
	queries *db.Queries
}

func NewExportService(queries *db.Queries) *ExportService {
	return &ExportService{queries: queries}
}

type ExportSet struct {
	WeightInG   int32  `json:"weightInG"`
	Repetitions int32  `json:"repetitions"`
	DoneAt      string `json:"doneAt"`
}

type ExportExercise struct {
	Name string      `json:"name"`
	Tags []string    `json:"tags"`
	Sets []ExportSet `json:"sets"`
}

type ExportUser struct {
	Name               string `json:"name"`
	WeightUnit         string `json:"weightUnit"`
	OneRepMaxAlgorithm string `json:"oneRepMaxAlgorithm"`
}

type UserExport struct {
	Version    string           `json:"version"`
	ExportedAt string           `json:"exportedAt"`
	User       ExportUser       `json:"user"`
	Exercises  []ExportExercise `json:"exercises"`
}

func (s *ExportService) ExportUserData(ctx context.Context, user db.User) (UserExport, error) {
	exercises, err := s.queries.GetAllExercisesByUserID(ctx, user.ID)
	if err != nil {
		return UserExport{}, err
	}

	allSets, err := s.queries.GetAllSetsByUserID(ctx, user.ID)
	if err != nil {
		return UserExport{}, err
	}

	allTagRows, err := s.queries.GetAllExerciseTagNamesByUserID(ctx, user.ID)
	if err != nil {
		return UserExport{}, err
	}

	setsByExercise := make(map[int32][]ExportSet, len(exercises))
	for _, s := range allSets {
		setsByExercise[s.ExerciseID] = append(setsByExercise[s.ExerciseID], ExportSet{
			WeightInG:   s.WeightInG,
			Repetitions: s.Repetitions,
			DoneAt:      s.DoneAt.Time.UTC().Format(time.RFC3339),
		})
	}

	tagsByExercise := make(map[int32][]string, len(exercises))
	for _, row := range allTagRows {
		tagsByExercise[row.ExerciseID] = append(tagsByExercise[row.ExerciseID], row.Name)
	}

	exportExercises := make([]ExportExercise, 0, len(exercises))
	for _, ex := range exercises {
		sets := setsByExercise[ex.ID]
		if sets == nil {
			sets = []ExportSet{}
		}

		tags := tagsByExercise[ex.ID]
		if tags == nil {
			tags = []string{}
		}

		exportExercises = append(exportExercises, ExportExercise{
			Name: ex.Name,
			Tags: tags,
			Sets: sets,
		})
	}

	return UserExport{
		Version:    "1",
		ExportedAt: time.Now().UTC().Format(time.RFC3339),
		User: ExportUser{
			Name:               user.Name,
			WeightUnit:         string(user.WeightUnit),
			OneRepMaxAlgorithm: string(user.OneRepMaxAlgorithm),
		},
		Exercises: exportExercises,
	}, nil
}
